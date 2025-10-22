import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mic, MicOff, Play, Square, Check, AlertCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Purchase, Test, TestSection, Question } from "@shared/schema";

interface AudioRecording {
  blob: Blob | null;
  url: string | null;
  duration: number;
}

interface HierarchicalSection extends TestSection {
  children?: HierarchicalSection[];
  displayNumber?: string;
}

// Helper to build section tree from flat array
function buildSectionTree(sections: TestSection[]): HierarchicalSection[] {
  const sectionMap = new Map<string, HierarchicalSection>();
  const rootSections: HierarchicalSection[] = [];
  
  // First pass: create map
  sections.forEach(section => {
    sectionMap.set(section.id, { ...section, children: [] });
  });
  
  // Second pass: build tree structure
  sections.forEach(section => {
    const node = sectionMap.get(section.id)!;
    if (!section.parentSectionId) {
      rootSections.push(node);
    } else {
      const parent = sectionMap.get(section.parentSectionId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
      } else {
        console.warn(`Section ${section.id} has missing parent ${section.parentSectionId}, treating as root`);
        rootSections.push(node);
      }
    }
  });
  
  // Third pass: sort and assign display numbers
  const assignDisplayNumbers = (nodes: HierarchicalSection[], prefix = '') => {
    // Sort by section number FIRST
    const sorted = nodes.sort((a, b) => a.sectionNumber - b.sectionNumber);
    
    sorted.forEach((node, index) => {
      const num = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
      node.displayNumber = num;
      
      // Recursively sort and number children
      if (node.children && node.children.length > 0) {
        node.children.sort((a, b) => a.sectionNumber - b.sectionNumber);
        assignDisplayNumbers(node.children, num);
      }
    });
    
    return sorted;
  };
  
  const sortedRoots = assignDisplayNumbers(rootSections);
  
  console.log('🌳 [TREE] Built section tree:', sortedRoots.map(r => ({
    title: r.title,
    displayNumber: r.displayNumber,
    children: r.children?.map(c => ({ title: c.title, displayNumber: c.displayNumber }))
  })));
  
  return sortedRoots;
}

// Helper to flatten hierarchical tree back to array with display numbers
function flattenSections(tree: HierarchicalSection[]): HierarchicalSection[] {
  const result: HierarchicalSection[] = [];
  
  const traverse = (nodes: HierarchicalSection[]) => {
    // Ensure nodes are sorted before processing
    const sorted = [...nodes].sort((a, b) => a.sectionNumber - b.sectionNumber);
    
    sorted.forEach(node => {
      result.push(node);
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  };
  
  traverse(tree);
  
  console.log('📋 [FLATTEN] Flattened sections order:', result.map((s, i) => ({
    index: i,
    title: s.title,
    displayNumber: s.displayNumber,
    sectionNumber: s.sectionNumber,
    hasParent: !!s.parentSectionId
  })));
  
  return result;
}

export default function TakeTest() {
  const [, params] = useRoute("/test/:purchaseId");
  const purchaseId = params?.purchaseId;
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Mikrofon test bosqichi
  const [micTestCompleted, setMicTestCompleted] = useState(false);
  const [micTestRecording, setMicTestRecording] = useState<AudioRecording | null>(null);
  const [isMicTesting, setIsMicTesting] = useState(false);

  // Use a flat list approach - single global question index
  const [globalQuestionIndex, setGlobalQuestionIndex] = useState(0);
  const globalQuestionIndexRef = useRef(0); // Track current index in ref to avoid stale closures
  const flatQuestionListRef = useRef<any[]>([]); // Track flat list in ref to avoid re-renders
  const [recordings, setRecordings] = useState<{ [questionId: string]: AudioRecording }>({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null); // null until test starts
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testPhase, setTestPhase] = useState<'preparation' | 'speaking'>('preparation');
  
  // Submission tracking
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const submissionIdRef = useRef<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const sectionTimerRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const recordingQuestionIdRef = useRef<string | null>(null);
  const autoProgressQueuedRef = useRef<boolean>(false);
  
  // Wave visualization refs
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const { data: purchase, isLoading: purchaseLoading } = useQuery<Purchase>({
    queryKey: ["/api/purchases", purchaseId],
    enabled: !!purchaseId,
  });

  const { data: test, isLoading: testLoading } = useQuery<Test>({
    queryKey: ["/api/tests", purchase?.testId],
    enabled: !!purchase?.testId,
  });

  const { data: rawSections = [], isLoading: sectionsLoading } = useQuery<TestSection[]>({
    queryKey: ["/api/tests", test?.id, "sections"],
    enabled: !!test?.id,
  });

  // Build hierarchical tree and flatten for navigation (memoized to prevent refetch loop)
  const sectionTree = useMemo(() => buildSectionTree(rawSections), [rawSections]);
  const sections = useMemo(() => flattenSections(sectionTree), [sectionTree]);

  // Fetch all questions for all sections
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  useEffect(() => {
    const fetchAllQuestions = async () => {
      if (sections.length === 0) return;
      
      console.log('📥 [FETCH] Fetching questions for sections:', sections.map(s => ({ id: s.id, title: s.title, displayNumber: s.displayNumber })));
      
      setQuestionsLoading(true);
      try {
        const questionsPromises = sections.map(section =>
          fetch(`/api/sections/${section.id}/questions`).then(res => res.json())
        );
        const questionsArrays = await Promise.all(questionsPromises);
        
        console.log('📦 [FETCH] Received questions per section:', questionsArrays.map((arr, i) => ({
          section: sections[i].title,
          count: arr.length,
          questions: arr.map((q: any) => ({ number: q.questionNumber, text: q.questionText.substring(0, 30) }))
        })));
        
        const flatQuestions = questionsArrays.flat();
        console.log('✅ [FETCH] Total questions:', flatQuestions.length);
        setAllQuestions(flatQuestions);
      } catch (error) {
        console.error("Error fetching questions:", error);
        toast({
          title: "Xatolik",
          description: "Savollarni yuklashda xatolik",
          variant: "destructive",
        });
      } finally {
        setQuestionsLoading(false);
      }
    };

    fetchAllQuestions();
  }, [sections]);

  // Flat list of all questions with section info embedded
  const flatQuestionList = useMemo(() => {
    const list: Array<Question & { sectionIndex: number; sectionTitle: string; sectionPreparationTime: number; sectionSpeakingTime: number; sectionImageUrl: string | null }> = [];
    
    sections.forEach((section, sectionIdx) => {
      const sectionQs = allQuestions
        .filter(q => q.sectionId === section.id)
        .sort((a, b) => a.questionNumber - b.questionNumber);
      
      sectionQs.forEach(q => {
        list.push({
          ...q,
          sectionIndex: sectionIdx,
          sectionTitle: section.title,
          sectionPreparationTime: section.preparationTime ?? 5,
          sectionSpeakingTime: section.speakingTime ?? 30,
          sectionImageUrl: section.imageUrl
        });
      });
    });
    
    console.log('📋 [FLAT LIST] Built flat question list:', list.length, 'questions');
    list.forEach((q, idx) => {
      console.log(`  ${idx}: Section "${q.sectionTitle}" Q${q.questionNumber} - ${q.questionText.substring(0, 40)}`);
    });
    
    return list;
  }, [allQuestions, sections]);
  
  const currentQuestion = useMemo(() => flatQuestionList[globalQuestionIndex], [flatQuestionList, globalQuestionIndex]);
  const currentSection = useMemo(() => {
    if (!currentQuestion) return null;
    return sections[currentQuestion.sectionIndex];
  }, [currentQuestion, sections]);

  // Calculate total progress
  const completedQuestions = Object.keys(recordings).length;
  const totalQuestions = allQuestions.length;
  const progress = totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0;


  // Recording timer (for both mic test and actual recording)
  useEffect(() => {
    if (isRecording || isMicTesting) {
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordingTime(0);
    }

    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording, isMicTesting]);

  // Start wave visualization when canvas is ready
  useEffect(() => {
    if ((isRecording || isMicTesting) && analyzerRef.current && canvasRef.current) {
      drawWaveform();
      // Only cleanup if we actually started the waveform
      return () => {
        stopWaveform();
      };
    }
  }, [isRecording, isMicTesting]);

  // Wave visualization
  const drawWaveform = () => {
    if (!analyzerRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyzer = analyzerRef.current;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyzer.getByteTimeDomainData(dataArray);

      // Clear canvas with fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw wave
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'hsl(var(--primary))';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  };

  const stopWaveform = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    analyzerRef.current = null;
  };

  // Mikrofon test uchun recording
  const startMicTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      // Setup Web Audio API for wave visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 2048;
      source.connect(analyzer);
      analyzerRef.current = analyzer;
      
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const duration = recordingStartTimeRef.current 
          ? Math.floor((Date.now() - recordingStartTimeRef.current) / 1000)
          : 0;
        
        setMicTestRecording({
          blob: audioBlob,
          url: audioUrl,
          duration,
        });
        
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        stopWaveform();
        recordingStartTimeRef.current = null;
      };
      
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsMicTesting(true);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Mikrofonga ruxsat berilmadi. Brauzer sozlamalarini tekshiring.",
        variant: "destructive",
      });
    }
  };

  const stopMicTest = () => {
    if (mediaRecorderRef.current && isMicTesting) {
      mediaRecorderRef.current.stop();
      setIsMicTesting(false);
      stopWaveform();
    }
  };

  // Create submission when test starts
  const createSubmission = async () => {
    try {
      if (!purchase?.id || !test?.id) return;

      const response = await apiRequest("/api/submissions", {
        method: "POST",
        body: JSON.stringify({
          purchaseId: purchase.id,
          testId: test.id,
        }),
      });

      const submission = await response.json();
      setSubmissionId(submission.id);
      submissionIdRef.current = submission.id;
      
      console.log('✅ Submission created:', submission.id);
    } catch (error) {
      console.error('❌ Error creating submission:', error);
      toast({
        title: "Xatolik",
        description: "Topshiriqni boshlashda xatolik yuz berdi",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Upload answer to server immediately after recording
  const uploadAnswer = async (questionId: string, audioBlob: Blob) => {
    try {
      const currentSubmissionId = submissionIdRef.current;
      if (!currentSubmissionId) {
        console.error('❌ No submission ID available');
        return;
      }

      console.log('⬆️ Uploading answer for question:', questionId);

      // Upload audio file to object storage
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      const uploadResponse = await fetch('/api/upload-audio', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Audio upload failed');
      }

      const { filename } = await uploadResponse.json();
      console.log('✅ Audio uploaded:', filename);

      // Save answer to database
      const answerResponse = await apiRequest(`/api/submissions/${currentSubmissionId}/answer`, {
        method: 'POST',
        body: JSON.stringify({
          questionId,
          audioFile: filename,
        }),
      });

      if (!answerResponse.ok) {
        throw new Error('Answer submission failed');
      }

      console.log('✅ Answer saved to database');
    } catch (error) {
      console.error('❌ Error uploading answer:', error);
      toast({
        title: "Ogohlantirish",
        description: "Javobni yuklashda muammo yuz berdi. Test davom etadi.",
        variant: "destructive",
      });
    }
  };

  const startRecording = useCallback(async () => {
    try {
      if (!currentQuestion) return;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      // Setup Web Audio API for wave visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 2048;
      source.connect(analyzer);
      analyzerRef.current = analyzer;
      
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();
      // Capture the question ID when recording starts
      recordingQuestionIdRef.current = currentQuestion.id;
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const duration = recordingStartTimeRef.current 
          ? Math.floor((Date.now() - recordingStartTimeRef.current) / 1000)
          : 0;
        
        // Use the captured question ID from when recording started
        const questionId = recordingQuestionIdRef.current;
        if (questionId) {
          setRecordings(prev => ({
            ...prev,
            [questionId]: {
              blob: audioBlob,
              url: audioUrl,
              duration,
            },
          }));
          
          // Upload answer immediately in the background
          uploadAnswer(questionId, audioBlob).catch(err => {
            console.error('Background upload failed:', err);
          });
        }
        
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        stopWaveform();
        recordingStartTimeRef.current = null;
        recordingQuestionIdRef.current = null;
      };
      
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Mikrofonga ruxsat berilmadi",
        variant: "destructive",
      });
    }
  }, [currentQuestion, toast]);

  const stopRecording = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        const recorder = mediaRecorderRef.current;
        
        // Add a one-time listener for when stop completes
        const originalOnStop = recorder.onstop;
        recorder.onstop = (event) => {
          // Call original handler first
          if (originalOnStop) {
            originalOnStop.call(recorder, event);
          }
          setIsRecording(false);
          stopWaveform();
          resolve();
        };
        
        recorder.stop();
      } else {
        setIsRecording(false);
        stopWaveform();
        resolve();
      }
    });
  }, [isRecording]);

  const handleNextQuestion = useCallback(async () => {
    console.log('🚀 [NEXT] handleNextQuestion called');
    if (isRecording) {
      console.log('🛑 [NEXT] Stopping recording first');
      await stopRecording();
    }
    
    if (globalQuestionIndex < flatQuestionList.length - 1) {
      console.log(`➡️ [NEXT] Moving to question ${globalQuestionIndex + 2}`);
      setGlobalQuestionIndex(prev => prev + 1);
    } else {
      console.log('✅ [NEXT] Already at last question');
    }
  }, [isRecording, stopRecording, globalQuestionIndex, flatQuestionList.length]);

  const handlePrevQuestion = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    }
    
    if (globalQuestionIndex > 0) {
      setGlobalQuestionIndex(prev => prev - 1);
    } else {
      console.log('⚠️ [PREV] Already at first question');
    }
  }, [isRecording, stopRecording, globalQuestionIndex]);

  const submitTest = async () => {
    if (completedQuestions < totalQuestions) {
      const confirmed = confirm(
        `Siz ${totalQuestions - completedQuestions} ta savolga javob bermadingiz. Testni topshirishni xohlaysizmi?`
      );
      if (!confirmed) return;
    }

    setIsSubmitting(true);

    try {
      // Upload all audio recordings
      const uploadedUrls: { [questionId: string]: string } = {};

      for (const [questionId, recording] of Object.entries(recordings)) {
        if (recording.blob) {
          const formData = new FormData();
          formData.append('file', recording.blob, `answer-${questionId}.webm`);

          const uploadRes = await fetch('/api/upload-audio', {
            method: 'POST',
            body: formData,
          });

          if (!uploadRes.ok) throw new Error('Audio yuklashda xatolik');
          const { url } = await uploadRes.json();
          uploadedUrls[questionId] = url;
        }
      }

      // Create submission
      await apiRequest("POST", "/api/submissions", {
        purchaseId,
        testId: test?.id,
        audioFiles: uploadedUrls,
      });

      toast({
        title: "Muvaffaqiyat!",
        description: "Test muvaffaqiyatli topshirildi",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      navigate("/student");
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message || "Test topshirishda xatolik",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sync refs with state - CRITICAL for avoiding stale closures
  useEffect(() => {
    globalQuestionIndexRef.current = globalQuestionIndex;
  }, [globalQuestionIndex]);
  
  useEffect(() => {
    flatQuestionListRef.current = flatQuestionList;
  }, [flatQuestionList]);

  // Initialize section timer - run ONLY after mic test AND when question changes
  useEffect(() => {
    // Skip completely if mic test not done yet
    if (!micTestCompleted) return;
    
    // Initialize timer for new question
    if (currentQuestion) {
      const prepTime = currentQuestion.preparationTime ?? currentQuestion.sectionPreparationTime;
      console.log(`🔄 [INIT] Question ${globalQuestionIndex + 1}/${flatQuestionList.length}, Section "${currentQuestion.sectionTitle}", Prep: ${prepTime}s`);
      setTimeRemaining(prepTime);
      setTestPhase('preparation');
      autoProgressQueuedRef.current = false;
    } else {
      console.log(`⚠️ [INIT] Waiting for data... question: ${!!currentQuestion}`);
    }
  }, [micTestCompleted, globalQuestionIndex, currentQuestion, flatQuestionList.length]);

  // Timer countdown - run ONLY after mic test  
  useEffect(() => {
    // Absolutely block all timer activity before mic test completes
    if (!micTestCompleted) return;
    
    // Don't countdown if timer not initialized yet
    if (timeRemaining === null) return;
    
    if (timeRemaining > 0 && !isSubmitting) {
      sectionTimerRef.current = window.setTimeout(() => {
        setTimeRemaining(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeRemaining === 0 && !autoProgressQueuedRef.current) {
      // Time's up - handle phase transition
      // Use REFS to get current values (avoids stale closure AND re-renders)
      const currentIdx = globalQuestionIndexRef.current;
      const currentFlatList = flatQuestionListRef.current;
      const question = currentFlatList[currentIdx];
      if (!question) {
        console.log(`⚠️ [TIMER HIT 0] No question found at index ${currentIdx}`);
        return;
      }
      
      console.log(`⏰ [TIMER HIT 0] Current index from ref: ${currentIdx}/${currentFlatList.length}, Phase: ${testPhase}, Question: ${question.questionText.substring(0, 30)}`);
      
      if (testPhase === 'preparation') {
        console.log('⏰ [PHASE] Preparation done, switching to speaking');
        // Preparation done - start speaking phase
        const speakTime = question.speakingTime ?? question.sectionSpeakingTime;
        console.log(`⏱️ [PHASE] Speaking time: ${speakTime}s`);
        setTimeRemaining(speakTime);
        setTestPhase('speaking');
        
        // Auto-start recording - direct call without dependency
        if (!isRecording) {
          console.log('🎤 [AUTO] Starting recording');
          navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            const recorder = new MediaRecorder(stream);
            audioChunksRef.current = [];
            
            recorder.ondataavailable = (e) => {
              if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };
            
            recorder.onstop = () => {
              const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              const url = URL.createObjectURL(blob);
              const questionId = recordingQuestionIdRef.current!;
              
              setRecordings(prev => ({
                ...prev,
                [questionId]: { blob, url, duration: recordingTime }
              }));
              
              // Upload answer immediately in the background
              uploadAnswer(questionId, blob).catch(err => {
                console.error('Background upload failed:', err);
              });
              
              stream.getTracks().forEach(track => track.stop());
              setIsRecording(false);
              stopWaveform();
            };
            
            mediaRecorderRef.current = recorder;
            recordingQuestionIdRef.current = question.id;
            recordingStartTimeRef.current = Date.now();
            
            recorder.start();
            setIsRecording(true);
          }).catch(err => {
            console.error('Mikrofon xatosi:', err);
          });
        }
      } else if (testPhase === 'speaking') {
        console.log('⏰ [PHASE] Speaking done, auto-progressing');
        // Mark auto-progress as queued to prevent re-triggers  
        autoProgressQueuedRef.current = true;
        
        // Speaking time done - stop recording and move to next directly
        const progressToNext = async () => {
          console.log('🛑 [AUTO] Stopping recording...');
          
          // Stop recording directly
          if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
          }
          
          // Wait a bit for recording to save
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Use refs to get current values
          const currentIdxBeforeUpdate = globalQuestionIndexRef.current;
          const totalQuestions = flatQuestionListRef.current.length;
          console.log(`➡️ [AUTO] Moving to next question: ${currentIdxBeforeUpdate} → ${currentIdxBeforeUpdate + 1} (total: ${totalQuestions})`);
          
          // Check if this was the last question
          if (currentIdxBeforeUpdate >= totalQuestions - 1) {
            console.log('✅ [COMPLETE] Last question finished, completing submission');
            
            // Complete submission
            const currentSubmissionId = submissionIdRef.current;
            if (currentSubmissionId) {
              try {
                await apiRequest(`/api/submissions/${currentSubmissionId}/complete`, {
                  method: 'POST',
                });
                console.log('✅ Submission completed');
                
                // Navigate to student dashboard after a short delay
                setTimeout(() => {
                  navigate('/student');
                  toast({
                    title: "Test yakunlandi",
                    description: "Javoblaringiz muvaffaqiyatli yuklandi",
                  });
                }, 1000);
              } catch (error) {
                console.error('❌ Error completing submission:', error);
                toast({
                  title: "Xatolik",
                  description: "Testni yakunlashda xatolik yuz berdi",
                  variant: "destructive",
                });
              }
            }
          } else {
            // Move to next question in flat list - NO SKIP!
            setGlobalQuestionIndex(prevIdx => {
              const nextIdx = prevIdx + 1;
              console.log(`✅ [STATE UPDATE] Question index: ${prevIdx} → ${nextIdx}`);
              return nextIdx;
            });
          }
        };
        
        progressToNext();
      }
    }

    return () => {
      if (sectionTimerRef.current) clearTimeout(sectionTimerRef.current);
    };
    // CRITICAL: Do NOT include globalQuestionIndex or flatQuestionList in deps!
    // They cause double progression when they change. We use refs instead.
  }, [timeRemaining, testPhase, isSubmitting, isRecording, micTestCompleted]);

  // Mikrofon test sahifasi - show before checking other data
  if (!micTestCompleted) {
    if (purchaseLoading || testLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg">Yuklanmoqda...</div>
        </div>
      );
    }
    
    if (!purchase || !test) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg text-destructive">Ma'lumot topilmadi</div>
        </div>
      );
    }
    const micTestText = `Assalomu alaykum! Mening ismim ${user?.firstName || "Talaba"}. Men Imtihonchi platformasida CEFR og'zaki baholash testini topshiryapman. Mikrafonim to'g'ri sozlanganini tekshiryapman. Agar ovoz yaxshi eshitilsa, testni boshlashim mumkin.`;

    return (
      <div className="min-h-screen bg-background">
        <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Mikrofon testi</h1>
            <Button 
              variant="outline" 
              onClick={() => {
                if (confirm("Testni bekor qilmoqchimisiz?")) {
                  navigate("/student");
                }
              }}
            >
              Bekor qilish
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Mikrofon sozlamasini tekshiring</CardTitle>
              <CardDescription className="text-base">
                Test boshlashdan avval mikrofoningiz to'g'ri ishlayotganini tekshiring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Quyidagi matnni o'qing va ovozingizni tinglang. Agar yaxshi eshitilsa, testni boshlashingiz mumkin.
                </AlertDescription>
              </Alert>

              <div className="p-6 bg-muted/30 rounded-lg border-2">
                <p className="text-lg leading-relaxed">{micTestText}</p>
              </div>

              <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed rounded-lg bg-muted/10">
                {!isMicTesting && !micTestRecording ? (
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                      <Mic className="h-10 w-10 text-primary" />
                    </div>
                    <Button onClick={startMicTest} size="lg" data-testid="button-start-mic-test">
                      <Mic className="h-5 w-5 mr-2" />
                      Yozishni boshlash
                    </Button>
                  </div>
                ) : isMicTesting ? (
                  <div className="text-center space-y-4 w-full">
                    <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center animate-pulse">
                      <Mic className="h-10 w-10 text-destructive" />
                    </div>
                    <p className="text-lg font-medium">Yozilmoqda... Matnni o'qing</p>
                    
                    {/* Wave visualization canvas */}
                    <div className="w-full bg-background border-2 rounded-lg overflow-hidden">
                      <canvas 
                        ref={canvasRef}
                        width={600}
                        height={120}
                        className="w-full h-[120px]"
                      />
                    </div>
                    
                    <div className="my-6">
                      <p className="text-sm text-muted-foreground mb-2">Yozilgan vaqt:</p>
                      <p className="text-[100px] md:text-[120px] font-black font-mono text-primary leading-none">{recordingTime}s</p>
                    </div>
                    <Button onClick={stopMicTest} variant="destructive" size="lg">
                      <Square className="h-5 w-5 mr-2" />
                      To'xtatish
                    </Button>
                  </div>
                ) : micTestRecording ? (
                  <div className="w-full space-y-4">
                    <div className="text-center space-y-2">
                      <div className="w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
                        <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-lg font-medium">Yozuv tayyor!</p>
                    </div>
                    
                    <div className="p-4 bg-background border rounded-lg">
                      <audio 
                        src={micTestRecording.url || undefined} 
                        controls 
                        className="w-full"
                        data-testid="audio-mic-test"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        onClick={() => {
                          if (micTestRecording.url) {
                            URL.revokeObjectURL(micTestRecording.url);
                          }
                          setMicTestRecording(null);
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Qayta yozish
                      </Button>
                      <Button 
                        onClick={async () => {
                          try {
                            await createSubmission();
                            setMicTestCompleted(true);
                          } catch (error) {
                            // Error already handled in createSubmission
                          }
                        }}
                        className="flex-1"
                        data-testid="button-start-test"
                      >
                        <Check className="h-5 w-5 mr-2" />
                        Testni boshlash
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Show loading while sections/questions are being fetched
  if (sectionsLoading || questionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Test yuklanmoqda...</div>
      </div>
    );
  }

  // Check if data is valid
  if (!purchase || !test || sections.length === 0 || allQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-destructive">Test ma'lumotlari topilmadi</div>
      </div>
    );
  }

  // All questions completed - show submission screen
  if (!currentSection || !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Test topshirildi</CardTitle>
            <CardDescription>
              Barcha savollar tugatildi. Test topshirishingiz mumkin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={submitTest} disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Yuklanmoqda..." : "Testni topshirish"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentRecording = recordings[currentQuestion.id];
  const isQuestionAnswered = !!currentRecording;

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate" data-testid="text-test-title">
              {test.title}
            </h1>
            <p className="text-xs text-muted-foreground">
              Savol {globalQuestionIndex + 1}/{flatQuestionList.length}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">Qolgan vaqt</p>
              <p className={`text-lg font-bold ${(timeRemaining !== null && timeRemaining < 30) ? 'text-destructive' : 'text-primary'}`} data-testid="text-timer">
                {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}
              </p>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => {
                if (confirm("Testni yarim qoldirmoqchimisiz?")) {
                  navigate("/student");
                }
              }}
            >
              Chiqish
            </Button>
          </div>
        </div>
        
        <div className="container mx-auto px-4 pb-2">
          <div className="flex items-center gap-3">
            <Progress value={progress} className="flex-1" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {completedQuestions}/{totalQuestions}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Question Text - FIRST! */}
          <Card className="border-2 border-primary/20">
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Badge variant="outline" className="text-base px-4 py-2">
                    {currentQuestion.sectionTitle} - Savol {globalQuestionIndex + 1}/{flatQuestionList.length}
                  </Badge>
                  {isQuestionAnswered && (
                    <Badge variant="default">
                      <Check className="h-3 w-3 mr-1" />
                      Javob berildi
                    </Badge>
                  )}
                </div>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-2xl md:text-3xl font-bold leading-relaxed text-foreground">{currentQuestion.questionText}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Large Timer Display */}
          <Card className="border-4 border-primary/30">
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Badge variant={testPhase === 'preparation' ? 'secondary' : 'default'} className="text-base px-4 py-2">
                    {testPhase === 'preparation' ? '📖 Tayyorgarlik' : '🎤 Gapirish'}
                  </Badge>
                </div>
                
                <div className="relative">
                  <div className={`text-[120px] md:text-[160px] font-black leading-none tracking-tight font-mono ${
                    (timeRemaining !== null && timeRemaining < 30) ? 'text-destructive animate-pulse' : 
                    testPhase === 'preparation' ? 'text-primary' : 'text-green-600 dark:text-green-400'
                  }`} data-testid="text-timer-large">
                    {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}
                  </div>
                  <p className="text-lg text-muted-foreground mt-2">
                    {testPhase === 'preparation' 
                      ? 'Savol ustida o\'ylab, javob tayyorlang' 
                      : 'Javobingizni aytib bering (yozilmoqda)'}
                  </p>
                </div>

                {testPhase === 'speaking' && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <div className="w-4 h-4 bg-destructive rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Ovoz yozilmoqda</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{currentSection.title}</CardTitle>
                  {currentSection.instructions && (
                    <CardDescription className="mt-2">
                      {currentSection.instructions}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Images and Key Facts Card */}
          {(currentSection.imageUrl || currentQuestion.imageUrl || currentQuestion.keyFactsPlus || currentQuestion.keyFactsMinus) && (
            <Card className="border-2">
              <CardContent className="space-y-6 pt-6">
                {/* Section Image - Shows for all questions in this section */}
                {currentSection.imageUrl && (
                  <div className="rounded-lg overflow-hidden border-2 border-primary/20 bg-muted/20 p-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                      Bo'lim rasmi (barcha savollar uchun):
                    </p>
                    <img 
                      src={currentSection.imageUrl} 
                      alt="Bo'lim rasmi"
                      className="w-full h-auto rounded-md"
                      data-testid="section-image"
                    />
                  </div>
                )}

                {/* Question Image */}
                {currentQuestion.imageUrl && (
                  <div className="rounded-lg overflow-hidden border">
                    <img 
                      src={currentQuestion.imageUrl} 
                      alt="Savol rasmi"
                      className="w-full h-auto"
                    />
                  </div>
                )}

                {/* Key Facts - Bo'lim 3 uchun */}
                {(currentQuestion.keyFactsPlus || currentQuestion.keyFactsMinus) && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {currentQuestion.keyFactsPlus && (
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                          <span>➕</span> {currentQuestion.keyFactsPlusLabel || "Plus tomonlar"}
                        </h4>
                        <p className="text-sm text-green-900 dark:text-green-200 whitespace-pre-wrap">
                          {currentQuestion.keyFactsPlus}
                        </p>
                      </div>
                    )}
                    {currentQuestion.keyFactsMinus && (
                      <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                          <span>➖</span> {currentQuestion.keyFactsMinusLabel || "Minus tomonlar"}
                        </h4>
                        <p className="text-sm text-red-900 dark:text-red-200 whitespace-pre-wrap">
                          {currentQuestion.keyFactsMinus}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recording Status Card */}
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-4 p-6 bg-muted/30 rounded-lg border-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Audio javob holati</h3>
                  {isRecording && (
                    <div className="flex items-center gap-2 text-destructive">
                      <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                      <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
                    </div>
                  )}
                </div>

                {/* Wave visualization during recording */}
                {isRecording && (
                  <div className="w-full bg-background border-2 rounded-lg overflow-hidden">
                    <canvas 
                      ref={canvasRef}
                      width={800}
                      height={120}
                      className="w-full h-[120px]"
                    />
                  </div>
                )}

                {currentRecording ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">Javob yozildi</p>
                        <p className="text-xs text-green-700 dark:text-green-300">Davomiyligi: {formatTime(currentRecording.duration)}</p>
                      </div>
                    </div>
                    <audio 
                      src={currentRecording.url || undefined} 
                      controls 
                      className="w-full"
                      data-testid="audio-playback"
                    />
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {testPhase === 'preparation' 
                        ? 'Tayyorgarlik vaqti tugagach, avtomatik yozuv boshlanadi'
                        : 'Javob avtomatik yozilmoqda...'}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Auto-progression Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                <strong>Avtomatik rejim:</strong> Vaqt tugagach keyingi savolga avtomatik o'tiladi
              </span>
              {globalQuestionIndex === flatQuestionList.length - 1 && (
                <Button
                  onClick={submitTest}
                  disabled={isSubmitting}
                  size="sm"
                  data-testid="button-submit-test"
                >
                  {isSubmitting ? "Yuklanmoqda..." : "Testni topshirish"}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </div>
      </main>
    </div>
  );
}

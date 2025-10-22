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
  
  // Third pass: assign display numbers
  const assignDisplayNumbers = (nodes: HierarchicalSection[], prefix = '') => {
    nodes
      .sort((a, b) => a.sectionNumber - b.sectionNumber)
      .forEach((node, index) => {
        const num = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
        node.displayNumber = num;
        if (node.children && node.children.length > 0) {
          assignDisplayNumbers(node.children, num);
        }
      });
  };
  assignDisplayNumbers(rootSections);
  
  return rootSections;
}

// Helper to flatten hierarchical tree back to array with display numbers
function flattenSections(tree: HierarchicalSection[]): HierarchicalSection[] {
  const result: HierarchicalSection[] = [];
  const traverse = (nodes: HierarchicalSection[]) => {
    nodes.forEach(node => {
      result.push(node);
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  };
  traverse(tree);
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

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [recordings, setRecordings] = useState<{ [questionId: string]: AudioRecording }>({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testPhase, setTestPhase] = useState<'preparation' | 'speaking'>('preparation');

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
      
      setQuestionsLoading(true);
      try {
        const questionsPromises = sections.map(section =>
          fetch(`/api/sections/${section.id}/questions`).then(res => res.json())
        );
        const questionsArrays = await Promise.all(questionsPromises);
        const flatQuestions = questionsArrays.flat();
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

  const currentSection = useMemo(() => sections[currentSectionIndex], [sections, currentSectionIndex]);
  const sectionQuestions = useMemo(() => 
    allQuestions
      .filter(q => q.sectionId === currentSection?.id)
      .sort((a, b) => a.questionNumber - b.questionNumber),
    [allQuestions, currentSection]
  );
  const currentQuestion = useMemo(() => sectionQuestions[currentQuestionIndex], [sectionQuestions, currentQuestionIndex]);

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

  const handleNextSection = useCallback(async () => {
    // Stop any active recording and wait for it to complete
    if (isRecording) {
      await stopRecording();
    }
    
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
      
      // Reset to preparation phase
      setTimeRemaining(0); // Trigger initialization effect
      setTestPhase('preparation');
    }
  }, [isRecording, stopRecording, currentSectionIndex, sections.length]);

  const handleNextQuestion = useCallback(async () => {
    // Stop any active recording and wait for it to complete
    if (isRecording) {
      await stopRecording();
    }
    
    if (currentQuestionIndex < sectionQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      // Reset to preparation phase
      setTimeRemaining(0); // Trigger initialization effect
      setTestPhase('preparation');
    } else {
      handleNextSection();
    }
  }, [isRecording, stopRecording, currentQuestionIndex, sectionQuestions.length, handleNextSection]);

  const handlePrevQuestion = useCallback(async () => {
    // Stop any active recording and wait for it to complete
    if (isRecording) {
      await stopRecording();
    }
    
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      // Reset to preparation phase
      setTimeRemaining(0); // Trigger initialization effect
      setTestPhase('preparation');
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
      const prevSection = sections[currentSectionIndex - 1];
      const prevQuestions = allQuestions.filter(q => q.sectionId === prevSection.id);
      setCurrentQuestionIndex(prevQuestions.length - 1);
      
      // Reset to preparation phase
      setTimeRemaining(0); // Trigger initialization effect
      setTestPhase('preparation');
    }
  }, [isRecording, stopRecording, currentQuestionIndex, currentSectionIndex, sections, allQuestions]);

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
        answers: uploadedUrls,
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

  // Initialize section timer with preparation phase - ONLY when mic test completes OR question/section changes
  useEffect(() => {
    // CRITICAL: Only run this effect AFTER mic test is completed
    if (!micTestCompleted) return;
    
    // Initialize timer for new question
    if (currentSection && currentQuestion) {
      console.log(`🔄 [Timer Init] Question ${currentQuestionIndex + 1}, Section ${currentSectionIndex + 1}`);
      const prepTime = currentQuestion.preparationTime ?? currentSection.preparationTime ?? 5;
      console.log(`⏱️ [Timer Init] Preparation time: ${prepTime}s`);
      setTimeRemaining(prepTime);
      setTestPhase('preparation');
      // Reset auto-progress flag when starting new question
      autoProgressQueuedRef.current = false;
    }
  }, [micTestCompleted, currentSectionIndex, currentQuestionIndex, currentSection, currentQuestion]);

  // Section timer countdown with auto-progression
  useEffect(() => {
    // CRITICAL: Only countdown after mic test is completed
    if (!micTestCompleted) {
      console.log('⏸️ [Timer Countdown] Blocked - mic test not completed');
      return;
    }
    
    if (timeRemaining > 0 && !isSubmitting) {
      console.log(`⏱️ [Timer Countdown] ${timeRemaining}s remaining (${testPhase})`);
      sectionTimerRef.current = window.setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && currentSection && currentQuestion && !autoProgressQueuedRef.current) {
      // Time's up - handle phase transition
      if (testPhase === 'preparation') {
        console.log('⏰ Preparation phase complete, starting speaking phase');
        // Preparation done - start speaking phase
        const speakTime = currentQuestion.speakingTime ?? currentSection.speakingTime ?? 30;
        setTimeRemaining(speakTime);
        setTestPhase('speaking');
        
        // Auto-start recording
        if (!isRecording) {
          console.log('🎤 Auto-starting recording');
          startRecording();
        }
      } else if (testPhase === 'speaking') {
        console.log('⏰ Speaking phase complete, auto-progressing to next question');
        // Mark auto-progress as queued to prevent re-triggers
        autoProgressQueuedRef.current = true;
        
        // Speaking time done - auto stop recording and move to next
        const handleAutoProgress = async () => {
          if (isRecording) {
            console.log('🛑 Stopping recording before progression');
            await stopRecording();
          }
          
          // Auto-move to next question after stop completes
          setTimeout(() => {
            console.log('➡️ Moving to next question');
            handleNextQuestion();
          }, 500);
        };
        
        handleAutoProgress();
      }
    }

    return () => {
      if (sectionTimerRef.current) clearTimeout(sectionTimerRef.current);
    };
  }, [timeRemaining, currentSection, currentQuestion, testPhase, isSubmitting, isRecording, micTestCompleted, handleNextQuestion, startRecording, stopRecording]);

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
                        onClick={() => setMicTestCompleted(true)}
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
              Bo'lim {currentSectionIndex + 1}/{sections.length} - Savol {currentQuestionIndex + 1}/{sectionQuestions.length}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">Qolgan vaqt</p>
              <p className={`text-lg font-bold ${timeRemaining < 30 ? 'text-destructive' : 'text-primary'}`} data-testid="text-timer">
                {formatTime(timeRemaining)}
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
                    Bo'lim {currentSection.displayNumber || currentSectionIndex + 1} - Savol {currentQuestionIndex + 1}/{sectionQuestions.length}
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
                    timeRemaining < 30 ? 'text-destructive animate-pulse' : 
                    testPhase === 'preparation' ? 'text-primary' : 'text-green-600 dark:text-green-400'
                  }`} data-testid="text-timer-large">
                    {formatTime(timeRemaining)}
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
              {currentQuestionIndex === sectionQuestions.length - 1 && 
               currentSectionIndex === sections.length - 1 && (
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

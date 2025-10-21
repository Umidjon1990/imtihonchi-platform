import { useState, useEffect, useRef, useMemo } from "react";
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

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [recordings, setRecordings] = useState<{ [questionId: string]: AudioRecording }>({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const sectionTimerRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);

  const { data: purchase } = useQuery<Purchase>({
    queryKey: ["/api/purchases", purchaseId],
    enabled: !!purchaseId,
  });

  const { data: test } = useQuery<Test>({
    queryKey: ["/api/tests", purchase?.testId],
    enabled: !!purchase?.testId,
  });

  const { data: rawSections = [] } = useQuery<TestSection[]>({
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

  const currentSection = sections[currentSectionIndex];
  const sectionQuestions = allQuestions.filter(q => q.sectionId === currentSection?.id);
  const currentQuestion = sectionQuestions[currentQuestionIndex];

  // Calculate total progress
  const completedQuestions = Object.keys(recordings).length;
  const totalQuestions = allQuestions.length;
  const progress = totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0;

  // Initialize section timer
  useEffect(() => {
    if (currentSection && timeRemaining === 0) {
      const timeLimit = currentSection.preparationTime + currentSection.speakingTime;
      setTimeRemaining(timeLimit);
    }
  }, [currentSection, currentSectionIndex]);

  // Section timer countdown
  useEffect(() => {
    if (timeRemaining > 0 && !isSubmitting) {
      sectionTimerRef.current = window.setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && currentSection && sectionQuestions.length > 0) {
      // Time's up for this section - move to next
      if (currentSectionIndex < sections.length - 1) {
        handleNextSection();
      }
    }

    return () => {
      if (sectionTimerRef.current) clearTimeout(sectionTimerRef.current);
    };
  }, [timeRemaining, currentSection, isSubmitting]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
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
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
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
        
        if (currentQuestion) {
          setRecordings(prev => ({
            ...prev,
            [currentQuestion.id]: {
              blob: audioBlob,
              url: audioUrl,
              duration,
            },
          }));
        }
        
        stream.getTracks().forEach(track => track.stop());
        recordingStartTimeRef.current = null;
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
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < sectionQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleNextSection();
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
      const prevSection = sections[currentSectionIndex - 1];
      const prevQuestions = allQuestions.filter(q => q.sectionId === prevSection.id);
      setCurrentQuestionIndex(prevQuestions.length - 1);
      
      // Reset timer for previous section
      const timeLimit = prevSection.preparationTime + prevSection.speakingTime;
      setTimeRemaining(timeLimit);
    }
  };

  const handleNextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
      const nextSection = sections[currentSectionIndex + 1];
      const timeLimit = nextSection ? nextSection.preparationTime + nextSection.speakingTime : 120;
      setTimeRemaining(timeLimit);
    }
  };

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

  if (!purchase || !test || sections.length === 0 || questionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yuklanmoqda...</div>
      </div>
    );
  }

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
                <Badge variant="outline">
                  Bo'lim {currentSection.displayNumber || currentSectionIndex + 1}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Question Card */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-xl">
                  Savol {currentQuestionIndex + 1}
                </CardTitle>
                {isQuestionAnswered && (
                  <Badge variant="default">
                    <Check className="h-3 w-3 mr-1" />
                    Javob berildi
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
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

              {/* Question Text */}
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-lg leading-relaxed">{currentQuestion.questionText}</p>
              </div>

              {/* Key Facts - Bo'lim 3 uchun */}
              {(currentQuestion.keyFactsPlus || currentQuestion.keyFactsMinus) && (
                <div className="grid md:grid-cols-2 gap-4">
                  {currentQuestion.keyFactsPlus && (
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                        <span>➕</span> Plus tomonlar
                      </h4>
                      <p className="text-sm text-green-900 dark:text-green-200 whitespace-pre-wrap">
                        {currentQuestion.keyFactsPlus}
                      </p>
                    </div>
                  )}
                  {currentQuestion.keyFactsMinus && (
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                        <span>➖</span> Minus tomonlar
                      </h4>
                      <p className="text-sm text-red-900 dark:text-red-200 whitespace-pre-wrap">
                        {currentQuestion.keyFactsMinus}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Recording Section */}
              <div className="space-y-4 p-6 bg-muted/30 rounded-lg border-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Audio javob</h3>
                  {isRecording && (
                    <div className="flex items-center gap-2 text-destructive">
                      <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                      <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
                    </div>
                  )}
                </div>

                {currentRecording && !isRecording ? (
                  <div className="space-y-3">
                    <audio 
                      src={currentRecording.url || undefined} 
                      controls 
                      className="w-full"
                      data-testid="audio-playback"
                    />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Davomiyligi: {formatTime(currentRecording.duration)}</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={startRecording}
                        data-testid="button-rerecord"
                      >
                        Qayta yozish
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 py-6">
                    {!isRecording ? (
                      <>
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                          <Mic className="h-10 w-10 text-primary" />
                        </div>
                        <Button 
                          size="lg" 
                          onClick={startRecording}
                          data-testid="button-start-recording"
                        >
                          <Mic className="h-4 w-4 mr-2" />
                          Yozishni boshlash
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                          Mikrofon tugmasini bosing va javobingizni aytib bering
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-24 h-24 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
                          <MicOff className="h-12 w-12 text-destructive" />
                        </div>
                        <Button 
                          size="lg" 
                          variant="destructive"
                          onClick={stopRecording}
                          data-testid="button-stop-recording"
                        >
                          <Square className="h-4 w-4 mr-2" />
                          Yozishni to'xtatish
                        </Button>
                        <p className="text-sm text-muted-foreground">
                          Javobingizni gapiring...
                        </p>
                      </>
                    )}
                  </div>
                )}

                {!isQuestionAnswered && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Bu savolga javob berishni unutmang. Keyinroq qaytib kelishingiz mumkin.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={handlePrevQuestion}
              disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
              data-testid="button-prev"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Oldingi
            </Button>

            <div className="text-sm text-muted-foreground">
              {currentQuestionIndex === sectionQuestions.length - 1 && 
               currentSectionIndex === sections.length - 1 ? (
                <span className="font-medium text-primary">Oxirgi savol</span>
              ) : (
                <span>
                  {currentQuestionIndex === sectionQuestions.length - 1
                    ? "Keyingi bo'limga o'tish"
                    : "Keyingi savol"}
                </span>
              )}
            </div>

            {currentQuestionIndex === sectionQuestions.length - 1 && 
             currentSectionIndex === sections.length - 1 ? (
              <Button
                onClick={submitTest}
                disabled={isSubmitting}
                data-testid="button-submit-test"
              >
                {isSubmitting ? "Yuklanmoqda..." : "Testni topshirish"}
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                data-testid="button-next"
              >
                Keyingi
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

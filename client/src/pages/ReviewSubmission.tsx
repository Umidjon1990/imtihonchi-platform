import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Volume2, Check, User, FileText, Award, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";

const CEFR_LEVELS = [
  { value: "A1", label: "A1 - Boshlang'ich" },
  { value: "A2", label: "A2 - Elementar" },
  { value: "B1", label: "B1 - O'rta" },
  { value: "B2", label: "B2 - Yuqori o'rta" },
  { value: "C1", label: "C1 - Ilg'or" },
  { value: "C2", label: "C2 - Profессional" },
];

export default function ReviewSubmission() {
  const [, params] = useRoute("/teacher/review/:submissionId");
  const submissionId = params?.submissionId;
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [questionScores, setQuestionScores] = useState<{ [questionId: string]: number }>({});
  const [totalScore, setTotalScore] = useState(0);
  const [cefrLevel, setCefrLevel] = useState("");
  const [feedback, setFeedback] = useState("");
  const [studentNameOverride, setStudentNameOverride] = useState("");
  const [showAiPanel, setShowAiPanel] = useState(false);

  const { data: submission, isLoading: submissionLoading } = useQuery<any>({
    queryKey: ["/api/submissions", submissionId],
    enabled: !!submissionId,
  });

  const { data: test } = useQuery<any>({
    queryKey: ["/api/tests", submission?.testId],
    enabled: !!submission?.testId,
  });

  const { data: sections = [] } = useQuery<any[]>({
    queryKey: ["/api/tests", test?.id, "sections"],
    enabled: !!test?.id,
  });

  const [allQuestions, setAllQuestions] = useState<any[]>([]);
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
      } finally {
        setQuestionsLoading(false);
      }
    };

    fetchAllQuestions();
  }, [sections]);

  const { data: existingResult } = useQuery<any>({
    queryKey: ["/api/results", submissionId],
    enabled: !!submissionId,
  });

  // Fetch submission answers
  const { data: submissionAnswers = [], isLoading: answersLoading } = useQuery<any[]>({
    queryKey: ["/api/submissions", submissionId, "answers"],
    enabled: !!submissionId,
  });

  // Fetch student data
  const { data: student } = useQuery<any>({
    queryKey: ["/api/users", submission?.studentId],
    enabled: !!submission?.studentId,
  });

  // Fetch AI evaluation
  const { data: aiEvaluation, isLoading: aiEvaluationLoading } = useQuery<any>({
    queryKey: ["/api/submissions", submissionId, "ai-evaluation"],
    enabled: !!submissionId && showAiPanel,
    retry: false,
  });

  // Transcribe mutation
  const transcribeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/submissions/${submissionId}/transcribe`, {});
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Transkripsiya tayyor",
        description: `${data.transcribed} / ${data.total} audio yozuv matnli ko'rinishga o'tkazildi`,
      });
      // Invalidate answers to refetch with transcripts
      queryClient.invalidateQueries({ queryKey: ["/api/submissions", submissionId, "answers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik",
        description: error.message || "Transkripsiya xatolik",
        variant: "destructive",
      });
    },
  });

  // AI evaluate mutation
  const aiEvaluateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/submissions/${submissionId}/ai-evaluate`, {});
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: "AI Baholash Tayyor",
        description: "ChatGPT tomonidan baholash yakunlandi",
      });
      setShowAiPanel(true);
      // Prefill suggestions
      setTotalScore(data.suggestedScore);
      setCefrLevel(data.suggestedCefrLevel);
      // Combine AI feedback
      const combinedFeedback = `SO'Z BOYLIGI (${data.vocabularyScore}/100):\n${data.vocabularyFeedback}\n\nGRAMMATIKA (${data.grammarScore}/100):\n${data.grammarFeedback}\n\nIZCHILLIK (${data.coherenceScore}/100):\n${data.coherenceFeedback}\n\nUMUMIY XULOSA:\n${data.overallFeedback}`;
      setFeedback(combinedFeedback);
      queryClient.invalidateQueries({ queryKey: ["/api/submissions", submissionId, "ai-evaluation"] });
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik",
        description: error.message || "AI baholash xatolik",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (existingResult) {
      setTotalScore(existingResult.score || 0);
      setCefrLevel(existingResult.cefrLevel || "");
      setFeedback(existingResult.feedback || "");
      setStudentNameOverride(existingResult.studentNameOverride || "");
    }
  }, [existingResult]);

  const submitResultMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/results", {
        submissionId,
        score: totalScore,
        cefrLevel,
        feedback,
        studentNameOverride: studentNameOverride || undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: "Muvaffaqiyat!",
        description: "Natija saqlandi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/submissions/teacher"] });
      queryClient.invalidateQueries({ queryKey: ["/api/results", submissionId] });
      navigate("/teacher");
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik",
        description: error.message || "Natijani saqlashda xatolik",
        variant: "destructive",
      });
    },
  });

  if (submissionLoading || questionsLoading || answersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yuklanmoqda...</div>
      </div>
    );
  }

  if (!submission || !test) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Topshiriq topilmadi</CardTitle>
            <CardDescription>
              Bu topshiriq mavjud emas yoki sizga ruxsat berilmagan.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Create a map of questionId -> audioUrl from submission answers
  const audioFiles: { [questionId: string]: string } = {};
  submissionAnswers.forEach((answer: any) => {
    // Only add to map if audioUrl exists
    if (answer.audioUrl) {
      audioFiles[answer.questionId] = `/api/audio/${answer.audioUrl}`;
    }
  });

  const totalQuestions = allQuestions.length;
  const answeredQuestions = Object.keys(audioFiles).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/teacher">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold" data-testid="text-test-title">
                {test.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                Topshiriqni baholash
              </p>
            </div>
          </div>
          <Badge variant={submission.status === 'graded' ? 'default' : 'secondary'}>
            {submission.status === 'graded' ? 'Baholangan' : 'Baholanmagan'}
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Student Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Talaba Ma'lumotlari
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Ism Familiya</p>
                  <p className="font-medium">{submission.studentName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Topshirilgan vaqt</p>
                  <p className="font-medium">
                    {new Date(submission.submittedAt).toLocaleDateString('uz-UZ', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Javoblar</p>
                  <p className="font-medium">
                    {answeredQuestions} / {totalQuestions}
                  </p>
                  <Progress value={(answeredQuestions / totalQuestions) * 100} className="mt-2" />
                </div>
              </CardContent>
            </Card>

            {/* AI Assistant Card */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Yordamchi
                </CardTitle>
                <CardDescription>
                  ChatGPT yordamida avtomatik baholash
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => transcribeMutation.mutate()}
                  disabled={transcribeMutation.isPending}
                  data-testid="button-transcribe"
                >
                  {transcribeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {transcribeMutation.isPending ? "Transkripsiya..." : "1. Audio → Matn"}
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => aiEvaluateMutation.mutate()}
                  disabled={aiEvaluateMutation.isPending}
                  data-testid="button-ai-evaluate"
                >
                  {aiEvaluateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {aiEvaluateMutation.isPending ? "Baholanmoqda..." : "2. AI Baholash"}
                </Button>

                <p className="text-xs text-muted-foreground">
                  Avval audiolarni matnga o'giring, keyin AI baholash tugmasini bosing
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Umumiy Natija
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="total-score">Umumiy Ball (0-100)</Label>
                  <Input
                    id="total-score"
                    type="number"
                    min="0"
                    max="100"
                    value={totalScore}
                    onChange={(e) => setTotalScore(Number(e.target.value))}
                    data-testid="input-total-score"
                  />
                </div>
                <div>
                  <Label htmlFor="cefr-level">CEFR Darajasi</Label>
                  <Select value={cefrLevel} onValueChange={setCefrLevel}>
                    <SelectTrigger id="cefr-level" data-testid="select-cefr">
                      <SelectValue placeholder="Darajani tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {CEFR_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="feedback">Umumiy Izoh</Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Talabaga umumiy izoh va tavsiyalar..."
                    rows={4}
                    data-testid="textarea-feedback"
                  />
                </div>
                <div className="border-t pt-4">
                  <Label htmlFor="student-name-override">
                    Talaba Ism-Familiyasi (Sertifikat uchun)
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Database'dagi ism: {student?.firstName} {student?.lastName}. 
                    Agar bu to'g'ri bo'lmasa, sertifikatda chiqishi kerak bo'lgan to'g'ri ism-familiyani kiriting.
                  </p>
                  <Input
                    id="student-name-override"
                    value={studentNameOverride}
                    onChange={(e) => setStudentNameOverride(e.target.value)}
                    placeholder={`${student?.firstName || ''} ${student?.lastName || ''}`.trim() || "Masalan: Abdulloh Karimov"}
                    data-testid="input-student-name"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => submitResultMutation.mutate()}
                  disabled={submitResultMutation.isPending || !totalScore || !cefrLevel}
                  data-testid="button-submit-result"
                >
                  {submitResultMutation.isPending ? "Saqlanmoqda..." : "Natijani saqlash"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Audio Review */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Audio Javoblar
                </CardTitle>
                <CardDescription>
                  Har bir savolning audio javobini tinglang
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={sections[0]?.id} className="space-y-4">
                  <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
                    {sections.map((section: any, idx: number) => (
                      <TabsTrigger key={section.id} value={section.id}>
                        Bo'lim {idx + 1}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {sections.map((section: any) => {
                    const sectionQuestions = allQuestions.filter(q => q.sectionId === section.id);
                    
                    return (
                      <TabsContent key={section.id} value={section.id} className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold">{section.title}</h3>
                          {section.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {section.description}
                            </p>
                          )}
                        </div>

                        <div className="space-y-4">
                          {sectionQuestions.map((question: any, qIdx: number) => {
                            const audioUrl = audioFiles[question.id];
                            const answer = submissionAnswers.find((a: any) => a.questionId === question.id);
                            const transcript = answer?.transcript;
                            
                            return (
                              <Card key={question.id}>
                                <CardHeader>
                                  <div className="flex items-start justify-between gap-4">
                                    <CardTitle className="text-base">
                                      Savol {qIdx + 1}
                                    </CardTitle>
                                    {audioUrl && (
                                      <Badge variant="outline">
                                        <Check className="h-3 w-3 mr-1" />
                                        Javob berilgan
                                      </Badge>
                                    )}
                                  </div>
                                  <CardDescription className="mt-2">
                                    {question.questionText}
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  {question.imageUrl && (
                                    <div className="rounded-lg overflow-hidden border">
                                      <img 
                                        src={question.imageUrl} 
                                        alt="Savol rasmi"
                                        className="w-full h-auto"
                                      />
                                    </div>
                                  )}

                                  {audioUrl ? (
                                    <div className="p-4 bg-muted/30 rounded-lg border-2">
                                      <div className="flex items-center gap-3 mb-3">
                                        <Volume2 className="h-5 w-5 text-primary" />
                                        <p className="text-sm font-medium">Audio Javob</p>
                                      </div>
                                      <audio 
                                        src={audioUrl} 
                                        controls 
                                        className="w-full"
                                        data-testid={`audio-${question.id}`}
                                      />
                                      
                                      {transcript && (
                                        <div className="mt-4 pt-4 border-t">
                                          <p className="text-xs text-muted-foreground mb-2 font-medium">TRANSKRIPSIYA:</p>
                                          <p className="text-sm bg-background p-3 rounded border">
                                            {transcript}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="p-4 bg-muted/30 rounded-lg border-2 text-center text-muted-foreground">
                                      <p className="text-sm">Javob berilmagan</p>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

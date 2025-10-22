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
import { ArrowLeft, Volume2, Check, User, FileText, Award } from "lucide-react";
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

  useEffect(() => {
    if (existingResult) {
      setTotalScore(existingResult.score || 0);
      setCefrLevel(existingResult.cefrLevel || "");
      setFeedback(existingResult.feedback || "");
    }
  }, [existingResult]);

  const submitResultMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/results", {
        submissionId,
        score: totalScore,
        cefrLevel,
        feedback,
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
    audioFiles[answer.questionId] = `/api/audio/${answer.audioUrl}`;
  });

  const totalQuestions = allQuestions.length;
  const answeredQuestions = submissionAnswers.length;

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

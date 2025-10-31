import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, BookOpen, Award, LogOut, Upload, Download } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Test, Purchase, Submission } from "@shared/schema";

function SubmissionCard({ submission, test }: { submission: Submission; test: Test }) {
  const { data: result } = useQuery<any>({
    queryKey: ["/api/results", submission.id],
    enabled: submission.status === 'graded',
  });

  const handleDownloadCertificate = () => {
    if (result?.certificateUrl) {
      window.open(result.certificateUrl, '_blank');
    }
  };

  return (
    <Card data-testid={`card-submission-${submission.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{test.title}</CardTitle>
            <CardDescription>
              Topshirilgan: {new Date(submission.submittedAt).toLocaleDateString('uz-UZ', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </CardDescription>
          </div>
          {submission.status === 'graded' ? (
            <Badge variant="default">
              <Award className="h-3 w-3 mr-1" />
              Baholangan
            </Badge>
          ) : (
            <Badge variant="secondary">Tekshirilmoqda</Badge>
          )}
        </div>
      </CardHeader>
      {result && (
        <>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">CEFR Darajasi</p>
                <p className="text-2xl font-bold text-primary" data-testid={`text-cefr-${submission.id}`}>
                  {result.cefrLevel}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Ball</p>
                <p className="text-2xl font-bold" data-testid={`text-score-${submission.id}`}>
                  {result.score}/100
                </p>
              </div>
            </div>
            {result.feedback && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">O'qituvchi izohi</p>
                <p className="text-sm" data-testid={`text-feedback-${submission.id}`}>
                  {result.feedback}
                </p>
              </div>
            )}
          </CardContent>
          {result.certificateUrl && (
            <CardFooter>
              <Button
                variant="outline"
                onClick={handleDownloadCertificate}
                className="w-full"
                data-testid={`button-certificate-${submission.id}`}
              >
                <Download className="h-4 w-4 mr-2" />
                Sertifikatni yuklab olish
              </Button>
            </CardFooter>
          )}
        </>
      )}
    </Card>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const { data: tests = [], isLoading: testsLoading } = useQuery<Test[]>({
    queryKey: ["/api/tests"],
  });

  const { data: purchases = [], isLoading: purchasesLoading } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
  });

  const { data: submissions = [], isLoading: submissionsLoading } = useQuery<Submission[]>({
    queryKey: ["/api/submissions/student"],
  });

  const publishedTests = tests.filter(t => t.isPublished);
  const purchasedTestIds = new Set(purchases.map(p => p.testId));
  // Mavjud testlar: sotib olinMAgan yoki demo testlar
  const availableTests = publishedTests.filter(t => 
    !purchasedTestIds.has(t.id) || t.isDemo // Demo testlar har doim ko'rinadi
  );

  const createPurchaseMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTest || !receiptFile) throw new Error("Test yoki chek tanlanmagan");
      
      // Upload receipt image to object storage
      const formData = new FormData();
      formData.append("file", receiptFile);
      
      const uploadRes = await fetch("/api/upload-receipt", {
        method: "POST",
        body: formData,
      });
      
      if (!uploadRes.ok) throw new Error("Chek yuklashda xatolik");
      const { url } = await uploadRes.json();
      
      // Create purchase with receipt URL
      await apiRequest("POST", "/api/purchases", {
        testId: selectedTest.id,
        receiptUrl: url,
      });
    },
    onSuccess: () => {
      toast({ title: "Muvaffaqiyat", description: "So'rovingiz yuborildi. Tasdiqlashni kuting." });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      setBuyDialogOpen(false);
      setSelectedTest(null);
      setReceiptFile(null);
    },
    onError: (error: any) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Imtihonchi</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <p className="font-medium" data-testid="text-username">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-muted-foreground text-xs">Talaba</p>
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => window.location.href = '/api/logout'}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Xush kelibsiz, {user?.firstName}!</h2>
            <p className="text-muted-foreground">
              Testlarni sotib oling, topshiring va natijalarni kuzatib boring
            </p>
          </div>

          <Tabs defaultValue="available" className="space-y-6">
            <TabsList>
              <TabsTrigger value="available" data-testid="tab-available">
                Mavjud Testlar
              </TabsTrigger>
              <TabsTrigger value="purchased" data-testid="tab-purchased">
                Sotib Olingan ({purchases.length})
              </TabsTrigger>
              <TabsTrigger value="submissions" data-testid="tab-submissions">
                Topshirilgan ({submissions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="space-y-6">
              {/* UNIVERSAL DEMO TEST - Hamma uchun ochiq! */}
              <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10" data-testid="card-demo-test">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-2xl">Demo Test - Bepul Sinab Ko'ring</CardTitle>
                        <Badge variant="default" className="text-xs">
                          BEPUL
                        </Badge>
                      </div>
                      <CardDescription>
                        Platformamizni sinab ko'ring! CEFR og'zaki baholash testining qisqartirilgan versiyasi. 
                        Natijalar bazaga saqlanmaydi va o'qituvchi tomonidan baholanmaydi.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>~5-10 daqiqa (qisqartirilgan)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span>Platformani tanishish uchun ideal</span>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg border">
                      <p className="text-xs text-muted-foreground">
                        ℹ️ Bu demo test. Natijalaringiz saqlanmaydi va sertifikat berilmaydi.
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href="/take-test/demo" className="w-full">
                    <Button className="w-full" size="lg" data-testid="button-start-demo">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Demo Testni Boshlash
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              {/* Mavjud Testlar */}
              {testsLoading ? (
                <div className="text-center py-12">Yuklanmoqda...</div>
              ) : availableTests.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Hozircha yangi testlar yo'q
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableTests.map((test) => (
                    <Card key={test.id} className={`flex flex-col ${test.isDemo ? 'border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-500/5 to-yellow-500/10' : ''}`} data-testid={`card-test-${test.id}`}>
                      {test.imageUrl && (
                        <div className="aspect-video w-full overflow-hidden rounded-t-xl">
                          <img 
                            src={test.imageUrl} 
                            alt={test.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start gap-2 mb-1">
                          <CardTitle className="line-clamp-2 flex-1">{test.title}</CardTitle>
                          {test.isDemo && (
                            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/50 shrink-0">
                              📱 DEMO
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="line-clamp-3">
                          {test.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>~{test.isDemo ? '5-10' : '30'} daqiqa</span>
                          </div>
                          {test.isDemo ? (
                            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                              BEPUL
                            </div>
                          ) : (
                            <div className="text-2xl font-bold text-primary">
                              {test.price.toLocaleString()} so'm
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        {test.isDemo ? (
                          <Link href="/take-test/demo" className="w-full">
                            <Button 
                              className="w-full" 
                              data-testid={`button-start-demo-${test.id}`}
                            >
                              <BookOpen className="h-4 w-4 mr-2" />
                              Demo Testni Boshlash
                            </Button>
                          </Link>
                        ) : (
                          <Button 
                            className="w-full" 
                            onClick={() => {
                              setSelectedTest(test);
                              setBuyDialogOpen(true);
                            }}
                            data-testid={`button-buy-${test.id}`}
                          >
                            Sotib olish
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="purchased" className="space-y-6">
              {purchasesLoading ? (
                <div className="text-center py-12">Yuklanmoqda...</div>
              ) : purchases.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Sizda sotib olingan testlar yo'q
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {purchases.map((purchase) => {
                    const test = tests.find(t => t.id === purchase.testId);
                    // Only consider submitted or graded submissions as "completed"
                    const hasSubmission = submissions.some(s => 
                      s.purchaseId === purchase.id && 
                      (s.status === 'submitted' || s.status === 'graded')
                    );
                    
                    if (!test) return null;
                    
                    // Demo testni faqat 1 marta topshirish mumkin
                    const isDemoCompleted = test.isDemo && hasSubmission;
                    
                    return (
                      <Card key={purchase.id} className="flex flex-col" data-testid={`card-purchased-${purchase.id}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <CardTitle className="line-clamp-2">{test.title}</CardTitle>
                                {test.isDemo && (
                                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/50 shrink-0">
                                    📱 DEMO
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0">
                              {purchase.status === 'approved' && !test.isDemo && (
                                <Badge variant="default">Tasdiqlangan</Badge>
                              )}
                              {purchase.status === 'pending' && (
                                <Badge variant="secondary">Kutilmoqda</Badge>
                              )}
                              {purchase.status === 'rejected' && (
                                <Badge variant="destructive">Rad etilgan</Badge>
                              )}
                            </div>
                          </div>
                          <CardDescription>
                            {test.isDemo ? "Demo test - Amaliyot uchun" : `Sotib olingan: ${new Date(purchase.purchasedAt).toLocaleDateString('uz-UZ')}`}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <BookOpen className="h-4 w-4" />
                            <span>3 bo'lim, 8 savol</span>
                          </div>
                        </CardContent>
                        <CardFooter>
                          {purchase.status === 'pending' ? (
                            <Button 
                              variant="outline" 
                              className="w-full" 
                              disabled
                              data-testid={`button-pending-${purchase.id}`}
                            >
                              Tasdiqlashni kutilmoqda
                            </Button>
                          ) : purchase.status === 'rejected' ? (
                            <Button 
                              variant="destructive" 
                              className="w-full" 
                              disabled
                              data-testid={`button-rejected-${purchase.id}`}
                            >
                              Rad etilgan
                            </Button>
                          ) : isDemoCompleted ? (
                            <Button 
                              variant="outline" 
                              className="w-full" 
                              disabled
                              data-testid={`button-demo-completed-${purchase.id}`}
                            >
                              ✅ Demo tugatildi
                            </Button>
                          ) : hasSubmission ? (
                            <Button 
                              variant="outline" 
                              className="w-full" 
                              disabled
                              data-testid={`button-submitted-${purchase.id}`}
                            >
                              Topshirilgan
                            </Button>
                          ) : (
                            <Link href={`/test/${purchase.id}`} className="w-full">
                              <Button className="w-full" data-testid={`button-start-${purchase.id}`}>
                                {test.isDemo ? "Demo'ni boshlash" : "Testni boshlash"}
                              </Button>
                            </Link>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="submissions" className="space-y-6">
              {submissionsLoading ? (
                <div className="text-center py-12">Yuklanmoqda...</div>
              ) : submissions.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Sizda topshirilgan testlar yo'q
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => {
                    const test = tests.find(t => t.id === submission.testId);
                    
                    if (!test) return null;
                    
                    return <SubmissionCard key={submission.id} submission={submission} test={test} />;
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <DialogContent data-testid="dialog-buy-test">
          <DialogHeader>
            <DialogTitle>Test sotib olish</DialogTitle>
            <DialogDescription>
              To'lov chekini yuklang. O'qituvchi tasdiqlashidan keyin testni topshirishingiz mumkin bo'ladi.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTest && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">{selectedTest.title}</h3>
                <p className="text-2xl font-bold text-primary">
                  {selectedTest.price.toLocaleString()} so'm
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">To'lov cheki</label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover-elevate active-elevate-2 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="receipt-upload"
                    data-testid="input-receipt"
                  />
                  <label htmlFor="receipt-upload" className="cursor-pointer">
                    {receiptFile ? (
                      <div className="space-y-2">
                        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                          <Upload className="h-8 w-8 text-primary" />
                        </div>
                        <p className="text-sm font-medium">{receiptFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(receiptFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">Chek rasmini yuklang</p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG yoki JPEG
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setBuyDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button 
              onClick={() => createPurchaseMutation.mutate()}
              disabled={!receiptFile || createPurchaseMutation.isPending}
              data-testid="button-submit-purchase"
            >
              Yuborish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

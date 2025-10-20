import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, BookOpen, Award, LogOut } from "lucide-react";
import { Link } from "wouter";
import type { Test, Purchase, Submission } from "@shared/schema";

export default function StudentDashboard() {
  const { user } = useAuth();

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
  const availableTests = publishedTests.filter(t => !purchasedTestIds.has(t.id));

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
                    <Card key={test.id} className="flex flex-col" data-testid={`card-test-${test.id}`}>
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
                        <CardTitle className="line-clamp-2">{test.title}</CardTitle>
                        <CardDescription className="line-clamp-3">
                          {test.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>~30 daqiqa</span>
                          </div>
                          <div className="text-2xl font-bold text-primary">
                            {test.price.toLocaleString()} so'm
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full" 
                          data-testid={`button-buy-${test.id}`}
                        >
                          Sotib olish
                        </Button>
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
                    const hasSubmission = submissions.some(s => s.purchaseId === purchase.id);
                    
                    if (!test) return null;
                    
                    return (
                      <Card key={purchase.id} className="flex flex-col" data-testid={`card-purchased-${purchase.id}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="line-clamp-2">{test.title}</CardTitle>
                            {purchase.status === 'completed' && (
                              <Badge variant="default">To'langan</Badge>
                            )}
                          </div>
                          <CardDescription>
                            Sotib olingan: {new Date(purchase.purchasedAt).toLocaleDateString('uz-UZ')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <BookOpen className="h-4 w-4" />
                            <span>3 bo'lim, 8 savol</span>
                          </div>
                        </CardContent>
                        <CardFooter>
                          {hasSubmission ? (
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
                                Testni boshlash
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
                    
                    return (
                      <Card key={submission.id} data-testid={`card-submission-${submission.id}`}>
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
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

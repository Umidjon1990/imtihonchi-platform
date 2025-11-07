import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function PublicTestCatalog() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: tests, isLoading } = useQuery<any[]>({
    queryKey: ["/api/tests"],
  });

  const { data: categories } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: purchases } = useQuery<any[]>({
    queryKey: ["/api/purchases"],
    enabled: isAuthenticated,
  });

  const handleDemoTest = () => {
    setLocation(`/take-test/demo`);
  };

  const handlePurchaseTest = (testId: string) => {
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(`/tests/${testId}/purchase`);
      window.location.href = `/login?returnUrl=${returnUrl}`;
      return;
    }
    setLocation(`/tests/${testId}/purchase`);
  };

  const isPurchased = (testId: string) => {
    if (!purchases) return false;
    return purchases.some(p => p.testId === testId && p.status === 'approved');
  };

  const hasPendingPurchase = (testId: string) => {
    if (!purchases) return false;
    return purchases.some(p => p.testId === testId && p.status === 'pending');
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories?.find(c => c.id === categoryId);
    return category?.name || 'Kategoriya';
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/')}
              data-testid="button-back-home"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Testlar</h1>
            </div>
          </div>
          {!isAuthenticated ? (
            <Button
              onClick={() => window.location.href = '/login'}
              data-testid="button-login"
            >
              Kirish
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (user?.role === 'admin') setLocation('/admin');
                else if (user?.role === 'teacher') setLocation('/teacher');
                else setLocation('/student');
              }}
              data-testid="button-dashboard"
            >
              Dashboard
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Mavjud Testlar</h2>
          <p className="text-muted-foreground">
            Arab tili bilimingizni CEFR standartlariga asoslangan testlar bilan baholang
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-5/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !tests || tests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Hozircha testlar mavjud emas</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map(test => {
                const purchased = isPurchased(test.id);
                const pending = hasPendingPurchase(test.id);
                const isDemo = test.isDemo;

                return (
                  <Card key={test.id} data-testid={`card-test-${test.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <CardTitle className="text-xl">{test.title}</CardTitle>
                        {isDemo && (
                          <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">
                            📱 DEMO
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        <Badge variant="outline" className="mr-2">
                          {getCategoryName(test.categoryId)}
                        </Badge>
                        {test.price > 0 ? (
                          <span className="font-semibold text-primary">
                            {test.price.toLocaleString()} so'm
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Bepul</span>
                        )}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {test.description || 'Arab tili bilimingizni baholash testi'}
                      </p>

                      {purchased && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="font-medium">Sotib olingan</span>
                        </div>
                      )}

                      {pending && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-500">
                          <Lock className="h-4 w-4" />
                          <span className="font-medium">To'lov kutilmoqda</span>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="flex flex-col gap-2">
                      {isDemo ? (
                        <Button
                          className="w-full bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-700"
                          onClick={handleDemoTest}
                          data-testid={`button-demo-${test.id}`}
                        >
                          📱 Demo testni topshirish
                        </Button>
                      ) : purchased ? (
                        <Button
                          className="w-full"
                          onClick={() => setLocation('/student')}
                          data-testid={`button-my-tests-${test.id}`}
                        >
                          Testni boshlash
                        </Button>
                      ) : pending ? (
                        <Button
                          variant="secondary"
                          className="w-full"
                          disabled
                          data-testid={`button-pending-${test.id}`}
                        >
                          To'lov kutilmoqda...
                        </Button>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={() => handlePurchaseTest(test.id)}
                          data-testid={`button-purchase-${test.id}`}
                        >
                          Sotib olish - {test.price.toLocaleString()} so'm
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
          </div>
        )}
      </main>
    </div>
  );
}

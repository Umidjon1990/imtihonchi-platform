import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Check, AlertCircle, ArrowLeft, MessageCircle } from "lucide-react";

export default function PurchaseTest() {
  const [, params] = useRoute("/tests/:testId/purchase");
  const testId = params?.testId;
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(`/tests/${testId}/purchase`);
    window.location.href = `/login?returnUrl=${returnUrl}`;
    return null;
  }

  const { data: test, isLoading: testLoading } = useQuery<any>({
    queryKey: [`/api/tests/${testId}`],
    enabled: !!testId,
  });

  const { data: purchases } = useQuery<any[]>({
    queryKey: ["/api/purchases"],
  });

  const { data: settings } = useQuery<any>({
    queryKey: ["/api/settings"],
  });

  const existingPurchase = purchases?.find(p => p.testId === testId);

  const handleContactTelegram = () => {
    const telegramLink = settings?.telegramLink || 'arabictest_admin';
    const tgUrl = telegramLink.startsWith('http') 
      ? telegramLink 
      : telegramLink.startsWith('@') 
        ? `https://t.me/${telegramLink.slice(1)}` 
        : `https://t.me/${telegramLink}`;
    
    window.open(tgUrl, '_blank');
  };

  if (testLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Test topilmadi</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/tests')}>
              Testlarga qaytish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (existingPurchase) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 h-16 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/student')}
              data-testid="button-back-dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">To'lov Holati</h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {existingPurchase.status === 'approved' ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />
                )}
                {test.title}
              </CardTitle>
              <CardDescription>
                <Badge variant={
                  existingPurchase.status === 'approved' ? 'default' :
                  existingPurchase.status === 'pending' ? 'secondary' :
                  'destructive'
                }>
                  {existingPurchase.status === 'approved' ? 'Tasdiqlangan' :
                   existingPurchase.status === 'pending' ? 'Kutilmoqda' :
                   'Rad etilgan'}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {existingPurchase.status === 'approved' ? (
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    To'lovingiz tasdiqlangan! Testni "Mening testlarim" bo'limida topishingiz mumkin.
                  </AlertDescription>
                </Alert>
              ) : existingPurchase.status === 'pending' ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    To'lovingiz admin tomonidan ko'rib chiqilmoqda. Tez orada javob beriladi. Agar savolingiz bo'lsa, admin bilan Telegram orqali bog'laning.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    To'lovingiz rad etilgan. Iltimos, admin bilan Telegram orqali bog'laning.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                className="w-full"
                onClick={() => setLocation('/student')}
                data-testid="button-go-dashboard"
              >
                Dashboard ga qaytish
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/tests')}
            data-testid="button-back-tests"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Test Sotib Olish</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{test.title}</CardTitle>
            <CardDescription>
              <span className="text-2xl font-bold text-primary">
                {test.price.toLocaleString()} so'm
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {test.description || 'Arab tili bilimingizni baholash testi'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Admin bilan bog'laning
            </CardTitle>
            <CardDescription>
              Testni sotib olish uchun admin bilan Telegram orqali bog'laning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Testni sotib olish jarayoni:
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-6 rounded-lg space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Telegram orqali admin bilan bog'laning</p>
                    <p className="text-sm text-muted-foreground">
                      Quyidagi tugmani bosib, admin bilan muloqotni boshlang
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Quyidagi ma'lumotlarni yuboring</p>
                    <p className="text-sm text-muted-foreground">
                      • Test nomi: <strong>{test.title}</strong><br />
                      • Narxi: <strong>{test.price.toLocaleString()} so'm</strong><br />
                      • Ismingiz va familiyangiz
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">To'lovni amalga oshiring</p>
                    <p className="text-sm text-muted-foreground">
                      Admin sizga to'lov ma'lumotlarini yuboradi
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Login ma'lumotlarini oling</p>
                    <p className="text-sm text-muted-foreground">
                      To'lovdan so'ng, admin sizga login va parol beradi. Test avtomatik ochiladi.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleContactTelegram}
              data-testid="button-contact-telegram"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Telegram orqali bog'lanish
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation('/tests')}
              data-testid="button-back-tests-bottom"
            >
              Testlarga qaytish
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignIn, SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { CheckCircle2, Clock, Mic, Award } from "lucide-react";
import { useState } from "react";

export default function Landing() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Imtihonchi</h1>
          </div>
          <SignedOut>
            <Button 
              onClick={() => setShowSignIn(true)}
              data-testid="button-login"
            >
              Kirish
            </Button>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </header>

      {/* Clerk Sign In Modal */}
      {showSignIn && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative">
            <button
              onClick={() => setShowSignIn(false)}
              className="absolute -top-12 right-0 text-foreground hover:text-primary"
            >
              ✕ Yopish
            </button>
            <SignIn 
              routing="hash"
              afterSignInUrl="/"
            />
          </div>
        </div>
      )}

      <main>
        <section className="py-20 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
                CEFR Og'zaki Baholash Platformasi
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Professional ingliz tilini og'zaki baholash tizimi. Talabalar uchun sodda, 
                o'qituvchilar uchun kuchli, adminlar uchun boshqariladigan.
              </p>
              <SignedOut>
                <Button 
                  size="lg" 
                  className="text-lg px-8"
                  onClick={() => setShowSignIn(true)}
                  data-testid="button-get-started"
                >
                  Boshlash
                </Button>
              </SignedOut>
              <SignedIn>
                <Button 
                  size="lg" 
                  className="text-lg px-8"
                  onClick={() => window.location.href = '/'}
                  data-testid="button-dashboard"
                >
                  Dashboard
                </Button>
              </SignedIn>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl font-bold text-center mb-12">Platforma Imkoniyatlari</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Oddiy Test Topshirish</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Talabalar uchun sodda va tushunarli interfeys bilan testlarni topshiring.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Sozlanadigan Timerlar</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    O'qituvchilar har bir bo'lim va savol uchun maxsus vaqt belgilaydi.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Mic className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Audio Yozish</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Yuqori sifatli audio yozuv tizimi bilan javoblarni qayd eting.
                  </CardDescription>
                </CardContent>
                </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Sertifikatlar</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Baholash jarayonidan so'ng rasmiy sertifikatlar olish imkoniyati.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-3xl font-bold text-center mb-12">Uchta Rol Tizimi</h3>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Talabalar</CardTitle>
                    <CardDescription>
                      Testlarni sotib oling, topshiring va natijalarni ko'ring
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>O'qituvchilar</CardTitle>
                    <CardDescription>
                      Test yarating, savollarni tahrirlang, natijalarni baholang va sertifikat bering
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Adminlar</CardTitle>
                    <CardDescription>
                      Foydalanuvchilarni boshqaring, kategoriyalarni yarating va tizimni nazorat qiling
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 Imtihonchi. Barcha huquqlar himoyalangan.</p>
        </div>
      </footer>
    </div>
  );
}

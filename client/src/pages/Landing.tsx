import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Headphones, PenTool, Mic, Award, LogOut, CheckCircle2, Mail, Phone, MapPin } from "lucide-react";
import { SiTelegram, SiInstagram, SiYoutube } from "react-icons/si";
import { useAuth } from "@/hooks/useAuth";

export default function Landing() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const handleReplitLogin = () => {
    window.location.href = '/api/login';
  };

  const handlePhoneLogin = () => {
    window.location.href = '/phone-login';
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">ArabicTest</h1>
          </div>
          {!isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleReplitLogin}
                data-testid="button-replit-login"
                disabled={isLoading}
              >
                Kirish
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {user?.email || user?.firstName || 'Foydalanuvchi'}
              </span>
              <Button 
                variant="outline"
                size="sm"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Chiqish
              </Button>
            </div>
          )}
        </div>
      </header>

      <main>
        <section className="py-20 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
                Arab Tili Bilimingizni Baholang
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Arab tili bilimingizni to'liq baholash platformasi - yozma, o'qish, tinglash va og'zaki 
                ko'nikmalaringizni sinab ko'ring. CEFR standartlariga asoslangan professional baholash tizimi.
              </p>
              {!isAuthenticated ? (
                <Button 
                  size="lg" 
                  className="text-lg px-8"
                  onClick={handleReplitLogin}
                  data-testid="button-get-started"
                  disabled={isLoading}
                >
                  Boshlash
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  className="text-lg px-8"
                  onClick={() => window.location.href = '/'}
                  data-testid="button-dashboard"
                >
                  Dashboard
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl font-bold text-center mb-4">Nima Qila Olasiz?</h3>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Platformamizda arab tili bilimingizni to'rt asosiy ko'nikma bo'yicha sinab ko'ring
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <Card className="hover-elevate">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>O'qish (Reading)</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Arab tilida matnlarni tushunish va tahlil qilish qobiliyatingizni baholang.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Headphones className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Tinglash (Listening)</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Audio materiallarni eshitib tushunish va tahlil qilish ko'nikmangizni sinang.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <PenTool className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Yozish (Writing)</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Arab tilida yozma ish yaratish va grammatik qoidalarni qo'llash qobiliyatingizni tekshiring.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Mic className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Gapirish (Speaking)</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Og'zaki nutq ko'nikmalari va talaffuzingizni audio yozuv orqali baholang.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-3xl font-bold text-center mb-4">Qanday Ishlaydi?</h3>
              <p className="text-center text-muted-foreground mb-12">
                Oddiy 3 qadamda arab tili bilimingizni baholang
              </p>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">1</span>
                  </div>
                  <h4 className="text-xl font-semibold mb-2">Test Tanlang</h4>
                  <p className="text-muted-foreground">
                    O'qish, tinglash, yozish yoki gapirish bo'limidan kerakli testni tanlang va boshlang
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">2</span>
                  </div>
                  <h4 className="text-xl font-semibold mb-2">Testni Bajaring</h4>
                  <p className="text-muted-foreground">
                    Savolarga javob bering, audio yozing yoki yozma ish tayyorlang - barchasi onlayn
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">3</span>
                  </div>
                  <h4 className="text-xl font-semibold mb-2">Natija Oling</h4>
                  <p className="text-muted-foreground">
                    Professional baholash va CEFR darajangiz ko'rsatilgan rasmiy sertifikat oling
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-3xl font-bold text-center mb-12">Nima Uchun ArabicTest?</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="hover-elevate">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <CardTitle className="mb-2">CEFR Standartlari</CardTitle>
                        <CardDescription>
                          Xalqaro tan olingan CEFR standartlariga asoslangan professional baholash tizimi
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="hover-elevate">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <CardTitle className="mb-2">Rasmiy Sertifikat</CardTitle>
                        <CardDescription>
                          Test yakunida sizning CEFR darajangiz ko'rsatilgan rasmiy PDF sertifikat
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="hover-elevate">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <CardTitle className="mb-2">Bepul Demo Test</CardTitle>
                        <CardDescription>
                          Platformani sinab ko'ring - har qaysi test uchun bepul demo versiyasi mavjud
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-3xl font-bold text-center mb-4">Biz Haqimizda</h3>
              <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
                ArabicTest - arab tili bilimini CEFR standartlariga asoslangan holda baholash platformasi. 
                Biz o'quvchilarga sifatli ta'lim va baholash xizmatlarini taqdim etamiz.
              </p>
              <Card className="hover-elevate">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground leading-relaxed">
                    Platformamiz orqali siz arab tilini to'rt asosiy ko'nikma - o'qish, tinglash, yozish va gapirish 
                    bo'yicha sinab ko'rishingiz mumkin. Professional o'qituvchilar va zamonaviy texnologiyalar 
                    yordamida sizning bilimingiz aniq va adolatli baholanadi. Har bir test CEFR xalqaro standartlariga 
                    mos ravishda tuzilgan va natijalaringiz rasmiy sertifikat bilan tasdiqlanadi.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-3xl font-bold text-center mb-12">Biz Bilan Bog'lanish</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="hover-elevate">
                  <CardHeader>
                    <CardTitle>Aloqa Ma'lumotlari</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Email</p>
                        <a href="mailto:info@arabictest.uz" className="text-sm text-muted-foreground hover:text-primary">
                          info@arabictest.uz
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Telefon</p>
                        <a href="tel:+998901234567" className="text-sm text-muted-foreground hover:text-primary">
                          +998 (90) 123-45-67
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Manzil</p>
                        <p className="text-sm text-muted-foreground">
                          Toshkent shahri, O'zbekiston
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardHeader>
                    <CardTitle>Ijtimoiy Tarmoqlar</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <SiTelegram className="h-5 w-5 text-[#0088cc]" />
                      <div className="flex-1">
                        <p className="font-medium">Telegram</p>
                        <a 
                          href="https://t.me/arabictest" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-primary"
                        >
                          @arabictest
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <SiInstagram className="h-5 w-5 text-[#E4405F]" />
                      <div className="flex-1">
                        <p className="font-medium">Instagram</p>
                        <a 
                          href="https://instagram.com/arabictest" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-primary"
                        >
                          @arabictest
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <SiYoutube className="h-5 w-5 text-[#FF0000]" />
                      <div className="flex-1">
                        <p className="font-medium">YouTube</p>
                        <a 
                          href="https://youtube.com/@arabictest" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-primary"
                        >
                          @arabictest
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <h3 className="text-lg font-bold">ArabicTest</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Arab tili bilimini CEFR standartlariga asoslangan holda professional baholash platformasi.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Tezkor Havolalar</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>
                    <a href="#features" className="hover:text-primary">Imkoniyatlar</a>
                  </div>
                  <div>
                    <a href="#about" className="hover:text-primary">Biz haqimizda</a>
                  </div>
                  <div>
                    <a href="#contact" className="hover:text-primary">Bog'lanish</a>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Ijtimoiy Tarmoqlar</h4>
                <div className="flex gap-4">
                  <a 
                    href="https://t.me/arabictest" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover-elevate active-elevate-2 p-2 rounded-lg bg-background"
                    data-testid="link-telegram"
                  >
                    <SiTelegram className="h-5 w-5 text-[#0088cc]" />
                  </a>
                  <a 
                    href="https://instagram.com/arabictest" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover-elevate active-elevate-2 p-2 rounded-lg bg-background"
                    data-testid="link-instagram"
                  >
                    <SiInstagram className="h-5 w-5 text-[#E4405F]" />
                  </a>
                  <a 
                    href="https://youtube.com/@arabictest" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover-elevate active-elevate-2 p-2 rounded-lg bg-background"
                    data-testid="link-youtube"
                  >
                    <SiYoutube className="h-5 w-5 text-[#FF0000]" />
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t pt-6 text-center text-sm text-muted-foreground">
              <p>© 2024 ArabicTest. Barcha huquqlar himoyalangan.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

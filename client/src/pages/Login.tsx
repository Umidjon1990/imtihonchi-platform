import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, GraduationCap, UserCog } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"email" | "replit">("email");
  
  // Email/Password state
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRegister && (!firstName.trim() || !lastName.trim())) {
      toast({
        title: "Xato",
        description: "Ism va familiyani kiriting",
        variant: "destructive",
      });
      return;
    }

    if (!email.trim() || !password.trim()) {
      toast({
        title: "Xato",
        description: "Email va parolni kiriting",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Xato",
        description: "Parol kamida 6 belgidan iborat bo'lishi kerak",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const endpoint = isRegister ? '/api/register' : '/api/login';
      const body = isRegister 
        ? { email, password, firstName, lastName }
        : { email, password };

      await apiRequest('POST', endpoint, body);

      toast({
        title: "Muvaffaqiyatli!",
        description: isRegister ? "Ro'yxatdan o'tdingiz" : "Tizimga kirdingiz",
      });

      // Redirect based on user role
      window.location.href = '/';
    } catch (error: any) {
      toast({
        title: "Xato",
        description: error.message || (isRegister ? "Ro'yxatdan o'tishda xatolik" : "Kirishda xatolik"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReplitAuth = () => {
    // Get current URL for return redirect
    const currentUrl = window.location.href;
    const returnUrl = encodeURIComponent(currentUrl);
    window.location.href = `/api/login?returnUrl=${returnUrl}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">ArabicTest</CardTitle>
          <CardDescription>
            Arab tili bilimini baholash platformasi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "email" | "replit")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" data-testid="tab-email-auth">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </TabsTrigger>
              <TabsTrigger value="replit" data-testid="tab-replit-auth">
                <UserCog className="h-4 w-4 mr-2" />
                Replit
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4 mt-4">
              <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg">
                <GraduationCap className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">
                  O'quvchilar uchun
                </p>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {isRegister && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Ism</label>
                      <Input
                        type="text"
                        placeholder="Ahmad"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        disabled={loading}
                        data-testid="input-first-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Familiya</label>
                      <Input
                        type="text"
                        placeholder="Ahmadov"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        disabled={loading}
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Parol</label>
                  <Input
                    type="password"
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    data-testid="input-password"
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Kamida 6 belgidan iborat bo'lishi kerak
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  data-testid="button-email-submit"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isRegister ? "Ro'yxatdan o'tilmoqda..." : "Kirilmoqda..."}
                    </>
                  ) : (
                    isRegister ? "Ro'yxatdan o'tish" : "Kirish"
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsRegister(!isRegister)}
                    className="text-sm text-primary hover:underline"
                    data-testid="button-toggle-register"
                  >
                    {isRegister 
                      ? "Akkauntingiz bormi? Kirish" 
                      : "Akkauntingiz yo'qmi? Ro'yxatdan o'tish"}
                  </button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="replit" className="space-y-4 mt-4">
              <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg">
                <UserCog className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">
                  O'qituvchi va Admin uchun
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  O'qituvchi yoki Admin bo'lsangiz, Replit akkauntingiz orqali kiring
                </p>

                <Button
                  onClick={handleReplitAuth}
                  variant="default"
                  className="w-full"
                  data-testid="button-replit-login"
                >
                  <UserCog className="mr-2 h-4 w-4" />
                  Replit orqali kirish
                </Button>

                <div className="text-xs text-muted-foreground text-center space-y-1">
                  <p>• O'qituvchilar test yaratishi va baholashi mumkin</p>
                  <p>• Adminlar tizimni boshqaradi</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

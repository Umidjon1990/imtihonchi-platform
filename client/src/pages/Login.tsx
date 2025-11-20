import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Phone, Lock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get returnUrl from query params
  const urlParams = new URLSearchParams(window.location.search);
  const returnUrl = urlParams.get('returnUrl') || '/';
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim() || !password.trim()) {
      toast({
        title: "Xato",
        description: "Telefon raqam va parolni kiriting",
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
      await apiRequest('POST', '/api/login', { phoneNumber, password });

      toast({
        title: "Muvaffaqiyatli!",
        description: "Tizimga kirdingiz",
      });

      // Redirect to returnUrl or home
      window.location.href = returnUrl;
    } catch (error: any) {
      toast({
        title: "Xato",
        description: error.message || "Kirishda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Telefon raqam
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10"
                  data-testid="input-phone"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Parol
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Parolingizni kiriting"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  data-testid="input-password"
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              data-testid="button-login"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Tekshirilmoqda...
                </>
              ) : (
                "Kirish"
              )}
            </Button>

            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Login parolingiz yo'qmi? Testni harid qilish uchun{" "}
                <a 
                  href="https://t.me/zamonaviytalimuz" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                  data-testid="link-telegram"
                >
                  adminga murojaat qiling!
                </a>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult 
} from "firebase/auth";
import { Loader2, Phone, Shield } from "lucide-react";

export default function PhoneLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    // Initialize reCAPTCHA
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved
          }
        }
      );
    }
  }, []);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // If starts with 998, keep it
    // If starts with 0, replace with +998
    // Otherwise, add +998
    if (digits.startsWith('998')) {
      return '+' + digits;
    } else if (digits.startsWith('0')) {
      return '+998' + digits.slice(1);
    } else if (digits.length > 0) {
      return '+998' + digits;
    }
    return '';
  };

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 13) {
      toast({
        title: "Xato",
        description: "To'g'ri telefon raqam kiriting (masalan: +998 90 123 45 67)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const appVerifier = (window as any).recaptchaVerifier;
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setStep("otp");
      
      toast({
        title: "SMS Yuborildi!",
        description: "Telefon raqamingizga tasdiqlash kodi yuborildi",
      });
    } catch (error: any) {
      console.error("SMS yuborishda xatolik:", error);
      toast({
        title: "Xatolik",
        description: error.message || "SMS yuborishda xatolik yuz berdi",
        variant: "destructive",
      });
      
      // Reset reCAPTCHA on error
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Xato",
        description: "6 raqamli kodni kiriting",
        variant: "destructive",
      });
      return;
    }

    if (!confirmationResult) {
      toast({
        title: "Xato",
        description: "Iltimos qaytadan urinib ko'ring",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      
      // Get Firebase ID token
      const idToken = await user.getIdToken();
      
      // Send token to backend for session creation
      const response = await fetch('/api/auth/firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error('Backend authentication failed');
      }

      toast({
        title: "Muvaffaqiyatli!",
        description: "Tizimga kirdingiz",
      });

      // Redirect to dashboard
      setLocation('/');
    } catch (error: any) {
      console.error("Kodni tasdiqlashda xatolik:", error);
      toast({
        title: "Xato",
        description: error.message || "Tasdiqlash kodida xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Phone className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {step === "phone" ? "Telefon Raqamingizni Kiriting" : "Tasdiqlash Kodi"}
          </CardTitle>
          <CardDescription>
            {step === "phone" 
              ? "Telefon raqamingizga SMS kod yuboramiz" 
              : `${phoneNumber} raqamiga yuborilgan 6 raqamli kodni kiriting`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "phone" ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefon Raqam</label>
                <Input
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  disabled={loading}
                  data-testid="input-phone-number"
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Masalan: +998901234567 yoki 901234567
                </p>
              </div>
              <Button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full"
                data-testid="button-send-otp"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Yuborilmoqda...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    SMS Kod Yuborish
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tasdiqlash Kodi</label>
                <Input
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={loading}
                  data-testid="input-otp"
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                />
              </div>
              <Button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full"
                data-testid="button-verify-otp"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Tekshirilmoqda...
                  </>
                ) : (
                  "Tasdiqlash"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setConfirmationResult(null);
                }}
                disabled={loading}
                className="w-full"
                data-testid="button-back"
              >
                Orqaga
              </Button>
            </>
          )}
          
          {/* Invisible reCAPTCHA container */}
          <div id="recaptcha-container"></div>
        </CardContent>
      </Card>
    </div>
  );
}

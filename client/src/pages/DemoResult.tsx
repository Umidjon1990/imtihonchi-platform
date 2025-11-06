import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Home, RotateCcw } from "lucide-react";

interface DemoAnswer {
  questionId: string;
  audioUrl: string;
}

export default function DemoResult() {
  const [, setLocation] = useLocation();
  const [answers, setAnswers] = useState<DemoAnswer[]>([]);

  useEffect(() => {
    // Check if demo was completed
    const demoCompleted = localStorage.getItem('demo-completed');
    if (!demoCompleted) {
      setLocation('/');
      return;
    }

    // Load all demo audio from localStorage
    const demoAnswers: DemoAnswer[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('demo-audio-')) {
        const questionId = key.replace('demo-audio-', '');
        const base64Audio = localStorage.getItem(key);
        if (base64Audio) {
          // Convert base64 back to blob URL
          const byteCharacters = atob(base64Audio);
          const byteNumbers = new Array(byteCharacters.length);
          for (let j = 0; j < byteCharacters.length; j++) {
            byteNumbers[j] = byteCharacters.charCodeAt(j);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          demoAnswers.push({ questionId, audioUrl: url });
        }
      }
    }
    setAnswers(demoAnswers);

    // Cleanup function to revoke blob URLs
    return () => {
      demoAnswers.forEach(answer => URL.revokeObjectURL(answer.audioUrl));
    };
  }, [setLocation]);

  const handleTryAgain = () => {
    // Clear demo data
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('demo-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    setLocation('/take-test/demo');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Demo Test Natijasi</h1>
          <Button
            variant="outline"
            onClick={() => setLocation('/')}
            data-testid="button-home"
          >
            <Home className="h-5 w-5 mr-2" />
            Bosh sahifa
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-6 border-green-500/50 bg-green-500/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-2xl">Demo Test Yakunlandi!</CardTitle>
                <CardDescription className="text-base mt-1">
                  Platformamizni sinab ko'rganingiz uchun rahmat
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm">
                📱 <strong>Demo test:</strong> Bu faqat platformani sinab ko'rish uchun yaratilgan test edi. Javoblaringiz saqlanmadi va baholanmaydi.
              </p>
              <p className="text-sm">
                ✨ <strong>Haqiqiy testlar:</strong> Professional baholash va CEFR sertifikati olish uchun haqiqiy testlarni sotib oling.
              </p>
              <p className="text-sm">
                🎤 <strong>Sizning javoblaringiz:</strong> Quyida demo test davomida yozgan javoblaringizni tinglashingiz mumkin.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Sizning Javoblaringiz ({answers.length} ta)</h2>
          
          {answers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Hech qanday javob topilmadi</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {answers.map((answer, index) => (
                <Card key={answer.questionId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Savol {index + 1}</CardTitle>
                      <Badge variant="secondary">Audio javob</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <audio
                      src={answer.audioUrl}
                      controls
                      className="w-full"
                      data-testid={`audio-answer-${index + 1}`}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleTryAgain}
            variant="outline"
            className="flex-1"
            data-testid="button-try-again"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Yana urinib ko'rish
          </Button>
          <Button
            onClick={() => setLocation('/tests')}
            className="flex-1"
            data-testid="button-view-tests"
          >
            Haqiqiy testlarni ko'rish
          </Button>
        </div>
      </main>
    </div>
  );
}

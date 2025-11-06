import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, Check, AlertCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function PurchaseTest() {
  const [, params] = useRoute("/tests/:testId/purchase");
  const testId = params?.testId;
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(`/tests/${testId}/purchase`);
    window.location.href = `/api/login?returnUrl=${returnUrl}`;
    return null;
  }

  const { data: test, isLoading: testLoading } = useQuery<any>({
    queryKey: [`/api/tests/${testId}`],
    enabled: !!testId,
  });

  const { data: purchases } = useQuery<any[]>({
    queryKey: ["/api/purchases"],
  });

  const existingPurchase = purchases?.find(p => p.testId === testId);

  const uploadReceiptMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload-receipt', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Faylni yuklashda xatolik');
      return res.json();
    },
  });

  const createPurchaseMutation = useMutation({
    mutationFn: async (receiptUrl: string) => {
      return apiRequest('POST', '/api/purchases', {
        testId,
        receiptUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      toast({
        title: "Muvaffaqiyatli",
        description: "To'lov cheki yuklandi. O'qituvchi tomonidan tasdiqlanishi kutilmoqda.",
      });
      setTimeout(() => setLocation('/student'), 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik",
        description: error.message || "Xaridni yaratishda xatolik",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Xatolik",
          description: "Fayl hajmi 5MB dan oshmasligi kerak",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      toast({
        title: "Fayl tanlandi",
        description: file.name,
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({
        title: "Xatolik",
        description: "Iltimos, to'lov chekini yuklang",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { filename } = await uploadReceiptMutation.mutateAsync(selectedFile);
      await createPurchaseMutation.mutateAsync(filename);
    } catch (error: any) {
      console.error('Purchase error:', error);
    } finally {
      setUploading(false);
    }
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
                    To'lov chekingiz o'qituvchi tomonidan ko'rib chiqilmoqda. Tez orada javob beriladi.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    To'lovingiz rad etilgan. Iltimos, to'g'ri to'lov chekini yuklang.
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
            <CardTitle>To'lov Ma'lumotlari</CardTitle>
            <CardDescription>
              To'lovni amalga oshiring va chekni yuklang
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h3 className="font-semibold">Bank ma'lumotlari:</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Karta raqami:</strong> 8600 1234 5678 9012</p>
                <p><strong>Karta egasi:</strong> ArabicTest Platform</p>
                <p><strong>Summa:</strong> {test.price.toLocaleString()} so'm</p>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                To'lovni amalga oshirgandan keyin, to'lov chekini yuklang. O'qituvchi tomonidan 
                tasdiqlanganidan keyin test sizga ochiladi.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="receipt">To'lov Cheki</Label>
              <div className="flex flex-col gap-2">
                <Input
                  id="receipt"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  data-testid="input-receipt"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById('receipt')?.click()}
                  data-testid="button-select-receipt"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {selectedFile ? selectedFile.name : 'Chekni tanlang'}
                </Button>
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Tanlangan: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={!selectedFile || uploading}
              data-testid="button-submit-purchase"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Yuklanmoqda...
                </>
              ) : (
                'Yuborish'
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

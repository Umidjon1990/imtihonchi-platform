import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <CardTitle className="text-2xl">404 - Sahifa topilmadi</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Siz qidirayotgan sahifa topilmadi yoki o'chirilgan bo'lishi mumkin.
          </p>
          <Link href="/">
            <Button className="w-full">
              Bosh sahifaga qaytish
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

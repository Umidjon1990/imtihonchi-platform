import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, LogOut, Plus, Edit, Eye } from "lucide-react";
import { Link } from "wouter";
import type { Test, TestCategory } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTest, setNewTest] = useState({
    categoryId: "",
    title: "",
    description: "",
    price: 0,
  });

  const { data: tests = [], isLoading: testsLoading } = useQuery<Test[]>({
    queryKey: ["/api/tests", { teacherId: user?.id }],
  });

  const { data: categories = [] } = useQuery<TestCategory[]>({
    queryKey: ["/api/categories"],
  });

  const myTests = tests.filter(t => t.teacherId === user?.id);

  const handleCreateTest = async () => {
    if (!newTest.categoryId || !newTest.title || !newTest.price) {
      toast({
        title: "Xatolik",
        description: "Barcha maydonlarni to'ldiring",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest("POST", "/api/tests", newTest);

      toast({
        title: "Muvaffaqiyat",
        description: "Test muvaffaqiyatli yaratildi",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      setCreateDialogOpen(false);
      setNewTest({ categoryId: "", title: "", description: "", price: 0 });
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message || "Test yaratishda xatolik",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Imtihonchi</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <p className="font-medium" data-testid="text-username">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-muted-foreground text-xs">O'qituvchi</p>
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => window.location.href = '/api/logout'}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Mening testlarim</h2>
              <p className="text-muted-foreground">
                Testlarni yarating, tahrirlang va natijalarni ko'ring
              </p>
            </div>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              data-testid="button-create-test"
            >
              <Plus className="h-4 w-4 mr-2" />
              Yangi test
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Jami testlar</p>
                    <p className="text-2xl font-bold">{myTests.length}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Eye className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nashr qilingan</p>
                    <p className="text-2xl font-bold">{myTests.filter(t => t.isPublished).length}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Edit className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Qoralama</p>
                    <p className="text-2xl font-bold">{myTests.filter(t => !t.isPublished).length}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          {testsLoading ? (
            <div className="text-center py-12">Yuklanmoqda...</div>
          ) : myTests.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <p className="mb-4">Sizda hali testlar yo'q</p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Birinchi testni yaratish
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myTests.map((test) => (
                <Card key={test.id} data-testid={`card-test-${test.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle>{test.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {test.description || "Tavsif yo'q"}
                        </CardDescription>
                      </div>
                      <Badge variant={test.isPublished ? "default" : "secondary"}>
                        {test.isPublished ? "Nashr qilingan" : "Qoralama"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div>
                        <span className="text-2xl font-bold text-primary">
                          {test.price.toLocaleString()}
                        </span>
                        <span className="ml-1">so'm</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Link href={`/teacher/test/${test.id}`}>
                      <Button variant="default" data-testid={`button-edit-${test.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Tahrirlash
                      </Button>
                    </Link>
                    <Link href={`/teacher/submissions/${test.id}`}>
                      <Button variant="outline" data-testid={`button-submissions-${test.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Topshiriqlar
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-test">
          <DialogHeader>
            <DialogTitle>Yangi test yaratish</DialogTitle>
            <DialogDescription>
              Testning asosiy ma'lumotlarini kiriting. Keyinchalik bo'limlar va savollar qo'shishingiz mumkin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">Kategoriya</Label>
              <Select 
                value={newTest.categoryId} 
                onValueChange={(value) => setNewTest({ ...newTest, categoryId: value })}
              >
                <SelectTrigger id="category" data-testid="select-category">
                  <SelectValue placeholder="Kategoriyani tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="title">Sarlavha</Label>
              <Input
                id="title"
                data-testid="input-title"
                value={newTest.title}
                onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
                placeholder="CEFR Og'zaki Test - A2"
              />
            </div>
            <div>
              <Label htmlFor="description">Tavsif</Label>
              <Textarea
                id="description"
                data-testid="input-description"
                value={newTest.description}
                onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                placeholder="Boshlang'ich darajadagi ingliz tili og'zaki imtihoni"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="price">Narx (so'm)</Label>
              <Input
                id="price"
                type="number"
                data-testid="input-price"
                value={newTest.price || ""}
                onChange={(e) => setNewTest({ ...newTest, price: parseInt(e.target.value) || 0 })}
                placeholder="50000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleCreateTest} data-testid="button-submit-test">
              Yaratish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

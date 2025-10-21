import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, LogOut, Plus, Edit, Eye, CheckCircle, XCircle, Receipt } from "lucide-react";
import { Link } from "wouter";
import type { Test, TestCategory, Purchase, Submission } from "@shared/schema";
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
    queryKey: ["/api/tests"],
  });

  const { data: categories = [] } = useQuery<TestCategory[]>({
    queryKey: ["/api/categories"],
  });

  const { data: pendingPurchases = [], isLoading: purchasesLoading } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases/pending"],
    enabled: !!user?.id,
  });

  const { data: allSubmissions = [] } = useQuery<any[]>({
    queryKey: ["/api/submissions/teacher"],
    enabled: !!user?.id,
  });

  const myTests = tests.filter(t => t.teacherId === user?.id);
  
  // Get submissions for my tests
  const mySubmissions = allSubmissions.filter((sub: any) => 
    myTests.some(test => test.id === sub.testId)
  );

  const approvePurchaseMutation = useMutation({
    mutationFn: async (purchaseId: string) => {
      await apiRequest("PATCH", `/api/purchases/${purchaseId}/approve`, {});
    },
    onSuccess: () => {
      toast({ title: "Muvaffaqiyat", description: "Xarid tasdiqlandi" });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/pending"] });
    },
    onError: (error: any) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });

  const rejectPurchaseMutation = useMutation({
    mutationFn: async (purchaseId: string) => {
      await apiRequest("PATCH", `/api/purchases/${purchaseId}/reject`, {});
    },
    onSuccess: () => {
      toast({ title: "Muvaffaqiyat", description: "Xarid rad etildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/pending"] });
    },
    onError: (error: any) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });

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
          <Tabs defaultValue="tests" className="space-y-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-4">O'qituvchi Paneli</h2>
                <TabsList>
                  <TabsTrigger value="tests" data-testid="tab-tests">
                    Mening testlarim
                  </TabsTrigger>
                  <TabsTrigger value="submissions" data-testid="tab-submissions">
                    Topshiriqlar ({mySubmissions.length})
                  </TabsTrigger>
                  <TabsTrigger value="pending" data-testid="tab-pending">
                    Pending cheklar ({pendingPurchases.length})
                  </TabsTrigger>
                </TabsList>
              </div>
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                data-testid="button-create-test"
              >
                <Plus className="h-4 w-4 mr-2" />
                Yangi test
              </Button>
            </div>

            <TabsContent value="tests" className="space-y-6">

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
            </TabsContent>

            <TabsContent value="submissions" className="space-y-6">
              {mySubmissions.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Hozircha topshiriqlar yo'q
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {mySubmissions.map((submission: any) => (
                    <Card key={submission.id} data-testid={`card-submission-${submission.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle>{submission.testTitle}</CardTitle>
                            <CardDescription className="mt-2">
                              Talaba: {submission.studentName} {submission.studentLastName}
                            </CardDescription>
                            <p className="text-sm text-muted-foreground mt-1">
                              Topshirilgan: {new Date(submission.submittedAt).toLocaleDateString('uz-UZ', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <Badge variant={submission.status === 'graded' ? 'default' : 'secondary'}>
                            {submission.status === 'graded' ? 'Baholangan' : 'Baholanmagan'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardFooter>
                        <Link href={`/teacher/review/${submission.id}`}>
                          <Button data-testid={`button-review-${submission.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            {submission.status === 'graded' ? 'Natijani ko\'rish' : 'Baholash'}
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-6">
              {purchasesLoading ? (
                <div className="text-center py-12">Yuklanmoqda...</div>
              ) : pendingPurchases.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Pending cheklar yo'q
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pendingPurchases.map((purchase) => {
                    const test = tests.find(t => t.id === purchase.testId);
                    
                    if (!test) return null;
                    
                    return (
                      <Card key={purchase.id} data-testid={`card-pending-${purchase.id}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <CardTitle>{test.title}</CardTitle>
                              <CardDescription className="mt-2">
                                So'rov yuborilgan: {new Date(purchase.purchasedAt).toLocaleDateString('uz-UZ', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </CardDescription>
                              <div className="mt-2 text-sm">
                                <span className="text-muted-foreground">Narx: </span>
                                <span className="font-semibold text-primary">
                                  {test.price.toLocaleString()} so'm
                                </span>
                              </div>
                            </div>
                            <Badge variant="secondary">Kutilmoqda</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {purchase.receiptUrl && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium">To'lov cheki:</p>
                              <a 
                                href={purchase.receiptUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <div className="border rounded-lg p-4 hover-elevate active-elevate-2 cursor-pointer flex items-center gap-3">
                                  <Receipt className="h-8 w-8 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm font-medium">Chekni ko'rish</p>
                                    <p className="text-xs text-muted-foreground">
                                      Chekni yangi oynada ochish uchun bosing
                                    </p>
                                  </div>
                                </div>
                              </a>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="flex gap-2">
                          <Button
                            onClick={() => approvePurchaseMutation.mutate(purchase.id)}
                            disabled={approvePurchaseMutation.isPending || rejectPurchaseMutation.isPending}
                            data-testid={`button-approve-${purchase.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Tasdiqlash
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => rejectPurchaseMutation.mutate(purchase.id)}
                            disabled={approvePurchaseMutation.isPending || rejectPurchaseMutation.isPending}
                            data-testid={`button-reject-${purchase.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Rad etish
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
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

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, FolderOpen, TrendingUp, Plus, Pencil, Trash2, LogOut, ArrowLeft, Settings as SettingsIcon, Edit, Eye, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { Textarea } from "@/components/ui/textarea";

interface Category {
  id: string;
  name: string;
  description?: string;
}

function UserRoleSelect({ userId, currentRole }: { userId: string; currentRole: string }) {
  const { toast } = useToast();

  const updateRoleMutation = useMutation({
    mutationFn: async (newRole: string) => {
      await apiRequest("PATCH", `/api/users/${userId}/role`, { role: newRole });
    },
    onSuccess: () => {
      toast({ title: "Rol yangilandi" });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik",
        description: error.message || "Rolni yangilashda xatolik",
        variant: "destructive",
      });
    },
  });

  return (
    <Select
      value={currentRole}
      onValueChange={(value) => updateRoleMutation.mutate(value)}
      disabled={updateRoleMutation.isPending}
    >
      <SelectTrigger className="w-[180px]" data-testid={`select-role-${userId}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="student">Talaba</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "pending" | "approved">("all");

  // Test creation state
  const [createTestDialogOpen, setCreateTestDialogOpen] = useState(false);
  const [newTest, setNewTest] = useState({
    categoryId: "",
    title: "",
    description: "",
    price: 0,
    language: "ar" as "ar" | "en",
  });

  // Settings state
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [telegramLink, setTelegramLink] = useState("");
  const [instagramLink, setInstagramLink] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: allTests = [] } = useQuery<any[]>({
    queryKey: ["/api/tests"],
  });

  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<any>({
    queryKey: ["/api/settings"],
    refetchOnMount: true,
  });

  const { data: pendingPurchases = [] } = useQuery<any[]>({
    queryKey: ["/api/purchases/pending"],
    enabled: !!user?.id,
  });

  const { data: allPurchases = [], isLoading: purchasesLoading } = useQuery<any[]>({
    queryKey: ["/api/purchases/all"],
    enabled: !!user?.id,
  });

  const { data: allSubmissions = [] } = useQuery<any[]>({
    queryKey: ["/api/submissions/admin"],
    enabled: !!user?.id,
  });

  // Update settings state when data loads
  useEffect(() => {
    if (settings) {
      setContactEmail(settings.contactEmail || "");
      setContactPhone(settings.contactPhone || "");
      setContactAddress(settings.contactAddress || "");
      setTelegramLink(settings.telegramLink || "");
      setInstagramLink(settings.instagramLink || "");
      setYoutubeLink(settings.youtubeLink || "");
    }
  }, [settings]);

  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/categories", {
        name: categoryName,
        description: categoryDescription || undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "Kategoriya yaratildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setCreateDialogOpen(false);
      setCategoryName("");
      setCategoryDescription("");
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik",
        description: error.message || "Kategoriya yaratishda xatolik",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/categories/${id}`, {
        name: categoryName,
        description: categoryDescription || undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "Kategoriya yangilandi" });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setEditingCategory(null);
      setCategoryName("");
      setCategoryDescription("");
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik",
        description: error.message || "Kategoriyani yangilashda xatolik",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Kategoriya o'chirildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setDeleteCategory(null);
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik",
        description: error.message || "Kategoriyani o'chirishda xatolik",
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/settings", {
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
        contactAddress: contactAddress || undefined,
        telegramLink: telegramLink || undefined,
        instagramLink: instagramLink || undefined,
        youtubeLink: youtubeLink || undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "Sozlamalar saqlandi" });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik",
        description: error.message || "Sozlamalarni saqlashda xatolik",
        variant: "destructive",
      });
    },
  });

  const approvePurchaseMutation = useMutation({
    mutationFn: async (purchaseId: string) => {
      await apiRequest("PATCH", `/api/purchases/${purchaseId}/approve`, {});
    },
    onSuccess: () => {
      toast({ title: "Muvaffaqiyat", description: "Xarid tasdiqlandi" });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/all"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/all"] });
    },
    onError: (error: any) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

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
      setCreateTestDialogOpen(false);
      setNewTest({ categoryId: "", title: "", description: "", price: 0, language: "ar" });
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message || "Test yaratishda xatolik",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryDescription(category.description || "");
  };

  const handleCreateClick = () => {
    setCategoryName("");
    setCategoryDescription("");
    setCreateDialogOpen(true);
  };

  const totalTests = allTests.length;
  const totalUsers = allUsers.length;
  const totalCategories = categories.length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin/students">
              <Button variant="outline" data-testid="button-nav-students">
                <Users className="mr-2 h-4 w-4" />
                O'quvchilar
              </Button>
            </Link>
            <div className="text-sm text-muted-foreground">
              {user?.firstName} {user?.lastName}
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" data-testid="tab-overview">Umumiy</TabsTrigger>
            <TabsTrigger value="tests" data-testid="tab-tests">Testlar</TabsTrigger>
            <TabsTrigger value="submissions" data-testid="tab-submissions">Topshiriqlar ({allSubmissions.length})</TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">Pending ({pendingPurchases.length})</TabsTrigger>
            <TabsTrigger value="categories" data-testid="tab-categories">Kategoriyalar</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">Foydalanuvchilar</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Sozlamalar</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Jami Testlar</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-tests">
                    {totalTests}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Foydalanuvchilar</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-users">
                    {totalUsers}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Kategoriyalar</CardTitle>
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-categories">
                    {totalCategories}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">O'sish</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+23%</div>
                  <p className="text-xs text-muted-foreground">bu oyda</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tests" className="space-y-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Testlar</h2>
              <Button 
                onClick={() => setCreateTestDialogOpen(true)}
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
                      <p className="text-2xl font-bold">{allTests.length}</p>
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
                      <p className="text-2xl font-bold">{allTests.filter((t: any) => t.isPublished).length}</p>
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
                      <p className="text-2xl font-bold">{allTests.filter((t: any) => !t.isPublished).length}</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>

            {allTests.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <p className="mb-4">Sizda hali testlar yo'q</p>
                  <Button onClick={() => setCreateTestDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Birinchi testni yaratish
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {allTests.map((test: any) => (
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
                      <Link href={`/admin/test/${test.id}`}>
                        <Button variant="default" data-testid={`button-edit-${test.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Tahrirlash
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="submissions" className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">Topshiriqlar</h2>
            
            {allSubmissions.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Hozircha topshiriqlar yo'q
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {allSubmissions.map((submission: any) => (
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
                      <Link href={`/admin/review/${submission.id}`}>
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
            <h2 className="text-2xl font-bold mb-6">Pending Xaridlar</h2>
            
            {pendingPurchases.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Pending cheklar yo'q
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingPurchases.map((purchase: any) => {
                  const test = allTests.find((t: any) => t.id === purchase.testId);
                  
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
                        <p className="text-sm text-muted-foreground">
                          O'quvchi Telegram orqali to'lov haqida ma'lumot bergan. To'lovni tekshiring va tasdiqlang yoki rad eting.
                        </p>
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

          <TabsContent value="categories" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold" data-testid="text-categories-title">Test Kategoriyalari</h2>
              <Button onClick={handleCreateClick} data-testid="button-create-category">
                <Plus className="h-4 w-4 mr-2" />
                Yangi Kategoriya
              </Button>
            </div>

            {categoriesLoading ? (
              <div className="text-center py-12">Yuklanmoqda...</div>
            ) : categories.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Hozircha kategoriyalar yo'q
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => {
                  const categoryTests = allTests.filter(t => t.categoryId === category.id);
                  
                  return (
                    <Card key={category.id} data-testid={`card-category-${category.id}`}>
                      <CardHeader>
                        <CardTitle>{category.name}</CardTitle>
                        {category.description && (
                          <CardDescription>{category.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Testlar:</span>
                            <span className="font-semibold">{categoryTests.length}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(category)}
                          data-testid={`button-edit-${category.id}`}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Tahrirlash
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteCategory(category)}
                          data-testid={`button-delete-${category.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          O'chirish
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <h2 className="text-2xl font-bold">Foydalanuvchilar Boshqaruvi</h2>
            
            {purchasesLoading ? (
              <div className="text-center py-12">Yuklanmoqda...</div>
            ) : (
              <>
                {(() => {
                  const getUserLatestPurchaseStatus = (userId: string) => {
                    const userPurchases = allPurchases.filter((p: any) => p.studentId === userId);
                    if (userPurchases.length === 0) return null;
                    const latest = userPurchases.sort((a: any, b: any) => 
                      new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
                    )[0];
                    return latest.status;
                  };

                  const usersWithPendingPayments = allUsers.filter(
                    (u: any) => getUserLatestPurchaseStatus(u.id) === 'pending'
                  );
                  const usersWithApprovedPayments = allUsers.filter(
                    (u: any) => getUserLatestPurchaseStatus(u.id) === 'approved'
                  );

                  return (
                    <div className="flex gap-2 mb-4">
                      <Button
                        variant={userFilter === "all" ? "default" : "outline"}
                        onClick={() => setUserFilter("all")}
                        data-testid="button-filter-all"
                      >
                        Barchasi ({allUsers.length})
                      </Button>
                      <Button
                        variant={userFilter === "pending" ? "default" : "outline"}
                        onClick={() => setUserFilter("pending")}
                        data-testid="button-filter-pending"
                      >
                        To'lov kutilayotganlar ({usersWithPendingPayments.length})
                      </Button>
                      <Button
                        variant={userFilter === "approved" ? "default" : "outline"}
                        onClick={() => setUserFilter("approved")}
                        data-testid="button-filter-approved"
                      >
                        To'lov qilganlar ({usersWithApprovedPayments.length})
                      </Button>
                    </div>
                  );
                })()}
                
                {(() => {
                  const getUserLatestPurchaseStatus = (userId: string) => {
                    const userPurchases = allPurchases.filter((p: any) => p.studentId === userId);
                    if (userPurchases.length === 0) return null;
                    const latest = userPurchases.sort((a: any, b: any) => 
                      new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
                    )[0];
                    return latest.status;
                  };

                  let filteredUsers = allUsers;
                  
                  if (userFilter === "pending") {
                    filteredUsers = allUsers.filter((u: any) => getUserLatestPurchaseStatus(u.id) === 'pending');
                  } else if (userFilter === "approved") {
                    filteredUsers = allUsers.filter((u: any) => getUserLatestPurchaseStatus(u.id) === 'approved');
                  }
              
              return filteredUsers.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    {userFilter === "all" ? "Foydalanuvchilar yo'q" : 
                     userFilter === "pending" ? "To'lov kutilayotgan foydalanuvchilar yo'q" :
                     "To'lov qilgan foydalanuvchilar yo'q"}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {filteredUsers.map((userItem: any) => (
                      <div
                        key={userItem.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`user-${userItem.id}`}
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {userItem.firstName} {userItem.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{userItem.email}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge
                            variant={
                              userItem.role === 'admin'
                                ? 'default'
                                : 'outline'
                            }
                          >
                            {userItem.role === 'admin'
                              ? 'Admin'
                              : 'Talaba'}
                          </Badge>
                          {userItem.id !== user?.id && <UserRoleSelect userId={userItem.id} currentRole={userItem.role} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              );
            })()}
              </>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold">Platforma Sozlamalari</h2>
            
            {settingsLoading ? (
              <div className="text-center py-12">Yuklanmoqda...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Aloqa Ma'lumotlari</CardTitle>
                    <CardDescription>
                      Landing sahifada ko'rsatiladigan aloqa ma'lumotlari
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="info@arabictest.uz"
                        data-testid="input-contact-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone">Telefon</Label>
                      <Input
                        id="contact-phone"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+998 (90) 123-45-67"
                        data-testid="input-contact-phone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-address">Manzil</Label>
                      <Input
                        id="contact-address"
                        value={contactAddress}
                        onChange={(e) => setContactAddress(e.target.value)}
                        placeholder="Toshkent shahri, O'zbekiston"
                        data-testid="input-contact-address"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ijtimoiy Tarmoqlar</CardTitle>
                    <CardDescription>
                      Landing sahifada ko'rsatiladigan ijtimoiy tarmoq havolalari
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="telegram-link">Telegram</Label>
                      <Input
                        id="telegram-link"
                        value={telegramLink}
                        onChange={(e) => setTelegramLink(e.target.value)}
                        placeholder="@arabictest"
                        data-testid="input-telegram-link"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagram-link">Instagram</Label>
                      <Input
                        id="instagram-link"
                        value={instagramLink}
                        onChange={(e) => setInstagramLink(e.target.value)}
                        placeholder="@arabictest"
                        data-testid="input-instagram-link"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="youtube-link">YouTube</Label>
                      <Input
                        id="youtube-link"
                        value={youtubeLink}
                        onChange={(e) => setYoutubeLink(e.target.value)}
                        placeholder="@arabictest"
                        data-testid="input-youtube-link"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardFooter className="pt-6 flex justify-end">
                    <Button
                      onClick={() => updateSettingsMutation.mutate()}
                      disabled={updateSettingsMutation.isPending}
                      data-testid="button-save-settings"
                    >
                      {updateSettingsMutation.isPending ? "Saqlanmoqda..." : "Sozlamalarni Saqlash"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Category Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-category">
          <DialogHeader>
            <DialogTitle>Yangi Kategoriya</DialogTitle>
            <DialogDescription>
              Test kategoriyasini yaratish uchun ma'lumotlarni kiriting
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Kategoriya nomi *</Label>
              <Input
                id="category-name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Masalan: CEFR Speaking Test"
                data-testid="input-category-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Tavsif</Label>
              <Input
                id="category-description"
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                placeholder="Kategoriya haqida qisqacha"
                data-testid="input-category-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              data-testid="button-cancel-create"
            >
              Bekor qilish
            </Button>
            <Button
              onClick={() => createCategoryMutation.mutate()}
              disabled={!categoryName || createCategoryMutation.isPending}
              data-testid="button-confirm-create"
            >
              {createCategoryMutation.isPending ? "Saqlanmoqda..." : "Yaratish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent data-testid="dialog-edit-category">
          <DialogHeader>
            <DialogTitle>Kategoriyani Tahrirlash</DialogTitle>
            <DialogDescription>
              Kategoriya ma'lumotlarini yangilang
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">Kategoriya nomi *</Label>
              <Input
                id="edit-category-name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                data-testid="input-edit-category-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category-description">Tavsif</Label>
              <Input
                id="edit-category-description"
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                data-testid="input-edit-category-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingCategory(null)}
              data-testid="button-cancel-edit"
            >
              Bekor qilish
            </Button>
            <Button
              onClick={() => editingCategory && updateCategoryMutation.mutate(editingCategory.id)}
              disabled={!categoryName || updateCategoryMutation.isPending}
              data-testid="button-confirm-edit"
            >
              {updateCategoryMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={!!deleteCategory} onOpenChange={(open) => !open && setDeleteCategory(null)}>
        <AlertDialogContent data-testid="dialog-delete-category">
          <AlertDialogHeader>
            <AlertDialogTitle>Ishonchingiz komilmi?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteCategory?.name}" kategoriyasini o'chirmoqchisiz. Bu amalni bekor qilib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCategory && deleteCategoryMutation.mutate(deleteCategory.id)}
              data-testid="button-confirm-delete"
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Test Dialog */}
      <Dialog open={createTestDialogOpen} onOpenChange={setCreateTestDialogOpen}>
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
                placeholder="Boshlang'ich darajadagi arab tili og'zaki imtihoni"
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
            <Button variant="outline" onClick={() => setCreateTestDialogOpen(false)}>
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

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, KeyRound, UserPlus, ArrowLeft, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation, Link } from "wouter";

interface User {
  id: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: string;
  createdAt: string;
}

interface Test {
  id: string;
  title: string;
}

export default function AdminStudents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [updatePasswordDialog, setUpdatePasswordDialog] = useState<User | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<User | null>(null);

  // Create student form state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedTestId, setSelectedTestId] = useState<string>("");

  // Update password form state
  const [newPassword, setNewPassword] = useState("");

  // Redirect if not admin
  if (user?.role !== 'admin') {
    navigate('/');
    return null;
  }

  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: allTests = [] } = useQuery<Test[]>({
    queryKey: ["/api/tests"],
  });

  // Filter to show only students
  const students = allUsers.filter(u => u.role === 'student');

  const createStudentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/admin/create-student", data);
    },
    onSuccess: () => {
      toast({ title: "O'quvchi muvaffaqiyatli yaratildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setCreateDialogOpen(false);
      // Reset form
      setPhoneNumber("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setSelectedTestId("");
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik",
        description: error.message || "O'quvchi yaratishda xatolik",
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      return await apiRequest("PATCH", `/api/admin/update-student-password/${userId}`, { password });
    },
    onSuccess: () => {
      toast({ title: "Parol muvaffaqiyatli yangilandi" });
      setUpdatePasswordDialog(null);
      setNewPassword("");
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik",
        description: error.message || "Parolni yangilashda xatolik",
        variant: "destructive",
      });
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/admin/delete-student/${userId}`);
    },
    onSuccess: () => {
      toast({ title: "O'quvchi muvaffaqiyatli o'chirildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setDeleteDialog(null);
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik",
        description: error.message || "O'quvchini o'chirishda xatolik",
        variant: "destructive",
      });
    },
  });

  const handleCreateStudent = () => {
    if (!phoneNumber || !password || !firstName || !lastName) {
      toast({
        title: "Xatolik",
        description: "Barcha majburiy maydonlarni to'ldiring",
        variant: "destructive",
      });
      return;
    }

    createStudentMutation.mutate({
      phoneNumber,
      password,
      firstName,
      lastName,
      testId: selectedTestId || undefined,
    });
  };

  const handleUpdatePassword = () => {
    if (!updatePasswordDialog || !newPassword || newPassword.length < 6) {
      toast({
        title: "Xatolik",
        description: "Parol kamida 6 belgidan iborat bo'lishi kerak",
        variant: "destructive",
      });
      return;
    }

    updatePasswordMutation.mutate({
      userId: updatePasswordDialog.id,
      password: newPassword,
    });
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout");
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" data-testid="link-back-admin">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">O'quvchilar Boshqaruvi</h1>
          </div>
          <div className="flex items-center gap-4">
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
        <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-students">O'quvchilar</h1>
          <p className="text-muted-foreground">O'quvchilarni boshqarish</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-student">
              <UserPlus className="mr-2 h-4 w-4" />
              Yangi o'quvchi
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yangi o'quvchi yaratish</DialogTitle>
              <DialogDescription>
                O'quvchi uchun login ma'lumotlarini kiriting
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Telefon raqam *</Label>
                <Input
                  id="phone"
                  data-testid="input-create-phone"
                  placeholder="+998901234567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password">Parol *</Label>
                <Input
                  id="password"
                  data-testid="input-create-password"
                  type="password"
                  placeholder="Kamida 6 belgi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="firstName">Ism *</Label>
                <Input
                  id="firstName"
                  data-testid="input-create-firstname"
                  placeholder="Ism"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Familiya *</Label>
                <Input
                  id="lastName"
                  data-testid="input-create-lastname"
                  placeholder="Familiya"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="test">Test (ixtiyoriy)</Label>
                <Select value={selectedTestId} onValueChange={setSelectedTestId}>
                  <SelectTrigger data-testid="select-create-test">
                    <SelectValue placeholder="Testni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Test tanlanmagan</SelectItem>
                    {allTests.map((test) => (
                      <SelectItem key={test.id} value={test.id}>
                        {test.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Test tanlasangiz, o'quvchiga avtomatik ruxsat beriladi
                </p>
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
                onClick={handleCreateStudent}
                disabled={createStudentMutation.isPending}
                data-testid="button-submit-create"
              >
                {createStudentMutation.isPending ? "Yaratilmoqda..." : "Yaratish"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {usersLoading ? (
        <div className="text-center py-8">Yuklanmoqda...</div>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Hozircha o'quvchilar yo'q</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {students.map((student) => (
            <Card key={student.id} data-testid={`card-student-${student.id}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {student.firstName} {student.lastName}
                      <Badge variant="secondary" data-testid={`badge-role-${student.id}`}>
                        {student.role}
                      </Badge>
                    </CardTitle>
                    <CardDescription data-testid={`text-phone-${student.id}`}>
                      {student.phoneNumber}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUpdatePasswordDialog(student)}
                      data-testid={`button-update-password-${student.id}`}
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      Parolni yangilash
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteDialog(student)}
                      data-testid={`button-delete-${student.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Update Password Dialog */}
      <Dialog open={!!updatePasswordDialog} onOpenChange={(open) => !open && setUpdatePasswordDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Parolni yangilash</DialogTitle>
            <DialogDescription>
              {updatePasswordDialog?.firstName} {updatePasswordDialog?.lastName} uchun yangi parol
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword">Yangi parol</Label>
              <Input
                id="newPassword"
                data-testid="input-update-password"
                type="password"
                placeholder="Kamida 6 belgi"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUpdatePasswordDialog(null);
                setNewPassword("");
              }}
              data-testid="button-cancel-update-password"
            >
              Bekor qilish
            </Button>
            <Button
              onClick={handleUpdatePassword}
              disabled={updatePasswordMutation.isPending}
              data-testid="button-submit-update-password"
            >
              {updatePasswordMutation.isPending ? "Yangilanmoqda..." : "Yangilash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>O'quvchini o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog?.firstName} {deleteDialog?.lastName} o'chiriladi. Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog && deleteStudentMutation.mutate(deleteDialog.id)}
              data-testid="button-confirm-delete"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteStudentMutation.isPending ? "O'chirilmoqda..." : "O'chirish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </main>
    </div>
  );
}

import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Save, Trash2, Upload, Clock } from "lucide-react";
import { Link } from "wouter";
import type { Test, TestSection, Question } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function EditTest() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [addQuestionOpen, setAddQuestionOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [editImageOpen, setEditImageOpen] = useState(false);
  const [imageUploadMethod, setImageUploadMethod] = useState<"file" | "url">("file");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newSection, setNewSection] = useState({
    title: "",
    instructions: "",
    sectionNumber: 0,
    preparationTime: 60,
    speakingTime: 120,
  });
  const [newQuestion, setNewQuestion] = useState({
    questionText: "",
    questionNumber: 0,
    preparationTime: null as number | null,
    speakingTime: null as number | null,
    imageUrl: null as string | null,
  });

  const { data: test, isLoading } = useQuery<Test>({
    queryKey: [`/api/tests/${id}`],
    enabled: !!id,
  });

  const { data: sections = [] } = useQuery<TestSection[]>({
    queryKey: [`/api/tests/${id}/sections`],
    enabled: !!id,
  });

  const updateTestMutation = useMutation({
    mutationFn: async (data: Partial<Test>) => {
      await apiRequest("PATCH", `/api/tests/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Muvaffaqiyat", description: "Test yangilandi" });
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${id}`] });
    },
    onError: (error: any) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });

  const createSectionMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/sections", {
        testId: id,
        ...newSection,
      });
    },
    onSuccess: () => {
      toast({ title: "Muvaffaqiyat", description: "Bo'lim qo'shildi" });
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${id}/sections`] });
      setAddSectionOpen(false);
      setNewSection({
        title: "",
        instructions: "",
        sectionNumber: sections.length + 1,
        preparationTime: 60,
        speakingTime: 120,
      });
    },
    onError: (error: any) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (payload: typeof newQuestion & { sectionId: string; questionNumber: number }) => {
      await apiRequest("POST", "/api/questions", payload);
    },
    onSuccess: () => {
      toast({ title: "Muvaffaqiyat", description: "Savol qo'shildi" });
      // Invalidate both sections list and the specific section's questions
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${id}/sections`] });
      queryClient.invalidateQueries({ queryKey: [`/api/sections/${selectedSection}/questions`] });
      setAddQuestionOpen(false);
      setNewQuestion({
        questionText: "",
        questionNumber: 0,
        preparationTime: null,
        speakingTime: null,
        imageUrl: null,
      });
      setSelectedSection("");
    },
    onError: (error: any) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload-section-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Rasm yuklashda xatolik");
      }

      const data = await response.json();
      return data.url;
    } catch (error: any) {
      toast({ 
        title: "Xatolik", 
        description: error.message || "Rasm yuklashda xatolik", 
        variant: "destructive" 
      });
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveSectionImage = async () => {
    try {
      let finalImageUrl = imageUrl;

      if (imageUploadMethod === "file") {
        const fileInput = document.getElementById("section-image-file") as HTMLInputElement;
        const file = fileInput?.files?.[0];
        
        if (!file) {
          toast({ title: "Xatolik", description: "Fayl tanlanmagan", variant: "destructive" });
          return;
        }

        finalImageUrl = await handleImageUpload(file);
      }

      if (!finalImageUrl) {
        toast({ title: "Xatolik", description: "Rasm URL kiriting", variant: "destructive" });
        return;
      }

      await apiRequest("PATCH", `/api/sections/${selectedSection}`, {
        imageUrl: finalImageUrl,
      });

      toast({ title: "Muvaffaqiyat", description: "Rasm qo'shildi" });
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${id}/sections`] });
      setEditImageOpen(false);
      setImageUrl("");
      setSelectedSection("");
    } catch (error: any) {
      toast({ 
        title: "Xatolik", 
        description: error.message || "Rasm saqlanmadi", 
        variant: "destructive" 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yuklanmoqda...</div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Test topilmadi</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/teacher">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{test.title}</h1>
            <p className="text-sm text-muted-foreground">Test tahrirlash</p>
          </div>
          <Button
            onClick={() => updateTestMutation.mutate({ isPublished: !test.isPublished })}
            variant={test.isPublished ? "outline" : "default"}
            disabled={updateTestMutation.isPending}
            data-testid="button-publish"
          >
            <Save className="h-4 w-4 mr-2" />
            {test.isPublished ? "Nashrdan olib tashlash" : "Nashr qilish"}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <Tabs defaultValue="info" className="space-y-6">
            <TabsList>
              <TabsTrigger value="info" data-testid="tab-info">
                Asosiy ma'lumot
              </TabsTrigger>
              <TabsTrigger value="sections" data-testid="tab-sections">
                Bo'limlar va savollar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Test ma'lumotlari</CardTitle>
                  <CardDescription>
                    Testning asosiy ma'lumotlarini tahrirlang
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Sarlavha</Label>
                    <Input
                      id="title"
                      data-testid="input-title"
                      defaultValue={test.title}
                      onBlur={(e) => {
                        if (e.target.value !== test.title) {
                          updateTestMutation.mutate({ title: e.target.value });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Tavsif</Label>
                    <Textarea
                      id="description"
                      data-testid="input-description"
                      defaultValue={test.description || ""}
                      onBlur={(e) => {
                        if (e.target.value !== test.description) {
                          updateTestMutation.mutate({ description: e.target.value });
                        }
                      }}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Narx (so'm)</Label>
                    <Input
                      id="price"
                      type="number"
                      data-testid="input-price"
                      defaultValue={test.price}
                      onBlur={(e) => {
                        const price = parseInt(e.target.value);
                        if (price !== test.price) {
                          updateTestMutation.mutate({ price });
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sections" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Bo'limlar</h2>
                  <p className="text-sm text-muted-foreground">
                    Har bir bo'lim uchun timer va savollarni sozlang
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setNewSection({ ...newSection, sectionNumber: sections.length + 1 });
                    setAddSectionOpen(true);
                  }}
                  data-testid="button-add-section"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Bo'lim qo'shish
                </Button>
              </div>

              {sections.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    <p className="mb-4">Hali bo'limlar qo'shilmagan</p>
                    <Button onClick={() => setAddSectionOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Birinchi bo'limni qo'shish
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {sections.map((section, index) => (
                    <SectionCard
                      key={section.id}
                      section={section}
                      index={index}
                      onAddQuestion={(questionCount: number) => {
                        setSelectedSection(section.id);
                        setNewQuestion({
                          ...newQuestion,
                          questionNumber: questionCount + 1,
                        });
                        setAddQuestionOpen(true);
                      }}
                      onEditImage={(sectionId: string, currentImageUrl?: string) => {
                        setSelectedSection(sectionId);
                        setImageUrl(currentImageUrl || "");
                        setImageUploadMethod("file");
                        setEditImageOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={addSectionOpen} onOpenChange={setAddSectionOpen}>
        <DialogContent data-testid="dialog-add-section">
          <DialogHeader>
            <DialogTitle>Yangi bo'lim qo'shish</DialogTitle>
            <DialogDescription>
              Bo'lim ma'lumotlari va standart timer sozlamalarini kiriting
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="section-title">Sarlavha</Label>
              <Input
                id="section-title"
                data-testid="input-section-title"
                value={newSection.title}
                onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                placeholder="Bo'lim 1: Shaxsiy ma'lumotlar"
              />
            </div>
            <div>
              <Label htmlFor="section-instructions">Ko'rsatmalar</Label>
              <Textarea
                id="section-instructions"
                data-testid="input-section-instructions"
                value={newSection.instructions}
                onChange={(e) => setNewSection({ ...newSection, instructions: e.target.value })}
                placeholder="Ushbu bo'limda..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prep-time">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Tayyorgarlik (soniya)
                </Label>
                <Input
                  id="prep-time"
                  type="number"
                  data-testid="input-prep-time"
                  value={newSection.preparationTime}
                  onChange={(e) =>
                    setNewSection({ ...newSection, preparationTime: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="response-time">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Gapirish (soniya)
                </Label>
                <Input
                  id="response-time"
                  type="number"
                  data-testid="input-response-time"
                  value={newSection.speakingTime}
                  onChange={(e) =>
                    setNewSection({ ...newSection, speakingTime: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSectionOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              onClick={() => createSectionMutation.mutate()}
              disabled={!newSection.title || createSectionMutation.isPending}
              data-testid="button-save-section"
            >
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editImageOpen} onOpenChange={setEditImageOpen}>
        <DialogContent data-testid="dialog-edit-image">
          <DialogHeader>
            <DialogTitle>Bo'lim uchun rasm yuklash</DialogTitle>
            <DialogDescription>
              Rasm barcha savollarda doimiy ko'rinib turadi
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Tabs value={imageUploadMethod} onValueChange={(v) => setImageUploadMethod(v as "file" | "url")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file" data-testid="tab-upload-file">
                  Fayl yuklash
                </TabsTrigger>
                <TabsTrigger value="url" data-testid="tab-upload-url">
                  URL orqali
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="file" className="space-y-4">
                <div>
                  <Label htmlFor="section-image-file">Rasm tanlang</Label>
                  <Input
                    id="section-image-file"
                    type="file"
                    accept="image/*"
                    data-testid="input-image-file"
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, GIF, WEBP (max 5MB)
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="url" className="space-y-4">
                <div>
                  <Label htmlFor="section-image-url">Rasm URL</Label>
                  <Input
                    id="section-image-url"
                    data-testid="input-image-url-direct"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Rasmning to'liq URL manzilini kiriting
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditImageOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              onClick={handleSaveSectionImage}
              disabled={uploadingImage}
              data-testid="button-save-image"
            >
              {uploadingImage ? "Yuklanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addQuestionOpen} onOpenChange={setAddQuestionOpen}>
        <DialogContent data-testid="dialog-add-question">
          <DialogHeader>
            <DialogTitle>Yangi savol qo'shish</DialogTitle>
            <DialogDescription>
              Savol matnini kiriting. Timer sozlamalarini alohida belgilashingiz mumkin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="question-text">Savol matni</Label>
              <Textarea
                id="question-text"
                data-testid="input-question-text"
                value={newQuestion.questionText}
                onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                placeholder="Sizning ismingiz nima?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Timer sozlamalari (ixtiyoriy)</Label>
              <p className="text-xs text-muted-foreground">
                Bo'sh qoldiring, bo'lim timer sozlamalarini ishlatish uchun
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="q-prep-time" className="text-sm">
                    Tayyorgarlik (soniya)
                  </Label>
                  <Input
                    id="q-prep-time"
                    type="number"
                    data-testid="input-question-prep-time"
                    value={newQuestion.preparationTime || ""}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        preparationTime: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="Bo'limdan olish"
                  />
                </div>
                <div>
                  <Label htmlFor="q-response-time" className="text-sm">
                    Gapirish (soniya)
                  </Label>
                  <Input
                    id="q-response-time"
                    type="number"
                    data-testid="input-question-response-time"
                    value={newQuestion.speakingTime || ""}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        speakingTime: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="Bo'limdan olish"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddQuestionOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              onClick={() => createQuestionMutation.mutate({
                ...newQuestion,
                sectionId: selectedSection,
                questionNumber: newQuestion.questionNumber,
              })}
              disabled={!newQuestion.questionText || createQuestionMutation.isPending}
              data-testid="button-save-question"
            >
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SectionCard({
  section,
  index,
  onAddQuestion,
  onEditImage,
}: {
  section: TestSection & { questions?: Question[] };
  index: number;
  onAddQuestion: (questionCount: number) => void;
  onEditImage: (sectionId: string, currentImageUrl?: string) => void;
}) {
  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: [`/api/sections/${section.id}/questions`],
  });

  return (
    <Card data-testid={`card-section-${section.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>
              Bo'lim {index + 1}: {section.title}
            </CardTitle>
            <CardDescription className="mt-2">{section.instructions}</CardDescription>
            <div className="flex gap-4 mt-3 text-sm flex-wrap">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Tayyorgarlik: {section.preparationTime}s</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Gapirish: {section.speakingTime}s</span>
              </div>
              {section.imageUrl && (
                <div className="flex items-center gap-1 text-primary">
                  <Upload className="h-3 w-3" />
                  <span>Rasm yuklangan</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onEditImage(section.id, section.imageUrl || undefined)} 
              data-testid={`button-edit-image-${section.id}`}
            >
              <Upload className="h-4 w-4 mr-2" />
              {section.imageUrl ? "Rasmni o'zgartirish" : "Rasm qo'shish"}
            </Button>
            <Button size="sm" onClick={() => onAddQuestion(questions.length)} data-testid={`button-add-question-${section.id}`}>
              <Plus className="h-4 w-4 mr-2" />
              Savol qo'shish
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {section.imageUrl && (
          <div className="mb-4 p-3 rounded-md border bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground mb-2">Bo'lim rasmi (barcha savollarda ko'rinadi):</p>
            <img 
              src={section.imageUrl} 
              alt="Bo'lim rasmi" 
              className="w-full max-w-md rounded-md border"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling!.classList.remove('hidden');
              }}
            />
            <p className="text-xs text-destructive mt-2 hidden">Rasmni yuklashda xatolik</p>
          </div>
        )}
        
        {questions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Hali savollar yo'q</p>
        ) : (
          <div className="space-y-2">
            {questions.map((q, qIndex) => (
              <div
                key={q.id}
                className="p-3 rounded-md border bg-card hover-elevate"
                data-testid={`question-${q.id}`}
              >
                <p className="font-medium text-sm">
                  {qIndex + 1}. {q.questionText}
                </p>
                {q.imageUrl && (
                  <p className="text-xs text-muted-foreground mt-1">
                    📷 Rasm: {q.imageUrl}
                  </p>
                )}
                {(q.preparationTime || q.speakingTime) && (
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    {q.preparationTime && (
                      <span>Tayyorgarlik: {q.preparationTime}s</span>
                    )}
                    {q.speakingTime && (
                      <span>Gapirish: {q.speakingTime}s</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

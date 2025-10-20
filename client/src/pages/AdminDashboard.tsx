import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import StatsCard from "@/components/StatsCard";
import { FileText, Users, FolderOpen, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  //todo: remove mock functionality
  const mockCategories = [
    { id: "1", name: "CEFR Speaking", tests: 12, students: 456 },
    { id: "2", name: "IELTS Preparation", tests: 8, students: 234 },
    { id: "3", name: "Business English", tests: 6, students: 123 },
  ];

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar userRole="admin" userName="Admin" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b border-border">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <h1 className="text-2xl font-bold">Boshqaruv paneli</h1>
            <div className="w-10" />
          </header>
          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard title="Jami testlar" value={156} icon={FileText} />
                <StatsCard title="Foydalanuvchilar" value={2847} icon={Users} />
                <StatsCard title="Kategoriyalar" value={12} icon={FolderOpen} />
                <StatsCard title="O'sish" value="+23%" icon={TrendingUp} description="bu oyda" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Test bo'limlari</h2>
                  <Button data-testid="button-create-category">Yangi bo'lim</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockCategories.map((category) => (
                    <Card key={category.id} data-testid={`card-category-${category.id}`}>
                      <CardHeader>
                        <CardTitle>{category.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Testlar:</span>
                            <span className="font-semibold">{category.tests}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">O'quvchilar:</span>
                            <span className="font-semibold">{category.students}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

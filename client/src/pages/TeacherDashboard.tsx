import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import StatsCard from "@/components/StatsCard";
import { FileText, Users, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TeacherDashboard() {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  //todo: remove mock functionality
  const mockTests = [
    {
      id: "1",
      title: "CEFR Og'zaki Test - A2",
      students: 45,
      pending: 5,
      price: 50000,
      status: "published",
    },
    {
      id: "2",
      title: "CEFR Og'zaki Test - B1",
      students: 32,
      pending: 3,
      price: 75000,
      status: "draft",
    },
  ];

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar userRole="teacher" userName="Olimjon Karimov" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b border-border">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <h1 className="text-2xl font-bold">Boshqaruv paneli</h1>
            <Button data-testid="button-create-test">
              <Plus className="w-4 h-4 mr-2" />
              Yangi test
            </Button>
          </header>
          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard title="Jami testlar" value={8} icon={FileText} />
                <StatsCard title="O'quvchilar" value={127} icon={Users} />
                <StatsCard title="Kutilmoqda" value={12} icon={Clock} />
                <StatsCard title="Daromad" value="4.2M" icon={DollarSign} description="so'm" />
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Mening testlarim</h2>
                <div className="grid grid-cols-1 gap-4">
                  {mockTests.map((test) => (
                    <Card key={test.id} data-testid={`card-test-${test.id}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>{test.title}</CardTitle>
                          <Badge
                            variant={test.status === "published" ? "default" : "secondary"}
                            data-testid={`badge-status-${test.id}`}
                          >
                            {test.status === "published" ? "Nashr qilingan" : "Qoralama"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">O'quvchilar</p>
                            <p className="text-2xl font-bold">{test.students}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Kutilmoqda</p>
                            <p className="text-2xl font-bold text-yellow-500">{test.pending}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Narh</p>
                            <p className="text-2xl font-bold text-primary">
                              {test.price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" size="sm" data-testid={`button-edit-${test.id}`}>
                            Tahrirlash
                          </Button>
                          <Button variant="outline" size="sm" data-testid={`button-view-${test.id}`}>
                            Natijalar
                          </Button>
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

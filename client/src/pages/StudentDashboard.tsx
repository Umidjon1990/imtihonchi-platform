import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import StatsCard from "@/components/StatsCard";
import TestCard from "@/components/TestCard";
import { FileText, Award, Clock, CheckCircle } from "lucide-react";
import testBanner from "@assets/generated_images/CEFR_test_banner_image_5a92fa47.png";

export default function StudentDashboard() {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  //todo: remove mock functionality
  const mockTests = [
    {
      id: "1",
      title: "CEFR Og'zaki Test - A2",
      description: "Boshlang'ich darajadagi ingliz tili og'zaki imtihoni",
      price: 50000,
      imageUrl: testBanner,
    },
    {
      id: "2",
      title: "CEFR Og'zaki Test - B1",
      description: "O'rta darajadagi ingliz tili og'zaki imtihoni",
      price: 75000,
      imageUrl: testBanner,
    },
  ];

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar userRole="student" userName="Sardor Usmonov" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b border-border">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <h1 className="text-2xl font-bold">Boshqaruv paneli</h1>
            <div className="w-10" />
          </header>
          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard title="Sotib olingan" value={3} icon={FileText} />
                <StatsCard title="Tugatilgan" value={2} icon={CheckCircle} />
                <StatsCard title="Kutilmoqda" value={1} icon={Clock} />
                <StatsCard title="Sertifikatlar" value={2} icon={Award} />
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Mavjud testlar</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mockTests.map((test) => (
                    <TestCard
                      key={test.id}
                      {...test}
                      onPurchase={(id) => console.log("Purchase:", id)}
                    />
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

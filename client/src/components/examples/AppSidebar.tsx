import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "../AppSidebar";

export default function AppSidebarExample() {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar userRole="student" userName="Sardor Usmonov" />
        <div className="flex-1 p-8 bg-background">
          <h1 className="text-2xl font-bold">Asosiy sahifa</h1>
        </div>
      </div>
    </SidebarProvider>
  );
}

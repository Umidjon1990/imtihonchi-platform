import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  ShoppingCart,
  Award,
  BarChart,
  FolderOpen,
} from "lucide-react";
import { Link } from "wouter";

interface AppSidebarProps {
  userRole: "admin" | "teacher" | "student";
  userName: string;
}

const menuItems = {
  admin: [
    { title: "Boshqaruv paneli", url: "/admin", icon: LayoutDashboard },
    { title: "Test bo'limlari", url: "/admin/categories", icon: FolderOpen },
    { title: "Foydalanuvchilar", url: "/admin/users", icon: Users },
    { title: "Sozlamalar", url: "/admin/settings", icon: Settings },
  ],
  teacher: [
    { title: "Boshqaruv paneli", url: "/teacher", icon: LayoutDashboard },
    { title: "Mening testlarim", url: "/teacher/tests", icon: FileText },
    { title: "Natijalar", url: "/teacher/results", icon: BarChart },
    { title: "Sozlamalar", url: "/teacher/settings", icon: Settings },
  ],
  student: [
    { title: "Boshqaruv paneli", url: "/student", icon: LayoutDashboard },
    { title: "Testlar", url: "/student/tests", icon: ShoppingCart },
    { title: "Mening testlarim", url: "/student/my-tests", icon: FileText },
    { title: "Natijalarim", url: "/student/results", icon: BarChart },
    { title: "Sertifikatlarim", url: "/student/certificates", icon: Award },
  ],
};

export default function AppSidebar({ userRole, userName }: AppSidebarProps) {
  const items = menuItems[userRole];

  return (
    <Sidebar data-testid="sidebar">
      <SidebarHeader className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="text-lg font-bold text-primary-foreground">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-semibold" data-testid="text-username">{userName}</p>
            <p className="text-xs text-muted-foreground capitalize" data-testid="text-role">
              {userRole === "admin" ? "Administrator" : userRole === "teacher" ? "O'qituvchi" : "O'quvchi"}
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menyu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton data-testid="button-logout">
              <LogOut className="w-4 h-4" />
              <span>Chiqish</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

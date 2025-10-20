import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { RoleGuard } from "@/components/RoleGuard";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import StudentDashboard from "@/pages/StudentDashboard";
import TeacherDashboard from "@/pages/TeacherDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import TakeTest from "@/pages/TakeTest";
import { useEffect, useState } from "react";

function Router() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('darkMode');
      return stored !== null ? stored === 'true' : true; // default to dark
    }
    return true;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/:rest*">
            {() => <Redirect to="/" />}
          </Route>
        </>
      ) : (
        <>
          <Route path="/">
            {() => {
              if (user?.role === 'admin') return <Redirect to="/admin" />;
              if (user?.role === 'teacher') return <Redirect to="/teacher" />;
              return <Redirect to="/student" />;
            }}
          </Route>
          <Route path="/student">
            {() => (
              <RoleGuard allowedRoles={['student']}>
                <StudentDashboard />
              </RoleGuard>
            )}
          </Route>
          <Route path="/teacher">
            {() => (
              <RoleGuard allowedRoles={['teacher', 'admin']}>
                <TeacherDashboard />
              </RoleGuard>
            )}
          </Route>
          <Route path="/admin">
            {() => (
              <RoleGuard allowedRoles={['admin']}>
                <AdminDashboard />
              </RoleGuard>
            )}
          </Route>
          <Route path="/test/:id">
            {() => (
              <RoleGuard allowedRoles={['student']}>
                <TakeTest />
              </RoleGuard>
            )}
          </Route>
          <Route component={NotFound} />
        </>
      )}
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

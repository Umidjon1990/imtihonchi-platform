import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { RoleGuard } from "@/components/RoleGuard";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import PhoneLogin from "@/pages/PhoneLogin";
import PublicTestCatalog from "@/pages/PublicTestCatalog";
import PurchaseTest from "@/pages/PurchaseTest";
import DemoResult from "@/pages/DemoResult";
import StudentDashboard from "@/pages/StudentDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminStudents from "@/pages/AdminStudents";
import TakeTest from "@/pages/TakeTest";
import EditTest from "@/pages/EditTest";
import ReviewSubmission from "@/pages/ReviewSubmission";
import { useEffect, useState } from "react";

function Router() {
  const { user, isAuthenticated } = useAuth();
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

  return (
    <Switch>
      {/* Public routes - accessible by everyone (MUST be before authenticated routes) */}
      <Route path="/take-test/demo" component={TakeTest} />
      <Route path="/demo-result" component={DemoResult} />
      <Route path="/tests" component={PublicTestCatalog} />
      <Route path="/tests/:testId/purchase" component={PurchaseTest} />
      <Route path="/login" component={Login} />
      <Route path="/phone-login" component={PhoneLogin} />
      
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
          <Route path="/admin/test/:id">
            {() => (
              <RoleGuard allowedRoles={['admin']}>
                <EditTest />
              </RoleGuard>
            )}
          </Route>
          <Route path="/admin/review/:submissionId">
            {() => (
              <RoleGuard allowedRoles={['admin']}>
                <ReviewSubmission />
              </RoleGuard>
            )}
          </Route>
          <Route path="/admin/students">
            {() => (
              <RoleGuard allowedRoles={['admin']}>
                <AdminStudents />
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
          <Route path="/take-test/:purchaseId">
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

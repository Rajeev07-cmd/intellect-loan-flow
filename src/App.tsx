import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import CreditOfficerDashboard from "./pages/CreditOfficerDashboard";
import Applications from "./pages/Applications";
import RiskEngine from "./pages/RiskEngine";
import CamGenerator from "./pages/CamGenerator";
import Tracking from "./pages/Tracking";
import DocumentVerification from "./pages/DocumentVerification";
import AmlCompliance from "./pages/AmlCompliance";
import DecisionCenter from "./pages/DecisionCenter";
import AIResearch from "./pages/AIResearch";

import ManagerDashboard from "./pages/ManagerDashboard";
import AdminSettings from "./pages/AdminSettings";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Credit Officer routes */}
              <Route element={<ProtectedRoute allowedRoles={["credit_officer", "admin"]} />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<CreditOfficerDashboard />} />
                  <Route path="/applications" element={<Applications />} />
                  <Route path="/document-verification" element={<DocumentVerification />} />
                  <Route path="/aml-compliance" element={<AmlCompliance />} />
                  <Route path="/risk-engine" element={<RiskEngine />} />
                  <Route path="/cam-generator" element={<CamGenerator />} />
                  <Route path="/tracking" element={<Tracking />} />
                  <Route path="/research" element={<AIResearch />} />
                  
                </Route>
              </Route>

              {/* Manager routes */}
              <Route element={<ProtectedRoute allowedRoles={["manager", "admin"]} />}>
                <Route element={<AppLayout />}>
                  <Route path="/manager-dashboard" element={<ManagerDashboard />} />
                </Route>
              </Route>

              {/* Shared routes (both roles) */}
              <Route element={<ProtectedRoute allowedRoles={["credit_officer", "manager", "admin"]} />}>
                <Route element={<AppLayout />}>
                  <Route path="/decision-center" element={<DecisionCenter />} />
                </Route>
              </Route>

              {/* Admin routes */}
              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route element={<AppLayout />}>
                  <Route path="/admin/users" element={<AdminSettings />} />
                </Route>
              </Route>

              <Route path="/credit-officer/*" element={<Navigate to="/dashboard" replace />} />
              <Route path="/manager/*" element={<Navigate to="/manager-dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

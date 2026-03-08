import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLayout } from "@/components/layout/AppLayout";
import CreditOfficerDashboard from "./pages/CreditOfficerDashboard";
import Applications from "./pages/Applications";
import RiskEngine from "./pages/RiskEngine";
import CamGenerator from "./pages/CamGenerator";
import Tracking from "./pages/Tracking";
import DocumentVerification from "./pages/DocumentVerification";
import DecisionCenter from "./pages/DecisionCenter";
import AIResearch from "./pages/AIResearch";
import ManagerDashboard from "./pages/ManagerDashboard";
import AdminSettings from "./pages/AdminSettings";
import Index from "./pages/Index";
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
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Landing page */}
            <Route path="/" element={<Index />} />

            {/* Main app routes - no auth required */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<CreditOfficerDashboard />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/document-verification" element={<DocumentVerification />} />
              <Route path="/risk-engine" element={<RiskEngine />} />
              <Route path="/cam-generator" element={<CamGenerator />} />
              <Route path="/tracking" element={<Tracking />} />
              <Route path="/decision-center" element={<DecisionCenter />} />
              <Route path="/research" element={<AIResearch />} />
              <Route path="/manager-dashboard" element={<ManagerDashboard />} />
              <Route path="/admin/users" element={<AdminSettings />} />
            </Route>

            {/* Legacy redirects */}
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/signup" element={<Navigate to="/dashboard" replace />} />
            <Route path="/credit-officer/*" element={<Navigate to="/dashboard" replace />} />
            <Route path="/manager/*" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

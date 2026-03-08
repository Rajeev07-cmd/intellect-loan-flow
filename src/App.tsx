import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import CreditOfficerDashboard from "./pages/CreditOfficerDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import Applications from "./pages/Applications";
import RiskEngine from "./pages/RiskEngine";
import CamGenerator from "./pages/CamGenerator";
import Tracking from "./pages/Tracking";
import DocumentVerification from "./pages/DocumentVerification";
import AdminSettings from "./pages/AdminSettings";
import DecisionCenter from "./pages/DecisionCenter";
import AIResearch from "./pages/AIResearch";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />

          {/* Credit Officer Routes */}
          <Route element={<AppLayout />}>
            <Route path="/credit-officer/dashboard" element={<CreditOfficerDashboard />} />
            <Route path="/credit-officer/applications" element={<Applications />} />
            <Route path="/credit-officer/risk-engine" element={<RiskEngine />} />
            <Route path="/credit-officer/cam-generator" element={<CamGenerator />} />
            <Route path="/credit-officer/document-verification" element={<DocumentVerification />} />
            <Route path="/credit-officer/tracking" element={<Tracking />} />
            <Route path="/credit-officer/research" element={<AIResearch />} />
          </Route>

          {/* Manager Routes */}
          <Route element={<AppLayout />}>
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
            <Route path="/manager/applications" element={<Applications />} />
            <Route path="/manager/risk-engine" element={<RiskEngine />} />
            <Route path="/manager/decision-center" element={<DecisionCenter />} />
            <Route path="/manager/tracking" element={<Tracking />} />
            <Route path="/manager/research" element={<AIResearch />} />
            <Route path="/manager/admin/users" element={<AdminSettings />} />
          </Route>

          {/* Legacy redirects */}
          <Route path="/dashboard" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

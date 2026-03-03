import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Shield, Sliders, AlertTriangle, ScrollText, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/admin/UserManagement";
import { RoleManagement } from "@/components/admin/RoleManagement";
import { ModelWeights } from "@/components/admin/ModelWeights";
import { RiskThresholds } from "@/components/admin/RiskThresholds";
import { AuditLogs } from "@/components/admin/AuditLogs";

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">System configuration, user management & audit controls</p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-muted/50 border border-border/50 p-1 flex-wrap h-auto">
          <TabsTrigger value="users" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2 text-xs">
            <Users className="h-3.5 w-3.5" /> Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2 text-xs">
            <Shield className="h-3.5 w-3.5" /> Roles
          </TabsTrigger>
          <TabsTrigger value="weights" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2 text-xs">
            <Sliders className="h-3.5 w-3.5" /> Model Weights
          </TabsTrigger>
          <TabsTrigger value="thresholds" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2 text-xs">
            <AlertTriangle className="h-3.5 w-3.5" /> Risk Thresholds
          </TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2 text-xs">
            <ScrollText className="h-3.5 w-3.5" /> Audit Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users"><UserManagement /></TabsContent>
        <TabsContent value="roles"><RoleManagement /></TabsContent>
        <TabsContent value="weights"><ModelWeights /></TabsContent>
        <TabsContent value="thresholds"><RiskThresholds /></TabsContent>
        <TabsContent value="audit"><AuditLogs /></TabsContent>
      </Tabs>
    </div>
  );
}

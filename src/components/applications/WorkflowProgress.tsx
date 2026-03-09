import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, FileText, FolderUp, SearchCheck, BarChart3, ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useApplicationStore } from "@/store/useApplicationStore";

const STAGES = [
  { key: "Application Created", label: "Application Created", icon: FileText },
  { key: "Documents Uploaded", label: "Documents Uploaded", icon: FolderUp },
  { key: "Verification Completed", label: "Verification", icon: SearchCheck },
  { key: "Risk Analysis Completed", label: "Risk Analysis", icon: BarChart3 },
  { key: "Decision", label: "Decision", icon: ShieldCheck }
];

export function WorkflowProgress() {
  const { selectedApplication } = useApplicationStore();
  const [currentStage, setCurrentStage] = useState("Application Created");
  const [loading, setLoading] = useState(true);

  const fetchWorkflow = useCallback(async () => {
    if (!selectedApplication) return;
    try {
      const { data, error } = await supabase
        .from("workflow_status")
        .select("current_stage")
        .eq("application_id", selectedApplication.id)
        .maybeSingle();

      if (!error && data) {
        setCurrentStage(data.current_stage);
      }
    } catch (err) {
      console.error("Error fetching workflow:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedApplication]);

  useEffect(() => {
    fetchWorkflow();
    if (!selectedApplication) return;

    const channel = supabase
      .channel("workflow_tracking_progress_" + selectedApplication.id)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "workflow_status",
        filter: `application_id=eq.${selectedApplication.id}`,
      }, () => fetchWorkflow())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchWorkflow, selectedApplication]);

  if (!selectedApplication) return null;

  const getActiveIndex = () => {
    switch (currentStage) {
      case "Application Created": return 0;
      case "Documents Uploaded": return 1;
      case "Verification Completed": return 2;
      case "Risk Analysis Completed": return 3;
      case "CAM Generated": 
      case "Manager Review": 
      case "Approved": 
      case "Rejected": return 4;
      default: return 0;
    }
  };

  const activeIdx = getActiveIndex();
  const totalStages = STAGES.length;

  if (loading) {
    return (
      <div className="glass-card p-6 mb-6 flex items-center justify-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading workflow...</span>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 md:p-8 mb-6 hidden md:block">
      <h3 className="text-sm font-semibold text-foreground mb-8">Application Progress</h3>
      <div className="relative">
        <div className="absolute top-6 left-[10%] right-[10%] h-1 bg-border/40 rounded-full" />
        <motion.div
          className="absolute top-6 left-[10%] h-1 rounded-full bg-gradient-to-r from-risk-low via-primary to-primary"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((activeIdx / (totalStages - 1)) * 80, 80)}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        />

        <div className="relative flex justify-between">
          {STAGES.map((stage, i) => {
            const status = i < activeIdx ? "completed" : i === activeIdx ? "active" : "pending";
            const Icon = stage.icon;

            return (
              <motion.div 
                key={stage.key} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="flex flex-col items-center text-center group relative" 
                style={{ width: `${100 / totalStages}%` }}
              >
                <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${status === "completed"
                    ? "bg-risk-low/20 border-risk-low text-risk-low shadow-md shadow-risk-low/20"
                    : status === "active"
                    ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/30"
                    : "bg-card border-border/60 text-muted-foreground"
                  }
                `}>
                  {status === "completed" ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                      <CheckCircle2 className="h-5 w-5" />
                    </motion.div>
                  ) : status === "active" ? (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-primary/40"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <Icon className="h-5 w-5" />
                    </>
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <p className={`text-[11px] font-medium mt-3 max-w-[90px] leading-tight transition-colors
                  ${status === "active" ? "text-primary" : status === "completed" ? "text-foreground" : "text-muted-foreground"}
                `}>
                  {stage.label}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

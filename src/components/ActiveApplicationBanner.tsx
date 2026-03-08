import { useApplicationStore } from "@/store/useApplicationStore";
import { Building2, X, ChevronRight } from "lucide-react";
import { RiskBadge } from "@/components/ui/risk-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { useNavigate } from "react-router-dom";

export function ActiveApplicationBanner() {
  const { selectedApplication, clearSelectedApplication } = useApplicationStore();
  const navigate = useNavigate();

  if (!selectedApplication) return null;

  return (
    <div className="mb-4 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Building2 className="h-4 w-4 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{selectedApplication.company}</span>
            <RiskBadge score={selectedApplication.riskScore} label={selectedApplication.riskCategory} size="sm" />
            <StatusBadge status={selectedApplication.status} />
          </div>
          <p className="text-[10px] text-muted-foreground">
            {selectedApplication.sector} • ₹{selectedApplication.loanAmount} Cr • {selectedApplication.cin}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <WorkflowNav />
        <button
          onClick={() => {
            clearSelectedApplication();
            navigate("/applications");
          }}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          title="Back to Applications"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function WorkflowNav() {
  const navigate = useNavigate();
  const steps = [
    { label: "Docs", path: "/document-verification" },
    { label: "Risk", path: "/risk-engine" },
    { label: "CAM", path: "/cam-generator" },
    { label: "Track", path: "/tracking" },
  ];

  return (
    <div className="hidden md:flex items-center gap-1">
      {steps.map((step, i) => (
        <button
          key={step.path}
          onClick={() => navigate(step.path)}
          className="text-[10px] font-medium text-muted-foreground hover:text-primary px-2 py-1 rounded-md hover:bg-primary/5 transition-colors"
        >
          {step.label}
        </button>
      ))}
    </div>
  );
}

export function NoApplicationSelected() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
        <Building2 className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-1">No Application Selected</h2>
      <p className="text-sm text-muted-foreground mb-4">Please select an application from the Applications page to continue.</p>
      <button
        onClick={() => navigate("/applications")}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Go to Applications
      </button>
    </div>
  );
}

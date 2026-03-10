import { AmlScreeningPanel } from "@/components/compliance/AmlScreeningPanel";
import { useApplicationStore } from "@/store/useApplicationStore";
import { ActiveApplicationBanner, NoApplicationSelected } from "@/components/ActiveApplicationBanner";

export default function AmlCompliance() {
  const { selectedApplication } = useApplicationStore();

  if (!selectedApplication) return <NoApplicationSelected />;

  return (
    <div className="space-y-6 p-6">
      <ActiveApplicationBanner />
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">AML / Compliance</h1>
      </div>
      <AmlScreeningPanel />
    </div>
  );
}

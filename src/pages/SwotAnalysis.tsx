import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Target, ShieldAlert, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useApplicationStore } from "@/store/useApplicationStore";
import { ActiveApplicationBanner, NoApplicationSelected } from "@/components/ActiveApplicationBanner";
import { supabase } from "@/integrations/supabase/client";
import { ProcessingBanner } from "@/components/ui/processing-status";

interface SwotData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

const quadrants = [
  { key: "strengths" as const, label: "Strengths", icon: TrendingUp, colorClass: "text-risk-low", bgClass: "bg-risk-low/10 border-risk-low/20", dotClass: "bg-risk-low" },
  { key: "weaknesses" as const, label: "Weaknesses", icon: TrendingDown, colorClass: "text-risk-high", bgClass: "bg-risk-high/10 border-risk-high/20", dotClass: "bg-risk-high" },
  { key: "opportunities" as const, label: "Opportunities", icon: Target, colorClass: "text-primary", bgClass: "bg-primary/10 border-primary/20", dotClass: "bg-primary" },
  { key: "threats" as const, label: "Threats", icon: ShieldAlert, colorClass: "text-risk-medium", bgClass: "bg-risk-medium/10 border-risk-medium/20", dotClass: "bg-risk-medium" },
];

export default function SwotAnalysis() {
  const { selectedApplication } = useApplicationStore();
  const { toast } = useToast();
  const [swot, setSwot] = useState<SwotData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load existing SWOT
  useEffect(() => {
    if (!selectedApplication) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("swot_reports")
        .select("*")
        .eq("application_id", selectedApplication.id)
        .maybeSingle();

      if (data) {
        setSwot({
          strengths: (data.strengths as string[]) || [],
          weaknesses: (data.weaknesses as string[]) || [],
          opportunities: (data.opportunities as string[]) || [],
          threats: (data.threats as string[]) || [],
        });
      } else {
        setSwot(null);
      }
      setLoading(false);
    };
    load();
  }, [selectedApplication]);

  const generateSwot = useCallback(async () => {
    if (!selectedApplication) return;
    const isUUID = /^[0-9a-f]{8}-/i.test(selectedApplication.id);
    if (!isUUID) {
      toast({ title: "Demo Application", description: "SWOT generation only works with database applications.", variant: "destructive" });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-swot", {
        body: { application_id: selectedApplication.id },
      });
      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      setSwot({
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        opportunities: data.opportunities || [],
        threats: data.threats || [],
      });
      toast({ title: "SWOT Generated", description: "AI-powered SWOT analysis is ready." });
    } catch (e: any) {
      toast({ title: "Generation Failed", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }, [selectedApplication, toast]);

  if (!selectedApplication) return <NoApplicationSelected />;

  return (
    <div className="space-y-6 animate-slide-up">
      <ActiveApplicationBanner />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">SWOT Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedApplication.company} — AI-generated strategic assessment
          </p>
        </div>
        <Button className="gap-2" onClick={generateSwot} disabled={generating}>
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : swot ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {generating ? "Generating..." : swot ? "Regenerate SWOT" : "Generate SWOT"}
        </Button>
      </div>

      <ProcessingBanner
        state={generating ? "processing" : "idle"}
        processingText="AI is analyzing company data for SWOT..."
        successText="SWOT analysis generated"
      />

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
        </div>
      ) : !swot ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Target className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-sm font-medium">No SWOT analysis generated yet</p>
            <p className="text-xs mt-1">Click "Generate SWOT" to create an AI-powered strategic assessment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quadrants.map((q, i) => (
            <motion.div
              key={q.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
            >
              <Card className={`glass-card border ${q.bgClass} h-full`}>
                <CardHeader className="pb-3">
                  <CardTitle className={`text-sm flex items-center gap-2 ${q.colorClass}`}>
                    <q.icon className="h-4 w-4" />
                    {q.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {swot[q.key].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <div className={`h-1.5 w-1.5 rounded-full mt-2 shrink-0 ${q.dotClass}`} />
                        <span className="text-sm text-foreground/90 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

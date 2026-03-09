import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Brain, Newspaper, Scale, TrendingUp, User, Search, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useApplicationStore } from "@/store/useApplicationStore";
import { ActiveApplicationBanner, NoApplicationSelected } from "@/components/ActiveApplicationBanner";
import { ProcessingBanner } from "@/components/ui/processing-status";

type Sentiment = "Positive" | "Negative" | "Neutral";

const sentimentColor = (s: Sentiment) =>
  s === "Positive" ? "bg-risk-low/15 text-risk-low border-risk-low/20" :
  s === "Negative" ? "bg-risk-high/15 text-risk-high border-risk-high/20" :
  "bg-risk-medium/15 text-risk-medium border-risk-medium/20";

const sentimentDot = (s: Sentiment) =>
  s === "Positive" ? "bg-risk-low" : s === "Negative" ? "bg-risk-high" : "bg-risk-medium";

function TimelineItem({ item, index }: { item: { headline: string; source: string; date: string; sentiment: Sentiment; confidence: number }; index: number }) {
  return (
    <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.06 }} className="flex gap-4 group">
      <div className="flex flex-col items-center pt-1">
        <div className={`w-3 h-3 rounded-full ${sentimentDot(item.sentiment)} ring-4 ring-background`} />
        <div className="w-0.5 flex-1 bg-border/50 mt-1" />
      </div>
      <div className="flex-1 pb-6">
        <div className="glass-card-hover p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground leading-relaxed">{item.headline}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-[10px] font-medium text-primary">{item.source}</span>
                <span className="text-[10px] text-muted-foreground">•</span>
                <span className="text-[10px] text-muted-foreground">{item.date}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline" className={`text-[10px] ${sentimentColor(item.sentiment)}`}>{item.sentiment}</Badge>
              <span className="text-[10px] text-muted-foreground font-mono">{item.confidence}%</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function AIResearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { selectedApplication } = useApplicationStore();

  if (!selectedApplication) return <NoApplicationSelected />;

  const app = selectedApplication;

  // Build research data from application context
  const newsData = (app.researchFindings || []).map(r => ({
    headline: r.title,
    source: r.source,
    date: r.date,
    sentiment: r.sentiment as Sentiment,
    confidence: r.confidence,
  }));

  // Build explainable AI items as risk signals
  const riskSignals = (app.explainableAI || []).map((e, i) => ({
    headline: e.text,
    source: "AI Risk Engine",
    date: new Date().toLocaleDateString(),
    sentiment: (e.severity === "high" ? "Negative" : e.severity === "medium" ? "Neutral" : "Positive") as Sentiment,
    confidence: e.severity === "high" ? 90 : e.severity === "medium" ? 75 : 85,
  }));

  // Sector risk derived from Five Cs
  const sectorRiskData = (app.fiveCsScores || []).map(c => ({
    factor: c.name,
    outlook: c.score >= 70 ? "Strong" : c.score >= 50 ? "Moderate" : "Weak",
    impact: c.weight >= 25 ? "High" : c.weight >= 20 ? "Medium" : "Low",
    sentiment: (c.score >= 70 ? "Positive" : c.score >= 50 ? "Neutral" : "Negative") as Sentiment,
    detail: c.explanation,
  }));

  // Promoter data
  const promoterData = [
    { aspect: "Promoter Group", detail: app.promoterGroup || "N/A", sentiment: "Neutral" as Sentiment },
    { aspect: "CIBIL Score", detail: `${app.cibilScore || "N/A"}`, sentiment: ((app.cibilScore || 700) >= 750 ? "Positive" : (app.cibilScore || 700) >= 650 ? "Neutral" : "Negative") as Sentiment },
    { aspect: "Incorporation Year", detail: app.incorporationYear || "N/A", sentiment: "Neutral" as Sentiment },
    { aspect: "Registered Office", detail: app.registeredOffice || "N/A", sentiment: "Neutral" as Sentiment },
  ];

  const hasNoData = newsData.length === 0 && riskSignals.length === 0;

  return (
    <div className="space-y-6">
      <ActiveApplicationBanner />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Company Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-1">{app.company} — AI-powered research insights</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => toast({ title: "Refreshing", description: "Fetching latest intelligence data..." })}>
          <Brain className="h-4 w-4" /> Refresh Intelligence
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 border border-border/50">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search intelligence reports..." className="border-0 bg-transparent h-auto p-0 text-sm focus-visible:ring-0" />
        </div>
      </div>

      {hasNoData ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No research data available</h3>
          <p className="text-sm text-muted-foreground">Run risk analysis first to generate intelligence insights for this application.</p>
        </motion.div>
      ) : (
        <Tabs defaultValue="news" className="space-y-4">
          <TabsList className="bg-muted/50 border border-border/50 p-1">
            <TabsTrigger value="news" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2 text-xs">
              <Newspaper className="h-3.5 w-3.5" /> Research ({newsData.length})
            </TabsTrigger>
            <TabsTrigger value="risks" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2 text-xs">
              <Scale className="h-3.5 w-3.5" /> Risk Signals ({riskSignals.length})
            </TabsTrigger>
            <TabsTrigger value="sector" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2 text-xs">
              <TrendingUp className="h-3.5 w-3.5" /> Five Cs Analysis
            </TabsTrigger>
            <TabsTrigger value="promoter" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2 text-xs">
              <User className="h-3.5 w-3.5" /> Promoter
            </TabsTrigger>
          </TabsList>

          <TabsContent value="news" className="space-y-2">
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Newspaper className="h-4 w-4 text-primary" /> Research Intelligence Timeline
              </h3>
              {newsData.length > 0 ? newsData.map((item, i) => (
                <TimelineItem key={i} item={item} index={i} />
              )) : (
                <p className="text-xs text-muted-foreground text-center py-4">No research findings available</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="risks" className="space-y-2">
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" /> AI Risk Signals
              </h3>
              {riskSignals.map((item, i) => (
                <TimelineItem key={i} item={item} index={i} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sector" className="space-y-2">
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Five Cs Risk Analysis
              </h3>
              <div className="space-y-3">
                {sectorRiskData.map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${sentimentDot(item.sentiment)}`} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.factor}</p>
                        <p className="text-[10px] text-muted-foreground">{item.detail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground">Impact: {item.impact}</span>
                      <Badge variant="outline" className={`text-[10px] ${sentimentColor(item.sentiment)}`}>{item.sentiment}</Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="promoter" className="space-y-2">
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Promoter Profile
              </h3>
              <div className="space-y-3">
                {promoterData.map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${sentimentDot(item.sentiment)}`} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.aspect}</p>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${sentimentColor(item.sentiment)}`}>{item.sentiment}</Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

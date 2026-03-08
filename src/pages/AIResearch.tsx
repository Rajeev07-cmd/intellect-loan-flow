import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Newspaper, Scale, TrendingUp, User, Search, Filter, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const newsData = [
  { year: "2026", headline: "Steel sector braces for margin squeeze amid global slowdown", source: "Economic Times", date: "Feb 28, 2026", sentiment: "Negative" as const, confidence: 87 },
  { year: "2026", headline: "Promoter increased stake by 2% via open market purchase", source: "Bloomberg", date: "Feb 8, 2026", sentiment: "Positive" as const, confidence: 91 },
  { year: "2025", headline: "New capacity expansion announced — ₹2,400 Cr investment", source: "Business Standard", date: "Nov 15, 2025", sentiment: "Positive" as const, confidence: 93 },
  { year: "2025", headline: "Credit outlook stable for large steel manufacturers", source: "CRISIL Report", date: "Sep 20, 2025", sentiment: "Neutral" as const, confidence: 92 },
  { year: "2024", headline: "Tax investigation reported by DGGI for FY22 input credit", source: "LiveMint", date: "Jun 12, 2024", sentiment: "Negative" as const, confidence: 78 },
  { year: "2024", headline: "Annual return filed — No adverse remarks by auditors", source: "MCA Filing", date: "Mar 30, 2024", sentiment: "Positive" as const, confidence: 95 },
];

const litigationData = [
  { year: "2025", headline: "2 pending cases — aggregate claim value ₹12 Cr", source: "e-Courts", date: "Feb 15, 2026", sentiment: "Negative" as const, confidence: 78 },
  { year: "2024", headline: "Labour dispute case filed in NCLT — hearing pending", source: "NCLT Records", date: "Aug 10, 2024", sentiment: "Negative" as const, confidence: 82 },
  { year: "2023", headline: "Environmental clearance case dismissed by NGT", source: "NGT Portal", date: "May 22, 2023", sentiment: "Positive" as const, confidence: 88 },
  { year: "2022", headline: "Trademark infringement case filed by competitor", source: "High Court", date: "Nov 3, 2022", sentiment: "Negative" as const, confidence: 75 },
];

const sectorRiskData = [
  { factor: "Global Demand", outlook: "Weakening", impact: "High", sentiment: "Negative" as const },
  { factor: "Raw Material Costs", outlook: "Stabilizing", impact: "Medium", sentiment: "Neutral" as const },
  { factor: "EV Transition Impact", outlook: "Moderate Disruption", impact: "Medium", sentiment: "Negative" as const },
  { factor: "Government Infrastructure Push", outlook: "Strong", impact: "High", sentiment: "Positive" as const },
  { factor: "Export Competitiveness", outlook: "Improving", impact: "Medium", sentiment: "Positive" as const },
];

const promoterData = [
  { aspect: "Industry Experience", detail: "25+ years in steel & metals", sentiment: "Positive" as const },
  { aspect: "CIBIL History", detail: "Clean record — no defaults", sentiment: "Positive" as const },
  { aspect: "Personal Guarantee Exposure", detail: "₹15 Cr in related entity", sentiment: "Negative" as const },
  { aspect: "Stake Movement", detail: "Increased by 2% in FY26", sentiment: "Positive" as const },
  { aspect: "Other Directorships", detail: "3 active companies — all compliant", sentiment: "Neutral" as const },
  { aspect: "Public Reputation", detail: "Well-regarded in industry circles", sentiment: "Positive" as const },
];

const sentimentColor = (s: "Positive" | "Negative" | "Neutral") =>
  s === "Positive" ? "bg-risk-low/15 text-risk-low border-risk-low/20" :
  s === "Negative" ? "bg-risk-high/15 text-risk-high border-risk-high/20" :
  "bg-risk-medium/15 text-risk-medium border-risk-medium/20";

const sentimentDot = (s: "Positive" | "Negative" | "Neutral") =>
  s === "Positive" ? "bg-risk-low" : s === "Negative" ? "bg-risk-high" : "bg-risk-medium";

function TimelineItem({ item, index }: { item: typeof newsData[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex gap-4 group"
    >
      <div className="flex flex-col items-center pt-1">
        <div className={`w-3 h-3 rounded-full ${sentimentDot(item.sentiment)} ring-4 ring-background`} />
        {<div className="w-0.5 flex-1 bg-border/50 mt-1" />}
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Company Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-1">Tata Steel Ltd — AI-powered research insights</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => toast({ title: "Refreshing", description: "Fetching latest intelligence data..." })}>
          <Brain className="h-4 w-4" /> Refresh Intelligence
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 border border-border/50">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search intelligence reports..." className="border-0 bg-transparent h-auto p-0 text-sm focus-visible:ring-0" />
        </div>
      </div>

      <Tabs defaultValue="news" className="space-y-4">
        <TabsList className="bg-muted/50 border border-border/50 p-1">
          <TabsTrigger value="news" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2 text-xs">
            <Newspaper className="h-3.5 w-3.5" /> News Mentions
          </TabsTrigger>
          <TabsTrigger value="litigation" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2 text-xs">
            <Scale className="h-3.5 w-3.5" /> Litigation
          </TabsTrigger>
          <TabsTrigger value="sector" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2 text-xs">
            <TrendingUp className="h-3.5 w-3.5" /> Sector Risk
          </TabsTrigger>
          <TabsTrigger value="promoter" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2 text-xs">
            <User className="h-3.5 w-3.5" /> Promoter
          </TabsTrigger>
        </TabsList>

        <TabsContent value="news" className="space-y-2">
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-primary" /> News Intelligence Timeline
            </h3>
            {newsData.map((item, i) => (
              <TimelineItem key={i} item={item} index={i} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="litigation" className="space-y-2">
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" /> Litigation Timeline
            </h3>
            {litigationData.map((item, i) => (
              <TimelineItem key={i} item={item} index={i} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sector" className="space-y-2">
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Sector Risk Analysis
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
                      <p className="text-[10px] text-muted-foreground">Outlook: {item.outlook}</p>
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
              <User className="h-4 w-4 text-primary" /> Promoter Reputation Analysis
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
    </div>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Circle, Clock, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useApplicationStore } from "@/store/useApplicationStore";
import { ActiveApplicationBanner, NoApplicationSelected } from "@/components/ActiveApplicationBanner";

export default function Tracking() {
  const { selectedApplication } = useApplicationStore();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(selectedApplication?.comments || []);

  if (!selectedApplication) return <NoApplicationSelected />;

  const pipeline = selectedApplication.pipeline;

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setComments(prev => [
      { author: "Rajesh Kumar", role: "Credit Manager", time: "Just now", text: newComment },
      ...prev,
    ]);
    setNewComment("");
    toast({ title: "Comment Added", description: "Your note has been posted." });
  };

  const completedIndex = pipeline.reduce((last, s, i) => s.status === "completed" ? i : last, -1);
  const activeIndex = pipeline.findIndex(s => s.status === "active");
  const progressPercent = activeIndex >= 0
    ? ((activeIndex) / (pipeline.length - 1)) * 100
    : completedIndex >= 0
    ? ((completedIndex + 1) / (pipeline.length - 1)) * 100
    : 0;

  return (
    <div className="space-y-6">
      <ActiveApplicationBanner />

      <div>
        <h1 className="text-2xl font-bold text-foreground">Application Tracking</h1>
        <p className="text-sm text-muted-foreground mt-1">{selectedApplication.company} — {selectedApplication.id}</p>
      </div>

      {/* Horizontal Pipeline */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8">
        <h3 className="text-sm font-semibold text-foreground mb-8">Approval Pipeline</h3>

        <div className="relative">
          {/* Background line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-border/50 rounded-full" />
          {/* Progress line */}
          <motion.div
            className="absolute top-5 left-0 h-0.5 bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />

          {/* Steps */}
          <div className="relative flex justify-between">
            {pipeline.map((step, i) => {
              const isCompleted = step.status === "completed";
              const isActive = step.status === "active";

              return (
                <motion.div
                  key={step.stage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex flex-col items-center text-center"
                  style={{ width: `${100 / pipeline.length}%` }}
                >
                  {/* Circle */}
                  <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? "bg-risk-low/20 border-risk-low text-risk-low"
                      : isActive
                      ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/20"
                      : "bg-card border-border text-muted-foreground"
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : isActive ? (
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                        <Clock className="h-5 w-5" />
                      </motion.div>
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>

                  {/* Label */}
                  <p className={`text-[11px] font-medium mt-3 max-w-[90px] leading-tight ${
                    isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {step.stage}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{step.date}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Comments */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Internal Notes & Comments</h3>
        </div>

        <div className="flex gap-2 mb-4">
          <Input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Add a comment or note..."
            className="text-sm flex-1 rounded-xl"
            onKeyDown={e => e.key === "Enter" && handleAddComment()}
          />
          <Button size="sm" className="gap-2 rounded-xl" onClick={handleAddComment}>
            <Send className="h-3.5 w-3.5" /> Send
          </Button>
        </div>

        <div className="space-y-3">
          {comments.map((c, i) => (
            <motion.div key={`${c.author}-${i}`} initial={i === 0 ? { opacity: 0, y: -10 } : {}} animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 p-3.5 bg-muted/20 rounded-xl border border-border/20"
            >
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                {c.author.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-foreground">{c.author}</span>
                  <span className="text-[10px] text-muted-foreground">• {c.role}</span>
                  <span className="text-[10px] text-muted-foreground">• {c.time}</span>
                </div>
                <p className="text-sm text-muted-foreground">{c.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

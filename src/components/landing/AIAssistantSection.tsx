import { motion } from "framer-motion";
import { Bot, User, Sparkles } from "lucide-react";

const conversation = [
  {
    role: "user" as const,
    message: "Why is Tata Steel classified as medium risk?",
  },
  {
    role: "ai" as const,
    message:
      "Tata Steel shows a high debt-to-equity ratio of 1.8x and declining interest coverage ratio. Additionally, two litigation mentions were detected in Q3 2024 filings, and the steel sector faces cyclical headwinds with declining demand forecasts.",
  },
  {
    role: "user" as const,
    message: "What are the key risk mitigants?",
  },
  {
    role: "ai" as const,
    message:
      "Key mitigants include strong brand value (AAA-rated promoter), diversified revenue streams across 26 countries, and ₹12,400 Cr collateral coverage with 1.4x asset coverage ratio. The company also maintains a strong management track record with 25+ years of operations.",
  },
];

export function AIAssistantSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">AI Assistant</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3">Ask Anything About Credit Risk</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Our AI Credit Assistant provides instant, citation-backed intelligence on any company in your portfolio.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto glass-card p-6 md:p-8"
        >
          {/* Chat header */}
          <div className="flex items-center gap-2 pb-4 border-b border-border/50 mb-6">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">Intelli-Credit AI Assistant</span>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-risk-low">
              <span className="w-1.5 h-1.5 rounded-full bg-risk-low" />
              Online
            </span>
          </div>

          {/* Messages */}
          <div className="space-y-5">
            {conversation.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "ai" && (
                  <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.message}
                </div>
                {msg.role === "user" && (
                  <div className="shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center mt-1">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Input mockup */}
          <div className="mt-6 flex items-center gap-2 p-2 rounded-xl bg-muted/50 border border-border/50">
            <div className="flex-1 px-3 py-2 text-xs text-muted-foreground">
              Ask about any company's credit profile...
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium cursor-default">
              Send
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

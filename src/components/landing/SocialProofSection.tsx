import { motion } from "framer-motion";
import { Building2, Landmark, CreditCard, BadgeCheck } from "lucide-react";
import { AnimatedValue } from "@/components/ui/animated-value";

const logos = [
  { Icon: Landmark, name: "National Bank" },
  { Icon: Building2, name: "Metro Finance" },
  { Icon: CreditCard, name: "FinServe NBFC" },
  { Icon: Landmark, name: "Capital Trust" },
  { Icon: Building2, name: "Urban Credit Co." },
  { Icon: CreditCard, name: "PaySecure" },
];

const metrics = [
  { value: "50+", label: "Financial Institutions" },
  { value: "₹1.2L Cr", label: "Loans Processed" },
  { value: "99.7%", label: "Uptime SLA" },
  { value: "ISO 27001", label: "Certified" },
];

export function SocialProofSection() {
  return (
    <section className="py-20 px-6 border-y border-border/40 bg-muted/20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <BadgeCheck className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">
              Trusted by Leading Institutions
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold">
            Powering Credit Decisions Across India
          </h2>
        </motion.div>

        {/* Logo grid */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-16">
          {logos.map((logo, i) => (
            <motion.div
              key={logo.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ scale: 1.05 }}
              className="glass-card p-5 flex flex-col items-center justify-center gap-2 cursor-default"
            >
              <logo.Icon className="h-7 w-7 text-muted-foreground/60" />
              <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">
                {logo.name}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Trust metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="text-center p-4"
            >
              <AnimatedValue value={m.value} className="text-2xl md:text-3xl font-bold text-foreground" />
              <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

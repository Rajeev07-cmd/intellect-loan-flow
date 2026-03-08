import { motion } from "framer-motion";
import { Github, Linkedin } from "lucide-react";

const developers = [
  {
    name: "Rajeev Pichika",
    role: "Full Stack Developer",
    description: "Architecting the end-to-end platform from data pipelines to decision dashboards.",
    initials: "RP",
    color: "from-primary/30 to-chart-4/30",
    linkedin: "https://www.linkedin.com/in/rajeev-pichika-8b58a8309",
  },
  {
    name: "Tarun Kumar Choudhury",
    role: "Backend & AI Developer",
    description: "Building credit risk models, explainable AI modules, and backend infrastructure.",
    initials: "TC",
    color: "from-chart-4/30 to-chart-2/30",
    linkedin: "https://www.linkedin.com/in/tarunkumarchoudhury",
  },
  {
    name: "Sudeepa Mund",
    role: "Frontend Developer",
    description: "Crafting responsive, high-performance interfaces for credit officers and managers.",
    initials: "SM",
    color: "from-chart-2/30 to-primary/30",
    linkedin: "https://www.linkedin.com/in/sudeepa-mund",
  },
  {
    name: "Subhankar Rath",
    role: "UI/UX Designer",
    description: "Designing intuitive workflows and enterprise-grade visual experiences.",
    initials: "SR",
    color: "from-primary/30 to-chart-1/30",
    linkedin: "https://www.linkedin.com/in/subhankar-rath-2a369b274",
  },
];

export function DevelopersSection() {
  return (
    <section id="developers" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">
            Our Team
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3">Meet the Developers</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            The team behind Intelli-Credit.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {developers.map((dev, i) => (
            <motion.div
              key={dev.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="glass-card p-6 flex flex-col items-center text-center cursor-default"
            >
              <div
                className={`w-20 h-20 rounded-full bg-gradient-to-br ${dev.color} border-2 border-border/50 flex items-center justify-center mb-4 shadow-lg`}
              >
                <span className="text-xl font-bold text-foreground">{dev.initials}</span>
              </div>

              <h3 className="text-base font-semibold text-foreground">{dev.name}</h3>
              <p className="text-xs font-medium text-primary mt-1">{dev.role}</p>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                {dev.description}
              </p>

              <motion.a
                href={dev.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors"
              >
                <Linkedin className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary">LinkedIn Profile</span>
              </motion.a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

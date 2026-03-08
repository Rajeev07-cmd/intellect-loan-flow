import { motion } from "framer-motion";
import { Github, Linkedin } from "lucide-react";

const developers = [
  {
    name: "Rajeev Pichika",
    role: "Full Stack Developer",
    description: "Architecting the end-to-end platform from data pipelines to decision dashboards.",
    initials: "RP",
    color: "from-primary/30 to-chart-4/30",
  },
  {
    name: "Tarun Kumar Choudhury",
    role: "Backend & AI Developer",
    description: "Building credit risk models, explainable AI modules, and backend infrastructure.",
    initials: "TC",
    color: "from-chart-4/30 to-chart-2/30",
  },
  {
    name: "Sudeepa Mund",
    role: "Frontend Developer",
    description: "Crafting responsive, high-performance interfaces for credit officers and managers.",
    initials: "SM",
    color: "from-chart-2/30 to-primary/30",
  },
  {
    name: "Shobha Patel",
    role: "UI/UX Designer",
    description: "Designing intuitive workflows and enterprise-grade visual experiences.",
    initials: "SP",
    color: "from-primary/30 to-chart-1/30",
  },
  {
    name: "Amisha Patel",
    role: "Data & ML Engineer",
    description: "Engineering data extraction pipelines and machine learning scoring models.",
    initials: "AP",
    color: "from-chart-1/30 to-chart-4/30",
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
              {/* Avatar */}
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

              {/* Social icons */}
              <div className="flex gap-3 mt-4">
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.15 }}
                  className="p-2 rounded-lg bg-muted/50 hover:bg-primary/10 transition-colors"
                >
                  <Github className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                </motion.a>
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.15 }}
                  className="p-2 rounded-lg bg-muted/50 hover:bg-primary/10 transition-colors"
                >
                  <Linkedin className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                </motion.a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

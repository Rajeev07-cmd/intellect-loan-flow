import { useState, useMemo } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Bell, Search, X, Building2, ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { recentApplications } from "@/lib/mock-data";
import { companyApplications } from "@/lib/company-data";
import { useApplicationStore } from "@/store/useApplicationStore";
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";

const notifications = [
  { id: 1, title: "High Risk Alert", desc: "Adani Ports & SEZ flagged — Risk Score 72", time: "5 min ago", read: false },
  { id: 2, title: "CAM Report Ready", desc: "Tata Steel Ltd CAM v2.1 generated", time: "1 hour ago", read: false },
  { id: 3, title: "Committee Decision Pending", desc: "ABC Industries awaiting approval", time: "2 hours ago", read: true },
  { id: 4, title: "Document Verification", desc: "Director KYC verification failed", time: "3 hours ago", read: false },
  { id: 5, title: "New Application", desc: "JSW Steel Ltd — ₹450 Cr term loan", time: "5 hours ago", read: true },
];

export function AppLayout() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifRead, setNotifRead] = useState<number[]>(notifications.filter(n => n.read).map(n => n.id));
  const [appSelectorOpen, setAppSelectorOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { selectedApplication, setSelectedApplication } = useApplicationStore();

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return recentApplications.filter(app =>
      app.company.toLowerCase().includes(q) ||
      app.cin.toLowerCase().includes(q) ||
      app.sector.toLowerCase().includes(q) ||
      app.id.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const unreadCount = notifications.filter(n => !notifRead.includes(n.id)).length;
  const markAllRead = () => setNotifRead(notifications.map(n => n.id));


  const handleSelectApp = (app: typeof companyApplications[0]) => {
    setSelectedApplication(app);
    setAppSelectorOpen(false);
    toast({ title: "Application Selected", description: `Switched to ${app.company}` });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border/40 px-4 bg-card/60 backdrop-blur-xl sticky top-0 z-10">
            <div className="flex items-center gap-4 relative flex-1">
              {/* Sidebar Toggle */}
              <SidebarTrigger className="h-8 w-8 shrink-0" />
              {/* Search */}
              <div className="hidden md:flex items-center gap-2 bg-muted/40 rounded-xl px-3.5 py-2 w-72 border border-border/30 focus-within:border-primary/40 transition-colors">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  placeholder="Search by CIN, Company, PAN..."
                  className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {searchFocused && searchQuery && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-popover border border-border rounded-xl shadow-xl z-50 max-h-64 overflow-auto">
                  {searchResults.length > 0 ? (
                    searchResults.map(app => (
                      <button
                        key={app.id}
                        className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0"
                        onMouseDown={() => { setSearchQuery(""); navigate("/applications"); }}
                      >
                        <p className="text-xs font-medium text-foreground">{app.company}</p>
                        <p className="text-[10px] text-muted-foreground">{app.id} • {app.sector} • ₹{app.loanAmount} Cr</p>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center">
                      <p className="text-xs text-muted-foreground">No results found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Application Selector */}
              <div className="hidden lg:block relative">
                <button
                  onClick={() => setAppSelectorOpen(!appSelectorOpen)}
                  className="flex items-center gap-2 rounded-xl border border-border/40 bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/30 transition-colors"
                >
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  <span className="max-w-[160px] truncate">
                    {selectedApplication ? selectedApplication.company : "Select Application"}
                  </span>
                  <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${appSelectorOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {appSelectorOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute top-full left-0 mt-1 w-72 bg-popover border border-border rounded-xl shadow-xl z-50 max-h-80 overflow-auto"
                    >
                      <div className="p-2">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-2 py-1">Applications</p>
                        {companyApplications.map((app) => (
                          <button
                            key={app.id}
                            onClick={() => handleSelectApp(app)}
                            className={`flex items-center gap-3 w-full px-2.5 py-2 rounded-lg text-left transition-colors hover:bg-muted/50 ${
                              selectedApplication?.id === app.id ? "bg-primary/10" : ""
                            }`}
                          >
                            <div className="h-7 w-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{app.company}</p>
                              <p className="text-[10px] text-muted-foreground">{app.sector} · ₹{app.loanAmount} Cr</p>
                            </div>
                            <span className={`ml-auto shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              app.riskScore <= 40 ? "bg-risk-low/15 text-risk-low" :
                              app.riskScore <= 65 ? "bg-risk-medium/15 text-risk-medium" :
                              "bg-risk-high/15 text-risk-high"
                            }`}>
                              {app.riskScore}
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="h-5 w-px bg-border/50" />

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative p-2 rounded-xl hover:bg-muted/50 transition-colors">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-risk-high text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 rounded-xl">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[10px] text-primary hover:underline">Mark all read</button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.map(n => (
                    <DropdownMenuItem
                      key={n.id}
                      className={`flex flex-col items-start gap-0.5 py-2.5 cursor-pointer ${!notifRead.includes(n.id) ? "bg-primary/5" : ""}`}
                      onClick={() => setNotifRead(prev => prev.includes(n.id) ? prev : [...prev, n.id])}
                    >
                      <div className="flex items-center gap-2 w-full">
                        {!notifRead.includes(n.id) && <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
                        <span className="text-xs font-medium text-foreground">{n.title}</span>
                        <span className="text-[9px] text-muted-foreground ml-auto">{n.time}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground ml-3.5">{n.desc}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="h-5 w-px bg-border/50" />

              <span className="text-[10px] text-muted-foreground hidden md:block font-mono">v2.1.0</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

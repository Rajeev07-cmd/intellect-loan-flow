import {
  LayoutDashboard, FileText, FileCheck, Shield, BookOpen, GitBranch,
  Brain, Gavel, Users, Zap, LogOut, User, Settings, ShieldAlert, FileSearch, Target, FileBarChart, Database,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const allNavItems: NavItem[] = [
  // Credit Officer pages
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["credit_officer", "admin"] },
  { title: "Applications", url: "/applications", icon: FileText, roles: ["credit_officer", "admin"] },
  { title: "Doc Verification", url: "/document-verification", icon: FileCheck, roles: ["credit_officer", "admin"] },
  { title: "Doc Classification", url: "/document-classification", icon: FileSearch, roles: ["credit_officer", "admin"] },
  { title: "Extraction Workspace", url: "/extraction-workspace", icon: Database, roles: ["credit_officer", "admin"] },
  { title: "AML / Compliance", url: "/aml-compliance", icon: ShieldAlert, roles: ["credit_officer", "admin"] },
  { title: "Risk Engine", url: "/risk-engine", icon: Shield, roles: ["credit_officer", "admin"] },
  { title: "CAM Generator", url: "/cam-generator", icon: BookOpen, roles: ["credit_officer", "admin"] },
  { title: "Tracking", url: "/tracking", icon: GitBranch, roles: ["credit_officer", "admin"] },
  { title: "AI Research", url: "/research", icon: Brain, roles: ["credit_officer", "admin"] },
  { title: "SWOT Analysis", url: "/swot-analysis", icon: Target, roles: ["credit_officer", "admin"] },
  { title: "Final Report", url: "/final-report", icon: FileBarChart, roles: ["credit_officer", "manager", "admin"] },
  
  // Manager pages
  { title: "Manager Dashboard", url: "/manager-dashboard", icon: LayoutDashboard, roles: ["manager", "admin"] },
  { title: "Decision Center", url: "/decision-center", icon: Gavel, roles: ["credit_officer", "manager", "admin"] },
  // Admin pages
  { title: "Admin Settings", url: "/admin/users", icon: Settings, roles: ["admin"] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const userRole = profile?.role || "credit_officer";
  const visibleItems = allNavItems.filter(item => item.roles.includes(userRole));

  // Group items: "Main" for dashboard/workflow, "Tools" for secondary
  const mainUrls = ["/dashboard", "/manager-dashboard", "/applications", "/document-verification", "/document-classification", "/risk-engine", "/cam-generator", "/tracking"];
  const mainItems = visibleItems.filter(i => mainUrls.includes(i.url));
  const toolItems = visibleItems.filter(i => !mainUrls.includes(i.url));

  const isActive = (path: string) => location.pathname === path;

  const roleLabel: Record<UserRole, string> = {
    credit_officer: "Credit Officer",
    manager: "Manager",
    admin: "Admin",
  };

  const roleBadgeColor: Record<UserRole, string> = {
    credit_officer: "bg-primary/15 text-primary border-primary/20",
    manager: "bg-chart-4/15 text-chart-4 border-chart-4/20",
    admin: "bg-destructive/15 text-destructive border-destructive/20",
  };

  const renderMenuItem = (item: NavItem) => (
    <SidebarMenuItem key={item.title}>
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuButton asChild isActive={isActive(item.url)}>
              <NavLink to={item.url} end activeClassName="bg-primary/10 text-primary border-primary/20">
                <item.icon className="h-4 w-4" />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            </SidebarMenuButton>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" className="text-xs">
              {item.title}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-border/30 transition-all duration-300 ease-in-out">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shrink-0">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">Intelli-Credit</h2>
              <p className="text-[10px] text-muted-foreground">Credit Platform</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-3">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {toolItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-3">Tools</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {toolItems.map(renderMenuItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3">
        {user ? (
          <div className={`flex items-center gap-3 p-2.5 rounded-xl bg-muted/20 border border-border/20 ${collapsed ? "justify-center" : ""}`}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                {(profile?.full_name || user.email || "U").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{profile?.full_name || user.email?.split("@")[0]}</p>
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 font-medium mt-0.5 ${roleBadgeColor[userRole]}`}>
                    {roleLabel[userRole]}
                  </Badge>
                </div>
                <button onClick={() => { signOut(); navigate("/login"); }} className="text-muted-foreground hover:text-foreground transition-colors">
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        ) : (
          !collapsed && (
            <button onClick={() => navigate("/login")} className="flex items-center gap-3 w-full p-2.5 rounded-xl bg-muted/20 border border-border/20 hover:bg-muted/40 transition-colors">
              <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-foreground">Sign In</p>
                <p className="text-[10px] text-muted-foreground">Access your account</p>
              </div>
            </button>
          )
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

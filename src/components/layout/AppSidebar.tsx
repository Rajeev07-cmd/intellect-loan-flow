import {
  LayoutDashboard, FileText, FileCheck, Shield, BookOpen, GitBranch,
  Brain, Gavel, Users, LogOut, Zap,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isActive = (path: string) => location.pathname === path;

  const role = localStorage.getItem("userRole") || "credit-officer";
  const prefix = role === "manager" ? "/manager" : "/credit-officer";

  const mainItems = role === "credit-officer" ? [
    { title: "Dashboard", url: `${prefix}/dashboard`, icon: LayoutDashboard },
    { title: "Applications", url: `${prefix}/applications`, icon: FileText },
    { title: "Doc Verification", url: `${prefix}/document-verification`, icon: FileCheck },
    { title: "Risk Engine", url: `${prefix}/risk-engine`, icon: Shield },
    { title: "CAM Generator", url: `${prefix}/cam-generator`, icon: BookOpen },
    { title: "Tracking", url: `${prefix}/tracking`, icon: GitBranch },
  ] : [
    { title: "Dashboard", url: `${prefix}/dashboard`, icon: LayoutDashboard },
    { title: "Applications", url: `${prefix}/applications`, icon: FileText },
    { title: "Risk Engine", url: `${prefix}/risk-engine`, icon: Shield },
    { title: "Decision Center", url: `${prefix}/decision-center`, icon: Gavel },
    { title: "Tracking", url: `${prefix}/tracking`, icon: GitBranch },
  ];

  const toolItems = [
    { title: "AI Research", url: `${prefix}/research`, icon: Brain },
  ];

  const adminItems = role === "manager" ? [
    { title: "User Management", url: `${prefix}/admin/users`, icon: Users },
  ] : [];

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    toast({ title: "Signed Out", description: "You have been logged out successfully." });
    navigate("/login");
  };

  const userName = role === "manager" ? "Amit Desai" : "Rajesh Kumar";
  const userRole = role === "manager" ? "Senior Manager" : "Credit Officer";
  const initials = userName.split(" ").map(n => n[0]).join("");

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">Intelli-Credit</h2>
              <p className="text-[10px] text-muted-foreground">Credit Appraisal Platform</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end activeClassName="bg-primary/10 text-primary border-primary/20">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end activeClassName="bg-primary/10 text-primary border-primary/20">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} end activeClassName="bg-primary/10 text-primary border-primary/20">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">{initials}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{userName}</p>
              <p className="text-[10px] text-muted-foreground">{userRole}</p>
            </div>
            <button onClick={handleLogout} title="Sign Out">
              <LogOut className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

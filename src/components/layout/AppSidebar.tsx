import {
  LayoutDashboard, FileText, FileCheck, Shield, BookOpen, GitBranch,
  Brain, Gavel, Users, LogOut, Zap, Loader2,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, signOut, loading } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;

  // Determine role from profile or fallback to URL pattern
  const role = profile?.role || 
    (location.pathname.startsWith("/manager") ? "manager" : "credit_officer");
  
  const prefix = role === "manager" ? "/manager" : "/credit-officer";

  const mainItems = role === "credit_officer" || role === "admin" ? [
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

  const adminItems = role === "manager" || role === "admin" ? [
    { title: "User Management", url: `${prefix}/admin/users`, icon: Users },
  ] : [];

  const handleLogout = async () => {
    await signOut();
    toast({ title: "Signed Out", description: "You have been logged out successfully." });
    navigate("/login");
  };

  // User display info
  const userName = profile?.full_name || "User";
  const userRoleDisplay = role === "manager" ? "Senior Manager" : 
                          role === "admin" ? "Administrator" : "Credit Officer";
  const initials = userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Sidebar collapsible="icon" className="border-r border-border/30">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
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
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-3">Tools</SidebarGroupLabel>
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
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-3">Admin</SidebarGroupLabel>
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
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/20 border border-border/20">
            <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{userName}</p>
              <p className="text-[10px] text-muted-foreground">{userRoleDisplay}</p>
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

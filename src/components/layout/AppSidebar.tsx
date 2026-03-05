import {
  LayoutDashboard,
  FileText,
  FileCheck,
  Shield,
  BookOpen,
  GitBranch,
  Settings,
  Search,
  Brain,
  Gavel,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Applications", url: "/applications", icon: FileText },
  { title: "Doc Verification", url: "/document-verification", icon: FileCheck },
  { title: "Risk Engine", url: "/risk-engine", icon: Shield },
  { title: "CAM Generator", url: "/cam-generator", icon: BookOpen },
  { title: "Tracking", url: "/tracking", icon: GitBranch },
  { title: "Decision Center", url: "/decision-center", icon: Gavel },
];

const toolItems = [
  { title: "AI Research", url: "/research", icon: Brain },
  { title: "Search", url: "/search", icon: Search },
];

const adminItems = [
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

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
      </SidebarContent>

      <SidebarFooter className="p-3">
        <button onClick={toggleSidebar} className="flex items-center gap-2 w-full p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-sm">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Collapse</span></>}
        </button>
        {!collapsed && (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">RK</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">Rajesh Kumar</p>
              <p className="text-[10px] text-muted-foreground">Credit Manager</p>
            </div>
            <LogOut className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

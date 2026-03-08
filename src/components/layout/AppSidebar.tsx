import {
  LayoutDashboard, FileText, FileCheck, Shield, BookOpen, GitBranch,
  Brain, Gavel, Users, Zap,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const mainItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Applications", url: "/applications", icon: FileText },
    { title: "Doc Verification", url: "/document-verification", icon: FileCheck },
    { title: "Risk Engine", url: "/risk-engine", icon: Shield },
    { title: "CAM Generator", url: "/cam-generator", icon: BookOpen },
    { title: "Tracking", url: "/tracking", icon: GitBranch },
  ];

  const toolItems = [
    { title: "AI Research", url: "/research", icon: Brain },
    { title: "Decision Center", url: "/decision-center", icon: Gavel },
    { title: "Manager View", url: "/manager-dashboard", icon: Users },
  ];

  const renderMenuItem = (item: typeof mainItems[0]) => (
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

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-3">Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && (
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/20 border border-border/20">
            <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">Intelli-Credit Platform</p>
              <p className="text-[10px] text-muted-foreground">Open Access Demo</p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

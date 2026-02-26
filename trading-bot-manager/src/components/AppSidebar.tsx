import {
  LayoutDashboard,
  Layers,
  Crosshair,
  History,
  BarChart3,
  Settings,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Strategies", url: "/strategies", icon: Layers },
  { title: "Manual Trigger", url: "/trigger", icon: Crosshair },
  { title: "Signal History", url: "/history", icon: History },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" className="border-r border-white/5 bg-sidebar-background/50 backdrop-blur-xl">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20 animate-pulse-subtle">
            <Crosshair className="h-5 w-5 text-primary-foreground stroke-[2.5px]" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-xl tracking-tight text-gradient">
              FiFTO
            </span>
            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest -mt-1">
              Terminal v2.0
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
            General
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} className="h-11 px-3 rounded-lg transition-all duration-200 hover:bg-white/5 group">
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      activeClassName="bg-primary/10 text-primary font-semibold shadow-[inset_0_0_12px_rgba(16,185,129,0.05)]"
                    >
                      <item.icon className="h-[18px] w-[18px] group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-sm tracking-wide">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

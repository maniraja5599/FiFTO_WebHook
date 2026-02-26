import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative overflow-hidden">
        {/* Premium Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <AppSidebar />
        <main className="flex-1 flex flex-col relative z-10">
          <header className="h-14 border-b border-white/5 flex items-center px-6 gap-4 bg-background/50 backdrop-blur-md sticky top-0 z-50">
            <SidebarTrigger className="hover:bg-primary/10 transition-colors" />
            <div className="h-4 w-[1px] bg-white/10 mx-2 hidden sm:block" />
            <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground/80">
              FiFTO Terminal
            </h2>
          </header>
          <div className="flex-1 p-6 lg:p-10 overflow-auto">
            <div className="max-w-7xl mx-auto space-y-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

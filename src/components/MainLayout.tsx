import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, Code } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

const Footer = () => (
  <footer className="border-t border-nav-border p-4 text-center text-xs text-muted-foreground bg-background">
    <div className="flex items-center justify-center gap-1">
      <Code className="h-3 w-3 text-primary" />
      <span>Desenvolvido por Renato CMA SUL/GPM</span>
    </div>
  </footer>
);

const MainLayout = () => {
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const desktopSidebarWidth = "w-[240px]";

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 bg-nav border-b border-nav-border h-16 flex items-center px-4 justify-between">
          <h1 className="text-xl font-semibold text-foreground">Sistema CAF</h1>
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px]">
              <ScrollArea className="h-full">
                <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
                  <h1 className="text-xl font-bold text-sidebar-foreground">Sistema CAF</h1>
                </div>
                <Sidebar onLinkClick={() => setIsSheetOpen(false)} />
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </header>
        
        {/* Mobile Content */}
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className={cn("sticky top-0 h-screen border-r border-sidebar-border bg-sidebar", desktopSidebarWidth)}>
        <ScrollArea className="h-full">
          <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
            <h1 className="text-xl font-bold text-sidebar-foreground">Sistema CAF</h1>
          </div>
          <Sidebar />
        </ScrollArea>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
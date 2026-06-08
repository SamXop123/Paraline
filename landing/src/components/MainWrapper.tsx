"use client";

import { useSidebarStore } from "@/store/sidebar";
import { cn } from "@/lib/utils";

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const isOpen = useSidebarStore((state) => state.isOpen);

  return (
    <main className={cn(
      "flex-1 relative z-10 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
      isOpen ? "lg:pl-64" : "pl-0"
    )}>
      {children}
    </main>
  );
}

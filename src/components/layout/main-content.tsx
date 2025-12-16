import { cn } from "@/lib/utils";
import React, { type ReactNode } from "react";

const MainContent = React.forwardRef<HTMLDivElement, { children: ReactNode; className?: string }>(
  ({ children, className }, ref) => {
    return (
      <main ref={ref} className={cn("flex-1 p-4 sm:p-6 overflow-y-auto", className)}>
        {children}
      </main>
    );
  }
);
MainContent.displayName = 'MainContent';

export { MainContent };

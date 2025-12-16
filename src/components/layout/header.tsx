import { SidebarTrigger } from "@/components/ui/sidebar";
import { Logo } from "@/components/icons";

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <SidebarTrigger className="flex md:hidden" />
      <div className="flex-1">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <Logo className="size-4 text-accent" />
          MRSA Resistance Forecaster
        </h1>
      </div>
    </header>
  );
}

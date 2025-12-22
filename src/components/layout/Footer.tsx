import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";

export function Footer() {
  const { sidebarCollapsed } = useAppStore();
  
  return (
    <footer 
      className={cn(
        "fixed bottom-0 left-0 right-0 py-2 px-4 text-center border-t border-border/10 bg-background/80 backdrop-blur-sm transition-all duration-300 z-10",
        sidebarCollapsed ? "md:ml-16" : "md:ml-64"
      )}
    >
      <p className="text-[10px] text-muted-foreground/50 font-medium tracking-wide">
        Developed and Hosted by{" "}
        <span className="text-primary/60 font-semibold">Lumina</span>
      </p>
    </footer>
  );
}

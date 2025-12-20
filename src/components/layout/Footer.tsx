import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";

export function Footer() {
  const { sidebarCollapsed } = useAppStore();
  
  return (
    <footer 
      className={cn(
        "py-2 px-4 text-center border-t border-border/10 bg-background/50 backdrop-blur-sm transition-all duration-300",
        sidebarCollapsed ? "ml-16" : "ml-64"
      )}
    >
      <p className="text-xs text-muted-foreground/60 font-medium tracking-wide">
        Developed and Hosted by{" "}
        <span className="text-primary/70 font-semibold">Lumina</span>
      </p>
    </footer>
  );
}

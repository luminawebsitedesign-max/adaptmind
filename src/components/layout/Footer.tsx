import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";

export function Footer() {
  const { sidebarCollapsed } = useAppStore();
  
  return (
    <footer 
      className={cn(
        "fixed bottom-0 right-4 py-1.5 px-3 text-center transition-all duration-300 z-10",
        "opacity-40 hover:opacity-70"
      )}
    >
      <p className="text-[9px] text-muted-foreground font-medium tracking-wider">
        Powered by Lumina
      </p>
    </footer>
  );
}

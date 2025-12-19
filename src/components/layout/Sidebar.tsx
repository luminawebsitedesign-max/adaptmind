import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  CheckSquare,
  Target,
  Repeat,
  Bot,
  ChevronLeft,
  ChevronRight,
  Download,
  LogOut,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewType } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: "todos", label: "To-Do Lists", icon: <CheckSquare className="w-5 h-5" /> },
  { id: "goals", label: "Goals", icon: <Target className="w-5 h-5" /> },
  { id: "habits", label: "Habits", icon: <Repeat className="w-5 h-5" /> },
  { id: "assistant", label: "AI Assistant", icon: <Bot className="w-5 h-5" /> },
];

export function Sidebar() {
  const { currentView, setCurrentView, sidebarCollapsed, toggleSidebar, todoLists, goals, habits, chatMessages } = useAppStore();
  const { user, profile, signOut } = useAuth();

  const exportData = () => {
    const data = {
      todoLists,
      goals,
      habits,
      chatMessages,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `adaptmind-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full glass-strong z-50 transition-all duration-300 flex flex-col",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-cyan">
            <span className="text-xl font-bold text-primary-foreground">A</span>
          </div>
          {!sidebarCollapsed && (
            <span className="font-display text-xl font-bold text-gradient-cyan">
              Adaptmind
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
              "hover:bg-primary/10 hover-glow",
              currentView === item.id
                ? "bg-primary/20 text-primary neon-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.icon}
            {!sidebarCollapsed && (
              <span className="font-medium">{item.label}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-border/30 space-y-2">
        <button
          onClick={exportData}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
            "text-muted-foreground hover:text-foreground hover:bg-muted/20"
          )}
        >
          <Download className="w-5 h-5" />
          {!sidebarCollapsed && <span className="font-medium">Export Data</span>}
        </button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                "text-muted-foreground hover:text-foreground hover:bg-muted/20"
              )}
            >
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-3 h-3 text-primary" />
              </div>
              {!sidebarCollapsed && (
                <span className="font-medium truncate">{displayName}</span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem className="text-muted-foreground text-sm">
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              {!sidebarCollapsed && <span className="font-medium">Collapse</span>}
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}

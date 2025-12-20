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
  Calendar,
  Brain,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: "todos", label: "Tasks", icon: <CheckSquare className="w-5 h-5" /> },
  { id: "goals", label: "Goals", icon: <Target className="w-5 h-5" /> },
  { id: "habits", label: "Habits", icon: <Repeat className="w-5 h-5" /> },
  { id: "calendar", label: "Calendar", icon: <Calendar className="w-5 h-5" /> },
  { id: "assistant", label: "AI Assistant", icon: <Bot className="w-5 h-5" /> },
];

export function Sidebar() {
  const { currentView, setCurrentView, sidebarCollapsed, toggleSidebar } = useAppStore();
  const { user, profile, signOut } = useAuth();

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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center glow-cyan relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
            <Brain className="w-5 h-5 text-primary-foreground relative z-10" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="font-display text-xl font-bold text-gradient-cyan leading-tight">
                Adaptmind
              </span>
              <span className="text-[10px] text-muted-foreground/70 tracking-wider uppercase">AI Productivity</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <TooltipProvider key={item.id} delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setCurrentView(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                    "hover:bg-primary/10 hover-glow",
                    currentView === item.id
                      ? "bg-primary/20 text-primary neon-border"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label={item.label}
                >
                  {item.icon}
                  {!sidebarCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
              </TooltipTrigger>
              {sidebarCollapsed && (
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-border/30 space-y-1">
        {/* Profile */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setCurrentView('profile')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                  currentView === 'profile'
                    ? "bg-primary/20 text-primary neon-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                )}
                aria-label="Profile"
              >
                <User className="w-5 h-5" />
                {!sidebarCollapsed && <span className="font-medium">Profile</span>}
              </button>
            </TooltipTrigger>
            {sidebarCollapsed && (
              <TooltipContent side="right" className="font-medium">
                Profile
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {/* Export Data */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setCurrentView('settings')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                  currentView === 'settings'
                    ? "bg-primary/20 text-primary neon-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                )}
                aria-label="Export Data"
              >
                <Download className="w-5 h-5" />
                {!sidebarCollapsed && <span className="font-medium">Export Data</span>}
              </button>
            </TooltipTrigger>
            {sidebarCollapsed && (
              <TooltipContent side="right" className="font-medium">
                Export Data
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                "text-muted-foreground hover:text-foreground hover:bg-muted/20"
              )}
              aria-label="User menu"
            >
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{displayName.charAt(0).toUpperCase()}</span>
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

        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <>
                    <ChevronLeft className="w-5 h-5" />
                    <span className="font-medium">Collapse</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            {sidebarCollapsed && (
              <TooltipContent side="right" className="font-medium">
                Expand sidebar
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
}

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { useAuth } from "@/contexts/AuthContext";
import adaptmindIconDark from "@/assets/adaptmind-icon-dark.png";
import adaptmindTextDark from "@/assets/adaptmind-text-dark.png";
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
  Wallet,
  Menu,
  X,
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
  { id: "finance", label: "Finance", icon: <Wallet className="w-5 h-5" /> },
  { id: "calendar", label: "Calendar", icon: <Calendar className="w-5 h-5" /> },
  { id: "assistant", label: "AI Assistant", icon: <Bot className="w-5 h-5" /> },
];

export function Sidebar() {
  const { currentView, setCurrentView, sidebarCollapsed, toggleSidebar } = useAppStore();
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';

  const handleNavClick = (viewId: ViewType) => {
    setCurrentView(viewId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-4 left-4 z-[60] md:hidden w-10 h-10 rounded-lg glass-strong flex items-center justify-center text-foreground hover:text-primary transition-colors"
        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-full glass-strong z-50 transition-all duration-300 flex flex-col",
          // Mobile: slide in/out
          "md:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: width based on collapsed state
          sidebarCollapsed ? "md:w-16" : "md:w-64",
          "w-64"
        )}
      >
      {/* Logo */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <img 
            src={adaptmindIconDark} 
            alt="AdaptMind" 
            className={cn(
              "object-contain transition-all duration-300",
              sidebarCollapsed ? "w-8 h-8" : "w-9 h-9"
            )}
          />
          {!sidebarCollapsed && (
            <div className="flex flex-col gap-0.5">
              <img 
                src={adaptmindTextDark} 
                alt="AdaptMind" 
                className="h-5 object-contain object-left"
              />
              <span className="text-[10px] text-muted-foreground tracking-wider uppercase">Productivity</span>
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
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                    "hover:bg-primary/10",
                    currentView === item.id
                      ? "nav-active font-medium"
                      : "text-muted-foreground hover:text-foreground",
                    sidebarCollapsed && "justify-center px-0"
                  )}
                  aria-label={item.label}
                  aria-current={currentView === item.id ? "page" : undefined}
                >
                  <span className={cn(
                    "transition-colors",
                    currentView === item.id && "text-primary"
                  )}>
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && (
                    <span className="text-sm">{item.label}</span>
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

      {/* Bottom Section */}
      <div className="p-3 border-t border-border/30 space-y-2">
        {/* Profile Dropdown */}
        <DropdownMenu>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 px-3 py-3 h-auto text-muted-foreground hover:text-foreground hover:bg-primary/10",
                      sidebarCollapsed && "justify-center px-0"
                    )}
                    aria-label="Open profile menu"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    {!sidebarCollapsed && (
                      <div className="flex flex-col items-start text-left overflow-hidden">
                        <span className="text-sm font-medium text-foreground truncate max-w-[140px]">
                          {displayName}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                          {user?.email}
                        </span>
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              {sidebarCollapsed && (
                <TooltipContent side="right" className="font-medium">
                  Profile Menu
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent align="end" className="w-56 glass-strong border-border/50">
            <DropdownMenuItem 
              onClick={() => handleNavClick("profile")}
              className="cursor-pointer gap-2 hover:bg-primary/10"
            >
              <User className="w-4 h-4" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleNavClick("export")}
              className="cursor-pointer gap-2 hover:bg-primary/10"
            >
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem 
              onClick={signOut}
              className="cursor-pointer gap-2 text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Collapse Button */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSidebar();
                }}
                className={cn(
                  "w-full justify-center text-muted-foreground hover:text-foreground hover:bg-primary/10 hidden md:flex",
                  sidebarCollapsed ? "px-0" : ""
                )}
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    <span className="text-xs">Collapse Sidebar</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side={sidebarCollapsed ? "right" : "top"}>
              {sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      </aside>
    </>
  );
}

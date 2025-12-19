import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardView } from "@/components/views/DashboardView";
import { TodosView } from "@/components/views/TodosView";
import { GoalsView } from "@/components/views/GoalsView";
import { HabitsView } from "@/components/views/HabitsView";
import { AssistantView } from "@/components/views/AssistantView";

const Index = () => {
  const { currentView, sidebarCollapsed } = useAppStore();

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardView />;
      case "todos":
        return <TodosView />;
      case "goals":
        return <GoalsView />;
      case "habits":
        return <HabitsView />;
      case "assistant":
        return <AssistantView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen">
      <Sidebar />
      
      <main
        className={cn(
          "transition-all duration-300 p-6 lg:p-8",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <div className="max-w-7xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default Index;

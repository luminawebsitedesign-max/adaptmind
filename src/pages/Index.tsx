import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { DashboardView } from "@/components/views/DashboardView";
import { TodosView } from "@/components/views/TodosView";
import { GoalsView } from "@/components/views/GoalsView";
import { HabitsView } from "@/components/views/HabitsView";
import { AssistantView } from "@/components/views/AssistantView";
import { ExportDataView } from "@/components/views/ExportDataView";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { currentView, sidebarCollapsed } = useAppStore();
  const { profile } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(
    () => profile?.onboarding_completed === false
  );

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
      case "settings":
        return <ExportDataView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen pb-8">
      <Sidebar />
      
      <main
        className={cn(
          "transition-all duration-200 p-6 lg:p-8",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <div className="max-w-7xl mx-auto">
          {renderView()}
        </div>
      </main>

      <Footer />

      {showOnboarding && (
        <OnboardingTour onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  );
};

export default Index;

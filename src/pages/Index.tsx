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
import { CalendarView } from "@/components/views/CalendarView";
import { ProfileView } from "@/components/views/ProfileView";
import { ExportDataView } from "@/components/views/ExportDataView";
import { FinanceView } from "@/components/views/FinanceView";

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
      case "finance":
        return <FinanceView />;
      case "assistant":
        return <AssistantView />;
      case "calendar":
        return <CalendarView />;
      case "profile":
        return <ProfileView />;
      case "settings":
        return <ExportDataView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Sidebar />
      
      <main
        className={cn(
          "flex-1 transition-all duration-200 p-4 pt-16 md:pt-4 md:p-6 lg:p-8 pb-20",
          sidebarCollapsed ? "md:ml-16" : "md:ml-64"
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

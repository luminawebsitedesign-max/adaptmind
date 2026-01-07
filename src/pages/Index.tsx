import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingFlow, StandaloneTutorial } from "@/components/onboarding/OnboardingFlow";
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
  const { currentView, sidebarCollapsed, showManualTutorial, setShowManualTutorial } = useAppStore();
  const { profile } = useAuth();
  
  // Determine if we need to show onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  useEffect(() => {
    if (profile) {
      // Welcome form: show only if never completed
      // Tutorial: show on every sign-in unless disabled
      const needsWelcomeForm = !profile.welcome_form_completed;
      const needsTutorial = !profile.disable_auto_tutorial && !profile.welcome_tutorial_completed;
      
      setShowOnboarding(needsWelcomeForm || needsTutorial);
    }
  }, [profile]);

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

      {/* First-time onboarding flow */}
      {showOnboarding && (
        <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
      )}

      {/* Manual tutorial re-run from settings */}
      {showManualTutorial && (
        <StandaloneTutorial onComplete={() => setShowManualTutorial(false)} />
      )}
    </div>
  );
};

export default Index;

import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { ProgressRing } from "@/components/ui/progress-ring";
import { CheckSquare, Target, Repeat, TrendingUp, Sparkles, Calendar, Zap, ArrowRight, ChevronLeft, ChevronRight, Lightbulb, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from "date-fns";
import { useState, useMemo, useEffect } from "react";

const ONBOARDING_DISMISSED_KEY = 'adaptmind_onboarding_dismissed';

export function DashboardView() {
  const { todoLists, goals, habits, setCurrentView } = useAppStore();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem(ONBOARDING_DISMISSED_KEY) !== 'true';
  });

  const handleDismissOnboarding = () => {
    localStorage.setItem(ONBOARDING_DISMISSED_KEY, 'true');
    setShowOnboarding(false);
  };

  const totalTasks = todoLists.reduce((acc, list) => acc + list.items.length, 0);
  const completedTasks = todoLists.reduce(
    (acc, list) => acc + list.items.filter((item) => item.completed).length,
    0
  );
  const taskCompletion = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const avgGoalProgress =
    goals.length > 0
      ? goals.reduce((acc, goal) => acc + goal.progress, 0) / goals.length
      : 0;

  const todayStr = new Date().toISOString().split("T")[0];
  const habitsCompletedToday = habits.filter((h) =>
    h.completedDates.includes(todayStr)
  ).length;
  const habitCompletion = habits.length > 0 ? (habitsCompletedToday / habits.length) * 100 : 0;

  const totalStreak = habits.reduce((acc, h) => acc + h.streak, 0);
  const bestStreak = Math.max(...habits.map((h) => h.bestStreak), 0);

  const upcomingTasks = todoLists
    .flatMap((list) => list.items.filter((item) => !item.completed && item.deadline))
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 3);

  const hasData = totalTasks > 0 || goals.length > 0 || habits.length > 0;

  // Mini calendar week data
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(weekStart, i);
      const dateStr = format(day, "yyyy-MM-dd");
      const tasksOnDay = todoLists.flatMap(l => l.items).filter(t => t.deadline && format(new Date(t.deadline), "yyyy-MM-dd") === dateStr);
      const habitsOnDay = habits.filter(h => h.completedDates.includes(dateStr));
      const goalsOnDay = goals.filter(g => g.deadline && format(new Date(g.deadline), "yyyy-MM-dd") === dateStr);
      return { day, dateStr, tasksOnDay, habitsOnDay, goalsOnDay, isToday: isSameDay(day, new Date()) };
    });
  }, [weekStart, todoLists, habits, goals]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Onboarding Panel */}
      {showOnboarding && (
        <div className="glass rounded-2xl p-6 border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
              <Lightbulb className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-xl md:text-2xl font-display font-bold text-gradient-brand">
                    Welcome to AdaptMind
                  </h2>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={handleDismissOnboarding}
                    aria-label="Dismiss onboarding"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-muted-foreground mt-2 text-sm md:text-base">
                  AdaptMind is your intelligent productivity companion. It helps you manage tasks, 
                  build lasting habits, and achieve your goals — all in one place. The AI assistant 
                  is here to help you stay focused and make progress every day.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground/80">Getting Started</h3>
                <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside pl-1">
                  <li>Create your first task in the Tasks section</li>
                  <li>Add a habit to build daily routines</li>
                  <li>Explore the calendar to see your schedule</li>
                </ul>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDismissOnboarding}
                className="mt-2"
              >
                Got it, let's go!
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-gradient-brand">
            Your Dashboard
          </h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            {hasData 
              ? "Here's your productivity overview for today"
              : "Start tracking your tasks, goals, and habits to see your progress here"
            }
          </p>
        </div>
        <button 
          onClick={() => setCurrentView("calendar")}
          className="text-left sm:text-right hover:bg-primary/10 p-2 rounded-lg transition-colors group border border-transparent hover:border-primary/20"
        >
          <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">View Calendar →</p>
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tasks Overview */}
        <div
          onClick={() => setCurrentView("todos")}
          className="glass rounded-2xl p-6 hover-glow cursor-pointer transition-all duration-300 hover:scale-[1.02] group hover:border-primary/30 min-h-[220px] flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Tasks</h3>
                <p className="text-sm text-muted-foreground">
                  {totalTasks > 0 ? `${completedTasks} of ${totalTasks} completed` : 'Track your to-dos'}
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            {totalTasks > 0 ? (
              <ProgressRing progress={taskCompletion} size={100} color="cyan" />
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckSquare className="w-8 h-8 text-primary/50" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">Create task lists to organize your work</p>
                <Button variant="outline" size="sm" className="gap-2 hover:bg-primary/10 hover:border-primary/30" onClick={(e) => { e.stopPropagation(); setCurrentView("todos"); }}>
                  <Zap className="w-4 h-4" />
                  Add your first task
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Goals Overview */}
        <div
          onClick={() => setCurrentView("goals")}
          className="glass rounded-2xl p-6 hover-glow cursor-pointer transition-all duration-300 hover:scale-[1.02] group hover:border-secondary/30 min-h-[220px] flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Goals</h3>
                <p className="text-sm text-muted-foreground">
                  {goals.length > 0 ? `${goals.length} active goal${goals.length !== 1 ? 's' : ''}` : 'Track milestones'}
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            {goals.length > 0 ? (
              <ProgressRing progress={avgGoalProgress} size={100} color="magenta" />
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Target className="w-8 h-8 text-secondary/50" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">Set goals and track your progress over time</p>
                <Button variant="outline" size="sm" className="gap-2 hover:bg-secondary/10 hover:border-secondary/30" onClick={(e) => { e.stopPropagation(); setCurrentView("goals"); }}>
                  <Zap className="w-4 h-4" />
                  Set your first goal
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Habits Overview */}
        <div
          onClick={() => setCurrentView("habits")}
          className="glass rounded-2xl p-6 hover-glow cursor-pointer transition-all duration-300 hover:scale-[1.02] group hover:border-accent/30 min-h-[220px] flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Repeat className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Habits</h3>
                <p className="text-sm text-muted-foreground">
                  {habits.length > 0 ? `${habitsCompletedToday} of ${habits.length} today` : 'Build routines'}
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            {habits.length > 0 ? (
              <ProgressRing progress={habitCompletion} size={100} color="purple" />
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-accent/10 flex items-center justify-center">
                  <Repeat className="w-8 h-8 text-accent/50" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">Build daily habits and track your streaks</p>
                <Button variant="outline" size="sm" className="gap-2 hover:bg-accent/10 hover:border-accent/30" onClick={(e) => { e.stopPropagation(); setCurrentView("habits"); }}>
                  <Zap className="w-4 h-4" />
                  Start a habit
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Stats - Only show if there's data */}
      {hasData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="glass rounded-xl p-3 md:p-4 hover:bg-muted/5 transition-colors">
            <div className="flex items-center gap-2 text-primary mb-2">
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span className="text-xs md:text-sm font-medium truncate">Total Streak</span>
            </div>
            <p className="text-xl md:text-2xl font-display font-bold">{totalStreak} days</p>
          </div>

          <div className="glass rounded-xl p-3 md:p-4 hover:bg-muted/5 transition-colors">
            <div className="flex items-center gap-2 text-secondary mb-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="text-xs md:text-sm font-medium truncate">Best Streak</span>
            </div>
            <p className="text-xl md:text-2xl font-display font-bold">{bestStreak} days</p>
          </div>

          <div className="glass rounded-xl p-3 md:p-4 hover:bg-muted/5 transition-colors">
            <div className="flex items-center gap-2 text-accent mb-2">
              <Target className="w-4 h-4 shrink-0" />
              <span className="text-xs md:text-sm font-medium truncate">Avg. Goal Progress</span>
            </div>
            <p className="text-xl md:text-2xl font-display font-bold">{Math.round(avgGoalProgress)} %</p>
          </div>

          <div className="glass rounded-xl p-3 md:p-4 hover:bg-muted/5 transition-colors">
            <div className="flex items-center gap-2 text-primary mb-2">
              <CheckSquare className="w-4 h-4 shrink-0" />
              <span className="text-xs md:text-sm font-medium truncate">Completion Rate</span>
            </div>
            <p className="text-xl md:text-2xl font-display font-bold">{Math.round(taskCompletion)} %</p>
          </div>
        </div>
      )}

      {/* Mini Calendar Week Widget */}
      <div className="glass rounded-2xl p-4 md:p-6 hover-glow transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary shrink-0" />
            <h3 className="font-semibold text-base md:text-lg">
              {isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 })) 
                ? "This Week" 
                : format(weekStart, "MMM d") + " - " + format(addDays(weekStart, 6), "MMM d")}
            </h3>
            {isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 })) && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary font-medium">Current</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekStart(subWeeks(weekStart, 1))} aria-label="Previous week">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs md:text-sm text-muted-foreground min-w-[100px] md:min-w-[140px] text-center">
              {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d")}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekStart(addWeeks(weekStart, 1))} aria-label="Next week">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {weekDays.map(({ day, tasksOnDay, habitsOnDay, goalsOnDay, isToday }) => (
            <button
              key={day.toISOString()}
              onClick={() => setCurrentView("calendar")}
              className={cn(
                "flex flex-col items-center p-1 md:p-2 rounded-lg transition-all hover:bg-muted/20",
                isToday && "bg-primary/20 ring-1 ring-primary"
              )}
              aria-label={`View ${format(day, "EEEE, MMMM d")}`}
            >
              <span className="text-[10px] md:text-xs text-muted-foreground">{format(day, "EEE")}</span>
              <span className={cn("text-sm md:text-lg font-semibold", isToday && "text-primary")}>{format(day, "d")}</span>
              <div className="flex gap-0.5 mt-1">
                {tasksOnDay.length > 0 && <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-primary" />}
                {habitsOnDay.length > 0 && <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-accent" />}
                {goalsOnDay.length > 0 && <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-secondary" />}
              </div>
            </button>
          ))}
        </div>
        <Button 
          variant="ghost" 
          className="w-full mt-4 text-muted-foreground hover:text-primary text-sm" 
          onClick={() => setCurrentView("calendar")}
        >
          Open Full Calendar
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <div className="glass rounded-2xl p-6 hover-glow transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">Upcoming Deadlines</h3>
          </div>
          <div className="space-y-3">
            {upcomingTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => setCurrentView("todos")}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      task.priority === "high"
                        ? "bg-destructive"
                        : task.priority === "medium"
                        ? "bg-secondary"
                        : "bg-primary"
                    )}
                  />
                  <span>{task.title}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {task.deadline &&
                    new Date(task.deadline).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestion Card */}
      <div
        onClick={() => setCurrentView("assistant")}
        className="glass rounded-2xl p-6 cursor-pointer hover-glow transition-all duration-300 border border-primary/30 group"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-cyan group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">AI Assistant</h3>
              <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">Ready</span>
            </div>
            <p className="text-muted-foreground">
              {hasData 
                ? `Get personalized insights based on your ${totalTasks} tasks, ${goals.length} goals, and ${habits.length} habits. Click to chat with your AI assistant.`
                : "Get started by adding some tasks, goals, or habits. Your AI assistant can help you plan and stay productive."
              }
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-2" />
        </div>
      </div>
    </div>
  );
}
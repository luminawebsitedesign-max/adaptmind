import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { ProgressRing } from "@/components/ui/progress-ring";
import { CheckSquare, Target, Repeat, TrendingUp, Sparkles, Calendar, Zap, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from "date-fns";
import { useState, useMemo } from "react";

export function DashboardView() {
  const { todoLists, goals, habits, setCurrentView } = useAppStore();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gradient-cyan">
            Welcome Back
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's your productivity overview for today
          </p>
        </div>
        <button 
          onClick={() => setCurrentView("calendar")}
          className="text-right hover:bg-muted/20 p-2 rounded-lg transition-colors group"
        >
          <p className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
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
          className="glass rounded-2xl p-6 hover-glow cursor-pointer transition-all duration-300 hover:scale-[1.02] group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Tasks</h3>
                <p className="text-sm text-muted-foreground">
                  {totalTasks > 0 ? `${completedTasks} of ${totalTasks} completed` : 'No tasks yet'}
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {totalTasks > 0 ? (
            <ProgressRing progress={taskCompletion} size={100} color="cyan" />
          ) : (
            <div className="h-[100px] flex items-center justify-center">
              <Button variant="outline" size="sm" className="gap-2" onClick={(e) => { e.stopPropagation(); setCurrentView("todos"); }}>
                <Zap className="w-4 h-4" />
                Add your first task
              </Button>
            </div>
          )}
        </div>

        {/* Goals Overview */}
        <div
          onClick={() => setCurrentView("goals")}
          className="glass rounded-2xl p-6 hover-glow cursor-pointer transition-all duration-300 hover:scale-[1.02] group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Goals</h3>
                <p className="text-sm text-muted-foreground">
                  {goals.length > 0 ? `${goals.length} active goal${goals.length !== 1 ? 's' : ''}` : 'No goals yet'}
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {goals.length > 0 ? (
            <ProgressRing progress={avgGoalProgress} size={100} color="magenta" />
          ) : (
            <div className="h-[100px] flex items-center justify-center">
              <Button variant="outline" size="sm" className="gap-2" onClick={(e) => { e.stopPropagation(); setCurrentView("goals"); }}>
                <Zap className="w-4 h-4" />
                Set your first goal
              </Button>
            </div>
          )}
        </div>

        {/* Habits Overview */}
        <div
          onClick={() => setCurrentView("habits")}
          className="glass rounded-2xl p-6 hover-glow cursor-pointer transition-all duration-300 hover:scale-[1.02] group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Repeat className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Habits</h3>
                <p className="text-sm text-muted-foreground">
                  {habits.length > 0 ? `${habitsCompletedToday} of ${habits.length} today` : 'No habits yet'}
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {habits.length > 0 ? (
            <ProgressRing progress={habitCompletion} size={100} color="purple" />
          ) : (
            <div className="h-[100px] flex items-center justify-center">
              <Button variant="outline" size="sm" className="gap-2" onClick={(e) => { e.stopPropagation(); setCurrentView("habits"); }}>
                <Zap className="w-4 h-4" />
                Start a habit
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Stats - Only show if there's data */}
      {hasData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass rounded-xl p-4 hover:bg-muted/5 transition-colors">
            <div className="flex items-center gap-2 text-primary mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Total Streak</span>
            </div>
            <p className="text-2xl font-display font-bold">{totalStreak} days</p>
          </div>

          <div className="glass rounded-xl p-4 hover:bg-muted/5 transition-colors">
            <div className="flex items-center gap-2 text-secondary mb-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Best Streak</span>
            </div>
            <p className="text-2xl font-display font-bold">{bestStreak} days</p>
          </div>

          <div className="glass rounded-xl p-4 hover:bg-muted/5 transition-colors">
            <div className="flex items-center gap-2 text-accent mb-2">
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium">Avg. Goal Progress</span>
            </div>
            <p className="text-2xl font-display font-bold">{Math.round(avgGoalProgress)}%</p>
          </div>

          <div className="glass rounded-xl p-4 hover:bg-muted/5 transition-colors">
            <div className="flex items-center gap-2 text-primary mb-2">
              <CheckSquare className="w-4 h-4" />
              <span className="text-sm font-medium">Completion Rate</span>
            </div>
            <p className="text-2xl font-display font-bold">{Math.round(taskCompletion)}%</p>
          </div>
        </div>
      )}

      {/* Mini Calendar Week Widget */}
      <div className="glass rounded-2xl p-6 hover-glow transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">This Week</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[140px] text-center">
              {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d")}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(({ day, tasksOnDay, habitsOnDay, goalsOnDay, isToday }) => (
            <button
              key={day.toISOString()}
              onClick={() => setCurrentView("calendar")}
              className={cn(
                "flex flex-col items-center p-2 rounded-lg transition-all hover:bg-muted/20",
                isToday && "bg-primary/20 ring-1 ring-primary"
              )}
            >
              <span className="text-xs text-muted-foreground">{format(day, "EEE")}</span>
              <span className={cn("text-lg font-semibold", isToday && "text-primary")}>{format(day, "d")}</span>
              <div className="flex gap-0.5 mt-1">
                {tasksOnDay.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                {habitsOnDay.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
                {goalsOnDay.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-secondary" />}
              </div>
            </button>
          ))}
        </div>
        <Button 
          variant="ghost" 
          className="w-full mt-4 text-muted-foreground hover:text-primary" 
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
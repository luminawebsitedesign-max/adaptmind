import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { ProgressRing } from "@/components/ui/progress-ring";
import { CheckSquare, Target, Repeat, TrendingUp, Sparkles, Calendar } from "lucide-react";

export function DashboardView() {
  const { todoLists, goals, habits, setCurrentView } = useAppStore();

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

  const upcomingTasks = todoLists
    .flatMap((list) => list.items.filter((item) => !item.completed && item.deadline))
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 3);

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
        <div className="text-right">
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tasks Overview */}
        <div
          onClick={() => setCurrentView("todos")}
          className="glass rounded-2xl p-6 hover-glow cursor-pointer transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Tasks</h3>
                <p className="text-sm text-muted-foreground">
                  {completedTasks} of {totalTasks} completed
                </p>
              </div>
            </div>
          </div>
          <ProgressRing progress={taskCompletion} size={100} color="cyan" />
        </div>

        {/* Goals Overview */}
        <div
          onClick={() => setCurrentView("goals")}
          className="glass rounded-2xl p-6 hover-glow cursor-pointer transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Goals</h3>
                <p className="text-sm text-muted-foreground">
                  {goals.length} active goals
                </p>
              </div>
            </div>
          </div>
          <ProgressRing progress={avgGoalProgress} size={100} color="magenta" />
        </div>

        {/* Habits Overview */}
        <div
          onClick={() => setCurrentView("habits")}
          className="glass rounded-2xl p-6 hover-glow cursor-pointer transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Repeat className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Habits</h3>
                <p className="text-sm text-muted-foreground">
                  {habitsCompletedToday} of {habits.length} today
                </p>
              </div>
            </div>
          </div>
          <ProgressRing progress={habitCompletion} size={100} color="purple" />
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-primary mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Total Streak</span>
          </div>
          <p className="text-2xl font-display font-bold">{totalStreak} days</p>
        </div>

        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-secondary mb-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Active Habits</span>
          </div>
          <p className="text-2xl font-display font-bold">{habits.length}</p>
        </div>

        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-accent mb-2">
            <Target className="w-4 h-4" />
            <span className="text-sm font-medium">Goals Progress</span>
          </div>
          <p className="text-2xl font-display font-bold">{Math.round(avgGoalProgress)}%</p>
        </div>

        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-primary mb-2">
            <CheckSquare className="w-4 h-4" />
            <span className="text-sm font-medium">Todo Lists</span>
          </div>
          <p className="text-2xl font-display font-bold">{todoLists.length}</p>
        </div>
      </div>

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">Upcoming Deadlines</h3>
          </div>
          <div className="space-y-3">
            {upcomingTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/20"
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
        className="glass rounded-2xl p-6 cursor-pointer hover-glow transition-all duration-300 border border-primary/30"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-cyan animate-pulse-slow">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">AI Suggestion</h3>
            <p className="text-muted-foreground">
              Based on your current progress, consider focusing on your "
              {goals[0]?.title || "goals"}" to maintain momentum. Click to chat
              with your AI assistant.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

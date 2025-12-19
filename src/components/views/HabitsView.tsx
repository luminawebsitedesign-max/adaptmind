import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Flame, TrendingUp, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Habit } from "@/types";

export function HabitsView() {
  const { habits, addHabit, deleteHabit, toggleHabitCompletion } = useAppStore();
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: "",
    icon: "✨",
    frequency: "daily" as Habit["frequency"],
  });

  const handleAddHabit = () => {
    if (newHabit.name.trim()) {
      addHabit({
        name: newHabit.name,
        icon: newHabit.icon,
        frequency: newHabit.frequency,
      });
      setNewHabit({ name: "", icon: "✨", frequency: "daily" });
      setIsAddingHabit(false);
    }
  };

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Get last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toISOString().split("T")[0],
      dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: date.getDate(),
      isToday: date.toISOString().split("T")[0] === todayStr,
    };
  });

  const totalStreak = habits.reduce((acc, h) => acc + h.streak, 0);
  const avgCompletion =
    habits.length > 0
      ? (habits.filter((h) => h.completedDates.includes(todayStr)).length /
          habits.length) *
        100
      : 0;
  const bestStreak = Math.max(...habits.map((h) => h.bestStreak), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gradient-cyan">
            Habit Tracker
          </h1>
          <p className="text-muted-foreground mt-1">
            Build consistency, one day at a time
          </p>
        </div>

        <Dialog open={isAddingHabit} onOpenChange={setIsAddingHabit}>
          <DialogTrigger asChild>
            <Button className="gap-2 glow-purple bg-accent hover:bg-accent/90">
              <Plus className="w-4 h-4" />
              New Habit
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong">
            <DialogHeader>
              <DialogTitle>Create New Habit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Icon"
                  value={newHabit.icon}
                  onChange={(e) =>
                    setNewHabit((prev) => ({ ...prev, icon: e.target.value }))
                  }
                  className="w-20 text-center text-xl"
                />
                <Input
                  placeholder="Habit name"
                  value={newHabit.name}
                  onChange={(e) =>
                    setNewHabit((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="flex-1"
                />
              </div>
              <Select
                value={newHabit.frequency}
                onValueChange={(v) =>
                  setNewHabit((prev) => ({
                    ...prev,
                    frequency: v as Habit["frequency"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddHabit} className="w-full">
                Create Habit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Flame className="w-5 h-5" />
            <span className="text-sm font-medium">Total Streak</span>
          </div>
          <p className="text-3xl font-display font-bold">{totalStreak}</p>
          <p className="text-xs text-muted-foreground">days combined</p>
        </div>

        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-secondary mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">Today's Progress</span>
          </div>
          <p className="text-3xl font-display font-bold">{Math.round(avgCompletion)}%</p>
          <p className="text-xs text-muted-foreground">habits completed</p>
        </div>

        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-accent mb-2">
            <Flame className="w-5 h-5" />
            <span className="text-sm font-medium">Best Streak</span>
          </div>
          <p className="text-3xl font-display font-bold">{bestStreak}</p>
          <p className="text-xs text-muted-foreground">days record</p>
        </div>
      </div>

      {/* Habits Grid */}
      <div className="glass rounded-2xl overflow-hidden">
        {/* Header Row */}
        <div className="flex items-center border-b border-border/30">
          <div className="w-64 p-4 font-medium">Habit</div>
          <div className="flex-1 flex">
            {last7Days.map((day) => (
              <div
                key={day.date}
                className={cn(
                  "flex-1 p-3 text-center border-l border-border/30",
                  day.isToday && "bg-primary/10"
                )}
              >
                <p className="text-xs text-muted-foreground">{day.dayName}</p>
                <p className={cn("font-medium", day.isToday && "text-primary")}>
                  {day.dayNum}
                </p>
              </div>
            ))}
          </div>
          <div className="w-24 p-4 text-center font-medium border-l border-border/30">
            Streak
          </div>
          <div className="w-16" />
        </div>

        {/* Habit Rows */}
        {habits.map((habit) => (
          <div
            key={habit.id}
            className="flex items-center border-b border-border/20 hover:bg-muted/5 transition-colors"
          >
            <div className="w-64 p-4 flex items-center gap-3">
              <span className="text-2xl">{habit.icon}</span>
              <div>
                <p className="font-medium">{habit.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {habit.frequency}
                </p>
              </div>
            </div>

            <div className="flex-1 flex">
              {last7Days.map((day) => {
                const isCompleted = habit.completedDates.includes(day.date);
                return (
                  <div
                    key={day.date}
                    className={cn(
                      "flex-1 p-3 flex items-center justify-center border-l border-border/30",
                      day.isToday && "bg-primary/5"
                    )}
                  >
                    <button
                      onClick={() => toggleHabitCompletion(habit.id, day.date)}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200",
                        isCompleted
                          ? "bg-primary text-primary-foreground glow-cyan"
                          : "bg-muted/20 hover:bg-muted/40"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="w-24 p-4 text-center border-l border-border/30">
              <div className="flex items-center justify-center gap-1">
                <Flame
                  className={cn(
                    "w-4 h-4",
                    habit.streak > 0 ? "text-orange-500" : "text-muted-foreground"
                  )}
                />
                <span className="font-display font-bold">{habit.streak}</span>
              </div>
            </div>

            <div className="w-16 p-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteHabit(habit.id)}
                className="text-destructive hover:text-destructive h-8 w-8"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        {habits.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              No habits yet. Start building your routine!
            </p>
            <Button onClick={() => setIsAddingHabit(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Habit
            </Button>
          </div>
        )}
      </div>

      {/* Habit Analytics */}
      {habits.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold text-lg mb-4">Analytics Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {habits.slice(0, 3).map((habit) => {
              const successRate =
                habit.completedDates.length > 0
                  ? Math.round(
                      (habit.completedDates.length / 30) * 100
                    )
                  : 0;
              return (
                <div key={habit.id} className="p-4 rounded-xl bg-muted/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{habit.icon}</span>
                    <span className="font-medium">{habit.name}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Streak</span>
                      <span className="font-medium">{habit.streak} days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Best Streak</span>
                      <span className="font-medium">{habit.bestStreak} days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Success Rate (30d)
                      </span>
                      <span className="font-medium">{successRate}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

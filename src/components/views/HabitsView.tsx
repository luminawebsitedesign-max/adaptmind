import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconPicker } from "@/components/ui/icon-picker";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EditHabitDialog } from "@/components/ui/edit-habit-dialog";
import { Plus, Trash2, Flame, TrendingUp, Check, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Habit } from "@/types";
import { toast } from "sonner";

export function HabitsView() {
  const { habits, addHabit, updateHabit, deleteHabit, toggleHabitCompletion } = useAppStore();
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: "",
    icon: "✨",
    frequency: "daily" as Habit["frequency"],
    customIntervalDays: 2,
    customIntervalInput: "2",
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; habitId: string; habitName: string }>({
    open: false,
    habitId: "",
    habitName: "",
  });
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const handleAddHabit = () => {
    if (newHabit.name.trim()) {
      // Validate custom interval if frequency is custom
      if (newHabit.frequency === "custom") {
        const parsed = parseInt(newHabit.customIntervalInput, 10);
        if (!parsed || parsed < 1) {
          toast.error("Enter a valid interval of 1 day or more");
          return;
        }
      }
      addHabit({
        name: newHabit.name,
        icon: newHabit.icon,
        frequency: newHabit.frequency,
        customIntervalDays: newHabit.frequency === "custom" ? newHabit.customIntervalDays : undefined,
      });
      setNewHabit({ name: "", icon: "✨", frequency: "daily", customIntervalDays: 2, customIntervalInput: "2" });
      setIsAddingHabit(false);
      toast.success("Habit created successfully");
    }
  };

  const handleDeleteHabit = () => {
    deleteHabit(deleteConfirm.habitId);
    setDeleteConfirm({ open: false, habitId: "", habitName: "" });
    toast.success("Habit deleted");
  };

  const handleToggleCompletion = (habitId: string, date: string, habitName: string) => {
    const habit = habits.find(h => h.id === habitId);
    const isCompleting = !habit?.completedDates.includes(date);
    toggleHabitCompletion(habitId, date);
    if (isCompleting) {
      toast.success(`${habitName} completed for today!`);
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

  // Beta badge component
  const BetaBadge = () => (
    <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-secondary/20 text-secondary border border-secondary/30">
      Beta
    </span>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-display font-bold text-gradient-brand">
              Habit Tracker
            </h1>
            <BetaBadge />
          </div>
          <p className="text-muted-foreground mt-1">
            Build consistency, one day at a time
          </p>
        </div>

        <Dialog open={isAddingHabit} onOpenChange={setIsAddingHabit}>
          <DialogTrigger asChild>
            <Button className="gap-2 glow-primary bg-accent hover:bg-accent/90">
              <Plus className="w-4 h-4" />
              New Habit
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong">
            <DialogHeader>
              <DialogTitle>Create New Habit</DialogTitle>
              <DialogDescription>
                Start building a new habit. Pick an emoji and set how often you want to do it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="flex gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Icon</label>
                  <IconPicker value={newHabit.icon} onChange={(icon) => setNewHabit((prev) => ({ ...prev, icon }))} />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground">Habit Name *</label>
                  <Input
                    placeholder="e.g., Morning exercise, Read 30 minutes"
                    value={newHabit.name}
                    onChange={(e) =>
                      setNewHabit((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Frequency</label>
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
              </div>
              {/* Custom frequency input - only show when custom is selected */}
              {newHabit.frequency === "custom" && (
                <div className="space-y-1 p-3 rounded-lg bg-muted/20 border border-border/50">
                  <label className="text-xs text-muted-foreground">Repeat every N days</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Every</span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      className="w-20 text-center"
                      placeholder="2"
                      value={newHabit.customIntervalInput}
                      onChange={(e) => {
                        const next = e.target.value;
                        if (next === "" || /^\d+$/.test(next)) {
                          setNewHabit((prev) => ({ ...prev, customIntervalInput: next }));
                        }
                      }}
                      onBlur={() => {
                        const parsed = parseInt(newHabit.customIntervalInput, 10);
                        if (!parsed || parsed < 1) {
                          setNewHabit((prev) => ({ ...prev, customIntervalInput: "1", customIntervalDays: 1 }));
                          return;
                        }
                        setNewHabit((prev) => ({ ...prev, customIntervalInput: String(parsed), customIntervalDays: parsed }));
                      }}
                    />
                    <span className="text-sm">days</span>
                  </div>
                </div>
              )}
              <Button 
                onClick={handleAddHabit} 
                className={cn(
                  "w-full transition-all",
                  !newHabit.name.trim() && "opacity-50 cursor-not-allowed"
                )}
                disabled={!newHabit.name.trim()}
              >
                {newHabit.name.trim() ? "Create Habit" : "Enter a name to continue"}
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
        <div className="animate-stagger">
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
                  {habit.frequency === "custom" && habit.customIntervalDays
                    ? `Every ${habit.customIntervalDays} days`
                    : habit.frequency}
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
                      onClick={() => handleToggleCompletion(habit.id, day.date, habit.name)}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200",
                        isCompleted
                          ? "bg-primary text-primary-foreground glow-primary"
                          : "bg-muted/20 hover:bg-muted/40"
                      )}
                      aria-label={`Mark ${habit.name} as ${isCompleted ? "incomplete" : "complete"} for ${day.dayName}`}
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

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-24 p-4 text-center border-l border-border/30 cursor-help">
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
                </TooltipTrigger>
                <TooltipContent>
                  Current streak: {habit.streak} days | Best: {habit.bestStreak} days
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="w-16 p-4 flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingHabit(habit)}
                      className="text-muted-foreground hover:text-foreground h-8 w-8"
                      aria-label="Edit habit"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit habit</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirm({ open: true, habitId: habit.id, habitName: habit.name })}
                      className="text-destructive hover:text-destructive h-8 w-8"
                      aria-label="Delete habit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete habit</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ))}
        </div>
        {habits.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-accent" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No habits yet</h3>
            <p className="text-muted-foreground mb-2">
              Start building your daily routine
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Habits help you stay consistent. Track things like exercise, reading, or meditation.
            </p>
            <Button onClick={() => setIsAddingHabit(true)} className="gap-2 glow-primary bg-accent hover:bg-accent/90">
              <Plus className="w-4 h-4" />
              Add Your First Habit
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
                  ? Math.min(100, Math.round((habit.completedDates.length / 30) * 100))
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

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
        title="Delete Habit?"
        description={`Are you sure you want to delete "${deleteConfirm.habitName}"? Your streak and history will be lost. This action cannot be undone.`}
        confirmLabel="Delete Habit"
        onConfirm={handleDeleteHabit}
      />

      {/* Edit Habit Dialog */}
      <EditHabitDialog
        habit={editingHabit}
        open={!!editingHabit}
        onOpenChange={(open) => !open && setEditingHabit(null)}
        onSave={(updates) => {
          if (editingHabit) {
            updateHabit(editingHabit.id, updates);
            toast.success("Habit updated");
          }
        }}
      />
    </div>
  );
}

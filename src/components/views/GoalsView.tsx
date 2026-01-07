import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EditGoalDialog } from "@/components/ui/edit-goal-dialog";
import { Plus, Trash2, Target, ChevronDown, Pencil } from "lucide-react";
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
import { Goal } from "@/types";
import { toast } from "sonner";

export function GoalsView() {
  const { goals, addGoal, updateGoal, deleteGoal, toggleMilestone } = useAppStore();
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    category: "short" as Goal["category"],
    milestones: [""],
    customDuration: 30, // Default 30 days for custom
    startDate: new Date().toISOString().split('T')[0], // Today as default start
  });
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; goalId: string; goalTitle: string }>({
    open: false,
    goalId: "",
    goalTitle: "",
  });
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const handleAddGoal = () => {
    if (newGoal.title.trim()) {
      // Calculate deadline based on category
      let deadline: Date | undefined;
      let startDate: Date | undefined;
      
      if (newGoal.category === 'short') {
        // 1 week from now
        deadline = new Date();
        deadline.setDate(deadline.getDate() + 7);
      } else if (newGoal.category === 'medium') {
        // 1 month from now
        deadline = new Date();
        deadline.setMonth(deadline.getMonth() + 1);
      } else if (newGoal.category === 'custom') {
        // Custom duration from specified start date
        startDate = new Date(newGoal.startDate);
        deadline = new Date(startDate);
        deadline.setDate(deadline.getDate() + newGoal.customDuration);
      }
      
      addGoal({
        title: newGoal.title,
        description: newGoal.description,
        category: newGoal.category,
        progress: 0,
        deadline,
        startDate,
        customDuration: newGoal.category === 'custom' ? newGoal.customDuration : undefined,
        milestones: newGoal.milestones
          .filter((m) => m.trim())
          .map((title, i) => ({
            id: String(i),
            title,
            completed: false,
          })),
      });
      setNewGoal({
        title: "",
        description: "",
        category: "short",
        milestones: [""],
        customDuration: 30,
        startDate: new Date().toISOString().split('T')[0],
      });
      setIsAddingGoal(false);
      toast.success("Goal created successfully");
    }
  };

  const handleDeleteGoal = () => {
    deleteGoal(deleteConfirm.goalId);
    setDeleteConfirm({ open: false, goalId: "", goalTitle: "" });
    toast.success("Goal deleted");
  };

  const addMilestoneField = () => {
    setNewGoal((prev) => ({
      ...prev,
      milestones: [...prev.milestones, ""],
    }));
  };

  const updateMilestoneField = (index: number, value: string) => {
    setNewGoal((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m, i) => (i === index ? value : m)),
    }));
  };

  const shortTermGoals = goals.filter((g) => g.category === "short");
  const mediumTermGoals = goals.filter((g) => g.category === "medium");
  const customGoals = goals.filter((g) => g.category === "custom");

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
              Goals
            </h1>
            <BetaBadge />
          </div>
          <p className="text-muted-foreground mt-1">
            Track your progress toward meaningful objectives
          </p>
        </div>

        <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
          <DialogTrigger asChild>
            <Button className="gap-2 glow-primary bg-secondary hover:bg-secondary/90">
              <Plus className="w-4 h-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>
                Define your goal and break it down into milestones for better tracking.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Goal Title *</label>
                <Input
                  placeholder="e.g., Learn a new programming language"
                  value={newGoal.title}
                  onChange={(e) =>
                    setNewGoal((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Description (optional)</label>
                <Textarea
                  placeholder="Add more context about your goal..."
                  value={newGoal.description}
                  onChange={(e) =>
                    setNewGoal((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Timeframe</label>
                <Select
                  value={newGoal.category}
                  onValueChange={(v) =>
                    setNewGoal((prev) => ({
                      ...prev,
                      category: v as Goal["category"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short-Term (This Week)</SelectItem>
                    <SelectItem value="medium">Medium-Term (This Month)</SelectItem>
                    <SelectItem value="custom">Custom Timeline</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom timeline inputs - only show when custom is selected */}
              {newGoal.category === "custom" && (
                <div className="space-y-3 p-3 rounded-lg bg-muted/20 border border-border/50">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Start Date</label>
                      <Input
                        type="date"
                        value={newGoal.startDate}
                        onChange={(e) =>
                          setNewGoal((prev) => ({ ...prev, startDate: e.target.value }))
                        }
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Duration (days)</label>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        value={newGoal.customDuration}
                        onChange={(e) =>
                          setNewGoal((prev) => ({ ...prev, customDuration: Math.max(1, parseInt(e.target.value) || 1) }))
                        }
                        placeholder="30"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Goal ends: {new Date(new Date(newGoal.startDate).getTime() + newGoal.customDuration * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  Milestones (optional) - Break your goal into smaller steps
                </label>
                {newGoal.milestones.map((milestone, i) => (
                  <Input
                    key={i}
                    placeholder={`Milestone ${i + 1}`}
                    value={milestone}
                    onChange={(e) => updateMilestoneField(i, e.target.value)}
                  />
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addMilestoneField}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Milestone
                </Button>
              </div>

              <Button 
                onClick={handleAddGoal} 
                className={cn(
                  "w-full transition-all",
                  !newGoal.title.trim() && "opacity-50 cursor-not-allowed"
                )} 
                disabled={!newGoal.title.trim()}
              >
                {newGoal.title.trim() ? "Create Goal" : "Enter a title to continue"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goal Categories */}
      <div className="space-y-8">
        {/* Short Term */}
        <GoalSection
          title="Short-Term Goals"
          subtitle="This Week"
          goals={shortTermGoals}
          color="cyan"
          expandedGoal={expandedGoal}
          setExpandedGoal={setExpandedGoal}
          toggleMilestone={toggleMilestone}
          onDeleteGoal={(id, title) => setDeleteConfirm({ open: true, goalId: id, goalTitle: title })}
          onEditGoal={(goal) => setEditingGoal(goal)}
        />

        {/* Medium Term */}
        <GoalSection
          title="Medium-Term Goals"
          subtitle="This Month"
          goals={mediumTermGoals}
          color="magenta"
          expandedGoal={expandedGoal}
          setExpandedGoal={setExpandedGoal}
          toggleMilestone={toggleMilestone}
          onDeleteGoal={(id, title) => setDeleteConfirm({ open: true, goalId: id, goalTitle: title })}
          onEditGoal={(goal) => setEditingGoal(goal)}
        />

        {/* Custom Goals */}
        <GoalSection
          title="Custom Timeline Goals"
          subtitle="User-defined timeframe"
          goals={customGoals}
          color="purple"
          expandedGoal={expandedGoal}
          setExpandedGoal={setExpandedGoal}
          toggleMilestone={toggleMilestone}
          onDeleteGoal={(id, title) => setDeleteConfirm({ open: true, goalId: id, goalTitle: title })}
          onEditGoal={(goal) => setEditingGoal(goal)}
        />
      </div>

      {goals.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-secondary" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No goals yet</h3>
          <p className="text-muted-foreground mb-2">
            Set your first goal to start tracking your progress
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Goals help you focus on what matters. Break them into milestones for easier tracking.
          </p>
          <Button onClick={() => setIsAddingGoal(true)} className="gap-2 glow-primary bg-secondary hover:bg-secondary/90">
            <Plus className="w-4 h-4" />
            Create Your First Goal
          </Button>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
        title="Delete Goal?"
        description={`Are you sure you want to delete "${deleteConfirm.goalTitle}"? All milestones will be lost. This action cannot be undone.`}
        confirmLabel="Delete Goal"
        onConfirm={handleDeleteGoal}
      />

      {/* Edit Goal Dialog */}
      <EditGoalDialog
        goal={editingGoal}
        open={!!editingGoal}
        onOpenChange={(open) => !open && setEditingGoal(null)}
        onSave={(updates) => {
          if (editingGoal) {
            updateGoal(editingGoal.id, updates);
            toast.success("Goal updated");
          }
        }}
      />
    </div>
  );
}

function GoalSection({
  title,
  subtitle,
  goals,
  color,
  expandedGoal,
  setExpandedGoal,
  toggleMilestone,
  onDeleteGoal,
  onEditGoal,
}: {
  title: string;
  subtitle: string;
  goals: Goal[];
  color: "cyan" | "magenta" | "purple"; // All map to green variants now
  expandedGoal: string | null;
  setExpandedGoal: (id: string | null) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
  onDeleteGoal: (id: string, title: string) => void;
  onEditGoal: (goal: Goal) => void;
}) {
  // Show an empty state hint when this category has no goals but others do
  if (goals.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="glass rounded-xl p-6 text-center text-muted-foreground border-dashed border-2 border-border/50">
          <p className="text-sm">No {title.toLowerCase()} yet</p>
          <p className="text-xs mt-1">Create a goal with the "{title.includes("Short") ? "Short-Term" : title.includes("Medium") ? "Medium-Term" : "Custom"}" timeframe to see it here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-stagger">
        {goals.map((goal) => {
          const completedMilestones = goal.milestones.filter((m) => m.completed).length;
          const totalMilestones = goal.milestones.length;
          
          return (
            <div
              key={goal.id}
              className={cn(
                "glass rounded-2xl p-5 transition-all duration-300",
                expandedGoal === goal.id && "ring-2 ring-primary/40 shadow-lg"
              )}
            >
              <div className="flex items-start gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <ProgressRing
                          progress={goal.progress}
                          size={80}
                          strokeWidth={6}
                          color={color}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {totalMilestones > 0 
                        ? `${completedMilestones} of ${totalMilestones} milestones completed = ${goal.progress}%`
                        : `${goal.progress}% complete`
                      }
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{goal.title}</h3>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {goal.description}
                        </p>
                      )}
                      {goal.deadline && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Due: {new Date(goal.deadline).toLocaleDateString()}
                          {goal.customDuration && ` (${goal.customDuration} days)`}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEditGoal(goal)}
                              className="text-muted-foreground hover:text-foreground h-8 w-8"
                              aria-label="Edit goal"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit goal</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDeleteGoal(goal.id, goal.title)}
                              className="text-destructive hover:text-destructive h-8 w-8"
                              aria-label="Delete goal"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete goal</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  {/* Milestones Toggle */}
                  {goal.milestones.length > 0 && (
                    <>
                      <button
                        onClick={() =>
                          setExpandedGoal(expandedGoal === goal.id ? null : goal.id)
                        }
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-3 transition-colors"
                      >
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 transition-transform duration-200",
                            expandedGoal === goal.id && "rotate-180"
                          )}
                        />
                        {completedMilestones}/{totalMilestones} milestones
                      </button>

                      {/* Milestones with smooth expand/collapse */}
                      <div
                        className={cn(
                          "overflow-hidden transition-all duration-300 ease-in-out",
                          expandedGoal === goal.id ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"
                        )}
                      >
                        <div className="space-y-2">
                          {goal.milestones.map((milestone) => (
                            <div
                              key={milestone.id}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-lg transition-all duration-200",
                                milestone.completed 
                                  ? "bg-primary/10" 
                                  : "bg-muted/10 hover:bg-muted/20"
                              )}
                            >
                              <Checkbox
                                checked={milestone.completed}
                                onCheckedChange={() =>
                                  toggleMilestone(goal.id, milestone.id)
                                }
                                className="data-[state=checked]:bg-primary"
                              />
                              <span
                                className={cn(
                                  "text-sm font-medium transition-all",
                                  milestone.completed 
                                    ? "text-primary" 
                                    : "text-foreground"
                                )}
                              >
                                {milestone.title}
                              </span>
                              {milestone.completed && (
                                <span className="ml-auto text-xs text-primary">✓ Done</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

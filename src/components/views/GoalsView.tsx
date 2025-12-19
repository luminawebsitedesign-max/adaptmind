import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Plus, Trash2, Target, Calendar, Check, ChevronDown } from "lucide-react";
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
import { Goal } from "@/types";

export function GoalsView() {
  const { goals, addGoal, updateGoal, deleteGoal, toggleMilestone } = useAppStore();
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    category: "short" as Goal["category"],
    milestones: [""],
  });
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);

  const handleAddGoal = () => {
    if (newGoal.title.trim()) {
      addGoal({
        title: newGoal.title,
        description: newGoal.description,
        category: newGoal.category,
        progress: 0,
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
      });
      setIsAddingGoal(false);
    }
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

  const categoryLabels = {
    short: "This Week",
    medium: "This Month",
    custom: "Custom",
  };

  const categoryColors = {
    short: "cyan" as const,
    medium: "magenta" as const,
    custom: "purple" as const,
  };

  const shortTermGoals = goals.filter((g) => g.category === "short");
  const mediumTermGoals = goals.filter((g) => g.category === "medium");
  const customGoals = goals.filter((g) => g.category === "custom");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gradient-magenta">
            Goals
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your progress toward meaningful objectives
          </p>
        </div>

        <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
          <DialogTrigger asChild>
            <Button className="gap-2 glow-magenta bg-secondary hover:bg-secondary/90">
              <Plus className="w-4 h-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input
                placeholder="Goal title"
                value={newGoal.title}
                onChange={(e) =>
                  setNewGoal((prev) => ({ ...prev, title: e.target.value }))
                }
              />
              <Textarea
                placeholder="Description (optional)"
                value={newGoal.description}
                onChange={(e) =>
                  setNewGoal((prev) => ({ ...prev, description: e.target.value }))
                }
              />
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
                  <SelectItem value="custom">Custom Length</SelectItem>
                </SelectContent>
              </Select>

              <div className="space-y-2">
                <label className="text-sm font-medium">Milestones</label>
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

              <Button onClick={handleAddGoal} className="w-full">
                Create Goal
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
          deleteGoal={deleteGoal}
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
          deleteGoal={deleteGoal}
        />

        {/* Custom */}
        <GoalSection
          title="Custom Goals"
          subtitle="User-defined timeframe"
          goals={customGoals}
          color="purple"
          expandedGoal={expandedGoal}
          setExpandedGoal={setExpandedGoal}
          toggleMilestone={toggleMilestone}
          deleteGoal={deleteGoal}
        />
      </div>

      {goals.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            No goals yet. Set your first goal to get started!
          </p>
          <Button onClick={() => setIsAddingGoal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Goal
          </Button>
        </div>
      )}
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
  deleteGoal,
}: {
  title: string;
  subtitle: string;
  goals: Goal[];
  color: "cyan" | "magenta" | "purple";
  expandedGoal: string | null;
  setExpandedGoal: (id: string | null) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
  deleteGoal: (id: string) => void;
}) {
  if (goals.length === 0) return null;

  const glowClass = {
    cyan: "glow-cyan",
    magenta: "glow-magenta",
    purple: "glow-purple",
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className={cn(
              "glass rounded-2xl p-5 transition-all duration-300 hover-glow",
              expandedGoal === goal.id && "ring-1 ring-primary/30"
            )}
          >
            <div className="flex items-start gap-4">
              <ProgressRing
                progress={goal.progress}
                size={80}
                strokeWidth={6}
                color={color}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{goal.title}</h3>
                    {goal.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {goal.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteGoal(goal.id)}
                    className="text-destructive hover:text-destructive h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Milestones Toggle */}
                <button
                  onClick={() =>
                    setExpandedGoal(expandedGoal === goal.id ? null : goal.id)
                  }
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-3"
                >
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform",
                      expandedGoal === goal.id && "rotate-180"
                    )}
                  />
                  {goal.milestones.filter((m) => m.completed).length}/
                  {goal.milestones.length} milestones
                </button>

                {/* Milestones */}
                {expandedGoal === goal.id && (
                  <div className="mt-3 space-y-2 animate-fade-in">
                    {goal.milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className="flex items-center gap-2"
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
                            "text-sm",
                            milestone.completed &&
                              "line-through text-muted-foreground"
                          )}
                        >
                          {milestone.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

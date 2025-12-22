import { useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  Database, 
  CheckCircle2,
  Shield,
  Sparkles,
  Bot,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

export function ExportDataView() {
  const { todoLists, goals, habits, chatMessages } = useAppStore();
  const [exporting, setExporting] = useState<'json' | 'csv' | null>(null);
  const [includeAIChats, setIncludeAIChats] = useState(false);

  // Deep export data with full metadata
  const exportData = {
    exportedAt: new Date().toISOString(),
    version: "2.0",
    summary: {
      totalTasks: todoLists.reduce((acc, list) => acc + list.items.length, 0),
      completedTasks: todoLists.reduce((acc, list) => acc + list.items.filter(i => i.completed).length, 0),
      totalGoals: goals.length,
      completedGoals: goals.filter(g => g.progress === 100).length,
      totalHabits: habits.length,
      totalAIMessages: includeAIChats ? chatMessages.length : 0,
    },
    todoLists: todoLists.map((list) => ({
      id: list.id,
      name: list.name,
      icon: list.icon,
      color: list.color,
      itemCount: list.items.length,
      items: list.items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description || null,
        priority: item.priority,
        completed: item.completed,
        progress: item.progress,
        listName: list.name,
        listId: list.id,
        order: item.order,
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
        completedAt: item.completedAt ? new Date(item.completedAt).toISOString() : null,
        deadline: item.deadline ? new Date(item.deadline).toISOString() : null,
      })),
    })),
    goals: goals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      description: goal.description || null,
      category: goal.category,
      progress: goal.progress,
      totalMilestones: goal.milestones.length,
      completedMilestones: goal.milestones.filter(m => m.completed).length,
      milestones: goal.milestones.map(m => ({
        id: m.id,
        title: m.title,
        completed: m.completed,
        completedAt: m.completedAt ? new Date(m.completedAt).toISOString() : null,
      })),
      createdAt: new Date(goal.createdAt).toISOString(),
      completedAt: goal.completedAt ? new Date(goal.completedAt).toISOString() : null,
      deadline: goal.deadline ? new Date(goal.deadline).toISOString() : null,
    })),
    habits: habits.map((habit) => ({
      id: habit.id,
      name: habit.name,
      icon: habit.icon,
      frequency: habit.frequency,
      customDays: habit.customDays || null,
      currentStreak: habit.streak,
      bestStreak: habit.bestStreak,
      totalCompletions: habit.completedDates.length,
      completionLog: habit.completedDates.map(date => ({
        date: date,
        dayOfWeek: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
      })),
      createdAt: new Date(habit.createdAt).toISOString(),
    })),
    ...(includeAIChats && chatMessages.length > 0 ? {
      aiInteractions: chatMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp).toISOString(),
      }))
    } : {}),
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = async () => {
    setExporting('json');
    await new Promise(resolve => setTimeout(resolve, 600));
    const json = JSON.stringify(exportData, null, 2);
    const filename = `adaptmind-export-${new Date().toISOString().split("T")[0]}.json`;
    downloadFile(json, filename, "application/json");
    setExporting(null);
    toast.success("Data exported as JSON", { duration: 4000 });
  };

  const handleExportCSV = async () => {
    setExporting('csv');
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const sections: string[] = [];
    
    // Tasks section with full metadata
    sections.push("=== TASKS ===");
    sections.push("List,Task,Description,Priority,Status,Progress,Created,Completed,Deadline");
    todoLists.forEach((list) => {
      list.items.forEach((item) => {
        const row = [
          `"${list.name}"`,
          `"${item.title}"`,
          `"${item.description || ''}"`,
          item.priority,
          item.completed ? "Completed" : "Pending",
          `${item.progress}%`,
          item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '',
          item.completedAt ? new Date(item.completedAt).toLocaleDateString() : '',
          item.deadline ? new Date(item.deadline).toLocaleDateString() : '',
        ];
        sections.push(row.join(","));
      });
    });
    
    // Goals section with milestones
    sections.push("");
    sections.push("=== GOALS ===");
    sections.push("Goal,Description,Category,Progress,Milestones Completed,Created,Completed,Deadline");
    goals.forEach((goal) => {
      const completedMilestones = goal.milestones.filter(m => m.completed).length;
      const row = [
        `"${goal.title}"`,
        `"${goal.description || ''}"`,
        goal.category,
        `${goal.progress}%`,
        `${completedMilestones}/${goal.milestones.length}`,
        new Date(goal.createdAt).toLocaleDateString(),
        goal.completedAt ? new Date(goal.completedAt).toLocaleDateString() : '',
        goal.deadline ? new Date(goal.deadline).toLocaleDateString() : '',
      ];
      sections.push(row.join(","));
    });
    
    // Milestones detail
    sections.push("");
    sections.push("=== MILESTONES ===");
    sections.push("Goal,Milestone,Status,Completed At");
    goals.forEach((goal) => {
      goal.milestones.forEach((m) => {
        const row = [
          `"${goal.title}"`,
          `"${m.title}"`,
          m.completed ? "Done" : "Pending",
          m.completedAt ? new Date(m.completedAt).toLocaleDateString() : '',
        ];
        sections.push(row.join(","));
      });
    });
    
    // Habits section with streaks and logs
    sections.push("");
    sections.push("=== HABITS ===");
    sections.push("Habit,Frequency,Current Streak,Best Streak,Total Completions,Created");
    habits.forEach((habit) => {
      const row = [
        `"${habit.name}"`,
        habit.frequency,
        habit.streak,
        habit.bestStreak,
        habit.completedDates.length,
        new Date(habit.createdAt).toLocaleDateString(),
      ];
      sections.push(row.join(","));
    });
    
    // Habit completion log
    sections.push("");
    sections.push("=== HABIT COMPLETION LOG ===");
    sections.push("Habit,Date,Day of Week");
    habits.forEach((habit) => {
      habit.completedDates.forEach((date) => {
        const row = [
          `"${habit.name}"`,
          date,
          new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
        ];
        sections.push(row.join(","));
      });
    });
    
    // AI interactions if included
    if (includeAIChats && chatMessages.length > 0) {
      sections.push("");
      sections.push("=== AI INTERACTIONS ===");
      sections.push("Role,Message,Timestamp");
      chatMessages.forEach((msg) => {
        const row = [
          msg.role,
          `"${msg.content.replace(/"/g, '""').substring(0, 500)}"`,
          new Date(msg.timestamp).toISOString(),
        ];
        sections.push(row.join(","));
      });
    }

    const csv = sections.join("\n");
    const filename = `adaptmind-export-${new Date().toISOString().split("T")[0]}.csv`;
    downloadFile(csv, filename, "text/csv");
    setExporting(null);
    toast.success("Data exported as CSV", { duration: 4000 });
  };

  const totalTasks = todoLists.reduce((acc, list) => acc + list.items.length, 0);
  const completedTasks = todoLists.reduce(
    (acc, list) => acc + list.items.filter((item) => item.completed).length,
    0
  );
  const totalItems = totalTasks + goals.length + habits.length;

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 glow-cyan">
          <Download className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-display font-bold text-gradient-cyan">
          Export Your Data
        </h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Download all your productivity data with full metadata. Your data belongs to you.
        </p>
      </div>

      {/* Data Summary Card */}
      <div className="glass rounded-2xl p-6 hover-glow">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Your Data Summary</h2>
            <p className="text-sm text-muted-foreground">Full metadata included in the export</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-muted/10 border border-border/20 transition-all hover:bg-muted/20">
            <p className="text-3xl font-display font-bold text-primary">
              {todoLists.length}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Task Lists</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/10 border border-border/20 transition-all hover:bg-muted/20">
            <p className="text-3xl font-display font-bold text-secondary">
              {totalTasks}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Total Tasks</p>
            <p className="text-xs text-muted-foreground/70">{completedTasks} completed</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/10 border border-border/20 transition-all hover:bg-muted/20">
            <p className="text-3xl font-display font-bold text-accent">
              {goals.length}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Goals</p>
            <p className="text-xs text-muted-foreground/70">{goals.reduce((a, g) => a + g.milestones.length, 0)} milestones</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/10 border border-border/20 transition-all hover:bg-muted/20">
            <p className="text-3xl font-display font-bold text-primary">
              {habits.length}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Habits</p>
            <p className="text-xs text-muted-foreground/70">{habits.reduce((a, h) => a + h.completedDates.length, 0)} logs</p>
          </div>
        </div>
      </div>

      {/* AI Chats Toggle */}
      {chatMessages.length > 0 && (
        <div className="glass rounded-2xl p-5 hover-glow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-accent" />
              </div>
              <div>
                <Label htmlFor="include-ai" className="font-semibold">Include AI Conversations</Label>
                <p className="text-sm text-muted-foreground">{chatMessages.length} messages available</p>
              </div>
            </div>
            <Switch
              id="include-ai"
              checked={includeAIChats}
              onCheckedChange={setIncludeAIChats}
            />
          </div>
        </div>
      )}

      {/* What's Included */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold text-lg mb-4">What's Included in Your Export</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <p className="font-medium text-primary">Tasks</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Creation & completion dates</li>
              <li>• List associations</li>
              <li>• Priority & progress</li>
              <li>• Deadlines</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-secondary">Goals</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• All milestones</li>
              <li>• Completion status</li>
              <li>• Progress history</li>
              <li>• Milestone timestamps</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-accent">Habits</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Daily completion logs</li>
              <li>• Streak history</li>
              <li>• Best streaks</li>
              <li>• Frequency settings</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* JSON Export */}
        <div className="glass rounded-2xl p-6 hover-glow transition-all duration-300 group">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileJson className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-xl">JSON Format</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Complete data with full structure
              </p>
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Full data backup with all metadata</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Import-ready for other apps</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Preserves relationships & timestamps</span>
            </div>
          </div>

          <Button
            onClick={handleExportJSON}
            disabled={exporting !== null || totalItems === 0}
            className="w-full gap-2 glow-cyan h-12 text-base"
          >
            {exporting === 'json' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            Download JSON
          </Button>
        </div>

        {/* CSV Export */}
        <div className="glass rounded-2xl p-6 hover-glow transition-all duration-300 group">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-7 h-7 text-secondary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-xl">CSV Format</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Spreadsheet-compatible format
              </p>
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-secondary" />
              <span>Opens in Excel, Google Sheets</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-secondary" />
              <span>Sectioned data with headers</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-secondary" />
              <span>Includes completion logs</span>
            </div>
          </div>

          <Button
            onClick={handleExportCSV}
            disabled={exporting !== null || totalItems === 0}
            variant="secondary"
            className="w-full gap-2 glow-magenta h-12 text-base"
          >
            {exporting === 'csv' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            Download CSV
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {totalItems === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No data to export yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Start adding tasks, goals, and habits to build your productivity data.
          </p>
        </div>
      )}

      {/* Security Note */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Shield className="w-4 h-4" />
        <span>Your data is processed locally and downloaded directly to your device</span>
      </div>
    </div>
  );
}
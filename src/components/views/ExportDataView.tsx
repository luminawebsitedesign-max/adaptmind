import { useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  Database, 
  CheckCircle2,
  Shield,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

export function ExportDataView() {
  const { todoLists, goals, habits } = useAppStore();
  const [exporting, setExporting] = useState<'json' | 'csv' | null>(null);

  const exportData = {
    exportedAt: new Date().toISOString(),
    todoLists: todoLists.map((list) => ({
      ...list,
      items: list.items.map((item) => ({
        ...item,
        deadline: item.deadline ? new Date(item.deadline).toISOString() : null,
      })),
    })),
    goals: goals.map((goal) => ({
      ...goal,
      createdAt: new Date(goal.createdAt).toISOString(),
      deadline: goal.deadline ? new Date(goal.deadline).toISOString() : null,
    })),
    habits: habits.map((habit) => ({
      ...habit,
      createdAt: new Date(habit.createdAt).toISOString(),
    })),
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
    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 500));
    const json = JSON.stringify(exportData, null, 2);
    const filename = `adaptmind-export-${new Date().toISOString().split("T")[0]}.json`;
    downloadFile(json, filename, "application/json");
    setExporting(null);
    toast.success("Data exported as JSON");
  };

  const handleExportCSV = async () => {
    setExporting('csv');
    await new Promise(resolve => setTimeout(resolve, 500));
    const rows: string[] = [];

    // Header
    rows.push("Type,Name,Status,Details,Created/Deadline");

    // Todo items
    todoLists.forEach((list) => {
      list.items.forEach((item) => {
        rows.push(
          `Task,"${item.title}",${item.completed ? "Completed" : "Pending"},"List: ${list.name}, Priority: ${item.priority}",${item.deadline ? new Date(item.deadline).toLocaleDateString() : ""}`
        );
      });
    });

    // Goals
    goals.forEach((goal) => {
      rows.push(
        `Goal,"${goal.title}",${goal.progress}%,"${goal.milestones.filter((m) => m.completed).length}/${goal.milestones.length} milestones",${new Date(goal.createdAt).toLocaleDateString()}`
      );
    });

    // Habits
    habits.forEach((habit) => {
      rows.push(
        `Habit,"${habit.name}","Streak: ${habit.streak}","Best: ${habit.bestStreak}, Frequency: ${habit.frequency}",${new Date(habit.createdAt).toLocaleDateString()}`
      );
    });

    const csv = rows.join("\n");
    const filename = `adaptmind-export-${new Date().toISOString().split("T")[0]}.csv`;
    downloadFile(csv, filename, "text/csv");
    setExporting(null);
    toast.success("Data exported as CSV");
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
          Download all your productivity data securely. Your data belongs to you.
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
            <p className="text-sm text-muted-foreground">Everything that will be included in the export</p>
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
          </div>
          <div className="p-4 rounded-xl bg-muted/10 border border-border/20 transition-all hover:bg-muted/20">
            <p className="text-3xl font-display font-bold text-primary">
              {habits.length}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Habits</p>
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
              <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
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
              <span>Easy viewing and analysis</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-secondary" />
              <span>Simple flat data structure</span>
            </div>
          </div>

          <Button
            onClick={handleExportCSV}
            disabled={exporting !== null || totalItems === 0}
            variant="secondary"
            className="w-full gap-2 glow-magenta h-12 text-base"
          >
            {exporting === 'csv' ? (
              <span className="w-5 h-5 border-2 border-secondary-foreground/30 border-t-secondary-foreground rounded-full animate-spin" />
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
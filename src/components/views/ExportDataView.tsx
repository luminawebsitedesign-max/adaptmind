import { useAppStore } from "@/stores/appStore";
import { Button } from "@/components/ui/button";
import { Download, FileJson, FileSpreadsheet, Database } from "lucide-react";
import { toast } from "sonner";

export function ExportDataView() {
  const { todoLists, goals, habits } = useAppStore();

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

  const handleExportJSON = () => {
    const json = JSON.stringify(exportData, null, 2);
    const filename = `adaptmind-export-${new Date().toISOString().split("T")[0]}.json`;
    downloadFile(json, filename, "application/json");
    toast.success("Data exported as JSON");
  };

  const handleExportCSV = () => {
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
    toast.success("Data exported as CSV");
  };

  const totalItems =
    todoLists.reduce((acc, list) => acc + list.items.length, 0) +
    goals.length +
    habits.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-gradient-cyan">
          Export Your Data
        </h1>
        <p className="text-muted-foreground mt-1">
          Download all your productivity data in your preferred format
        </p>
      </div>

      {/* Stats */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-lg">Data Summary</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-muted/20">
            <p className="text-2xl font-display font-bold text-primary">
              {todoLists.length}
            </p>
            <p className="text-sm text-muted-foreground">Task Lists</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/20">
            <p className="text-2xl font-display font-bold text-secondary">
              {todoLists.reduce((acc, list) => acc + list.items.length, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Total Tasks</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/20">
            <p className="text-2xl font-display font-bold text-accent">
              {goals.length}
            </p>
            <p className="text-sm text-muted-foreground">Goals</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/20">
            <p className="text-2xl font-display font-bold text-primary">
              {habits.length}
            </p>
            <p className="text-sm text-muted-foreground">Habits</p>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6 hover-glow transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <FileJson className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Export as JSON</h3>
              <p className="text-sm text-muted-foreground">
                Complete data with full structure
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Best for backups and importing into other apps. Contains all data
            including timestamps, relationships, and metadata.
          </p>
          <Button
            onClick={handleExportJSON}
            className="w-full gap-2 glow-cyan"
          >
            <Download className="w-4 h-4" />
            Download JSON
          </Button>
        </div>

        <div className="glass rounded-2xl p-6 hover-glow transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Export as CSV</h3>
              <p className="text-sm text-muted-foreground">
                Spreadsheet-compatible format
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Opens in Excel, Google Sheets, or any spreadsheet app. Simplified
            flat structure for easy viewing and analysis.
          </p>
          <Button
            onClick={handleExportCSV}
            variant="secondary"
            className="w-full gap-2 glow-magenta"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </Button>
        </div>
      </div>

      {totalItems === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No data to export yet. Start adding tasks, goals, and habits!
          </p>
        </div>
      )}
    </div>
  );
}

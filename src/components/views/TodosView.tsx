import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Trash2,
  GripVertical,
  Calendar,
  ChevronDown,
  ChevronRight,
  Flag,
} from "lucide-react";
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
import { TodoItem, TodoList } from "@/types";

export function TodosView() {
  const {
    todoLists,
    addTodoList,
    deleteTodoList,
    addTodoItem,
    updateTodoItem,
    deleteTodoItem,
  } = useAppStore();

  const [expandedLists, setExpandedLists] = useState<string[]>(
    todoLists.map((l) => l.id)
  );
  const [newListName, setNewListName] = useState("");
  const [newListIcon, setNewListIcon] = useState("📝");
  const [isAddingList, setIsAddingList] = useState(false);
  const [addingToList, setAddingToList] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemPriority, setNewItemPriority] = useState<"low" | "medium" | "high">("medium");

  const toggleList = (id: string) => {
    setExpandedLists((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAddList = () => {
    if (newListName.trim()) {
      addTodoList({
        name: newListName,
        icon: newListIcon,
        color: "cyan",
      });
      setNewListName("");
      setNewListIcon("📝");
      setIsAddingList(false);
    }
  };

  const handleAddItem = (listId: string) => {
    if (newItemTitle.trim()) {
      addTodoItem(listId, {
        title: newItemTitle,
        priority: newItemPriority,
        completed: false,
        progress: 0,
        listId,
      });
      setNewItemTitle("");
      setNewItemPriority("medium");
      setAddingToList(null);
    }
  };

  const priorityColors = {
    low: "bg-primary/20 text-primary",
    medium: "bg-secondary/20 text-secondary",
    high: "bg-destructive/20 text-destructive",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gradient-cyan">
            To-Do Lists
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your tasks across multiple lists
          </p>
        </div>

        <Dialog open={isAddingList} onOpenChange={setIsAddingList}>
          <DialogTrigger asChild>
            <Button className="gap-2 glow-cyan">
              <Plus className="w-4 h-4" />
              New List
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong">
            <DialogHeader>
              <DialogTitle>Create New List</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Icon (emoji)"
                  value={newListIcon}
                  onChange={(e) => setNewListIcon(e.target.value)}
                  className="w-20 text-center text-xl"
                />
                <Input
                  placeholder="List name"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleAddList()}
                />
              </div>
              <Button onClick={handleAddList} className="w-full">
                Create List
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lists */}
      <div className="space-y-4">
        {todoLists.map((list) => (
          <div key={list.id} className="glass rounded-2xl overflow-hidden">
            {/* List Header */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/10 transition-colors"
              onClick={() => toggleList(list.id)}
            >
              <div className="flex items-center gap-3">
                {expandedLists.includes(list.id) ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
                <span className="text-2xl">{list.icon}</span>
                <h3 className="font-semibold text-lg">{list.name}</h3>
                <span className="text-sm text-muted-foreground">
                  ({list.items.filter((i) => i.completed).length}/{list.items.length})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddingToList(list.id);
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTodoList(list.id);
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* List Items */}
            {expandedLists.includes(list.id) && (
              <div className="px-4 pb-4 space-y-2">
                {/* Add Item Form */}
                {addingToList === list.id && (
                  <div className="flex gap-2 p-3 rounded-lg bg-muted/10">
                    <Input
                      placeholder="Task title..."
                      value={newItemTitle}
                      onChange={(e) => setNewItemTitle(e.target.value)}
                      className="flex-1"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleAddItem(list.id)}
                    />
                    <Select
                      value={newItemPriority}
                      onValueChange={(v) =>
                        setNewItemPriority(v as "low" | "medium" | "high")
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => handleAddItem(list.id)}>Add</Button>
                    <Button variant="ghost" onClick={() => setAddingToList(null)}>
                      Cancel
                    </Button>
                  </div>
                )}

                {/* Items */}
                {list.items.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No tasks yet. Click + to add one.
                  </p>
                ) : (
                  list.items.map((item) => (
                    <TaskItem
                      key={item.id}
                      item={item}
                      listId={list.id}
                      onToggle={() =>
                        updateTodoItem(list.id, item.id, {
                          completed: !item.completed,
                          progress: item.completed ? 0 : 100,
                        })
                      }
                      onDelete={() => deleteTodoItem(list.id, item.id)}
                      priorityColors={priorityColors}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        ))}

        {todoLists.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-muted-foreground mb-4">
              No lists yet. Create your first one!
            </p>
            <Button onClick={() => setIsAddingList(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create List
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskItem({
  item,
  listId,
  onToggle,
  onDelete,
  priorityColors,
}: {
  item: TodoItem;
  listId: string;
  onToggle: () => void;
  onDelete: () => void;
  priorityColors: Record<string, string>;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
        "bg-muted/10 hover:bg-muted/20 group",
        item.completed && "opacity-60"
      )}
    >
      <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />

      <Checkbox
        checked={item.completed}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-medium truncate",
            item.completed && "line-through text-muted-foreground"
          )}
        >
          {item.title}
        </p>
        {item.description && (
          <p className="text-sm text-muted-foreground truncate">
            {item.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {item.deadline && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {new Date(item.deadline).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </div>
        )}

        <span
          className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            priorityColors[item.priority]
          )}
        >
          {item.priority}
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive h-8 w-8"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

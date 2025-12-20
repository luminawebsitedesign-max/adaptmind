import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Plus,
  Trash2,
  GripVertical,
  Calendar,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
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
import { TodoItem, TodoList } from "@/types";
import { toast } from "sonner";

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
  
  // Confirmation states
  const [deleteListConfirm, setDeleteListConfirm] = useState<{ open: boolean; listId: string; listName: string }>({
    open: false,
    listId: "",
    listName: "",
  });
  const [deleteItemConfirm, setDeleteItemConfirm] = useState<{ open: boolean; listId: string; itemId: string; itemTitle: string }>({
    open: false,
    listId: "",
    itemId: "",
    itemTitle: "",
  });

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
      toast.success("List created successfully");
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
      toast.success("Task added");
    }
  };

  const handleDeleteList = () => {
    deleteTodoList(deleteListConfirm.listId);
    setDeleteListConfirm({ open: false, listId: "", listName: "" });
    toast.success("List deleted");
  };

  const handleDeleteItem = () => {
    deleteTodoItem(deleteItemConfirm.listId, deleteItemConfirm.itemId);
    setDeleteItemConfirm({ open: false, listId: "", itemId: "", itemTitle: "" });
    toast.success("Task deleted");
  };

  const handleToggleItem = (listId: string, item: TodoItem) => {
    const wasCompleted = item.completed;
    updateTodoItem(listId, item.id, {
      completed: !item.completed,
      progress: item.completed ? 0 : 100,
    });
    if (!wasCompleted) {
      toast.success("Task completed!");
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
              <DialogDescription>
                Create a new list to organize your tasks. Pick an emoji icon and give it a name.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="flex gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Icon</label>
                  <Input
                    placeholder="📝"
                    value={newListIcon}
                    onChange={(e) => setNewListIcon(e.target.value)}
                    className="w-16 text-center text-xl"
                    maxLength={2}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground">List Name *</label>
                  <Input
                    placeholder="e.g., Work, Personal, Shopping"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddList()}
                  />
                </div>
              </div>
              <Button onClick={handleAddList} className="w-full" disabled={!newListName.trim()}>
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
                  <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform" />
                )}
                <span className="text-2xl">{list.icon}</span>
                <h3 className="font-semibold text-lg">{list.name}</h3>
                <span className="text-sm text-muted-foreground">
                  ({list.items.filter((i) => i.completed).length}/{list.items.length})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddingToList(list.id);
                        }}
                        aria-label="Add task to list"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add task</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteListConfirm({ open: true, listId: list.id, listName: list.name });
                        }}
                        className="text-destructive hover:text-destructive"
                        aria-label="Delete list"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete list</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* List Items */}
            {expandedLists.includes(list.id) && (
              <div className="px-4 pb-4 space-y-2 animate-fade-in">
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
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-3">
                      No tasks yet in this list
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddingToList(list.id)}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add your first task
                    </Button>
                  </div>
                ) : (
                  list.items.map((item) => (
                    <TaskItem
                      key={item.id}
                      item={item}
                      listId={list.id}
                      onToggle={() => handleToggleItem(list.id, item)}
                      onDelete={() => setDeleteItemConfirm({ 
                        open: true, 
                        listId: list.id, 
                        itemId: item.id, 
                        itemTitle: item.title 
                      })}
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
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No lists yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first list to start organizing your tasks
            </p>
            <Button onClick={() => setIsAddingList(true)} className="gap-2 glow-cyan">
              <Plus className="w-4 h-4" />
              Create Your First List
            </Button>
          </div>
        )}
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={deleteListConfirm.open}
        onOpenChange={(open) => setDeleteListConfirm((prev) => ({ ...prev, open }))}
        title="Delete List?"
        description={`Are you sure you want to delete "${deleteListConfirm.listName}"? All tasks in this list will be permanently deleted. This action cannot be undone.`}
        confirmLabel="Delete List"
        onConfirm={handleDeleteList}
      />

      <ConfirmDialog
        open={deleteItemConfirm.open}
        onOpenChange={(open) => setDeleteItemConfirm((prev) => ({ ...prev, open }))}
        title="Delete Task?"
        description={`Are you sure you want to delete "${deleteItemConfirm.itemTitle}"? This action cannot be undone.`}
        confirmLabel="Delete Task"
        onConfirm={handleDeleteItem}
      />
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
        item.completed && "opacity-70"
      )}
    >
      <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab transition-opacity" />

      <Checkbox
        checked={item.completed}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        aria-label={`Mark "${item.title}" as ${item.completed ? "incomplete" : "complete"}`}
      />

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-medium truncate transition-all",
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

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive h-8 w-8 transition-opacity"
                aria-label="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete task</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

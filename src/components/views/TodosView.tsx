import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { useCompletionSound } from "@/hooks/useCompletionSound";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EditTaskDialog } from "@/components/ui/edit-task-dialog";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  Plus,
  Trash2,
  GripVertical,
  Calendar,
  ChevronDown,
  ChevronRight,
  Send,
  Pencil,
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
    reorderTodoItems,
    moveTodoItem,
  } = useAppStore();

  const { playCompletionSound } = useCompletionSound();

  const [expandedLists, setExpandedLists] = useState<string[]>(
    todoLists.map((l) => l.id)
  );
  const [newListName, setNewListName] = useState("");
  const [newListIcon, setNewListIcon] = useState("📝");
  const [isAddingList, setIsAddingList] = useState(false);
  
  // Quick add bar state
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [quickTaskListId, setQuickTaskListId] = useState<string>(todoLists[0]?.id || "");
  const [quickTaskPriority, setQuickTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [isAddingQuickTask, setIsAddingQuickTask] = useState(false);
  
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
  
  // Edit task state
  const [editingTask, setEditingTask] = useState<{ task: TodoItem; listId: string } | null>(null);

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

  const handleQuickAddTask = () => {
    if (quickTaskTitle.trim() && quickTaskListId) {
      setIsAddingQuickTask(true);
      addTodoItem(quickTaskListId, {
        title: quickTaskTitle,
        priority: quickTaskPriority,
        completed: false,
        progress: 0,
        listId: quickTaskListId,
      });
      setQuickTaskTitle("");
      toast.success("Task added");
      setIsAddingQuickTask(false);
      
      if (!expandedLists.includes(quickTaskListId)) {
        setExpandedLists(prev => [...prev, quickTaskListId]);
      }
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
      playCompletionSound();
      toast.success("Task completed! 🎉");
    }
  };

  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // Same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceListId = source.droppableId;
    const destListId = destination.droppableId;

    if (sourceListId === destListId) {
      // Reorder within same list
      const list = todoLists.find(l => l.id === sourceListId);
      if (!list) return;

      const newItems = Array.from(list.items);
      const [removed] = newItems.splice(source.index, 1);
      newItems.splice(destination.index, 0, removed);

      // Update order
      const reorderedItems = newItems.map((item, index) => ({
        ...item,
        order: index,
      }));

      reorderTodoItems(sourceListId, reorderedItems);
    } else {
      // Move to different list
      moveTodoItem(draggableId, sourceListId, destListId);
      toast.success("Task moved");
    }
  }, [todoLists, reorderTodoItems, moveTodoItem]);

  const priorityColors = {
    low: "bg-primary/20 text-primary",
    medium: "bg-secondary/20 text-secondary",
    high: "bg-destructive/20 text-destructive",
  };

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      {/* Header with clear separation */}
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gradient-brand">
            Tasks
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <GripVertical className="w-4 h-4" />
            <span>Drag tasks to reorder or move between lists</span>
          </p>
        </div>

        <Dialog open={isAddingList} onOpenChange={setIsAddingList}>
          <DialogTrigger asChild>
            <Button className="gap-2 glow-primary" size="lg">
              <Plus className="w-5 h-5" />
              <span className="font-semibold">Create New List</span>
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
                  <label className="text-xs text-muted-foreground font-medium">Icon</label>
                  <Input
                    placeholder="📝"
                    value={newListIcon}
                    onChange={(e) => setNewListIcon(e.target.value)}
                    className="w-16 text-center text-xl"
                    maxLength={2}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">List Name *</label>
                  <Input
                    placeholder="e.g., Work, Personal, Shopping"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddList()}
                  />
                </div>
              </div>
              <Button 
                onClick={handleAddList} 
                className={cn(
                  "w-full transition-all",
                  !newListName.trim() && "opacity-50 cursor-not-allowed"
                )}
                disabled={!newListName.trim()}
              >
                {newListName.trim() ? "Create List" : "Enter a name to continue"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lists with Drag and Drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-2xl cursor-help">{list.icon}</span>
                      </TooltipTrigger>
                      <TooltipContent>List category icon</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <h3 className="font-semibold text-lg">{list.name}</h3>
                  {list.items.length > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm bg-muted/30 px-2 py-0.5 rounded-full font-medium cursor-help">
                            {list.items.filter((i) => i.completed).length} / {list.items.length} completed
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Tasks completed out of total</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
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

              {/* List Items with Drag and Drop */}
              {expandedLists.includes(list.id) && (
                <Droppable droppableId={list.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "px-4 pb-4 space-y-2 min-h-[60px] transition-colors",
                        snapshot.isDraggingOver && "bg-primary/5"
                      )}
                    >
                      {list.items.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                            <Plus className="w-6 h-6 text-primary/60" />
                          </div>
                          <p className="text-sm font-medium">No tasks yet</p>
                          <p className="text-xs mt-1 text-muted-foreground/70 mb-3">Drag tasks here or add one below</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickTaskListId(list.id);
                              const input = document.querySelector<HTMLInputElement>('input[placeholder="Add a new task..."]');
                              input?.focus();
                            }}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Task to This List
                          </Button>
                        </div>
                      ) : (
                        list.items.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={cn(
                                  "transition-shadow",
                                  snapshot.isDragging && "shadow-lg ring-2 ring-primary/50"
                                )}
                              >
                                <TaskItem
                                  item={item}
                                  listId={list.id}
                                  onToggle={() => handleToggleItem(list.id, item)}
                                  onDelete={() => setDeleteItemConfirm({ 
                                    open: true, 
                                    listId: list.id, 
                                    itemId: item.id, 
                                    itemTitle: item.title 
                                  })}
                                  onEdit={() => setEditingTask({ task: item, listId: list.id })}
                                  priorityColors={priorityColors}
                                  dragHandleProps={provided.dragHandleProps}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
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
              <Button onClick={() => setIsAddingList(true)} className="gap-2 glow-primary">
                <Plus className="w-4 h-4" />
                Create Your First List
              </Button>
            </div>
          )}
        </div>
      </DragDropContext>

      {/* Quick Add Bar - Fixed at bottom, properly centered with labels */}
      {todoLists.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-30 md:left-64">
          <div className="max-w-4xl mx-auto">
            <div className="glass-strong rounded-2xl p-4 shadow-xl border border-border/30">
              <div className="flex gap-3 items-end flex-wrap sm:flex-nowrap">
                <div className="flex-1 min-w-[150px] space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">New Task</label>
                  <Input
                    value={quickTaskTitle}
                    onChange={(e) => setQuickTaskTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className="bg-muted/10 h-11"
                    onKeyDown={(e) => e.key === "Enter" && handleQuickAddTask()}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Add to List</label>
                  <Select
                    value={quickTaskListId}
                    onValueChange={setQuickTaskListId}
                  >
                    <SelectTrigger className="w-36 h-11">
                      <SelectValue placeholder="Select list" />
                    </SelectTrigger>
                    <SelectContent>
                      {todoLists.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          <span className="flex items-center gap-2">
                            <span>{list.icon}</span>
                            <span>{list.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Priority</label>
                  <Select
                    value={quickTaskPriority}
                    onValueChange={(v) => setQuickTaskPriority(v as "low" | "medium" | "high")}
                  >
                    <SelectTrigger className="w-28 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">🟢 Low</SelectItem>
                      <SelectItem value="medium">🟡 Medium</SelectItem>
                      <SelectItem value="high">🔴 High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleQuickAddTask} 
                  disabled={!quickTaskTitle.trim() || !quickTaskListId || isAddingQuickTask}
                  className="glow-primary h-11 px-6 gap-2"
                >
                  {isAddingQuickTask ? (
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Add Task</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Edit Task Dialog */}
      <EditTaskDialog
        task={editingTask?.task || null}
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onSave={(updates) => {
          if (editingTask) {
            updateTodoItem(editingTask.listId, editingTask.task.id, updates);
            toast.success("Task updated");
          }
        }}
      />
    </div>
  );
}

function TaskItem({
  item,
  listId,
  onToggle,
  onDelete,
  onEdit,
  priorityColors,
  dragHandleProps,
}: {
  item: TodoItem;
  listId: string;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  priorityColors: Record<string, string>;
  dragHandleProps?: any;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
        "bg-muted/10 hover:bg-muted/20 group cursor-pointer",
        item.completed && "opacity-70"
      )}
      onClick={onEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onEdit()}
      aria-label={`Edit task: ${item.title}`}
    >
      <div 
        {...dragHandleProps} 
        className="cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={item.completed}
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          aria-label={`Mark "${item.title}" as ${item.completed ? "incomplete" : "complete"}`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-medium truncate transition-all",
            item.completed && "line-through text-muted-foreground/60"
          )}
        >
          {item.title}
        </p>
        {item.description && (
          <p className={cn(
            "text-sm text-muted-foreground truncate",
            item.completed && "line-through opacity-60"
          )}>
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
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground h-8 w-8 transition-opacity"
                aria-label="Edit task"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit task</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
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

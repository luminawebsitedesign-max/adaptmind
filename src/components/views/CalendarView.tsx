import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle2, Target, Repeat, Calendar as CalendarIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function CalendarView() {
  const { todoLists, goals, habits } = useAppStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get all tasks with deadlines
  const tasksWithDeadlines = useMemo(() => {
    return todoLists.flatMap(list => 
      list.items.filter(item => item.deadline).map(item => ({
        ...item,
        listName: list.name,
        listIcon: list.icon,
      }))
    );
  }, [todoLists]);

  // Get habits completed on selected date
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const habitsOnDate = useMemo(() => {
    return habits.map(habit => ({
      ...habit,
      completedOnDate: habit.completedDates.includes(dateStr),
    }));
  }, [habits, dateStr]);

  // Get tasks due on selected date
  const tasksDueOnDate = useMemo(() => {
    return tasksWithDeadlines.filter(task => 
      task.deadline && isSameDay(new Date(task.deadline), selectedDate)
    );
  }, [tasksWithDeadlines, selectedDate]);

  // Get goals with deadlines
  const goalsWithDeadlines = useMemo(() => {
    return goals.filter(g => g.deadline).map(g => ({
      ...g,
      dueOnDate: g.deadline && isSameDay(new Date(g.deadline), selectedDate),
    }));
  }, [goals, selectedDate]);

  // Modifier for days with events
  const modifiers = useMemo(() => {
    const taskDates = tasksWithDeadlines.map(t => new Date(t.deadline!));
    const habitDates = habits.flatMap(h => h.completedDates.map(d => new Date(d)));
    const goalDates = goals.filter(g => g.deadline).map(g => new Date(g.deadline!));
    
    return {
      hasTask: taskDates,
      hasHabit: habitDates,
      hasGoal: goalDates,
    };
  }, [tasksWithDeadlines, habits, goals]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    setSelectedDate(new Date());
    setCurrentMonth(new Date());
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gradient-cyan">Calendar</h1>
          <p className="text-muted-foreground mt-1">View your tasks, goals, and habits</p>
        </div>
        <Button variant="outline" onClick={handleToday} className="gap-2">
          <CalendarIcon className="w-4 h-4" />
          Today
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3 glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            modifiers={modifiers}
            modifiersStyles={{
              hasTask: { 
                borderBottom: "2px solid hsl(var(--primary))",
              },
              hasHabit: {
                backgroundColor: "hsl(var(--accent) / 0.2)",
              },
              hasGoal: {
                borderBottom: "2px solid hsl(var(--secondary))",
              },
            }}
            className="w-full [&_.rdp-months]:justify-center [&_.rdp-cell]:w-full [&_.rdp-head_cell]:w-full [&_.rdp-button]:w-full [&_.rdp-table]:w-full"
          />
          
          <div className="flex items-center justify-center gap-6 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span>Task</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-accent" />
              <span>Habit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
              <span>Goal</span>
            </div>
          </div>
        </div>

        {/* Day Details */}
        <div className="lg:col-span-2 glass rounded-2xl p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" />
            {format(selectedDate, "EEEE, MMM d")}
          </h3>
          
          <ScrollArea className="h-[350px]">
            <div className="space-y-3 pr-2">
              {/* Tasks */}
              {tasksDueOnDate.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Tasks Due
                  </div>
                  {tasksDueOnDate.map(task => (
                    <div 
                      key={task.id} 
                      className={cn(
                        "p-2.5 rounded-lg bg-muted/20 border-l-2",
                        task.completed ? "border-primary/50 opacity-60" : "border-primary"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{task.listIcon}</span>
                        <span className={cn("text-sm font-medium", task.completed && "line-through")}>
                          {task.title}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 ml-6">
                        {task.listName}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Goals */}
              {goalsWithDeadlines.filter(g => g.dueOnDate).map(goal => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <Target className="w-3.5 h-3.5" />
                    Goal Deadline
                  </div>
                  <div className="p-2.5 rounded-lg bg-secondary/10 border-l-2 border-secondary">
                    <div className="text-sm font-medium">{goal.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {goal.progress}% complete
                    </div>
                  </div>
                </div>
              ))}

              {/* Habits */}
              {habitsOnDate.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <Repeat className="w-3.5 h-3.5" />
                    Habits
                  </div>
                  {habitsOnDate.map(habit => (
                    <div 
                      key={habit.id} 
                      className={cn(
                        "p-2.5 rounded-lg border-l-2 flex items-center justify-between",
                        habit.completedOnDate 
                          ? "bg-accent/20 border-accent" 
                          : "bg-muted/20 border-muted-foreground/30"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{habit.icon}</span>
                        <span className="text-sm font-medium">{habit.name}</span>
                      </div>
                      <Badge variant={habit.completedOnDate ? "default" : "outline"} className="text-xs">
                        {habit.completedOnDate ? "Done" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {tasksDueOnDate.length === 0 && 
               goalsWithDeadlines.filter(g => g.dueOnDate).length === 0 && 
               habitsOnDate.every(h => !h.completedOnDate) && (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No events on this day</p>
                  <p className="text-xs mt-1">Add tasks, goals, or habits to see them here</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

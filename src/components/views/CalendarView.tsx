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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleNextMonth}>
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
            className="w-full"
          />
          
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-b-2 border-primary" />
              <span>Task due</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-accent/30 rounded" />
              <span>Habit completed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-b-2 border-secondary" />
              <span>Goal deadline</span>
            </div>
          </div>
        </div>

        {/* Day Details */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">
            {format(selectedDate, "EEEE, MMMM d")}
          </h3>
          
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {/* Tasks */}
              {tasksDueOnDate.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4" />
                    Tasks Due
                  </div>
                  {tasksDueOnDate.map(task => (
                    <div 
                      key={task.id} 
                      className={cn(
                        "p-3 rounded-lg bg-muted/20 border-l-2",
                        task.completed ? "border-primary/50 opacity-60" : "border-primary"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span>{task.listIcon}</span>
                        <span className={cn("font-medium", task.completed && "line-through")}>
                          {task.title}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {task.listName}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Goals */}
              {goalsWithDeadlines.filter(g => g.dueOnDate).map(goal => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Target className="w-4 h-4" />
                    Goal Deadline
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/10 border-l-2 border-secondary">
                    <div className="font-medium">{goal.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {goal.progress}% complete
                    </div>
                  </div>
                </div>
              ))}

              {/* Habits */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Repeat className="w-4 h-4" />
                  Habits
                </div>
                {habitsOnDate.map(habit => (
                  <div 
                    key={habit.id} 
                    className={cn(
                      "p-3 rounded-lg border-l-2 flex items-center justify-between",
                      habit.completedOnDate 
                        ? "bg-accent/20 border-accent" 
                        : "bg-muted/20 border-muted-foreground/30"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{habit.icon}</span>
                      <span className="font-medium">{habit.name}</span>
                    </div>
                    <Badge variant={habit.completedOnDate ? "default" : "outline"}>
                      {habit.completedOnDate ? "Done" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Empty state */}
              {tasksDueOnDate.length === 0 && 
               goalsWithDeadlines.filter(g => g.dueOnDate).length === 0 && 
               habitsOnDate.every(h => !h.completedOnDate) && (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No events on this day</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

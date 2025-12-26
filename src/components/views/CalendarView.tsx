import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay, addMonths, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle2, Target, Repeat, Calendar as CalendarIcon, ExternalLink } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function CalendarView() {
  const { todoLists, goals, habits } = useAppStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

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

  const handleConnectGoogle = () => {
    // Placeholder for Google OAuth flow
    toast.info("Google Calendar integration", {
      description: "This feature will be available soon. For now, use the internal calendar.",
    });
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-gradient-brand">Calendar</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">View your tasks, goals, and habits</p>
        </div>
        <div className="flex items-center gap-2">
          {!isGoogleConnected && (
            <Button 
              variant="outline" 
              onClick={handleConnectGoogle} 
              className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/10"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Connect Google Calendar
            </Button>
          )}
          <Button variant="outline" onClick={handleToday} className="gap-2">
            <CalendarIcon className="w-4 h-4" />
            Today
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        {/* Calendar - Expanded to take more space */}
        <div className="lg:col-span-3 glass rounded-2xl p-4 md:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-semibold text-primary">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-primary/10" onClick={handlePrevMonth} aria-label="Previous month">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-primary/10" onClick={handleNextMonth} aria-label="Next month">
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 min-h-[500px]">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              modifiers={modifiers}
              modifiersStyles={{
                hasTask: { 
                  borderBottom: "3px solid hsl(var(--primary))",
                },
                hasHabit: {
                  backgroundColor: "hsl(var(--accent) / 0.2)",
                },
                hasGoal: {
                  borderBottom: "3px solid hsl(var(--secondary))",
                },
              }}
              className="w-full h-full [&_.rdp-months]:h-full [&_.rdp-months]:justify-center [&_.rdp-month]:h-full [&_.rdp-month]:flex [&_.rdp-month]:flex-col [&_.rdp-table]:flex-1 [&_.rdp-tbody]:flex [&_.rdp-tbody]:flex-col [&_.rdp-tbody]:flex-1 [&_.rdp-cell]:flex-1 [&_.rdp-head_cell]:w-full [&_.rdp-button]:w-full [&_.rdp-button]:h-full [&_.rdp-button]:min-h-[60px] [&_.rdp-button]:text-lg [&_.rdp-row]:flex-1"
            />
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border/50 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>Task Due</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span>Habit Done</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-secondary" />
              <span>Goal Deadline</span>
            </div>
          </div>
        </div>

        {/* Day Details Sidebar */}
        <div className="glass rounded-2xl p-4 md:p-5 flex flex-col">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            {format(selectedDate, "EEEE, MMM d")}
          </h3>
          
          <ScrollArea className="flex-1">
            <div className="space-y-4 pr-2">
              {/* Google Calendar Events placeholder */}
              {isGoogleConnected && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    </svg>
                    Google Events
                  </div>
                  <p className="text-sm text-muted-foreground">No events from Google Calendar</p>
                </div>
              )}

              {/* Tasks */}
              {tasksDueOnDate.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-primary uppercase tracking-wide">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Tasks Due
                  </div>
                  {tasksDueOnDate.map(task => (
                    <div 
                      key={task.id} 
                      className={cn(
                        "p-3 rounded-lg bg-primary/10 border-l-3",
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
                  <div className="flex items-center gap-2 text-xs font-medium text-secondary uppercase tracking-wide">
                    <Target className="w-3.5 h-3.5" />
                    Goal Deadline
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/15 border-l-3 border-secondary">
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
                  <div className="flex items-center gap-2 text-xs font-medium text-accent uppercase tracking-wide">
                    <Repeat className="w-3.5 h-3.5" />
                    Habits
                  </div>
                  {habitsOnDate.map(habit => (
                    <div 
                      key={habit.id} 
                      className={cn(
                        "p-3 rounded-lg border-l-3 flex items-center justify-between",
                        habit.completedOnDate 
                          ? "bg-accent/15 border-accent" 
                          : "bg-muted/30 border-muted-foreground/30"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{habit.icon}</span>
                        <span className="text-sm font-medium">{habit.name}</span>
                      </div>
                      <Badge 
                        variant={habit.completedOnDate ? "default" : "outline"} 
                        className={cn(
                          "text-xs",
                          habit.completedOnDate && "bg-accent text-accent-foreground"
                        )}
                      >
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
                  <CalendarIcon className="w-10 h-10 mx-auto mb-3 opacity-40 text-primary" />
                  <p className="text-sm font-medium">No events on this day</p>
                  <p className="text-xs mt-1">Add tasks, goals, or habits to see them here</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Connect Google CTA if not connected */}
          {!isGoogleConnected && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <button 
                onClick={handleConnectGoogle}
                className="w-full p-3 rounded-lg bg-muted/30 hover:bg-muted/50 border border-dashed border-border transition-colors text-center group"
              >
                <ExternalLink className="w-4 h-4 mx-auto mb-1 text-muted-foreground group-hover:text-primary transition-colors" />
                <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                  Connect Google Calendar to sync events
                </p>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

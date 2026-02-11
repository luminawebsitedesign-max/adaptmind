import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay, addMonths, subMonths, startOfDay, eachDayOfInterval, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle2, Target, Repeat, Calendar as CalendarIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

// Normalize dates to local midnight to avoid timezone drift.
const toLocalMidnight = (date: Date | string): Date => {
  if (typeof date === "string") {
    // Handle YYYY-MM-DD explicitly as local date
    if (date.length === 10 && date.includes("-")) {
      const [year, month, day] = date.split("-").map(Number);
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    }
    return startOfDay(new Date(date));
  }
  return startOfDay(date);
};

export function CalendarView() {
  const { todoLists, goals, habits } = useAppStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get all tasks with deadlines
  const tasksWithDeadlines = useMemo(() => {
    return todoLists.flatMap((list) =>
      list.items.filter((item) => item.deadline).map((item) => ({
        ...item,
        listName: list.name,
        listIcon: list.icon,
      }))
    );
  }, [todoLists]);

  // Get habits completed on selected date
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const habitsOnDate = useMemo(() => {
    return habits.map((habit) => ({
      ...habit,
      completedOnDate: habit.completedDates.includes(dateStr),
    }));
  }, [habits, dateStr]);

  // Get tasks due on selected date
  const tasksDueOnDate = useMemo(() => {
    return tasksWithDeadlines.filter(
      (task) => task.deadline && isSameDay(toLocalMidnight(task.deadline), toLocalMidnight(selectedDate))
    );
  }, [tasksWithDeadlines, selectedDate]);

  // Goals w/ derived local-midnight start/end + range dates
  // RULE: duration is inclusive of both start and end days.
  // A 7-day goal starting Jan 7 highlights Jan 7 through Jan 13 (7 days).
  // But user prefers: 7-day goal = Jan 7-14 (includes end date as "day 7").
  // So we use: end = start + duration (not duration-1).
  const goalsWithDates = useMemo(() => {
    const today = toLocalMidnight(new Date());

    return goals.map((g) => {
      const start = g.startDate
        ? toLocalMidnight(g.startDate)
        : g.createdAt
          ? toLocalMidnight(g.createdAt)
          : today;

      // Derive inclusive end date if missing
      let endInclusive: Date | null = g.deadline ? toLocalMidnight(g.deadline) : null;
      if (!endInclusive) {
        if (g.category === "short") {
          // Short-term = 7-day, ends on day 7 (start + 7 days total, i.e. start is day 0)
          endInclusive = addDays(start, 7);
        } else if (g.category === "medium") {
          // Medium-term = ~1 month = 30 days
          endInclusive = addDays(start, 30);
        } else if (g.category === "custom" && g.customDuration) {
          // Custom: N-day goal, highlights N days starting from start
          // e.g. 7-day goal from Jan 7 highlights Jan 7-13 (7 days)
          endInclusive = addDays(start, Math.max(1, g.customDuration) - 1);
        }
      }

      const end = endInclusive ?? start;
      const rangeDays = eachDayOfInterval({ start, end });
      const selectedLocal = toLocalMidnight(selectedDate);

      return {
        ...g,
        start,
        end,
        rangeDays,
        dueOnDate: isSameDay(end, selectedLocal),
        startsOnDate: isSameDay(start, selectedLocal),
      };
    });
  }, [goals, selectedDate]);

  // Modifier for days with events
  const modifiers = useMemo(() => {
    const taskDates = tasksWithDeadlines.map((t) => toLocalMidnight(t.deadline!));
    const habitDates = habits.flatMap((h) => h.completedDates.map((d) => toLocalMidnight(d)));

    const goalRangeDates = goalsWithDates.flatMap((g) => g.rangeDays);

    return {
      hasTask: taskDates,
      hasHabit: habitDates,
      hasGoal: goalRangeDates,
    };
  }, [tasksWithDeadlines, habits, goalsWithDates]);


  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    setSelectedDate(new Date());
    setCurrentMonth(new Date());
  };

  return (
    <div className="h-full flex flex-col animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-gradient-brand">Calendar</h1>
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-secondary/20 text-secondary border border-secondary/30">
            Beta
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
        </div>
      </div>

      {/* Main Content - Full height grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 min-h-0 overflow-hidden">
        {/* Calendar Container */}
        <div className="rounded-2xl p-5 md:p-6 flex flex-col bg-card/80 border border-border/40 shadow-lg overflow-hidden">
          {/* Month Header with Navigation */}
          <div className="flex items-center justify-between mb-5 shrink-0">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground tracking-tight">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 md:h-10 md:w-10 hover:bg-primary/10 border-border/50" 
                onClick={handlePrevMonth} 
                aria-label="Previous month"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 md:h-10 md:w-10 hover:bg-primary/10 border-border/50" 
                onClick={handleNextMonth} 
                aria-label="Next month"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* Calendar - Fills remaining space */}
          <div className="flex-1 min-h-0 overflow-hidden">
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
                  backgroundColor: "hsl(var(--accent) / 0.15)",
                },
                hasGoal: {
                  borderBottom: "3px solid hsl(var(--secondary))",
                },
              }}
              showOutsideDays={true}
              className={cn(
                "w-full h-full",
                // Months container
                "[&_.rdp-months]:h-full [&_.rdp-months]:w-full",
                "[&_.rdp-month]:h-full [&_.rdp-month]:w-full [&_.rdp-month]:flex [&_.rdp-month]:flex-col",
                // Table layout
                "[&_.rdp-table]:flex-1 [&_.rdp-table]:w-full",
                "[&_.rdp-thead]:mb-2",
                "[&_.rdp-head_row]:flex [&_.rdp-head_row]:w-full",
                "[&_.rdp-head_cell]:flex-1 [&_.rdp-head_cell]:text-muted-foreground [&_.rdp-head_cell]:font-semibold [&_.rdp-head_cell]:text-xs [&_.rdp-head_cell]:md:text-sm [&_.rdp-head_cell]:pb-3 [&_.rdp-head_cell]:uppercase [&_.rdp-head_cell]:tracking-wide [&_.rdp-head_cell]:text-center",
                // Body layout
                "[&_.rdp-tbody]:flex [&_.rdp-tbody]:flex-col [&_.rdp-tbody]:flex-1 [&_.rdp-tbody]:gap-1",
                "[&_.rdp-row]:flex [&_.rdp-row]:flex-1 [&_.rdp-row]:gap-1",
                // Cell styling
                "[&_.rdp-cell]:flex-1 [&_.rdp-cell]:p-0",
                // Day button styling (layout only; hover styling handled by <Calendar /> to avoid global hover)
                "[&_.rdp-button]:w-full [&_.rdp-button]:h-full [&_.rdp-button]:rounded-xl [&_.rdp-button]:min-h-[44px] [&_.rdp-button]:md:min-h-[52px]",
                "[&_.rdp-button]:text-sm [&_.rdp-button]:md:text-base [&_.rdp-button]:font-medium",
                "[&_.rdp-button]:transition-colors",
                "[&_.rdp-button]:focus:outline-none [&_.rdp-button]:focus-visible:ring-2 [&_.rdp-button]:focus-visible:ring-primary/50 [&_.rdp-button]:focus-visible:ring-offset-0",
                // Selected day
                "[&_.rdp-day_selected]:bg-primary [&_.rdp-day_selected]:text-primary-foreground [&_.rdp-day_selected]:shadow-md",
                // Today
                "[&_.rdp-day_today]:ring-2 [&_.rdp-day_today]:ring-primary/50 [&_.rdp-day_today]:bg-primary/10"
              )}
            />
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-8 mt-4 pt-4 border-t border-border/40 text-xs text-muted-foreground shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="font-medium">Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-accent" />
              <span className="font-medium">Habits</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
              <span className="font-medium">Goals</span>
            </div>
          </div>
        </div>

        {/* Day Details Sidebar */}
        <div className="rounded-2xl p-4 flex flex-col bg-card/80 border border-border/40 shadow-lg overflow-hidden">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 shrink-0">
            <CalendarIcon className="w-5 h-5 text-primary" />
            {format(selectedDate, "EEEE, MMM d")}
          </h3>
          
          <ScrollArea className="flex-1">
            <div className="space-y-4 pr-2">
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
              {goalsWithDates.filter((g) => g.dueOnDate || g.startsOnDate).length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-secondary uppercase tracking-wide">
                    <Target className="w-3.5 h-3.5" />
                    Goals
                  </div>
                  {goalsWithDates
                    .filter((g) => g.dueOnDate || g.startsOnDate)
                    .map((goal) => (
                      <div key={goal.id} className="p-3 rounded-lg bg-secondary/15 border-l-3 border-secondary">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <span className="text-base">{goal.icon ?? "🎯"}</span>
                            <span>{goal.title}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/20 text-secondary">
                            {goal.startsOnDate ? "Starts" : "Ends"}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {goal.progress}% complete • {goal.category === "custom" ? "Custom" : goal.category === "short" ? "Short-term" : "Medium-term"}
                        </div>
                      </div>
                    ))}
                </div>
              )}


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

              {/* Empty state for selected day */}
              {tasksDueOnDate.length === 0 && 
               goalsWithDates.filter((g) => g.dueOnDate || g.startsOnDate).length === 0 && 
               habitsOnDate.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-10 h-10 mx-auto mb-3 opacity-40 text-primary" />
                  <p className="text-sm font-medium">Nothing scheduled</p>
                  <p className="text-xs mt-1">Add tasks with deadlines, set goal due dates, or track habits to see activity here</p>
                </div>
              )}

              {/* Empty state when no habits exist */}
              {tasksDueOnDate.length === 0 && 
               goalsWithDates.filter((g) => g.dueOnDate).length === 0 && 
               habitsOnDate.length > 0 && 
               habitsOnDate.every(h => !h.completedOnDate) && (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-10 h-10 mx-auto mb-3 opacity-40 text-primary" />
                  <p className="text-sm font-medium">No events on this day</p>
                  <p className="text-xs mt-1">Complete your habits or add tasks with deadlines</p>
                </div>
              )}
            </div>
          </ScrollArea>

        </div>
      </div>
    </div>
  );
}

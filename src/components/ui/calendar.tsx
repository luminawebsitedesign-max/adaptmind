import * as React from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-full h-full select-none", className)}
      classNames={{
        months: "flex flex-col h-full w-full",
        month: "flex flex-col h-full w-full",
        // Completely hide caption and nav - custom header is used externally
        caption: "hidden",
        caption_label: "hidden",
        nav: "hidden",
        nav_button: "hidden",
        nav_button_previous: "hidden",
        nav_button_next: "hidden",
        table: "w-full h-full border-collapse table-fixed flex-1 flex flex-col border-0",
        head_row: "flex w-full border-0",
        head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] text-center border-0",
        row: "flex w-full flex-1 border-0",
        cell: cn(
          "flex-1 text-center text-sm p-0.5 relative border-0",
          "focus-within:relative focus-within:z-20",
          // Disable range selection hover styles completely
          "[&:has([aria-selected])]:bg-transparent"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "w-full h-full p-0 font-normal",
          "focus:outline-none focus-visible:outline-none focus:ring-0",
          // Prevent hover from affecting siblings
          "hover:bg-accent hover:text-accent-foreground"
        ),
        // Range-related classes are intentionally disabled (single-date calendar only)
        day_range_end: "",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "day-outside text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };

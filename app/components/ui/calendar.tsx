"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { cn } from "../../lib/utils"
import { buttonVariants } from "./button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-0", className)}
      classNames={{
        months: "w-full",
        month: "w-full space-y-0",
        caption: "flex justify-center relative items-center h-14 bg-gray-50 rounded-t-lg border-b",
        caption_label: "text-xl font-semibold text-gray-900",
        nav: "flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-transparent p-0 hover:bg-gray-100"
        ),
        nav_button_previous: "absolute left-2",
        nav_button_next: "absolute right-2",
        table: "w-full border-collapse",
        head_row: "grid grid-cols-7 border-b border-gray-200",
        head_cell: cn(
          "text-gray-500 font-semibold",
          "h-10 flex items-center justify-center text-sm",
          "border-r last:border-r-0"
        ),
        row: "grid grid-cols-7",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          "border-b border-r last:border-r-0 h-[80px]",
          "[&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
        ),
        day: cn(
          "h-full w-full p-2",
          "flex items-start justify-end",
          "hover:bg-gray-50 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        ),
        day_selected: cn(
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
          "focus:bg-primary focus:text-primary-foreground",
          "after:absolute after:inset-0 after:border-2 after:border-primary"
        ),
        day_today: cn(
          "bg-accent/50 text-accent-foreground",
          "font-semibold"
        ),
        day_outside: "text-muted-foreground/50",
        day_disabled: "text-muted-foreground/50",
        day_range_middle: "aria-selected:bg-accent",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

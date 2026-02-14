"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { Calendar } from "@/components/ui/Calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/Popover"
import { Field, FieldLabel } from "@/components/ui/Field"

interface DatePickerProps {
    date?: Date
    setDate: (date?: Date) => void
    label?: string
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function DatePicker({
    date,
    setDate,
    label,
    placeholder = "Select date",
    className,
    disabled,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false)

    return (
        <Field className={cn("w-full space-y-1", className)}>
            {label && <FieldLabel className="text-xs font-bold text-gray-500 leading-normal">{label}</FieldLabel>}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        disabled={disabled}
                        className={cn(
                            "w-full justify-start text-left font-normal border border-gray-300 bg-white px-3 h-10 rounded-xl transition-all duration-200 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-0",
                            !date && "text-gray-400",
                            open && "border-gray-900 ring-2 ring-gray-900 ring-offset-0"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                        {date ? format(date!, "yyyy-MM-dd") : <span className="text-gray-400">{placeholder}</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border border-gray-200 shadow-lg rounded-xl overflow-hidden" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => {
                            setDate(d)
                            setOpen(false)
                        }}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </Field>
    )
}

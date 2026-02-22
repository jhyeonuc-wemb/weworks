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
    mode?: "date" | "month"
}

function MonthCalendar({ date, setDate, onSelect }: { date?: Date, setDate: (date: Date) => void, onSelect: () => void }) {
    const [year, setYear] = React.useState(date ? date.getFullYear() : new Date().getFullYear())

    const handlePreviousYear = () => setYear(year - 1)
    const handleNextYear = () => setYear(year + 1)

    const handleMonthSelect = (monthIndex: number) => {
        const newDate = new Date(year, monthIndex, 1)
        setDate(newDate)
        onSelect()
    }

    const months = [
        "1월", "2월", "3월", "4월", "5월", "6월",
        "7월", "8월", "9월", "10월", "11월", "12월"
    ]

    return (
        <div className="p-4 bg-white rounded-xl shadow-xl border border-gray-100 w-[280px]">
            <div className="flex justify-between items-center mb-4">
                <button
                    type="button"
                    onClick={handlePreviousYear}
                    className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                    <span className="sr-only">Previous year</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 text-gray-500"
                    >
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                </button>
                <div className="font-bold text-gray-800">{year}년</div>
                <button
                    type="button"
                    onClick={handleNextYear}
                    className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                    <span className="sr-only">Next year</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 text-gray-500"
                    >
                        <path d="m9 18 6-6-6-6" />
                    </svg>
                </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {months.map((month, index) => {
                    const isSelected = date && date.getFullYear() === year && date.getMonth() === index
                    return (
                        <button
                            key={month}
                            type="button"
                            onClick={() => handleMonthSelect(index)}
                            className={cn(
                                "h-10 text-sm rounded-lg transition-all hover:bg-indigo-50 hover:text-indigo-600 font-medium",
                                isSelected ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white shadow-sm" : "text-gray-700 bg-transparent"
                            )}
                        >
                            {month}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export function DatePicker({
    date,
    setDate,
    label,
    placeholder = "Select date",
    className,
    buttonClassName,
    disabled,
    dateFormat = "yyyy-MM-dd",
    mode = "date",
}: DatePickerProps & { dateFormat?: string; buttonClassName?: string }) {
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
                            "w-full justify-start text-left font-normal border border-gray-300 bg-white px-3 h-10 rounded-xl transition-all duration-200 focus:outline-none focus:ring-0",
                            !date && "text-gray-400",
                            buttonClassName,
                            disabled && "opacity-100 cursor-default text-gray-900 hover:bg-white"
                        )}
                    >
                        {!disabled && <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />}
                        {date ? (
                            <span className={cn(disabled ? "text-gray-900" : "text-foreground")}>
                                {format(date!, dateFormat)}
                            </span>
                        ) : (
                            <span className="text-gray-400">{placeholder}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border border-gray-200 shadow-lg rounded-xl overflow-hidden" align="start">
                    {mode === "month" ? (
                        <MonthCalendar
                            date={date}
                            setDate={(d) => setDate(d)}
                            onSelect={() => setOpen(false)}
                        />
                    ) : (
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(d) => {
                                setDate(d)
                                setOpen(false)
                            }}
                            initialFocus
                        />
                    )}
                </PopoverContent>
            </Popover>
        </Field>
    )
}

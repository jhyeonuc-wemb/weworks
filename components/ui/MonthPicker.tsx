"use client"

import * as React from "react"
import { format, addYears, subYears, setMonth as setMonthFns, setYear } from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/Popover"
import { Field, FieldLabel } from "@/components/ui/Field"

interface MonthPickerProps {
    date?: Date
    setDate: (date?: Date) => void
    label?: string
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function MonthPicker({
    date,
    setDate,
    label,
    placeholder = "Select month",
    className,
    disabled,
}: MonthPickerProps) {
    const [open, setOpen] = React.useState(false)
    const [viewDate, setViewDate] = React.useState(date || new Date())

    React.useEffect(() => {
        if (open && date) {
            setViewDate(date)
        }
    }, [open, date])

    const handlePrevYear = () => setViewDate(subYears(viewDate, 1))
    const handleNextYear = () => setViewDate(addYears(viewDate, 1))

    const handleMonthSelect = (monthIndex: number) => {
        const newDate = setMonthFns(setYear(new Date(), viewDate.getFullYear()), monthIndex)
        setDate(newDate)
        setOpen(false)
    }

    return (
        <Field className={cn("w-full space-y-1", className)}>
            {label && <FieldLabel className="text-sm font-medium text-gray-700 leading-normal">{label}</FieldLabel>}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        disabled={disabled}
                        className={cn(
                            "w-full justify-center text-center font-normal border border-gray-300 bg-white px-3 h-10 rounded-xl transition-all duration-200 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-0",
                            !date && "text-gray-400",
                            open && "border-gray-900 ring-2 ring-gray-900 ring-offset-0"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                        {date ? format(date, "yyyy-MM") : <span className="text-gray-400">{placeholder}</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0 border border-gray-200 shadow-lg rounded-xl overflow-hidden" align="start">
                    <div className="p-3 bg-white">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <Button variant="ghost" size="sm" onClick={handlePrevYear} className="h-7 w-7 p-0 hover:bg-slate-100 rounded-lg">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="font-bold text-sm relative">
                                <select
                                    className="bg-transparent border-none text-center font-bold text-sm focus:ring-0 cursor-pointer py-1 hover:bg-slate-100 rounded"
                                    value={viewDate.getFullYear()}
                                    onChange={(e) => {
                                        const newYear = parseInt(e.target.value);
                                        const newDate = setYear(viewDate, newYear);
                                        setViewDate(newDate);
                                    }}
                                >
                                    {Array.from({ length: 21 }, (_, i) => viewDate.getFullYear() - 10 + i).map((year) => (
                                        <option key={year} value={year}>{year}년</option>
                                    ))}
                                </select>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleNextYear} className="h-7 w-7 p-0 hover:bg-slate-100 rounded-lg">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <Button
                                    key={i}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMonthSelect(i)}
                                    className={cn(
                                        "h-9 w-full text-sm font-normal rounded-lg",
                                        date && date.getFullYear() === viewDate.getFullYear() && date.getMonth() === i
                                            ? "bg-gray-900 text-white hover:bg-gray-800 hover:text-white font-bold"
                                            : "hover:bg-slate-100 text-gray-700"
                                    )}
                                >
                                    {i + 1}월
                                </Button>
                            ))}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </Field>
    )
}

"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import { DayPicker, useDayPicker, CaptionProps } from "react-day-picker"
import { ko } from "date-fns/locale"
import { format } from "date-fns"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

// 커스텀 Caption 컴포넌트로 완전히 제어
function CustomCaption(props: any) {
    const { calendarMonth } = props;
    const { goToMonth, nextMonth, previousMonth } = useDayPicker();

    // calendarMonth.date를 사용
    const displayDate = calendarMonth?.date || new Date();
    const currentYear = displayDate.getFullYear();
    const currentMonth = displayDate.getMonth();

    const fromYear = 1900;
    const toYear = 2100;
    const years = Array.from({ length: toYear - fromYear + 1 }, (_, i) => fromYear + i);
    const months = Array.from({ length: 12 }, (_, i) => i);

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDate = new Date(displayDate);
        newDate.setFullYear(parseInt(e.target.value));
        goToMonth(newDate);
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDate = new Date(displayDate);
        newDate.setMonth(parseInt(e.target.value));
        goToMonth(newDate);
    };

    const handlePreviousClick = () => {
        if (previousMonth) goToMonth(previousMonth);
    };

    const handleNextClick = () => {
        if (nextMonth) goToMonth(nextMonth);
    };

    return (
        <div className="flex justify-center items-center relative h-10 mb-4">
            {/* 이전 달 버튼 */}
            <button
                type="button"
                onClick={handlePreviousClick}
                disabled={!previousMonth}
                className="h-8 w-8 bg-transparent p-0 opacity-60 hover:opacity-100 disabled:opacity-30 absolute left-0 top-1 z-10 transition-all hover:bg-gray-50 rounded-full flex items-center justify-center"
            >
                <ChevronLeft className="h-5 w-5 text-gray-500" />
            </button>

            {/* 년/월 선택 드롭다운 */}
            <div className="flex items-center gap-2">
                {/* 년 선택 */}
                <div className="relative inline-flex items-center group px-2 py-1 rounded-md hover:bg-gray-50 transition-all cursor-pointer border border-transparent hover:border-gray-100">
                    <select
                        value={currentYear}
                        onChange={handleYearChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    >
                        {years.map((y) => (
                            <option key={y} value={y}>
                                {y}년
                            </option>
                        ))}
                    </select>
                    <div className="flex items-center gap-1 pointer-events-none">
                        <span className="text-[16px] font-bold text-gray-800 tracking-tight">
                            {currentYear}년
                        </span>
                        <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                </div>

                {/* 월 선택 */}
                <div className="relative inline-flex items-center group px-2 py-1 rounded-md hover:bg-gray-50 transition-all cursor-pointer border border-transparent hover:border-gray-100">
                    <select
                        value={currentMonth}
                        onChange={handleMonthChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    >
                        {months.map((m) => (
                            <option key={m} value={m}>
                                {m + 1}월
                            </option>
                        ))}
                    </select>
                    <div className="flex items-center gap-1 pointer-events-none">
                        <span className="text-[16px] font-bold text-gray-800 tracking-tight">
                            {currentMonth + 1}월
                        </span>
                        <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                </div>
            </div>

            {/* 다음 달 버튼 */}
            <button
                type="button"
                onClick={handleNextClick}
                disabled={!nextMonth}
                className="h-8 w-8 bg-transparent p-0 opacity-60 hover:opacity-100 disabled:opacity-30 absolute right-0 top-1 z-10 transition-all hover:bg-gray-50 rounded-full flex items-center justify-center"
            >
                <ChevronRight className="h-5 w-5 text-gray-500" />
            </button>
        </div>
    );
}

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-4 bg-white rounded-xl shadow-xl border border-gray-100", className)}
            classNames={{
                months: "flex flex-col",
                month: "space-y-4",
                nav: "hidden", // 기본 네비게이션 숨김
                button_previous: "hidden",
                button_next: "hidden",
                month_grid: "w-full border-collapse space-y-1",
                weekdays: "flex justify-between mb-2 border-b border-gray-50 pb-2",
                weekday: "text-gray-400 w-10 font-medium text-[0.85rem] text-center",
                week: "flex w-full mt-1.5 justify-between",
                day: "h-10 w-10 text-center text-[0.9rem] p-0 relative flex items-center justify-center",
                day_button: cn(
                    "h-9 w-9 p-0 font-normal hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all flex items-center justify-center"
                ),
                selected: cn(
                    "bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white rounded-lg shadow-md !opacity-100 font-semibold"
                ),
                today: "text-indigo-600 font-bold bg-indigo-50/50 rounded-lg",
                outside: "text-gray-300 opacity-40",
                disabled: "text-gray-200 opacity-40 cursor-not-allowed",
                hidden: "invisible",
                ...classNames,
            }}
            locale={ko}
            components={{
                MonthCaption: CustomCaption,
            }}
            fromYear={1900}
            toYear={2100}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }

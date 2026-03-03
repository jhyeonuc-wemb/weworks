"use client";

import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import koLocale from "@fullcalendar/core/locales/ko";
import { EventContentArg, EventClickArg } from "@fullcalendar/core";
import { cn } from "@/lib/utils";
import type { WorkLog } from "../types";


interface WorkLogCalendarProps {
  logs: WorkLog[];
  holidays?: Set<string>; // "YYYY-MM-DD" 형식의 휴일 날짜 집합
  onDateClick: (date: string, time?: string) => void;
  onEventClick: (log: WorkLog) => void;
  onDatesSet?: (info: { startStr: string; endStr: string }) => void;
  calendarRef?: React.RefObject<FullCalendar | null>;
}

const CATEGORY_BG: Record<string, string> = {
  "CD_002_05_01": "#3b82f6", // 일반 프로젝트
  "CD_002_05_02": "#a78bfa", // 프리세일즈
  "CD_002_05_03": "#f97316", // 무상 유지보수
  "CD_002_05_04": "#f59e0b", // 유상 유지보수
  "CD_002_05_05": "#6b7280", // 일반업무
  "CD_002_05_06": "#10b981", // RnD
  "CD_002_05_07": "#64748b", // 기타
};


const DEFAULT_COLOR = "#94a3b8";

function renderEventContent(arg: EventContentArg) {
  const log: WorkLog = arg.event.extendedProps.log;
  const isPlan = log.logType === "plan";
  const label = log.title || log.projectName || log.category || "작업";

  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5 w-full overflow-hidden"
      title={`${log.startTime?.slice(0, 5) || ""} ${label}\n${log.memo || ""}`}
    >
      <div
        className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0",
          isPlan ? "bg-blue-200" : "bg-white/80"
        )}
      />
      <span className="text-[11px] font-medium text-white truncate leading-tight">
        {log.startTime ? `${log.startTime.slice(0, 5)} ` : ""}
        {label}
      </span>
    </div>
  );
}

export default function WorkLogCalendar({
  logs,
  holidays,
  onDateClick,
  onEventClick,
  onDatesSet,
  calendarRef,
}: WorkLogCalendarProps) {
  const events = logs.map((log) => {
    const color = CATEGORY_BG[log.category] || DEFAULT_COLOR;
    const start = log.startTime
      ? `${log.workDate}T${log.startTime}`
      : log.workDate;
    const end = log.endTime
      ? `${log.workDate}T${log.endTime}`
      : undefined;

    return {
      id: String(log.id),
      title: log.title || log.projectName || log.category || "작업",
      start,
      end,
      backgroundColor: color,
      borderColor: color,
      textColor: "#ffffff",
      display: "block",
      extendedProps: { log },
    };
  });

  const handleDateClick = (info: { dateStr: string }) => {
    const parts = info.dateStr.split("T");
    const date = parts[0];
    const time = parts[1] ? parts[1].slice(0, 5) : undefined;
    onDateClick(date, time);
  };

  const handleEventClick = (info: EventClickArg) => {
    const log: WorkLog = info.event.extendedProps.log;
    onEventClick(log);
  };

  // 휴일 여부 확인: YYYY-MM-DD 또는 is_recurring 휴일의 MM-DD 매칭
  const isHoliday = (dateStr: string) => {
    if (!holidays || holidays.size === 0) return false;
    // 정확한 날짜 매칭
    if (holidays.has(dateStr)) return true;
    return false;
  };

  const dayCellClassNames = (arg: { date: Date; isToday: boolean }) => {
    const dateStr = arg.date.toLocaleDateString("en-CA"); // YYYY-MM-DD
    return isHoliday(dateStr) ? ["fc-day-holiday"] : [];
  };

  return (
    <div className="fc-wrapper">
      <style>{`
        .fc-wrapper .fc {
          height: 100%;
          font-family: inherit;
        }
        .fc-wrapper .fc-toolbar-title {
          font-size: 1.1rem;
          font-weight: 700;
        }
        .fc-wrapper .fc-button {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-size: 0.8rem;
          font-weight: 600;
          border-radius: 8px;
          padding: 4px 10px;
          box-shadow: none;
        }
        .fc-wrapper .fc-button:hover {
          background: #e2e8f0;
          border-color: #cbd5e1;
        }
        .fc-wrapper .fc-button-primary:not(:disabled).fc-button-active,
        .fc-wrapper .fc-button-primary:not(:disabled):active {
          background: #0f172a;
          border-color: #0f172a;
          color: #fff;
        }
        .fc-wrapper .fc-today-button {
          background: #0f172a;
          border-color: #0f172a;
          color: #fff;
        }
        .fc-wrapper .fc-today-button:hover {
          background: #1e293b;
        }
        .fc-wrapper .fc-daygrid-day.fc-day-today {
          background-color: #eff6ff !important;
        }
        .fc-wrapper .fc-daygrid-day-number {
          font-size: 0.8rem;
          font-weight: 600;
          padding: 4px 6px;
          color: #374151;
        }
        .fc-wrapper .fc-day-sun .fc-daygrid-day-number,
        .fc-wrapper .fc-day-sun .fc-col-header-cell-cushion {
          color: #ef4444;
        }
        .fc-wrapper .fc-day-sat .fc-daygrid-day-number,
        .fc-wrapper .fc-day-sat .fc-col-header-cell-cushion {
          color: #3b82f6;
        }
        .fc-wrapper .fc-col-header-cell-cushion {
          font-size: 0.8rem;
          font-weight: 700;
          padding: 8px 4px;
          color: #6b7280;
        }
        .fc-wrapper .fc-event {
          border-radius: 5px;
          cursor: pointer;
        }
        .fc-wrapper .fc-event:hover {
          opacity: 0.85;
        }
        .fc-wrapper .fc-daygrid-event-harness {
          margin-bottom: 1px;
        }
        .fc-wrapper .fc-theme-standard .fc-scrollgrid {
          border-radius: 12px;
          overflow: hidden;
          border-color: #e5e7eb;
        }
        .fc-wrapper td, .fc-wrapper th {
          border-color: #f3f4f6;
        }
        .fc-wrapper .fc-daygrid-day:hover {
          background-color: #f9fafb;
          cursor: pointer;
        }
        .fc-wrapper .fc-day-holiday .fc-daygrid-day-number,
        .fc-wrapper .fc-day-holiday .fc-col-header-cell-cushion {
          color: #ef4444;
        }
        .fc-wrapper .fc-day-holiday.fc-daygrid-day {
          background-color: #fff5f580 !important;
        }
        .fc-wrapper .fc-timegrid-slot {
          height: 40px;
        }
      `}</style>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={koLocale}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
        }}
        buttonText={{
          today: "오늘",
          month: "월",
          week: "주",
          day: "일",
          list: "목록",
        }}
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventContent={renderEventContent}
        datesSet={onDatesSet}
        dayCellClassNames={dayCellClassNames}
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        dayMaxEvents={4}
        height="auto"
        contentHeight="auto"
        firstDay={0}
        nowIndicator
        selectable={false}
        editable={false}
      />
    </div>
  );
}

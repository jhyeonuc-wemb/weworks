"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { WorkLogPanel } from "./components/WorkLogPanel";
import type FullCalendar from "@fullcalendar/react";
import type { WorkLog } from "./types";

// SSR 이슈 방지 — FullCalendar는 클라이언트에서만 렌더
const WorkLogCalendar = dynamic(
    () => import("./components/WorkLogCalendar"),
    { ssr: false }
);



export default function WorkLogsPage() {
    const today = new Date();
    const [logs, setLogs] = useState<WorkLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [holidays, setHolidays] = useState<Set<string>>(new Set());
    // useRef: 재렌더링 없이 로드된 연도 추적 (state 사용 시 handleDatesSet 불안정해짐)
    const loadedHolidayYearsRef = useRef<Set<number>>(new Set());

    const [dateFrom, setDateFrom] = useState(() => {
        const d = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        return d.toLocaleDateString("en-CA");
    });
    const [dateTo, setDateTo] = useState(() => {
        const d = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        return d.toLocaleDateString("en-CA");
    });

    // 입력 패널 상태
    const [panelOpen, setPanelOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedTime, setSelectedTime] = useState<string | undefined>();
    const [editLog, setEditLog] = useState<WorkLog | null>(null);

    const calendarRef = useRef<FullCalendar | null>(null);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/work-logs?dateFrom=${dateFrom}&dateTo=${dateTo}`);
            if (!res.ok) return;
            const data = await res.json();
            setLogs(data.items || []);
        } catch (e) {
            console.error("Failed to fetch work logs:", e);
        } finally {
            setLoading(false);
        }
    }, [dateFrom, dateTo]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // 뷰 범위의 휴일 로드 — ref 기반으로 리렌더링 없이 중복 fetch 방지
    useEffect(() => {
        const startYear = new Date(dateFrom).getFullYear();
        const endYear = new Date(dateTo).getFullYear();
        const yearsToLoad: number[] = [];
        for (let y = startYear; y <= endYear; y++) {
            if (!loadedHolidayYearsRef.current.has(y)) yearsToLoad.push(y);
        }
        if (yearsToLoad.length === 0) return;
        Promise.all(
            yearsToLoad.map(y => fetch(`/api/holidays?year=${y}`).then(r => r.json()))
        ).then(results => {
            yearsToLoad.forEach(y => loadedHolidayYearsRef.current.add(y));
            setHolidays(prev => {
                const next = new Set(prev);
                results.forEach(data => {
                    (data.holidays || []).forEach((h: { holiday_date: string }) => {
                        next.add(h.holiday_date);
                    });
                });
                return next;
            });
        }).catch(e => console.error("Failed to fetch holidays:", e));
    }, [dateFrom, dateTo]);

    // FullCalendar 뷰 변경 시 — dateFrom/dateTo만 의존해 안정적
    const handleDatesSet = useCallback((info: { startStr: string; endStr: string }) => {
        const from = info.startStr.split("T")[0];
        const to = info.endStr.split("T")[0];
        if (from !== dateFrom || to !== dateTo) {
            setDateFrom(from);
            setDateTo(to);
        }
    }, [dateFrom, dateTo]);

    const openPanel = (date: string, logOrTime?: WorkLog | string, time?: string) => {
        setSelectedDate(date);
        if (typeof logOrTime === "object" && logOrTime !== null) {
            setEditLog(logOrTime);
            setSelectedTime(undefined);
        } else {
            setEditLog(null);
            setSelectedTime(typeof logOrTime === "string" ? logOrTime : time);
        }
        setPanelOpen(true);
    };

    const handleSaved = () => {
        fetchLogs();
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* 페이지 헤더 */}
            <div className="flex items-start justify-between px-2">
                <div>
                    <div className="h-10 flex items-center">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            개인별 작업일지
                        </h1>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        나의 업무 계획 및 실행 내역을 관리합니다.
                        <span className="ml-2 text-xs">
                            {loading && <span className="text-blue-500">불러오는 중...</span>}
                        </span>
                    </p>
                </div>
                <div className="h-10 flex items-center gap-2">
                    {/* 범례 */}
                    <div className="flex items-center gap-3 mr-2">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                            <span className="text-xs text-gray-500">실행</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                            <span className="text-xs text-gray-500">계획</span>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            const todayStr = today.toISOString().split("T")[0];
                            openPanel(todayStr);
                        }}
                        className="h-10 px-4 rounded-xl bg-blue-600 text-white text-sm font-medium flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        작업
                    </button>
                </div>
            </div>

            {/* 캘린더 */}
            <div className="neo-light-card border border-border/40 p-4 min-h-[600px] bg-white">
                <WorkLogCalendar
                    logs={logs}
                    holidays={holidays}
                    onDateClick={(date, time) => openPanel(date, time)}
                    onEventClick={(log) => openPanel(log.workDate, log)}
                    onDatesSet={handleDatesSet}
                    calendarRef={calendarRef}
                />
            </div>

            {/* 작업 입력/수정 패널 */}
            <WorkLogPanel
                open={panelOpen}
                onOpenChange={setPanelOpen}
                initialDate={selectedDate}
                initialTime={selectedTime}
                editLog={editLog}
                onSaved={handleSaved}
            />
        </div>
    );
}

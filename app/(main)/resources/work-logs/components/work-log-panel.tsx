"use client";

import React, { useState, useEffect } from "react";
import { Save, Trash2, Clock } from "lucide-react";
import { DraggablePanel } from "@/components/ui/DraggablePanel";
import { DatePicker } from "@/components/ui/DatePicker";
import { useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { WorkLog } from "../types";

interface Project {
    id: number;
    name: string;
    code: string;
}

interface WorkLogPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialDate?: string; // yyyy-MM-dd
    initialTime?: string; // HH:MM (주간/일간 뷰 클릭 시간)
    editLog?: WorkLog | null;
    onSaved: () => void;
}

interface Category {
    id: number;
    code: string;
    name: string;
}

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
        TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
}

// 프로젝트 선택 노출 카테고리 코드 (일반 프로젝트, 프리세일즈)
const PROJECT_CATEGORY_CODES = ["CD_002_05_01", "CD_002_05_02"];

export function WorkLogPanel({
    open,
    onOpenChange,
    initialDate,
    initialTime,
    editLog,
    onSaved,
}: WorkLogPanelProps) {
    const { showToast } = useToast();
    const [saving, setSaving] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    const defaultForm = (): WorkLog => {
        const snapTime = (t: string): string => {
            const [h, m] = t.split(":").map(Number);
            const snapped = m < 30 ? 0 : 30;
            return `${String(h).padStart(2, "0")}:${String(snapped).padStart(2, "0")}`;
        };

        let start = "09:00";
        let end = "18:00";

        if (initialTime) {
            start = snapTime(initialTime);
            const endHour = parseInt(start.split(":")[0]) + 1;
            end = endHour >= 24 ? "23:30" : `${String(endHour).padStart(2, "0")}:${start.split(":")[1]}`;
        }
        return {
            workDate: initialDate || new Date().toLocaleDateString("en-CA"),
            startTime: start,
            endTime: end,
            logType: "actual",
            category: "",
            projectId: null,
            title: null,
            memo: null,
        };
    };

    const [form, setForm] = useState<WorkLog>(defaultForm());

    useEffect(() => {
        if (open) {
            if (editLog) {
                setForm({
                    ...editLog,
                    startTime: editLog.startTime ? editLog.startTime.substring(0, 5) : null,
                    endTime: editLog.endTime ? editLog.endTime.substring(0, 5) : null,
                });
            } else {
                setForm(defaultForm());
            }
        }
    }, [open, editLog, initialDate, initialTime]);

    useEffect(() => {
        fetch("/api/projects")
            .then((r) => r.json())
            .then((data) => setProjects(data.projects || []))
            .catch(() => { });
        fetch("/api/codes?parentCode=CD_002_05")
            .then((r) => r.json())
            .then((data) => setCategories(data.codes || []))
            .catch(() => { });
    }, []);

    const setField = (key: keyof WorkLog, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const setBusinessHours = () => {
        setForm((prev) => ({ ...prev, startTime: "09:00", endTime: "18:00" }));
    };

    const handleSave = async () => {
        if (!form.workDate) {
            showToast("날짜를 선택하세요.", "error");
            return;
        }
        setSaving(true);
        try {
            const url = form.id ? `/api/work-logs/${form.id}` : "/api/work-logs";
            const method = form.id ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error("저장 실패");
            showToast(form.id ? "수정되었습니다." : "저장되었습니다.", "success");
            onSaved();
            onOpenChange(false);
        } catch (e) {
            showToast("저장에 실패했습니다.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!form.id) return;
        if (!confirm("삭제하시겠습니까?")) return;
        try {
            const res = await fetch(`/api/work-logs/${form.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("삭제 실패");
            showToast("삭제되었습니다.", "success");
            onSaved();
            onOpenChange(false);
        } catch (e) {
            showToast("삭제에 실패했습니다.", "error");
        }
    };

    const showProject = PROJECT_CATEGORY_CODES.includes(form.category);

    return (
        <DraggablePanel
            open={open}
            onOpenChange={onOpenChange}
            title={form.id ? "작업 수정" : "작업 등록"}
            description="개인별 작업일지"
            panelWidth={520}
        >
            <div className="space-y-5">
                {/* 날짜 + 계획/실행 */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">날짜</label>
                        <DatePicker
                            date={(() => {
                                if (!form.workDate) return undefined;
                                // YYYY-MM-DD 형식의 앞 10자리만 사용
                                const dateStr = String(form.workDate).slice(0, 10);
                                const d = new Date(dateStr + "T00:00:00");
                                return isNaN(d.getTime()) ? undefined : d;
                            })()}
                            setDate={(d) => setField("workDate", d ? d.toLocaleDateString("en-CA") : "")}
                            className="h-10 w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">구분</label>
                        <div className="flex gap-2 h-10 items-center">
                            {(["actual", "plan"] as const).map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setField("logType", type)}
                                    className={cn(
                                        "flex-1 h-10 rounded-xl border text-sm font-medium transition-colors",
                                        form.logType === type
                                            ? type === "actual"
                                                ? "bg-slate-900 text-white border-slate-900"
                                                : "bg-blue-600 text-white border-blue-600"
                                            : "bg-white text-gray-500 border-gray-300 hover:border-gray-400"
                                    )}
                                >
                                    {type === "actual" ? "실행" : "계획"}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 시간 */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-medium text-gray-700">시간</label>
                        <button
                            type="button"
                            onClick={setBusinessHours}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                            <Clock className="h-3 w-3" />
                            업무시간 (09:00~18:00)
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={form.startTime || "09:00"}
                            onChange={(e) => setField("startTime", e.target.value)}
                            className="flex-1 h-10 rounded-xl border border-gray-300 text-sm px-3 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 focus:outline-none"
                        >
                            {TIME_OPTIONS.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                        <span className="text-gray-400 text-sm">~</span>
                        <select
                            value={form.endTime || "18:00"}
                            onChange={(e) => setField("endTime", e.target.value)}
                            className="flex-1 h-10 rounded-xl border border-gray-300 text-sm px-3 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 focus:outline-none"
                        >
                            {TIME_OPTIONS.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 업무 유형 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">업무 유형</label>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat.code}
                                type="button"
                                onClick={() => setField("category", cat.code)}
                                className={cn(
                                    "px-3 h-8 rounded-lg border text-sm font-medium transition-colors",
                                    form.category === cat.code
                                        ? "bg-slate-900 text-white border-slate-900"
                                        : "bg-white text-gray-500 border-gray-300 hover:border-gray-400"
                                )}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 프로젝트 선택 */}
                {showProject && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">프로젝트</label>
                        <select
                            value={form.projectId || ""}
                            onChange={(e) => setField("projectId", e.target.value ? Number(e.target.value) : null)}
                            className="w-full h-10 rounded-xl border border-gray-300 text-sm px-3 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 focus:outline-none"
                        >
                            <option value="">프로젝트 선택</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    [{p.code}] {p.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* 제목 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">제목</label>
                    <input
                        type="text"
                        value={form.title || ""}
                        onChange={(e) => setField("title", e.target.value || null)}
                        placeholder="작업 제목"
                        className="w-full h-10 rounded-xl border border-gray-300 text-sm px-3 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 focus:outline-none"
                    />
                </div>

                {/* 업무 내용 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">업무 내용</label>
                    <textarea
                        value={form.memo || ""}
                        onChange={(e) => setField("memo", e.target.value || null)}
                        placeholder="업무 내용을 입력하세요"
                        rows={4}
                        className="w-full rounded-xl border border-gray-300 text-sm px-3 py-2.5 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 focus:outline-none resize-none"
                    />
                </div>

                {/* 버튼 */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    {form.id ? (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 h-10 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                        >
                            <Trash2 className="h-4 w-4" />
                            삭제
                        </button>
                    ) : (
                        <div />
                    )}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 h-10 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 h-10 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
                        >
                            <Save className="h-4 w-4" />
                            {saving ? "저장 중..." : "저장"}
                        </button>
                    </div>
                </div>
            </div>
        </DraggablePanel>
    );
}

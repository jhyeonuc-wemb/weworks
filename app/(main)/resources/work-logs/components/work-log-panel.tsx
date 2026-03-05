"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Save, Trash2, Clock, ChevronDown, Repeat2 } from "lucide-react";
import { DraggablePanel } from "@/components/ui/DraggablePanel";
import { DatePicker } from "@/components/ui/DatePicker";
import { useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { WorkLog } from "../types";

// ─── 검색 가능한 인라인 드롭다운 ─────────────────────────────────────────────
interface ComboOption { value: number; label: string; }

function SearchableCombobox({
    options, value, onChange, placeholder,
}: {
    options: ComboOption[];
    value: number | null;
    onChange: (val: number | null) => void;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const [inputText, setInputText] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selected = options.find(o => o.value === value);

    useEffect(() => {
        if (!open) setInputText(selected?.label ?? "");
    }, [value, open, selected]);

    const filtered = options.filter(o =>
        o.label.toLowerCase().includes(inputText.toLowerCase())
    );

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setInputText(selected?.label ?? "");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [selected]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(e.target.value);
        setOpen(true);
        if (selected && e.target.value !== selected.label) onChange(null);
    };

    const handleFocus = () => { setInputText(""); setOpen(true); };
    const handleSelect = (opt: ComboOption) => { onChange(opt.value); setInputText(opt.label); setOpen(false); };
    const handleClear = () => { onChange(null); setInputText(""); setOpen(false); inputRef.current?.focus(); };

    return (
        <div ref={containerRef} className="relative">
            <div className={cn(
                "flex items-center w-full h-10 rounded-xl border text-sm transition-colors focus-within:ring-2 focus-within:ring-gray-900 focus-within:ring-offset-0",
                open ? "border-gray-900 bg-white" : "border-gray-300 bg-white hover:border-gray-400"
            )}>
                <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    placeholder={placeholder || "검색하여 선택"}
                    className="flex-1 h-full bg-transparent px-3 outline-none focus:outline-none focus:ring-0 focus:shadow-none text-sm text-gray-900 placeholder:text-gray-400"
                />
                {value !== null && (
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); handleClear(); }} className="px-2 text-gray-400 hover:text-gray-600">
                        <span className="text-xs leading-none">✕</span>
                    </button>
                )}
                <ChevronDown className={cn("h-4 w-4 text-gray-400 shrink-0 mr-2 transition-transform duration-150", open && "rotate-180")} />
            </div>
            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
                    <div className="overflow-y-auto max-h-52">
                        {filtered.length === 0 ? (
                            <div className="px-3 py-4 text-sm text-gray-400 text-center">검색 결과 없음</div>
                        ) : (
                            filtered.map(o => (
                                <div
                                    key={o.value}
                                    onMouseDown={(e) => { e.preventDefault(); handleSelect(o); }}
                                    className={cn(
                                        "px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 transition-colors",
                                        o.value === value ? "bg-slate-50 font-semibold text-slate-900" : "text-gray-700"
                                    )}
                                >
                                    {o.label}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

interface Project {
    id: number;
    name: string;
    projectCode: string | null;
    actualEndDate: string | null;
    projectTypeId: number | null;
    maintenanceFreeCode: string | null;
    maintenancePaidCode: string | null;
    researchCode: string | null;
}

interface WorkLogPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialDate?: string;
    initialTime?: string;
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

const PRESALES_CODE = "CD_002_05_02";
const GENERAL_CODE = "CD_002_05_01";
const MAINTENANCE_FREE_CODE = "CD_002_05_03";
const MAINTENANCE_PAID_CODE = "CD_002_05_04";
const RESEARCH_CODE = "CD_002_05_06";
const EXTRA_PROJECT_CODES = [MAINTENANCE_FREE_CODE, MAINTENANCE_PAID_CODE, RESEARCH_CODE];
const PROJECT_CATEGORY_CODES = [GENERAL_CODE, PRESALES_CODE, ...EXTRA_PROJECT_CODES];
const SUB_CATEGORY_CODES = ["CD_002_05_07", "CD_002_05_05"];

// 날짜 범위 내 모든 날짜 생성
function getDateRange(from: string, to: string): string[] {
    const dates: string[] = [];
    const start = new Date(from + "T00:00:00");
    const end = new Date(to + "T00:00:00");
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return dates;
    const cur = new Date(start);
    while (cur <= end) {
        dates.push(cur.toLocaleDateString("en-CA"));
        cur.setDate(cur.getDate() + 1);
    }
    return dates;
}

export function WorkLogPanel({
    open,
    onOpenChange,
    initialDate,
    initialTime,
    editLog,
    onSaved,
}: WorkLogPanelProps) {
    const { showToast, confirm } = useToast();
    const [saving, setSaving] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [subCategories, setSubCategories] = useState<Category[]>([]);
    const [projectTypeCodes, setProjectTypeCodes] = useState<Category[]>([]);
    const [projectTypeFilter, setProjectTypeFilter] = useState<string>("");

    // 반복 입력 상태
    const [repeatMode, setRepeatMode] = useState(false);
    const [repeatFrom, setRepeatFrom] = useState<string>("");
    const [repeatTo, setRepeatTo] = useState<string>("");
    const [excludeHolidays, setExcludeHolidays] = useState(true);
    const [holidays, setHolidays] = useState<Set<string>>(new Set());

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
            category: GENERAL_CODE,
            subCategory: null,
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
                setRepeatMode(false);
            } else {
                setForm(defaultForm());
                // 반복 모드 초기 날짜 세팅
                const today = initialDate || new Date().toLocaleDateString("en-CA");
                setRepeatFrom(today);
                setRepeatTo(today);
                setRepeatMode(false);
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
        fetch("/api/codes?parentCode=CD_002_05_01")
            .then((r) => r.json())
            .then((data) => {
                const codes = data.codes || [];
                setProjectTypeCodes(codes);
                if (codes.length > 0) setProjectTypeFilter(codes[0].id.toString());
            })
            .catch(() => { });
    }, []);

    // 반복 모드 활성화 시 or 날짜 범위 변경 시 해당 연도 휴일 로드
    useEffect(() => {
        if (!repeatMode || !repeatFrom) return;
        const year = repeatFrom.substring(0, 4);
        fetch(`/api/holidays?year=${year}`)
            .then(r => r.json())
            .then(data => {
                const set = new Set<string>((data.holidays || []).map((h: any) => h.holiday_date as string));
                setHolidays(set);
            })
            .catch(() => setHolidays(new Set()));
    }, [repeatMode, repeatFrom]);

    useEffect(() => {
        if (SUB_CATEGORY_CODES.includes(form.category)) {
            fetch(`/api/codes?parentCode=${form.category}`)
                .then((r) => r.json())
                .then((data) => setSubCategories(data.codes || []))
                .catch(() => setSubCategories([]));
        } else {
            setSubCategories([]);
        }
    }, [form.category]);

    const setField = (key: keyof WorkLog, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const setBusinessHours = () => {
        setForm((prev) => ({ ...prev, startTime: "09:00", endTime: "18:00" }));
    };

    // 단일 저장
    const handleSave = async () => {
        if (!form.workDate) { showToast("날짜를 선택하세요.", "error"); return; }
        setSaving(true);
        try {
            const url = form.id ? `/api/work-logs/${form.id}` : "/api/work-logs";
            const method = form.id ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error();
            showToast(form.id ? "수정되었습니다." : "저장되었습니다.", "success");
            onSaved();
            onOpenChange(false);
        } catch {
            showToast("저장에 실패했습니다.", "error");
        } finally {
            setSaving(false);
        }
    };

    // 반복 저장
    const handleRepeatSave = async () => {
        if (!repeatFrom || !repeatTo) { showToast("날짜 범위를 선택하세요.", "error"); return; }
        if (repeatFrom > repeatTo) { showToast("시작일이 종료일보다 늦습니다.", "error"); return; }

        let dates = getDateRange(repeatFrom, repeatTo);

        // 토/일 항상 제외
        dates = dates.filter(d => {
            const day = new Date(d + "T00:00:00").getDay();
            return day !== 0 && day !== 6;
        });

        // 휴일 제외
        if (excludeHolidays) {
            dates = dates.filter(d => !holidays.has(d));
        }

        if (dates.length === 0) {
            showToast("저장할 날짜가 없습니다 (주말/휴일 제외 후).", "warning");
            return;
        }

        setSaving(true);
        try {
            const results = await Promise.allSettled(
                dates.map(date =>
                    fetch("/api/work-logs", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ...form, workDate: date }),
                    })
                )
            );
            const failed = results.filter(r => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok)).length;
            if (failed === 0) {
                showToast(`${dates.length}일치 작업일지가 등록되었습니다.`, "success");
            } else {
                showToast(`${dates.length - failed}건 성공, ${failed}건 실패.`, "warning");
            }
            onSaved();
            onOpenChange(false);
        } catch {
            showToast("저장에 실패했습니다.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        if (!form.id) return;
        confirm({
            title: "작업 삭제",
            message: "이 작업일지를 삭제하시겠습니까?",
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/work-logs/${form.id}`, { method: "DELETE" });
                    if (!res.ok) throw new Error();
                    showToast("삭제되었습니다.", "success");
                    onSaved();
                    onOpenChange(false);
                } catch {
                    showToast("삭제에 실패했습니다.", "error");
                }
            },
        });
    };

    const today = new Date();
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const projectOptions = useMemo<ComboOption[]>(() => {
        if (form.category === PRESALES_CODE) {
            return projects.filter(p => !p.projectCode).map(p => ({ value: p.id, label: p.name }));
        }
        if (form.category === GENERAL_CODE) {
            return projects
                .filter(p => {
                    if (!p.projectCode) return false;
                    if (!p.actualEndDate) return true;
                    if (new Date(p.actualEndDate) > thisMonthEnd) return false;
                    if (projectTypeFilter && p.projectTypeId !== null) {
                        return p.projectTypeId.toString() === projectTypeFilter;
                    }
                    return true;
                })
                .map(p => ({ value: p.id, label: `[${p.projectCode}] ${p.name}` }));
        }
        if (EXTRA_PROJECT_CODES.includes(form.category)) {
            return projects
                .filter(p => {
                    if (form.category === MAINTENANCE_FREE_CODE) return !!p.maintenanceFreeCode;
                    if (form.category === MAINTENANCE_PAID_CODE) return !!p.maintenancePaidCode;
                    if (form.category === RESEARCH_CODE) return !!p.researchCode;
                    return false;
                })
                .map(p => {
                    const code = form.category === MAINTENANCE_FREE_CODE ? p.maintenanceFreeCode
                        : form.category === MAINTENANCE_PAID_CODE ? p.maintenancePaidCode
                            : p.researchCode;
                    return { value: p.id, label: `[${code}] ${p.name}` };
                });
        }
        return [];
    }, [projects, form.category, projectTypeFilter]);

    const handleCategoryChange = (code: string) => {
        setForm(prev => ({ ...prev, category: code, subCategory: null, projectId: null }));
        if (code === GENERAL_CODE && projectTypeCodes.length > 0) {
            setProjectTypeFilter(projectTypeCodes[0].id.toString());
        }
    };

    const showSubCategory = SUB_CATEGORY_CODES.includes(form.category) && subCategories.length > 0;
    const showProject = PROJECT_CATEGORY_CODES.includes(form.category);

    // 반복 모드 미리보기 날짜 수
    const previewCount = useMemo(() => {
        if (!repeatFrom || !repeatTo || repeatFrom > repeatTo) return 0;
        let dates = getDateRange(repeatFrom, repeatTo).filter(d => {
            const day = new Date(d + "T00:00:00").getDay();
            return day !== 0 && day !== 6;
        });
        if (excludeHolidays) dates = dates.filter(d => !holidays.has(d));
        return dates.length;
    }, [repeatFrom, repeatTo, excludeHolidays, holidays]);

    return (
        <DraggablePanel
            open={open}
            onOpenChange={onOpenChange}
            title={form.id ? "작업 수정" : "작업 등록"}
            description="개인별 작업일지"
            panelWidth={780}
        >
            <div className="space-y-5">

                {/* 반복 입력 토글 (신규 등록 시에만 표시) */}
                {!form.id && (
                    <div className="flex items-center gap-3 pb-1 border-b border-gray-100">
                        <button
                            type="button"
                            onClick={() => setRepeatMode(false)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm font-medium transition-colors border",
                                !repeatMode
                                    ? "bg-slate-900 text-white border-slate-900"
                                    : "bg-white text-gray-500 border-gray-300 hover:border-gray-400"
                            )}
                        >
                            단일 입력
                        </button>
                        <button
                            type="button"
                            onClick={() => setRepeatMode(true)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm font-medium transition-colors border",
                                repeatMode
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-gray-500 border-gray-300 hover:border-gray-400"
                            )}
                        >
                            <Repeat2 className="h-3.5 w-3.5" />
                            반복 입력
                        </button>
                        {repeatMode && previewCount > 0 && (
                            <span className="ml-auto text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                                {previewCount}일 등록 예정
                            </span>
                        )}
                    </div>
                )}

                {/* 날짜 행 */}
                <div className="grid grid-cols-4 gap-3">
                    {/* 날짜 영역 */}
                    <div className={repeatMode ? "col-span-2" : "col-span-1"}>
                        {!repeatMode ? (
                            <>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">날짜</label>
                                <DatePicker
                                    date={(() => {
                                        if (!form.workDate) return undefined;
                                        const d = new Date(String(form.workDate).slice(0, 10) + "T00:00:00");
                                        return isNaN(d.getTime()) ? undefined : d;
                                    })()}
                                    setDate={(d) => setField("workDate", d ? d.toLocaleDateString("en-CA") : "")}
                                    className="h-10 w-full"
                                />
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-4 mb-1.5">
                                    <label className="block text-sm font-medium text-gray-700">날짜 범위</label>
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={excludeHolidays}
                                            onChange={e => setExcludeHolidays(e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-gray-600">휴일 제외</span>
                                    </label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <DatePicker
                                        date={repeatFrom ? new Date(repeatFrom + "T00:00:00") : undefined}
                                        setDate={(d) => setRepeatFrom(d ? d.toLocaleDateString("en-CA") : "")}
                                        className="h-10 flex-1"
                                    />
                                    <span className="text-gray-400 text-sm shrink-0">~</span>
                                    <DatePicker
                                        date={repeatTo ? new Date(repeatTo + "T00:00:00") : undefined}
                                        setDate={(d) => setRepeatTo(d ? d.toLocaleDateString("en-CA") : "")}
                                        className="h-10 flex-1"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* 시간 - col-span-3 or col-span-2 */}
                    <div className={repeatMode ? "col-span-2" : "col-span-3"}>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-sm font-medium text-gray-700">시간</label>
                            <button
                                type="button"
                                onClick={setBusinessHours}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                                <Clock className="h-3 w-3" />
                                업무시간 (09:00~18:00) 기준으로 입력해주세요.
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={form.startTime || "09:00"}
                                onChange={(e) => setField("startTime", e.target.value)}
                                className="flex-1 h-10 rounded-xl border border-gray-300 text-sm px-3 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 focus:outline-none"
                            >
                                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <span className="text-gray-400 text-sm">~</span>
                            <select
                                value={form.endTime || "18:00"}
                                onChange={(e) => setField("endTime", e.target.value)}
                                className="flex-1 h-10 rounded-xl border border-gray-300 text-sm px-3 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 focus:outline-none"
                            >
                                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* 업무 유형 + 프로젝트/하위업무 */}
                <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">업무 유형</label>
                        <select
                            value={form.category}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="w-full h-10 rounded-xl border border-gray-300 text-sm px-3 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 focus:outline-none bg-white"
                        >
                            {categories.map((cat) => (
                                <option key={cat.code} value={cat.code}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-span-3">
                        {showProject && form.category === GENERAL_CODE && (
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">프로젝트 유형</label>
                                    <select
                                        value={projectTypeFilter}
                                        onChange={(e) => { setProjectTypeFilter(e.target.value); setField("projectId", null); }}
                                        className="w-full h-10 rounded-xl border border-gray-300 text-sm px-3 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 focus:outline-none bg-white"
                                    >
                                        {projectTypeCodes.map((t) => (
                                            <option key={t.id} value={t.id.toString()}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">프로젝트</label>
                                    <SearchableCombobox
                                        options={projectOptions}
                                        value={form.projectId ?? null}
                                        onChange={(val) => setField("projectId", val)}
                                        placeholder="프로젝트 선택"
                                    />
                                </div>
                            </div>
                        )}
                        {showProject && form.category === PRESALES_CODE && (
                            <>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">프로젝트</label>
                                <SearchableCombobox
                                    options={projectOptions}
                                    value={form.projectId ?? null}
                                    onChange={(val) => setField("projectId", val)}
                                    placeholder="프로젝트 선택"
                                />
                            </>
                        )}
                        {showProject && EXTRA_PROJECT_CODES.includes(form.category) && (
                            <>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">프로젝트</label>
                                <SearchableCombobox
                                    options={projectOptions}
                                    value={form.projectId ?? null}
                                    onChange={(val) => setField("projectId", val)}
                                    placeholder="프로젝트 선택"
                                />
                            </>
                        )}
                        {showSubCategory && (
                            <>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">하위 업무</label>
                                <SearchableCombobox
                                    options={subCategories.map(c => ({ value: c.id, label: c.name }))}
                                    value={subCategories.find(c => c.code === form.subCategory)?.id ?? null}
                                    onChange={(val) => {
                                        const found = subCategories.find(c => c.id === val);
                                        setField("subCategory", found ? found.code : null);
                                    }}
                                    placeholder="하위 유형 선택"
                                />
                            </>
                        )}
                        {!showProject && !showSubCategory && <div className="h-full" />}
                    </div>
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
                    ) : <div />}
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
                            onClick={repeatMode ? handleRepeatSave : handleSave}
                            disabled={saving}
                            className={cn(
                                "inline-flex items-center gap-2 rounded-xl px-4 h-10 text-sm font-medium text-white disabled:opacity-50 transition-colors",
                                repeatMode ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-900 hover:bg-gray-800"
                            )}
                        >
                            {repeatMode ? <Repeat2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                            {saving ? "저장 중..." : repeatMode ? `${previewCount}일 일괄 등록` : "저장"}
                        </button>
                    </div>
                </div>
            </div>
        </DraggablePanel>
    );
}

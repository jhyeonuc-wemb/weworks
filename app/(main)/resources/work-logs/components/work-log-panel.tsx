"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Save, Trash2, Clock, ChevronDown } from "lucide-react";
import { DraggablePanel } from "@/components/ui/DraggablePanel";
import { DatePicker } from "@/components/ui/DatePicker";
import { useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { WorkLog } from "../types";

// ─── 검색 가능한 인라인 드롭다운 (인력계획탭 이름선택 스타일) ─────────────
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

    // 선택된 값이 바뀌면 inputText 동기화
    useEffect(() => {
        if (!open) {
            setInputText(selected?.label ?? "");
        }
    }, [value, open, selected]);

    const filtered = options.filter(o =>
        o.label.toLowerCase().includes(inputText.toLowerCase())
    );

    // 외부 클릭 시 닫기
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                // 닫힐 때 현재 선택값으로 텍스트 복원
                setInputText(selected?.label ?? "");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [selected]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(e.target.value);
        setOpen(true);
        // 텍스트 바꾸면 선택 해제
        if (selected && e.target.value !== selected.label) {
            onChange(null);
        }
    };

    const handleFocus = () => {
        setInputText("");
        setOpen(true);
    };

    const handleSelect = (opt: ComboOption) => {
        onChange(opt.value);
        setInputText(opt.label);
        setOpen(false);
    };

    const handleClear = () => {
        onChange(null);
        setInputText("");
        setOpen(false);
        inputRef.current?.focus();
    };

    return (
        <div ref={containerRef} className="relative">
            {/* 인력계획탭 이름 셀과 동일한 인라인 input 스타일 */}
            <div className={cn(
                "flex items-center w-full h-10 rounded-xl border text-sm transition-colors focus-within:ring-2 focus-within:ring-gray-900 focus-within:ring-offset-0",
                open
                    ? "border-gray-900 bg-white"
                    : "border-gray-300 bg-white hover:border-gray-400"
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
                {/* 선택됐을 때 X 버튼 */}
                {value !== null && (
                    <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
                        className="px-2 text-gray-400 hover:text-gray-600"
                    >
                        <span className="text-xs leading-none">✕</span>
                    </button>
                )}
                {/* 드롭다운 화살표 */}
                <ChevronDown
                    className={cn(
                        "h-4 w-4 text-gray-400 shrink-0 mr-2 transition-transform duration-150",
                        open && "rotate-180"
                    )}
                />
            </div>

            {/* 드롭다운 목록 */}
            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
                    <div className="overflow-y-auto max-h-52">
                        {filtered.length === 0 ? (
                            <div className="px-3 py-4 text-sm text-gray-400 text-center">
                                검색 결과 없음
                            </div>
                        ) : (
                            filtered.map(o => (
                                <div
                                    key={o.value}
                                    onMouseDown={(e) => { e.preventDefault(); handleSelect(o); }}
                                    className={cn(
                                        "px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 transition-colors",
                                        o.value === value
                                            ? "bg-slate-50 font-semibold text-slate-900"
                                            : "text-gray-700"
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

// 프로젝트 선택 노출 카테고리 코드
const PRESALES_CODE = "CD_002_05_02";  // 프리세일즈 → 코드 없는 프로젝트
const GENERAL_CODE = "CD_002_05_01";  // 일반 프로젝트 → 유형 선택 + 코드 있는 프로젝트
// 계약 프로젝트 목록(코드 있는)을 그냥 보여주는 카테고리들
const EXTRA_PROJECT_CODES = ["CD_002_05_06", "CD_002_05_03", "CD_002_05_04"]; // 연구과제, 무상/유상 유지보수
const PROJECT_CATEGORY_CODES = [GENERAL_CODE, PRESALES_CODE, ...EXTRA_PROJECT_CODES];

// 하위 카테고리 선택이 필요한 업무유형
const SUB_CATEGORY_CODES = ["CD_002_05_07", "CD_002_05_05"]; // R&D 지원, 일반 업무

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
    const [subCategories, setSubCategories] = useState<Category[]>([]);
    const [projectTypeCodes, setProjectTypeCodes] = useState<Category[]>([]); // CD_002_05_01 하위
    const [projectTypeFilter, setProjectTypeFilter] = useState<string>(""); // 선택된 프로젝트 유형 id

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
            category: GENERAL_CODE, // 디폴트: 일반 프로젝트
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
        fetch("/api/codes?parentCode=CD_002_05_01")
            .then((r) => r.json())
            .then((data) => {
                const codes = data.codes || [];
                setProjectTypeCodes(codes);
                // 디폴트: 첫 번째 유형 (계약 프로젝트)
                if (codes.length > 0) setProjectTypeFilter(codes[0].id.toString());
            })
            .catch(() => { });
    }, []);

    // R&D 지원 / 일반 업무 선택 시 하위 공통코드 로드
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

    const today = new Date();
    // 이번달 말일
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // 업무유형별 프로젝트 옵션 필터링
    const projectOptions = useMemo<ComboOption[]>(() => {
        if (form.category === PRESALES_CODE) {
            // 프리세일즈: 프로젝트 코드 없는 프로젝트 (코드 없으니 이름만)
            return projects
                .filter(p => !p.projectCode)
                .map(p => ({ value: p.id, label: p.name }));
        }
        if (form.category === GENERAL_CODE) {
            // 일반 프로젝트: 코드 있고 실제종료일이 이번달까지 + 프로젝트 유형 필터
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
            // 연구과제/유지보수: 계약 프로젝트 목록과 동일 (코드 있고 이번달까지)
            return projects
                .filter(p => {
                    if (!p.projectCode) return false;
                    if (!p.actualEndDate) return true;
                    return new Date(p.actualEndDate) <= thisMonthEnd;
                })
                .map(p => ({ value: p.id, label: `[${p.projectCode}] ${p.name}` }));
        }
        return [];
    }, [projects, form.category, projectTypeFilter]);

    // 카테고리 변경 시 프로젝트 + 서브카테고리 초기화
    const handleCategoryChange = (code: string) => {
        setForm(prev => ({ ...prev, category: code, subCategory: null, projectId: null }));
        // 일반 프로젝트로 전환 시 첫 번째 프로젝트 유형으로 리셋
        if (code === GENERAL_CODE && projectTypeCodes.length > 0) {
            setProjectTypeFilter(projectTypeCodes[0].id.toString());
        }
    };

    const showSubCategory = SUB_CATEGORY_CODES.includes(form.category) && subCategories.length > 0;

    const showProject = PROJECT_CATEGORY_CODES.includes(form.category);

    return (
        <DraggablePanel
            open={open}
            onOpenChange={onOpenChange}
            title={form.id ? "작업 수정" : "작업 등록"}
            description="개인별 작업일지"
            panelWidth={780}
        >
            <div className="space-y-5">
                {/* 날짜 + 시간 (한 라인, 업무유형 행과 동일 비율) */}
                <div className="grid grid-cols-4 gap-3">
                    {/* 날짜 - col-span-1 (업무유형과 동일 너비) */}
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">날짜</label>
                        <DatePicker
                            date={(() => {
                                if (!form.workDate) return undefined;
                                const dateStr = String(form.workDate).slice(0, 10);
                                const d = new Date(dateStr + "T00:00:00");
                                return isNaN(d.getTime()) ? undefined : d;
                            })()}
                            setDate={(d) => setField("workDate", d ? d.toLocaleDateString("en-CA") : "")}
                            className="h-10 w-full"
                        />
                    </div>

                    {/* 시간 - col-span-3 */}
                    <div className="col-span-3">
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
                </div>

                {/* 업무 유형 + 프로젝트/하위업무 (같은 라인) */}
                <div className="grid grid-cols-4 gap-3">
                    {/* 업무 유형 드롭다운 - 1/4 */}
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

                    {/* 프로젝트 선택 or 하위업무 선택 - 3/4 */}
                    <div className="col-span-3">
                        {showProject && form.category === GENERAL_CODE && (
                            <div className="grid grid-cols-3 gap-3">
                                {/* 프로젝트 유형 (1/3) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">프로젝트 유형</label>
                                    <select
                                        value={projectTypeFilter}
                                        onChange={(e) => {
                                            setProjectTypeFilter(e.target.value);
                                            setField("projectId", null); // 유형 변경 시 프로젝트 선택 초기화
                                        }}
                                        className="w-full h-10 rounded-xl border border-gray-300 text-sm px-3 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 focus:outline-none bg-white"
                                    >
                                        {projectTypeCodes.map((t) => (
                                            <option key={t.id} value={t.id.toString()}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {/* 프로젝트 선택 (2/3) */}
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
                        {!showProject && !showSubCategory && (
                            <div className="h-full" />
                        )}
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

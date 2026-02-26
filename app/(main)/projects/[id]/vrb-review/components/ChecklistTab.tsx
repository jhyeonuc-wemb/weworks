"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronRight, Save, BarChart3, FileText, Info, Target } from "lucide-react";
import { useToast } from "@/components/ui";
import { cn } from "@/lib/utils";

// ── 타입 ──────────────────────────────────────────────────────────────────────
interface ChecklistItem {
    id: number;
    name: string;
    weight: number;
    guide_texts: string;
}

interface Category {
    id: string;
    label: string;
    overallWeight: number;
    items: ChecklistItem[];
}

interface ScoreMap {
    [itemId: number]: number; // itemId → score (1~10)
}

// ── 난이도 레벨 ───────────────────────────────────────────────────────────────
const DIFFICULTY_LEVELS = [
    { min: 1.0, max: 3.0, label: "매우 낮음", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
    { min: 3.1, max: 5.0, label: "낮음", color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
    { min: 5.1, max: 7.0, label: "보통", color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
    { min: 7.1, max: 8.5, label: "높음", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
    { min: 8.6, max: 10.0, label: "매우 높음", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
];

function getDifficultyLevel(score: number | null) {
    if (score === null) return null;
    return DIFFICULTY_LEVELS.find((l) => score >= l.min && score <= l.max) || null;
}

// ── 점수 계산 ─────────────────────────────────────────────────────────────────
function calcCategoryScore(items: ChecklistItem[], scores: ScoreMap): number | null {
    const scored = items.filter((i) => scores[i.id] !== undefined && scores[i.id] !== null);
    if (scored.length === 0) return null;
    const totalWeight = scored.reduce((s, i) => s + i.weight, 0);
    if (totalWeight === 0) return null;
    const weighted = scored.reduce((s, i) => s + scores[i.id] * i.weight, 0);
    return weighted / totalWeight;
}

function calcTotalScore(categories: Category[], scores: ScoreMap): number | null {
    const catScores = categories
        .map((cat) => ({ score: calcCategoryScore(cat.items, scores), weight: cat.overallWeight }))
        .filter((c) => c.score !== null);
    if (catScores.length === 0) return null;
    const totalWeight = catScores.reduce((s, c) => s + c.weight, 0);
    if (totalWeight === 0) return null;
    return catScores.reduce((s, c) => s + (c.score! * c.weight), 0) / totalWeight;
}

// ── 점수 버튼 컴포넌트 ────────────────────────────────────────────────────────
function ScoreSelector({
    value,
    onChange,
    disabled,
}: {
    value: number | null;
    onChange: (v: number) => void;
    disabled?: boolean;
}) {
    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                    key={n}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(n)}
                    className={cn(
                        "w-7 h-7 rounded-lg text-sm font-bold transition-all duration-150 border",
                        value === n
                            ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:text-gray-900 hover:bg-gray-50"
                    )}
                >
                    {n}
                </button>
            ))}
        </div>
    );
}

// ── Accordion 카테고리 ────────────────────────────────────────────────────────
function CategoryAccordion({
    category,
    scores,
    onScoreChange,
    isOpen,
    onToggle,
}: {
    category: Category;
    scores: ScoreMap;
    onScoreChange: (itemId: number, score: number) => void;
    isOpen: boolean;
    onToggle: () => void;
}) {
    const catScore = calcCategoryScore(category.items, scores);
    const level = getDifficultyLevel(catScore);
    const scoredCount = category.items.filter((i) => scores[i.id] !== undefined).length;

    return (
        <div id={`accordion-${category.id}`} className="border border-gray-200 rounded-xl overflow-hidden scroll-mt-20">
            {/* Accordion Header */}
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-white hover:bg-gray-50/80 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                    <span className="text-sm font-bold text-gray-900">{category.label}</span>
                    <span className="text-sm text-gray-600 font-medium">
                        ({scoredCount}/{category.items.length}개 평가됨)
                    </span>
                    <span className="text-sm text-gray-600">
                        · 종합 가중치 <span className="font-bold text-gray-800">{category.overallWeight}%</span>
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {catScore !== null && level && (
                        <span className={cn("text-sm font-bold px-2.5 py-1 rounded-full border", level.bg, level.color, level.border)}>
                            {level.label}
                        </span>
                    )}
                    {catScore !== null && (
                        <span className="text-sm font-bold text-gray-900 font-mono min-w-[36px] text-right">
                            {catScore.toFixed(2)}점
                        </span>
                    )}
                    {catScore === null && (
                        <span className="text-sm text-gray-500 font-medium">미평가</span>
                    )}
                </div>
            </button>

            {/* Accordion Body */}
            {isOpen && (
                <div className="border-t border-gray-100 px-5 pt-4 pb-5 bg-gray-50/30">
                    <div className="overflow-x-auto border border-gray-200 bg-white">
                        <table className="min-w-full" style={{ borderCollapse: "collapse" }}>
                            <colgroup>
                                <col style={{ width: "36px" }} />
                                <col style={{ width: "150px" }} />
                                <col style={{ width: "60px" }} />
                                <col />
                                <col style={{ width: "320px" }} />
                            </colgroup>
                            <thead>
                                <tr className="h-[35px] bg-slate-50">
                                    <th className="border border-gray-200 px-3 whitespace-nowrap text-center text-sm font-bold text-gray-700">No</th>
                                    <th className="border border-gray-200 px-3 whitespace-nowrap text-left text-sm font-bold text-gray-700">항목명</th>
                                    <th className="border border-gray-200 px-3 whitespace-nowrap text-center text-sm font-bold text-gray-700">가중치</th>
                                    <th className="border border-gray-200 px-3 whitespace-nowrap text-left text-sm font-bold text-gray-700">평가 안내 문구</th>
                                    <th className="border border-gray-200 px-3 whitespace-nowrap text-center text-sm font-bold text-gray-700">점수 (1~10)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {category.items.map((item, idx) => (
                                    <tr
                                        key={item.id}
                                        className={cn(
                                            "h-[44px] transition-colors",
                                            scores[item.id] !== undefined ? "bg-white" : "bg-gray-50/30"
                                        )}
                                    >
                                        {/* No */}
                                        <td className="border border-gray-200 px-3 text-center text-sm text-gray-600" style={{ verticalAlign: "top", paddingTop: "12px", paddingBottom: "12px" }}>
                                            {idx + 1}
                                        </td>
                                        {/* 항목명 */}
                                        <td className="border border-gray-200 px-3" style={{ verticalAlign: "top", paddingTop: "12px", paddingBottom: "12px" }}>
                                            <span className="text-sm font-medium text-gray-800">{item.name}</span>
                                        </td>
                                        {/* 가중치 */}
                                        <td className="border border-gray-200 px-3 text-center" style={{ verticalAlign: "top", paddingTop: "12px", paddingBottom: "12px" }}>
                                            <span className="text-sm font-bold text-gray-700">{item.weight}%</span>
                                        </td>
                                        {/* 평가 안내 문구 전체 */}
                                        <td className="border border-gray-200 px-3" style={{ verticalAlign: "top", paddingTop: "12px", paddingBottom: "12px" }}>
                                            <div className="space-y-1">
                                                {item.guide_texts.split('\n').map((line, i) => (
                                                    line.trim() ? (
                                                        <p key={i} className="text-sm text-gray-700 leading-relaxed">
                                                            • {line.trim()}
                                                        </p>
                                                    ) : null
                                                ))}
                                            </div>
                                        </td>
                                        {/* 점수 선택 */}
                                        <td className="border border-gray-200 px-3 py-2 text-center" style={{ verticalAlign: "top" }}>
                                            <ScoreSelector
                                                value={scores[item.id] ?? null}
                                                onChange={(v) => onScoreChange(item.id, v)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                                {/* 카테고리 소계 */}
                                <tr className="h-[35px] bg-slate-50">
                                    <td colSpan={4} className="border border-gray-200 px-3 text-right text-sm font-bold text-gray-700 py-3">
                                        카테고리 점수
                                    </td>
                                    <td className="border border-gray-200 px-3 text-center py-3">
                                        {catScore !== null ? (
                                            <div className="flex items-center justify-center gap-2">
                                                {level && (
                                                    <span className={cn("text-sm font-bold", level.color)}>
                                                        {level.label}
                                                    </span>
                                                )}
                                                <span className="text-sm font-black text-gray-900 font-mono">
                                                    {catScore.toFixed(2)}점
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-500">-</span>
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function ChecklistTab({ projectId, vrbStatus }: { projectId: string; vrbStatus?: string }) {
    const { showToast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [scores, setScores] = useState<ScoreMap>({});
    const [comment, setComment] = useState("");
    const [vrbId, setVrbId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [openCategoryIds, setOpenCategoryIds] = useState<string[]>([]);

    // ── 아코디언 상태 제어 및 스크롤 ───────────────────────────────────────────
    const handleCategoryToggle = (categoryId: string) => {
        setOpenCategoryIds((prev) =>
            prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
        );
    };

    const scrollToCategory = (categoryId: string) => {
        setOpenCategoryIds((prev) => (prev.includes(categoryId) ? prev : [...prev, categoryId]));
        setTimeout(() => {
            const el = document.getElementById(`accordion-${categoryId}`);
            if (el) {
                // 부드러운 스크롤 (scroll-mt-20 클래스가 존재하여 헤더 영역 고려됨)
                el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }, 100);
    };

    // 1. VRB ID 조회 → 체크리스트 + 점수 로드
    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);

                // VRB ID 가져오기
                const vrbRes = await fetch(`/api/vrb-reviews?projectId=${projectId}`);
                if (!vrbRes.ok) throw new Error("VRB 데이터를 불러올 수 없습니다.");
                const vrbData = await vrbRes.json();
                const reviews = (vrbData.reviews || []).filter((r: any) => {
                    const rId = typeof r.project_id === "string" ? parseInt(r.project_id, 10) : Number(r.project_id);
                    return rId === parseInt(projectId, 10);
                });

                const currentVrbId: number | null = reviews.length > 0 ? reviews[0].id : null;
                setVrbId(currentVrbId);

                // 체크리스트 항목 로드
                const [checklistRes, scoresRes] = await Promise.all([
                    fetch("/api/settings/difficulty-checklist"),
                    currentVrbId ? fetch(`/api/vrb-reviews/${currentVrbId}/difficulty`) : Promise.resolve(null),
                ]);

                if (checklistRes.ok) {
                    const checklistData = await checklistRes.json();
                    setCategories(checklistData.categories || []);
                }

                if (scoresRes && scoresRes.ok) {
                    const scoresData = await scoresRes.json();
                    // scores 배열 → ScoreMap 변환
                    const map: ScoreMap = {};
                    (scoresData.scores || []).forEach((s: any) => {
                        map[s.itemId] = s.score;
                    });
                    setScores(map);
                    setComment(scoresData.comment || "");
                }
            } catch (e) {
                console.error("ChecklistTab init error:", e);
                showToast("데이터를 불러오는 중 오류가 발생했습니다.", "error");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [projectId]);

    const handleScoreChange = useCallback((itemId: number, score: number) => {
        setScores((prev) => ({ ...prev, [itemId]: score }));
    }, []);

    const totalScore = calcTotalScore(categories, scores);
    const totalLevel = getDifficultyLevel(totalScore);

    const handleSave = async () => {
        if (!vrbId) {
            showToast("VRB 심의가 아직 생성되지 않았습니다.", "error");
            return;
        }
        setSaving(true);
        try {
            // scores ScoreMap → 배열 변환 (항목명 포함)
            const allItems = categories.flatMap((cat) =>
                cat.items.map((item) => ({ ...item, categoryId: cat.id }))
            );
            const scoresPayload = Object.entries(scores)
                .map(([itemIdStr, score]) => {
                    const itemId = Number(itemIdStr);
                    const item = allItems.find((i) => i.id === itemId);
                    return {
                        itemId,
                        itemName: item?.name || "",
                        categoryId: item?.categoryId || "",
                        score,
                    };
                })
                .filter((s) => s.score !== null && s.score !== undefined);

            const res = await fetch(`/api/vrb-reviews/${vrbId}/difficulty`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    scores: scoresPayload,
                    comment,
                    totalScore: totalScore !== null ? parseFloat(totalScore.toFixed(2)) : null,
                }),
            });
            if (!res.ok) throw new Error("save failed");
            showToast("저장되었습니다.", "success");
        } catch (e) {
            console.error(e);
            showToast("저장에 실패했습니다.", "error");
        } finally {
            setSaving(false);
        }
    };

    // ── 렌더링 ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground font-medium">체크리스트를 불러오고 있습니다...</p>
            </div>
        );
    }

    if (categories.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
                <p className="text-base font-medium">등록된 난이도 체크리스트가 없습니다.</p>
                <p className="text-sm">설정 {">"} 난이도 체크리스트 관리에서 항목을 등록해주세요.</p>
            </div>
        );
    }

    const totalItemCount = categories.reduce((s, c) => s + c.items.length, 0);
    const scoredItemCount = categories.reduce(
        (s, c) => s + c.items.filter((i) => scores[i.id] !== undefined).length,
        0
    );

    return (
        <div className="space-y-8 pb-2">
            {/* ── 상단: 요약 및 종합 의견 영역 ── */}
            <div className="space-y-6">
                {/* ── 헤더 타이틀 및 저장 버튼 ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            난이도 종합
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                            각 난이도 항목의 평가 점수와 가중치를 기반으로 최종 종합 점수가 산정됩니다.
                        </p>
                    </div>
                    {vrbStatus !== "COMPLETED" && (
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 h-10 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Save className="h-4 w-4" />
                            {saving ? "저장 중..." : "저장"}
                        </button>
                    )}
                </div>

                {/* ── 종합 점수 카드 영역 (Grid) ── */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {/* 좌측: 요약 및 점수 */}
                    <div className="flex flex-col h-full gap-4">
                        <div className="rounded-xl border border-gray-200 bg-white p-5 flex-grow flex flex-col gap-4 shadow-sm transition-all hover:border-gray-300">

                            {/* 평가 진행률 */}
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                    <Target className="h-5 w-5 text-indigo-500" />
                                    <span className="text-md font-bold text-gray-800">평가 진행률</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-40 h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner flex-shrink-0">
                                        <div
                                            className="h-full bg-indigo-500 transition-all duration-500"
                                            style={{ width: `${totalItemCount > 0 ? (scoredItemCount / totalItemCount) * 100 : 0}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 font-mono">
                                        {scoredItemCount} / {totalItemCount} <span className="text-gray-500 text-xs font-medium ml-0.5">완료</span>
                                    </span>
                                </div>
                            </div>

                            <div className="w-full h-px bg-gray-100 my-0.5"></div>

                            {/* 카테고리별 소계 */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {categories.map((cat) => {
                                    const cs = calcCategoryScore(cat.items, scores);
                                    const lv = getDifficultyLevel(cs);
                                    return (
                                        <div
                                            key={cat.id}
                                            onClick={() => scrollToCategory(cat.id)}
                                            className="group relative flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-gray-200 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 gap-2 cursor-pointer"
                                        >
                                            <span className="text-sm font-medium text-gray-700 text-center leading-tight break-keep group-hover:text-indigo-700 transition-colors">
                                                {cat.label}
                                            </span>
                                            <span className="text-xs text-gray-500 font-medium">가중치 {cat.overallWeight}%</span>
                                            <div className="flex items-center justify-center w-full mt-auto pt-2 border-t border-gray-50">
                                                {cs !== null ? (
                                                    <span className={cn("text-base font-black font-mono tracking-tight", lv?.color || "text-gray-900")}>
                                                        {cs.toFixed(1)}
                                                    </span>
                                                ) : (
                                                    <span className="text-base text-gray-300 font-mono font-medium">-</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* 최종 종합 점수 */}
                            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border border-indigo-100/80 mt-auto shadow-sm">
                                <span className="text-base font-bold text-indigo-900">최종 종합 점수</span>
                                {totalScore !== null && totalLevel ? (
                                    <div className="flex items-center gap-3">
                                        <span className={cn(
                                            "text-sm font-bold px-3 py-1 rounded-full border bg-white shadow-sm",
                                            totalLevel.color, totalLevel.border
                                        )}>
                                            {totalLevel.label}
                                        </span>
                                        <span className="text-3xl font-black text-indigo-950 font-mono leading-none tracking-tight">
                                            {totalScore.toFixed(2)}
                                            <span className="text-sm font-bold text-indigo-400 ml-1">/ 10</span>
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-lg font-bold text-indigo-300">-</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 우측: 종합 의견 */}
                    <div className="flex flex-col h-full gap-4">
                        <div className="rounded-xl border border-gray-200 bg-white p-5 flex-grow flex flex-col gap-3 shadow-sm transition-all hover:border-gray-300">
                            <label className="text-md font-bold text-gray-800 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                종합 의견
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="VRB 심의 난이도에 대한 전반적인 의견, 특이사항, 주의해야 할 리스크 등을 입력해주세요."
                                className="flex-1 w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 focus:bg-white bg-gray-50 hover:bg-white resize-none transition-all placeholder:text-gray-400 leading-relaxed shadow-inner"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 중간: 난이도 해석 기준 ── */}
            <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-3">
                    <Info className="h-5 w-5 text-indigo-500" />
                    난이도 해석 기준
                </h3>
                <div className="overflow-x-auto border border-gray-200 shadow-sm">
                    <table className="min-w-full border-collapse bg-white">
                        <thead>
                            <tr className="h-[38px] bg-slate-50 border-b border-gray-200">
                                <th className="border-r border-gray-200 px-3 text-center text-sm font-bold text-gray-700" style={{ width: "140px" }}>점수 범위</th>
                                <th className="border-r border-gray-200 px-3 text-center text-sm font-bold text-gray-700" style={{ width: "100px" }}>난이도</th>
                                <th className="px-3 text-left text-sm font-bold text-gray-700">설명</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y border-t-0">
                            {[
                                { range: "1.0 ~ 3.0", label: "매우 낮음", desc: "팀 구성에 전혀 문제가 없으며, 프로젝트 수행이 매우 원활할 것으로 예상됨.", cls: "text-emerald-600" },
                                { range: "3.1 ~ 5.0", label: "낮음", desc: "소규모의 문제나 약간의 조정이 필요하지만, 대부분 원활한 진행 가능.", cls: "text-green-600" },
                                { range: "5.1 ~ 7.0", label: "보통", desc: "일부 어려움이 예상되며, 팀원들의 추가 조정이나 교육이 필요할 수 있음.", cls: "text-yellow-600" },
                                { range: "7.1 ~ 8.5", label: "높음", desc: "팀 구성의 여러 측면에서 도전 과제가 존재하며, 리스크 관리 및 추가 자원 투입이 필요.", cls: "text-orange-600" },
                                { range: "8.6 ~ 10.0", label: "매우 높음", desc: "팀 구성에 심각한 문제가 예상되며, 성공적인 프로젝트 수행을 위해 대대적인 개선이 필요.", cls: "text-red-700" },
                            ].map((level) => (
                                <tr key={level.range} className="h-[38px] hover:bg-slate-50/50 transition-colors">
                                    <td className={cn("border-r border-gray-200 px-3 text-center text-sm font-bold font-mono tracking-tight", level.cls)}>{level.range}</td>
                                    <td className={cn("border-r border-gray-200 px-3 text-center text-sm font-bold", level.cls)}>{level.label}</td>
                                    <td className="px-3 text-sm text-gray-600 leading-snug">{level.desc}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── 하단: 난이도 평가 체크리스트 아코디언 ── */}
            <div className="space-y-3">
                {categories.map((cat) => (
                    <CategoryAccordion
                        key={cat.id}
                        category={cat}
                        scores={scores}
                        onScoreChange={handleScoreChange}
                        isOpen={openCategoryIds.includes(cat.id)}
                        onToggle={() => handleCategoryToggle(cat.id)}
                    />
                ))}
            </div>
        </div>
    );
}

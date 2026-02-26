"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/components/ui";
import { cn } from "@/lib/utils";

// ── AutoResizeTextarea ────────────────────────────────────────────────────────
function AutoResizeTextarea({
    value,
    onChange,
    placeholder,
    className,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    className?: string;
}) {
    const ref = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "0px";
        el.style.height = `${el.scrollHeight}px`;
    }, [value]);

    return (
        <textarea
            ref={ref}
            rows={1}
            value={value}
            onChange={(e) => {
                onChange(e.target.value);
                const el = e.target;
                el.style.height = "0px";
                el.style.height = `${el.scrollHeight}px`;
            }}
            placeholder={placeholder}
            className={className}
            style={{ minHeight: "35px", overflow: "hidden" }}
        />
    );
}

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

// ── 초기 데이터 ────────────────────────────────────────────────────────────────
const INITIAL_CATEGORIES: Category[] = [
    {
        id: "tech", label: "기술적 난이도", overallWeight: 30,
        items: [
            { id: 1, name: "기술 스택", weight: 10, guide_texts: "프로젝트에서 사용될 기술이나 프레임워크 신규 여부\n기존에 사용 동인 기술과의 호환성 및 재사용 기능 여부\n학습 커브가 있는 새로운 기술에 대한 고려 필요 여부\n기술에 대한 표준화, 상위화, 레퍼런스 보유 여부" },
            { id: 2, name: "아키텍처", weight: 10, guide_texts: "프로젝트는 아키텍처의 복잡성(고가용성 고려, 대용량 처리, MSA 등 고려) 여부\n아키텍처 설계 및 구현의 잠재적인 리스크 여부\n분산 시스템의 설계 전 글로우드 기반 인프라 구축 등 고려 요구가 있는지 여부\n시스템의 상호작용(인터페이스, API 통합)의 복잡성이 있는지 여부" },
            { id: 3, name: "데이터 구축", weight: 10, guide_texts: "대규모 데이터 처리(예: 빅데이터, 실시간 처리)를 고려한 설계가 필요한지 여부\n데이터의 정합성 관련, 성능개선/정보보호를 위한 암호화 처리할 필요 여부\n기준 데이터 마이그레이션 여부(마이그레이션 복잡성, 첨부파일 포함여부)" },
            { id: 4, name: "보안", weight: 10, guide_texts: "일반 보안 항목 이상의 별도의 보안 요건이 필요한지(AD, SSO, 2단계 인증 등)\n보안 요구사항(예: 암호화, 인증, 권한 관리 등)의 복잡성, 추가 요구사항 여부\n시스템에 데이터에 대한 보안성 검토 요구사항 여부(웹취약점, 개인정보보호 등)" },
            { id: 5, name: "성능", weight: 10, guide_texts: "고가용성(HA) 및 확장성(Scalability)을 위한 설계 여부\n성능 테스트와 최적화에 대한 요구사항이 존재하고 대응할 수 있는 수준인지 여부" },
            { id: 6, name: "시스템 통합", weight: 10, guide_texts: "연계 시스템의 개수가 많은지 여부(15개 이상의 연계대상 유무)\n레거시 시스템과 업무절차자의 연계가 필요한지 여부(프로세스, 태그에일, SOP등)\n시스템 간의 대화나 실시간 동기화 데이터 처리 요건이 있는지 여부\n개발시스템, 테스트시스템, 운영시스템의 구분이 명확하고 프로세스 준수 여부" },
            { id: 7, name: "개발 및 운영 환경", weight: 10, guide_texts: "별 혼용성, 시스템 운영체제 혼용, 필요품 등 다양한 환경을 지원해야 하는지 여부\n운영 환경이 새로운 시스템 구축이고, 기존 시스템에 반영해야 하는지, 서버의 필요성" },
            { id: 8, name: "테스트 및 품질 보증", weight: 10, guide_texts: "품질보증 활동을 요구하고 고난이도 품질 요구사항이 있는가?(예외처리, 에러코드, 갭업)\n테스트 케이스가 복잡하고 다양하며, QA 투입 필요성이 있는 프로젝트인지 여부" },
            { id: 9, name: "배포 및 운영", weight: 10, guide_texts: "배포 프로세스의 선행성이 있는지 여부(배포일정, 무중단, 서비스 중요도 여부)\n모니터링 및 로깅 시스템의 구축이 필요 여부" },
            { id: 10, name: "기술적 리스크", weight: 10, guide_texts: "솔루션의 성숙도, 기술 성숙도를 고려하여 프로젝트의 잠재적 리스크 여부\n솔루션의 기술 지원 범위가 한정적이거나, 추가 커스터마이징 및 R&D 개발이 필요한지 여부\n기술 도메인에 따라 많은 영향을 줄 수 있는 사업인지 여부(도메인 이해도, 외부 기술 의존)" },
        ],
    },
    {
        id: "req", label: "요구사항의 복잡성", overallWeight: 25,
        items: [
            { id: 11, name: "기능 및 범위", weight: 15, guide_texts: "기능 요구사항의 수와 다양성, 비기능 요구사항의 어려움이 많이 존재하는지 여부\n주요 기능 하위에 세분화된 기능들이 많이 존재하는 프로젝트인지 여부" },
            { id: 12, name: "요구사항의 명확성", weight: 15, guide_texts: "체계적인 RFP가 구성되었거나, 사전에 Presale가 있어 RFP를 세밀하게 작성했는지 여부\n요구사항이 세부적으로 정의되어있거나 수행사도 충분히 정의된 요구사항이 있는지 여부" },
            { id: 13, name: "이해관계자 복잡성", weight: 10, guide_texts: "요구사항 도출 및 승인에 다양한 조직, 사용자, 이해관계자 유무\n사업 추진에 높은 조직적 지원, 주의수준이 필요한지 여부" },
            { id: 14, name: "사용자 및 사용 시나리오", weight: 10, guide_texts: "사용자 유형 및 시나리오가 복잡한지 여부\n사용자 인터페이스(UI)에 사용자 정의(UX)에 대한 요구사항이 복잡한지 여부" },
            { id: 15, name: "데이터 및 비즈니스 로직", weight: 10, guide_texts: "시스템이 복잡한 비즈니스 로직을 포함하여 실현되어야 하는지 여부(복잡한 규칙, 알고리즘 등)" },
            { id: 16, name: "성능 및 확장성", weight: 10, guide_texts: "요구사항이 확장성을 고려해야 하는지 여부(멀티테넌시 시스템 등)" },
            { id: 17, name: "보안 및 규정 준수", weight: 10, guide_texts: "보안 요구사항에 대해 까다로운 사항이 있어 추가 대응이 필요한지 여부" },
            { id: 18, name: "시스템 연계", weight: 10, guide_texts: "외부 시스템과의 연계 시 다른 지원 조직 여건으로 설계 및 개발이 많이 소요될 가능성 여부" },
            { id: 19, name: "긴급도", weight: 10, guide_texts: "짧은 요구일정에 다수의 시스템 반영과 테스트가 반복될 수 있는지 여부" },
        ],
    },
    {
        id: "team", label: "프로젝트 팀 구성", overallWeight: 20,
        items: [
            { id: 20, name: "기술 숙련도", weight: 20, guide_texts: "관련 기술/프레임워크 사용 경험이 있는 팀원의 비율\n새로운 기술 학습이 필요한 팀원의 수" },
            { id: 21, name: "도메인 지식", weight: 15, guide_texts: "프로젝트가 다루는 도메인(예: 금융, 의료, 제조)에 대한 이해도\n관련 산업 프로젝트 경험 여부" },
            { id: 22, name: "경험", weight: 15, guide_texts: "이전 유사 프로젝트 경험이 있는 팀원의 수\n프로젝트 관리 경험(팀 리드, PM 등)을 가진 인력의 유무" },
            { id: 23, name: "인력 가용성", weight: 15, guide_texts: "프로젝트 팀 구성을 위한 가용인력의 유무\n팀원 간의 커뮤니케이션 스킬과 협업 경험" },
            { id: 24, name: "PM의 경험", weight: 20, guide_texts: "프로젝트 고객 대응 경험\n다양한 부서 및 외부 협력 업체와의 조율 능력" },
            { id: 25, name: "외부 인력 리스크", weight: 10, guide_texts: "외주 인력이나 컨설팅 업체의 의존성이 높은지 여부\n외부 협력 인력의 기술 적합성과 협력 난이도" },
            { id: 26, name: "리스크 요소", weight: 5, guide_texts: "팀원의 이탈 가능성(퇴사, 병가 등)\n주요 인력에 대한 의존도와 대체 계획의 유무" },
        ],
    },
    {
        id: "mgmt", label: "프로젝트 관리 요소", overallWeight: 15,
        items: [
            { id: 27, name: "일정 관리", weight: 20, guide_texts: "프로젝트 수행 일정이 충분히 확보되어 있는지 여부\n주요 단계별 마일스톤과 목표가 충분히 설정되어 있는지 여부" },
            { id: 28, name: "리소스 관리", weight: 15, guide_texts: "프로젝트 투입 공수가 충분히 확보되고 진행에 이슈가 없는지 여부\n외부 인원의 투입으로 인력에 불확실성이 높은지 여부" },
            { id: 29, name: "리스크 관리", weight: 10, guide_texts: "리스크에 대해 대비책이 마련되어 있는지 여부\n요구사항의 변동, 범위 변경 가능성이 높은지 여부" },
            { id: 30, name: "이해관계자 관리", weight: 10, guide_texts: "이해관계자가 식별되어 있거나, 수행사와의 의사 소통이 원활한지 여부\n빠른 의사결정을 위한 조직(TFT), 담당자가 있는지 여부" },
            { id: 31, name: "품질 관리", weight: 10, guide_texts: "고객의 테스트 구성, 성과 검증을 위한 지표 및 표준이 명확하고 현실적으로 대응할 수 있는지 여부" },
            { id: 32, name: "의존성 관리", weight: 15, guide_texts: "프로젝트가 외부 시스템, 공급사, 인력 등의 의존성이 높은지 여부" },
            { id: 33, name: "변화 관리", weight: 10, guide_texts: "프로젝트로 인해 고객사의 업무, 절차 등에 신규 변경이 요구되는지 여부\n법적/규제 요건이 적용되는 사업인지 여부" },
            { id: 34, name: "기타 요소", weight: 10, guide_texts: "표준 준수, 보안 준수에 따른 관리요소가 많이 존재하는지 여부" },
        ],
    },
    {
        id: "ext", label: "외부 의존성 관리", overallWeight: 10,
        items: [
            { id: 35, name: "사업 구조의 위험성", weight: 30, guide_texts: "타 기업이 주사업자로 효과적인 수행이 가능한지 여부, 위험도가 높은지 여부\n컨소시엄의 협력사들과의 원활한 리스크 관리 가능성 여부" },
            { id: 36, name: "도메인 지식", weight: 15, guide_texts: "결코하지 못해 새로운 영역에서 필요한 데이터나 기술을 확보하는지 여부\n외부 협력업체의 기술 안정성 여부" },
            { id: 37, name: "외부 공급자의 신뢰도", weight: 15, guide_texts: "명확한 업무 범위 구분과 R&R 수립 가능 여부\n외부 공급업체의 서비스 경험이 많은지 여부" },
            { id: 38, name: "기술적 통합 난이도", weight: 20, guide_texts: "기술 통합의 복잡성이 높고, 다양한 요구사항 커스터마이징 필요 여부" },
            { id: 39, name: "유지보수 용이성", weight: 10, guide_texts: "유지보수 시 연관 시스템에 따른 이슈 발생 혹은 잠재적 리스크 발생 가능성 여부" },
            { id: 40, name: "사업 비용 및 검수", weight: 10, guide_texts: "프로젝트에 따른 추가 비용 발생 요구가 있는지 여부(사무실 업무, 장비 렌탈, 워크샵, 기타 비용)" },
        ],
    },
];

const SUMMARY_WEIGHTS = [
    { id: "tech", label: "기술적 난이도", weight: 30 },
    { id: "req", label: "요구사항의 복잡성", weight: 25 },
    { id: "team", label: "프로젝트 팀 구성", weight: 20 },
    { id: "mgmt", label: "프로젝트 관리 요소", weight: 15 },
    { id: "ext", label: "외부 의존성 관리", weight: 10 },
];

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────
export default function DifficultyChecklistPage() {
    const [activeTab, setActiveTab] = useState("summary");
    const { showToast, confirm } = useToast();
    const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // 초기 데이터 로드
    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await fetch("/api/settings/difficulty-checklist");
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                if (Array.isArray(data.categories) && data.categories.length > 0) {
                    setCategories(data.categories);
                }
            } catch (e) {
                console.error("difficulty checklist load error:", e);
                // 실패 시 INITIAL_CATEGORIES 유지
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const activeCategory = categories.find((c) => c.id === activeTab);
    const weightTotal = activeCategory?.items.reduce((s, i) => s + i.weight, 0) ?? 0;

    const updateItem = useCallback(
        (catId: string, itemId: number, field: keyof ChecklistItem, value: string | number) => {
            setCategories((prev) =>
                prev.map((cat) =>
                    cat.id !== catId
                        ? cat
                        : { ...cat, items: cat.items.map((i) => (i.id === itemId ? { ...i, [field]: value } : i)) }
                )
            );
        },
        []
    );

    const addItem = (catId: string) => {
        setCategories((prev) =>
            prev.map((cat) =>
                cat.id !== catId
                    ? cat
                    : { ...cat, items: [...cat.items, { id: Date.now(), name: "", weight: 0, guide_texts: "" }] }
            )
        );
    };

    const deleteItem = (catId: string, itemId: number) => {
        confirm({
            title: "항목 삭제",
            message: "이 항목을 삭제하시겠습니까?",
            onConfirm: () => {
                setCategories((prev) =>
                    prev.map((cat) =>
                        cat.id !== catId ? cat : { ...cat, items: cat.items.filter((i) => i.id !== itemId) }
                    )
                );
                showToast("항목이 삭제되었습니다.", "success");
            },
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/settings/difficulty-checklist", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ categories }),
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

    const TABS = [
        { id: "summary", label: "종합" },
        ...categories.map((c) => ({ id: c.id, label: c.label })),
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">난이도 체크리스트 관리</h1>
                    <p className="mt-1.5 text-sm font-medium text-muted-foreground opacity-70">
                        VRB 심의에 사용되는 난이도 평가 항목과 가중치를 관리합니다.
                    </p>
                </div>
            </div>

            {/* 탭 네비게이션 */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors",
                                activeTab === tab.id
                                    ? "border-gray-900 text-gray-900"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* ── 카테고리 항목 탭 ── */}
            {activeTab !== "summary" && activeCategory && (
                <div className="neo-light-card border border-border/40 overflow-hidden">
                    <div className="p-6 space-y-6">
                        {/* 카드 상단 타이틀 */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">{activeCategory.label}</h2>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 h-9 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Save className="h-4 w-4" />
                                {saving ? "저장 중..." : "저장"}
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full" style={{ borderCollapse: "collapse" }}>
                                <colgroup>
                                    <col style={{ width: "40px" }} />
                                    <col style={{ width: "160px" }} />
                                    <col style={{ width: "80px" }} />
                                    <col />
                                    <col style={{ width: "52px" }} />
                                </colgroup>
                                <thead>
                                    <tr className="h-[35px]">
                                        <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-center text-sm font-bold">No</th>
                                        <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-center text-sm font-bold">항목명</th>
                                        <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-center text-sm font-bold">가중치</th>
                                        <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-left text-sm font-bold">평가 안내 문구</th>
                                        <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-center text-sm font-bold">삭제</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeCategory.items.map((item, idx) => (
                                        <tr key={item.id} className="group">
                                            {/* No */}
                                            <td className="border border-gray-300 p-0 bg-gray-50/50 text-center text-sm text-gray-500" style={{ verticalAlign: "middle" }}>
                                                {idx + 1}
                                            </td>
                                            {/* 항목명 */}
                                            <td className="border border-gray-300 p-0" style={{ lineHeight: 0, fontSize: 0, height: "1px" }}>
                                                <input
                                                    type="text"
                                                    value={item.name}
                                                    onChange={(e) => updateItem(activeCategory.id, item.id, "name", e.target.value)}
                                                    className="w-full border-none bg-transparent px-[10px] text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white hover:bg-blue-50 transition-colors block"
                                                    style={{ height: "100%", minHeight: "35px" }}
                                                    placeholder="항목명 입력"
                                                />
                                            </td>
                                            {/* 가중치 */}
                                            <td className="border border-gray-300 p-0" style={{ lineHeight: 0, fontSize: 0, height: "1px" }}>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    value={item.weight || ""}
                                                    onChange={(e) => updateItem(activeCategory.id, item.id, "weight", parseFloat(e.target.value) || 0)}
                                                    className="w-full border-none bg-transparent px-[10px] text-sm text-right text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white hover:bg-blue-50 transition-colors block [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    style={{ height: "100%", minHeight: "35px" }}
                                                    placeholder="0"
                                                />
                                            </td>
                                            {/* 안내 문구 */}
                                            <td className="border border-gray-300 p-0" style={{ verticalAlign: "top" }}>
                                                <AutoResizeTextarea
                                                    value={item.guide_texts}
                                                    onChange={(v) => updateItem(activeCategory.id, item.id, "guide_texts", v)}
                                                    placeholder="안내 문구 입력 (줄바꿈으로 구분)"
                                                    className="w-full border-none bg-transparent px-[10px] py-[8px] text-sm text-gray-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white hover:bg-blue-50 transition-colors resize-none block"
                                                />
                                            </td>
                                            {/* 삭제 */}
                                            <td className="border border-gray-300 p-0 text-center" style={{ verticalAlign: "top" }}>
                                                <div className="h-[35px] flex items-center justify-center">
                                                    <button
                                                        onClick={() => deleteItem(activeCategory.id, item.id)}
                                                        className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                                        title="삭제"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* 행 추가 버튼 */}
                                    <tr>
                                        <td colSpan={5} className="border border-gray-300 p-0">
                                            <button
                                                onClick={() => addItem(activeCategory.id)}
                                                className="w-full h-[35px] flex items-center justify-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium"
                                            >
                                                <Plus className="h-4 w-4" />
                                                항목 추가
                                            </button>
                                        </td>
                                    </tr>

                                    {/* 합계 행 */}
                                    <tr className="h-[35px] bg-orange-100">
                                        <td colSpan={2} className="border border-gray-300 px-[10px] text-center text-sm font-bold text-gray-900">합 계</td>
                                        <td className={cn(
                                            "border border-gray-300 px-[10px] text-right text-sm font-bold",
                                            weightTotal === 100 ? "text-emerald-700" : "text-red-600"
                                        )}>
                                            {weightTotal}%
                                        </td>
                                        <td colSpan={2} className="border border-gray-300 px-[10px] text-sm text-gray-500">
                                            {weightTotal !== 100 && (
                                                <span className="text-xs text-red-400">⚠ 가중치 합계가 100%가 되어야 합니다.</span>
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 종합 탭 ── */}
            {activeTab === "summary" && (
                <div className="neo-light-card border border-border/40 overflow-hidden">
                    <div className="p-6 space-y-6">
                        {/* 카드 상단 타이틀 */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">종합</h2>
                                <p className="mt-1 text-sm text-gray-600">전체 카테고리별 가중치 구성 및 난이도 해석 기준을 확인합니다.</p>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 h-9 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Save className="h-4 w-4" />
                                {saving ? "저장 중..." : "저장"}
                            </button>
                        </div>
                        {/* 섹션 1: 종합 평가 가중치 구성 */}
                        <section className="space-y-3">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                                [ 종합 평가 가중치 구성 ]
                                <span className="text-xs text-gray-400 font-normal">각 카테고리의 종합 가중치를 확인합니다. (합계 100%)</span>
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full" style={{ borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr className="h-[35px]">
                                            <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-left text-sm font-bold">카테고리</th>
                                            <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-center text-sm font-bold" style={{ width: "120px" }}>종합 가중치</th>
                                            <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-center text-sm font-bold" style={{ width: "90px" }}>항목 수</th>
                                            <th className="border border-gray-300 bg-blue-50/50 px-[10px] text-center text-sm font-bold" style={{ width: "120px" }}>항목 가중치 합</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {SUMMARY_WEIGHTS.map((sw) => {
                                            const cat = categories.find((c) => c.id === sw.id);
                                            const catTotal = cat?.items.reduce((s, i) => s + i.weight, 0) ?? 0;
                                            return (
                                                <tr key={sw.id} className="h-[35px] hover:bg-blue-50/20 group">
                                                    <td className="border border-gray-300 px-[10px] text-sm text-gray-900">{sw.label}</td>
                                                    <td className="border border-gray-300 p-0" style={{ lineHeight: 0, fontSize: 0, height: "1px", width: "120px" }}>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={100}
                                                            value={cat?.overallWeight ?? sw.weight}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value) || 0;
                                                                setCategories((prev) =>
                                                                    prev.map((c) => c.id === sw.id ? { ...c, overallWeight: val } : c)
                                                                );
                                                            }}
                                                            className="w-full border-none bg-transparent px-[10px] text-sm text-center font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white hover:bg-blue-50 transition-colors block [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            style={{ height: "100%", minHeight: "35px" }}
                                                        />
                                                    </td>
                                                    <td className="border border-gray-300 px-[10px] text-center text-sm text-gray-600" style={{ width: "90px" }}>{cat?.items.length ?? 0}개</td>
                                                    <td className={cn("border border-gray-300 px-[10px] text-center text-sm font-semibold", catTotal === 100 ? "text-emerald-600" : "text-red-500")}>
                                                        {catTotal}%
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        <tr className="h-[35px] bg-orange-100">
                                            <td className="border border-gray-300 px-[10px] text-sm font-bold text-gray-900">합 계</td>
                                            <td className={cn("border border-gray-300 px-[10px] text-center text-sm font-bold", categories.reduce((s, c) => s + c.overallWeight, 0) === 100 ? "text-emerald-700" : "text-red-600")}>
                                                {categories.reduce((s, c) => s + c.overallWeight, 0)}%
                                            </td>
                                            <td className="border border-gray-300 px-[10px] text-center text-sm text-gray-700">{categories.reduce((s, c) => s + c.items.length, 0)}개</td>
                                            <td className="border border-gray-300 px-[10px]"></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
}

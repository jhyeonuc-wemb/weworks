"use client";

import { use, useState, useEffect } from "react";
import { useUsers } from "@/hooks/queries/useUsers";
import { useMonitoring } from "@/hooks/queries/useMonitoring";
import { useCodes } from "@/hooks/queries/useCodes";
import { SummaryTab } from "./components/SummaryTab";
import { ProfitabilityStatusBadge } from "./components/ProfitabilityStatusBadge";
import {
    Button,
    Badge,
    Dropdown,
    Field,
    FieldLabel,
    Input,
    DatePicker
} from "@/components/ui";
import { ArrowLeft, CheckCircle2, Save, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";

interface ProjectMonitoring {
    id: string | number;
    project_code: string;
    project_name: string;
    category: string;
    field: string;
    customer: string;
    pm: string;
    pl: string;
    actual_start_date: string;
    actual_end_date: string;
    progress_status: string;
    performance_rate: number;
    current_phase: string;
    progress_state: string;
    planned_internal_mm: number;
    planned_external_mm: number;
    executed_internal_mm: number;
    executed_external_mm: number;
}

export default function ProjectMonitoringDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("info");

    // ✅ SWR 훅으로 기준 데이터 병렬 조회
    const { users } = useUsers();
    const { monitoring, isLoading: loading } = useMonitoring();
    const { codes: statusCodesRaw } = useCodes("CD_002_06");
    const { codes: stateCodesRaw } = useCodes("CD_002_07");

    const statusCodes = statusCodesRaw.map((c) => ({ value: c.name, label: c.name }));
    const stateCodes = stateCodesRaw.map((c) => ({ value: c.name, label: c.name }));

    // 현재 프로젝트 찾기 (SWR 캐시에서)
    const foundProject = monitoring?.data?.find((p: any) => p.id.toString() === id) ?? null;
    const [project, setProject] = useState<ProjectMonitoring | null>(null);

    // SWR 데이터 도착 시 project state 동기화
    useEffect(() => {
        if (foundProject && !project) {
            setProject(foundProject);
        }
    }, [foundProject]);

    // 수지분석서 관련 상태
    const [profitabilityVersions, setProfitabilityVersions] = useState<any[]>([]);
    const [selectedProfitId, setSelectedProfitId] = useState<number | null>(null);
    const [profitData, setProfitData] = useState<any>(null);

    useEffect(() => {
        if (!id) return;
        const loadProfitability = async () => {
            try {
                const res = await fetch(`/api/profitability?projectId=${id}`);
                if (res.ok) {
                    const data = await res.json();
                    const versions = data.profitabilities || [];
                    setProfitabilityVersions(versions);
                    if (versions.length > 0) setSelectedProfitId(versions[0].id);
                }
            } catch (e) { console.error(e); }
        };
        loadProfitability();
    }, [id]);

    const fetchProfitabilityVersions = async () => {
        try {
            const res = await fetch(`/api/profitability?projectId=${id}`);
            if (res.ok) {
                const data = await res.json();
                const versions = data.profitabilities || [];
                setProfitabilityVersions(versions);
                if (versions.length > 0) setSelectedProfitId(versions[0].id);
            }
        } catch (e) { console.error(e); }
    };

    const fetchProfitabilityDetail = async (profitId: number) => {
        try {
            // 타입 안전성을 위해 == 대신 타입을 맞춰서 찾거나 유연하게 비교
            const found = profitabilityVersions.find(v => Number(v.id) === Number(profitId));
            if (found) {
                setProfitData(found);

                // 프로젝트 정보가 있을 때만 M/M 제안값 업데이트
                if (project) {
                    setProject(prev => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            planned_internal_mm: found.our_mm || prev.planned_internal_mm,
                            planned_external_mm: found.others_mm || prev.planned_external_mm,
                        };
                    });
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleInputChange = (field: keyof ProjectMonitoring, value: any) => {
        if (!project) return;
        setProject(prev => prev ? ({ ...prev, [field]: value }) : null);
    };

    const handleSave = async () => {
        if (!project) return;
        try {
            setSaving(true);
            const res = await fetch('/api/monitoring', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...project,
                }),
            });

            res.ok ? router.push('/projects/monitoring') : null;
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const calculateScheduleProgress = (start: string | null | undefined, end: string | null | undefined) => {
        if (!start || !end) return 0;
        const startDate = new Date(start);
        const endDate = new Date(end);
        const today = new Date();

        if (today < startDate) return 0;
        if (today > endDate) return 100;

        const totalDays = differenceInDays(endDate, startDate);
        if (totalDays <= 0) return 0;

        const passedDays = differenceInDays(today, startDate);
        const ratio = (passedDays / totalDays) * 100;
        return Math.min(Math.max(Math.round(ratio), 0), 100);
    };

    const calculateTotalMM = (internal: number | string, external: number | string) => {
        return (parseFloat(String(internal || 0)) + parseFloat(String(external || 0))).toFixed(1);
    };

    const calculateRemainingMMTotal = (planInt: number | string, planExt: number | string, execInt: number | string, execExt: number | string) => {
        const totalPlan = parseFloat(String(planInt || 0)) + parseFloat(String(planExt || 0));
        const totalExec = parseFloat(String(execInt || 0)) + parseFloat(String(execExt || 0));
        return (totalPlan - totalExec).toFixed(1);
    };

    if (loading && !project) {
        return <div className="p-8 text-center text-gray-500 font-medium">데이터를 불러오는 중입니다...</div>;
    }

    if (!project) {
        return <div className="p-8 text-center text-red-500 font-medium">프로젝트 정보를 찾을 수 없습니다.</div>;
    }

    const TABS = [
        { id: "info", label: "기본 정보 및 일정" },
        { id: "profitability", label: "수지분석서 현황" }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href="/projects/monitoring"
                        className="p-2 -ml-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-300"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 leading-snug">
                                <span className="text-blue-600">진척관리</span> - {project.project_name}
                            </h1>
                            <Badge
                                className={cn(
                                    "rounded-full px-3 h-7 text-xs font-black border-none shadow-sm",
                                    (project.progress_status === '정상' || !project.progress_status) ? "bg-green-100 text-green-700" :
                                        (project.progress_status === 'RISK' || project.progress_status === '이슈') ? "bg-red-100 text-red-700" :
                                            "bg-gray-100 text-gray-500"
                                )}
                            >
                                {project.progress_status || '정상'}
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                            {project.project_code} | {project.customer}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 h-10 px-6 rounded-xl font-bold bg-gray-900 hover:bg-gray-800"
                    >
                        닫기
                    </Button>
                </div>
            </div>

            {/* Tab Navigation */}
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

            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {activeTab === "info" ? (
                    <>
                        <div className="bg-slate-50/50 p-6 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <div className="w-1 h-4 bg-blue-500 rounded-full" />
                                기본 정보 및 일정 진척
                            </h3>
                        </div>
                        <div className="p-8 space-y-10">
                            {/* Summary Section */}
                            <div className="grid grid-cols-4 gap-8">
                                <Field className="col-span-1">
                                    <FieldLabel>영역 / 분야</FieldLabel>
                                    <div className="text-sm font-bold text-gray-900 mt-1">{project.category} / {project.field}</div>
                                </Field>
                                <Field className="col-span-1">
                                    <FieldLabel>고객사</FieldLabel>
                                    <div className="text-sm font-bold text-gray-900 mt-1">{project.customer || '-'}</div>
                                </Field>
                                <Field className="col-span-2">
                                    <FieldLabel>일정계획 진척도 (시작~종료일 기준 자동연산)</FieldLabel>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${calculateScheduleProgress(project.actual_start_date, project.actual_end_date)}%` }} />
                                        </div>
                                        <span className="text-sm font-black text-indigo-600 w-12 text-right">
                                            {calculateScheduleProgress(project.actual_start_date, project.actual_end_date)}%
                                        </span>
                                    </div>
                                </Field>
                            </div>

                            <div className="h-px bg-gray-100" />

                            {/* Input Section */}
                            <div className="grid grid-cols-4 gap-x-8 gap-y-6">
                                <Field className="col-span-1">
                                    <FieldLabel>PM (Project Manager)</FieldLabel>
                                    <Dropdown
                                        value={project.pm || ''}
                                        options={users.map(u => ({ value: u.name, label: `${u.name} (${u.department_name})` }))}
                                        onChange={(val) => handleInputChange('pm', val)}
                                        placeholder="PM 선택"
                                        className="h-10 rounded-xl mt-1.5"
                                        variant="premium"
                                    />
                                </Field>
                                <Field className="col-span-1">
                                    <FieldLabel>PL (Project Leader)</FieldLabel>
                                    <Dropdown
                                        value={project.pl || ''}
                                        options={users.map(u => ({ value: u.name, label: `${u.name} (${u.department_name})` }))}
                                        onChange={(val) => handleInputChange('pl', val)}
                                        placeholder="PL 선택"
                                        className="h-10 rounded-xl mt-1.5"
                                        variant="premium"
                                    />
                                </Field>
                                <Field className="col-span-1">
                                    <FieldLabel>실제 시작일</FieldLabel>
                                    <DatePicker
                                        date={project.actual_start_date ? new Date(project.actual_start_date) : undefined}
                                        setDate={(d) => handleInputChange('actual_start_date', d ? format(d, 'yyyy-MM-dd') : '')}
                                        className="w-full h-10 rounded-xl border-gray-300 mt-1.5"
                                    />
                                </Field>
                                <Field className="col-span-1">
                                    <FieldLabel>실제 종료일</FieldLabel>
                                    <DatePicker
                                        date={project.actual_end_date ? new Date(project.actual_end_date) : undefined}
                                        setDate={(d) => handleInputChange('actual_end_date', d ? format(d, 'yyyy-MM-dd') : '')}
                                        className="w-full h-10 rounded-xl border-gray-300 mt-1.5"
                                    />
                                </Field>

                                <Field className="col-span-1">
                                    <FieldLabel>현재 단계</FieldLabel>
                                    <Input
                                        value={project.current_phase || ''}
                                        onChange={(e) => handleInputChange('current_phase', e.target.value)}
                                        placeholder="분석, 설계, 개발 등"
                                        className="h-10 rounded-xl mt-1.5"
                                    />
                                </Field>
                                <Field className="col-span-1">
                                    <FieldLabel>상태</FieldLabel>
                                    <Dropdown
                                        value={project.progress_status || '정상'}
                                        options={statusCodes.length > 0 ? statusCodes : [
                                            { value: '정상', label: '정상' },
                                            { value: 'RISK', label: 'RISK' },
                                            { value: '이슈', label: '이슈' }
                                        ]}
                                        onChange={(val) => handleInputChange('progress_status', val)}
                                        className="h-10 rounded-xl mt-1.5"
                                        variant="premium"
                                    />
                                </Field>
                                <Field className="col-span-1">
                                    <FieldLabel>진행 상태</FieldLabel>
                                    <Dropdown
                                        value={project.progress_state || '정상'}
                                        options={stateCodes.length > 0 ? stateCodes : [
                                            { value: '정상', label: '정상' },
                                            { value: '일정지연', label: '일정지연' },
                                            { value: '대기', label: '대기' },
                                            { value: '종료', label: '종료' }
                                        ]}
                                        onChange={(val) => handleInputChange('progress_state', val)}
                                        className="h-10 rounded-xl mt-1.5"
                                        variant="premium"
                                    />
                                </Field>
                                <Field className="col-span-1">
                                    <FieldLabel>실제 실적 (%)</FieldLabel>
                                    <div className="relative mt-1.5">
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={project.performance_rate || 0}
                                            onChange={(e) => handleInputChange('performance_rate', e.target.value)}
                                            className="h-10 rounded-xl pr-8 text-right font-bold"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs">%</span>
                                    </div>
                                </Field>
                            </div>

                            <div className="h-px bg-gray-100" />

                            {/* M/M Section */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                                        공수(M/M) 관리
                                    </h3>
                                    <div className="bg-gray-900 rounded-xl px-6 py-2 flex items-center gap-4 text-white shadow-lg">
                                        <span className="text-xs font-bold text-gray-400">전체 잔여 M/M (계획 - 실행)</span>
                                        <span className={cn(
                                            "text-lg font-black font-mono",
                                            parseFloat(calculateRemainingMMTotal(project.planned_internal_mm, project.planned_external_mm, project.executed_internal_mm, project.executed_external_mm)) < 0
                                                ? "text-red-400" : "text-white"
                                        )}>
                                            {calculateRemainingMMTotal(project.planned_internal_mm, project.planned_external_mm, project.executed_internal_mm, project.executed_external_mm)}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="bg-slate-50/50 p-6 rounded-2xl border border-gray-200 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-black text-indigo-600 flex items-center gap-1.5 uppercase">
                                                <AlertCircle size={14} /> Planned M/M
                                            </h4>
                                            <Badge className="bg-indigo-600 text-white border-none h-6 px-3 text-[10px] font-black rounded-lg">
                                                합계: {calculateTotalMM(project.planned_internal_mm, project.planned_external_mm)}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <Field>
                                                <FieldLabel className="text-[10px] text-gray-400 uppercase tracking-tighter">당사 (Internal)</FieldLabel>
                                                <Input
                                                    type="number" step="0.1"
                                                    value={project.planned_internal_mm || 0}
                                                    onChange={(e) => handleInputChange('planned_internal_mm', e.target.value)}
                                                    className="h-10 rounded-xl text-right font-mono font-bold mt-1"
                                                />
                                            </Field>
                                            <Field>
                                                <FieldLabel className="text-[10px] text-gray-400 uppercase tracking-tighter">외주 (External)</FieldLabel>
                                                <Input
                                                    type="number" step="0.1"
                                                    value={project.planned_external_mm || 0}
                                                    onChange={(e) => handleInputChange('planned_external_mm', e.target.value)}
                                                    className="h-10 rounded-xl text-right font-mono font-bold mt-1"
                                                />
                                            </Field>
                                        </div>
                                    </div>

                                    <div className="bg-emerald-50/30 p-6 rounded-2xl border border-emerald-100 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-black text-emerald-600 flex items-center gap-1.5 uppercase">
                                                <Save size={14} /> Executed M/M
                                            </h4>
                                            <Badge className="bg-emerald-600 text-white border-none h-6 px-3 text-[10px] font-black rounded-lg">
                                                합계: {calculateTotalMM(project.executed_internal_mm, project.executed_external_mm)}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <Field>
                                                <FieldLabel className="text-[10px] text-gray-400 uppercase tracking-tighter">당사 (Internal)</FieldLabel>
                                                <Input
                                                    type="number" step="0.1"
                                                    value={project.executed_internal_mm || 0}
                                                    onChange={(e) => handleInputChange('executed_internal_mm', e.target.value)}
                                                    className="h-10 rounded-xl text-right font-mono font-bold mt-1"
                                                />
                                            </Field>
                                            <Field>
                                                <FieldLabel className="text-[10px] text-gray-400 uppercase tracking-tighter">외주 (External)</FieldLabel>
                                                <Input
                                                    type="number" step="0.1"
                                                    value={project.executed_external_mm || 0}
                                                    onChange={(e) => handleInputChange('executed_external_mm', e.target.value)}
                                                    className="h-10 rounded-xl text-right font-mono font-bold mt-1"
                                                />
                                            </Field>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="p-8 space-y-8">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-slate-700">버전 선택</span>
                                <Dropdown
                                    value={selectedProfitId?.toString() || ""}
                                    onChange={(val) => setSelectedProfitId(Number(val))}
                                    options={profitabilityVersions.map((v) => ({
                                        value: v.id.toString(),
                                        label: `VERSION ${v.version} (${v.created_at})`,
                                    }))}
                                    className="w-64 font-bold"
                                    variant="premium"
                                />
                            </div>
                            {profitData && (
                                <ProfitabilityStatusBadge status={profitData.status} />
                            )}
                        </div>

                        {profitData ? (
                            <SummaryTab
                                project={{
                                    id: id || '',
                                    name: project.project_name,
                                    customerName: project.customer || '미지정',
                                    projectCode: project.project_code
                                }}
                                currency="KRW"
                                totalRevenue={profitData.total_revenue || 0}
                                serviceProfit={profitData.service_profit || 0}
                                productProfit={profitData.product_profit || 0}
                                businessProfit={profitData.business_profit || 0}
                                extraRevenue={profitData.extra_revenue_amount || 0}
                                operatingProfit={profitData.operating_profit || 0}
                                profitRate={profitData.operating_profit_rate || 0}
                                ourMm={profitData.our_mm || 0}
                                othersMm={profitData.others_mm || 0}
                                profitabilityId={profitData.id}
                            />
                        ) : (
                            <div className="py-20 text-center text-slate-400 font-medium bg-slate-50/30 rounded-2xl border-2 border-dashed border-slate-100">
                                {profitabilityVersions.length > 0
                                    ? "버전을 선택하면 수지분석서 요약 정보를 조회할 수 있습니다."
                                    : "조회된 수지분석서 정보가 없습니다."}
                            </div>
                        )}
                    </div>
                )}

                {/* Bottom Bar */}
                <div className="bg-slate-50 p-4 border-t border-gray-100 flex justify-end gap-3">
                    <Link
                        href="/projects/monitoring"
                        className="inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        취소
                    </Link>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={saving}
                        className="min-w-[120px]"
                    >
                        {saving ? "저장 중..." : "저장"}
                    </Button>
                </div>
            </div>
        </div>
    );
}


"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Plus, FileSignature, Trash2, ChevronRight, CheckCircle2 } from "lucide-react";
import {
    Button,
    StatusBadge,
    useToast,
    DatePicker,
    Field,
    FieldLabel,
    Input,
    AttachmentSection,
} from "@/components/ui";
import { ProjectPhaseNav } from "@/components/projects/ProjectPhaseNav";
import { useProjectPhase } from "@/hooks/useProjectPhase";
import { formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

// ─── 타입 ───────────────────────────────────────────────────────────────────

interface ContractSummary {
    id: number;
    contractTitle: string | null;
    contractType: string | null;
    supplyAmount: number | null;
    contractDate: string | null;
    contractStartDate: string | null;
    contractEndDate: string | null;
}

interface ContractDetail {
    id: number;
    projectId: number;
    contractTitle: string | null;
    contractType: string | null;
    projectCode: string | null;
    projectName: string;
    expectedAmount: number | null;
    supplyAmount: number | null;
    stampDuty: number | null;
    performanceBondRate: number;
    defectBondRate: number;
    paymentSchedule: string;
    contractNotes: string;
    contractDate: string | null;
    contractStartDate: string | null;
    contractEndDate: string | null;
    durationDays: number | null;
    customerId: number | null;
    customerName: string | null;
    customerCode: string | null;
    ordererId: number | null;
    ordererName: string | null;
    ordererCode: string | null;
    managerId: number | null;
    managerName: string | null;
    managerRankName: string | null;
    managerDeptName: string | null;
    salesRepId: number | null;
    salesRepName: string | null;
    salesRepRankName: string | null;
    salesRepDeptName: string | null;
    currentPhase: string;
}

interface UserOption { id: number; name: string; rank_name: string | null; role_name: string; roles?: { id: number; name: string; is_primary: boolean }[]; }
interface ClientOption { id: number; name: string; type: string; }

const toDate = (s: string | null | undefined): Date | undefined =>
    s ? new Date(s) : undefined;
const formatDateStr = (d: Date | undefined): string | null =>
    d ? d.toISOString().slice(0, 10) : null;

// ─── 메인 페이지 ──────────────────────────────────────────────────────────

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const projectId = Number(id);

    const { showToast, confirm } = useToast();
    const { status: phaseStatus, isFinalStatus, onSaveSuccess, onCompleteSuccess } = useProjectPhase(projectId, "contract");
    const isReadOnly = isFinalStatus;

    // 프로젝트 기본 정보 (헤더 표시용)
    const [project, setProject] = useState<{
        name: string;
        projectCode?: string;
        customerName?: string;
    } | null>(null);

    // 계약 목록
    const [contractList, setContractList] = useState<ContractSummary[]>([]);
    const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
    const [isNewContract, setIsNewContract] = useState(false); // 아직 저장 안 된 신규 계약
    const [contract, setContract] = useState<ContractDetail | null>(null);
    const [loadingList, setLoadingList] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);

    // 폼 상태
    const [contractTitle, setContractTitle] = useState("");
    const [supplyAmount, setSupplyAmount] = useState("");
    const [stampDuty, setStampDuty] = useState("");
    const [performanceBondRate, setPerformanceBondRate] = useState("10");
    const [defectBondRate, setDefectBondRate] = useState("2");
    const [paymentSchedule, setPaymentSchedule] = useState("");
    const [contractNotes, setContractNotes] = useState("");
    const [contractDate, setContractDate] = useState<Date | undefined>();
    const [contractStartDate, setContractStartDate] = useState<Date | undefined>();
    const [contractEndDate, setContractEndDate] = useState<Date | undefined>();

    // 검색 목록 옵션
    const [users, setUsers] = useState<UserOption[]>([]);
    const [clients, setClients] = useState<ClientOption[]>([]);

    // 고객사/발주처/영업대표/PM 선택 상태
    const [customerSearch, setCustomerSearch] = useState("");
    const [ordererSearch, setOrdererSearch] = useState("");
    const [pmSearch, setPmSearch] = useState("");
    const [salesSearch, setSalesSearch] = useState("");
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [showOrdererDropdown, setShowOrdererDropdown] = useState(false);
    const [showPmDropdown, setShowPmDropdown] = useState(false);
    const [showSalesDropdown, setShowSalesDropdown] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    const [selectedOrdererId, setSelectedOrdererId] = useState<number | null>(null);
    const [selectedManagerId, setSelectedManagerId] = useState<number | null>(null);
    const [selectedSalesRepId, setSelectedSalesRepId] = useState<number | null>(null);

    // 참조 데이터 로드 (users, clients)
    useEffect(() => {
        Promise.all([fetch("/api/users"), fetch("/api/clients")])
            .then(async ([ur, cr]) => {
                if (ur.ok) { const d = await ur.json(); setUsers(d.users || []); }
                if (cr.ok) { const d = await cr.json(); setClients(d.clients || []); }
            });
    }, []);

    // 필터링
    const filteredCustomers = clients.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()));
    const filteredOrderers = clients.filter(c => c.name.toLowerCase().includes(ordererSearch.toLowerCase()));
    const filteredPms = users.filter(u => {
        const hasPmRole = u.roles && u.roles.length > 0
            ? u.roles.some(r => r.name.toLowerCase().includes("pm"))
            : (u.role_name?.toLowerCase().includes("pm") || false);
        return hasPmRole && u.name.toLowerCase().includes(pmSearch.toLowerCase());
    });
    const filteredSales = users.filter(u => u.role_name?.toLowerCase() === "sales" && u.name.toLowerCase().includes(salesSearch.toLowerCase()));

    // 프로젝트 정보 로드
    useEffect(() => {
        fetch(`/api/projects/${projectId}`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.project) {
                    setProject({
                        name: data.project.name,
                        projectCode: data.project.projectCode,
                        customerName: data.project.customerName || undefined,
                    });
                }
            })
            .catch(() => { });
    }, [projectId]);

    // 계약 목록 조회
    const fetchContractList = useCallback(async () => {
        setLoadingList(true);
        try {
            const res = await fetch(`/api/contracts?projectId=${projectId}`);
            const data = await res.json();
            const list: ContractSummary[] = data.contracts || [];
            setContractList(list);
            if (list.length > 0 && !selectedContractId) {
                setSelectedContractId(list[0].id);
            }
        } finally {
            setLoadingList(false);
        }
    }, [projectId]);

    useEffect(() => { fetchContractList(); }, [fetchContractList]);

    // 계약 상세 조회
    useEffect(() => {
        if (!selectedContractId) { setContract(null); return; }
        setLoadingDetail(true);
        fetch(`/api/contracts/${selectedContractId}`)
            .then(r => r.json())
            .then(data => {
                const c: ContractDetail = data.contract;
                setContract(c);
                setContractTitle(c.contractTitle || "");
                setSupplyAmount(c.supplyAmount ? String(c.supplyAmount) : "");
                setStampDuty(c.stampDuty ? String(c.stampDuty) : "");
                setPerformanceBondRate(String(c.performanceBondRate ?? 10));
                setDefectBondRate(String(c.defectBondRate ?? 2));
                setPaymentSchedule(c.paymentSchedule || "");
                setContractNotes(c.contractNotes || "");
                setContractDate(toDate(c.contractDate));
                setContractStartDate(toDate(c.contractStartDate));
                setContractEndDate(toDate(c.contractEndDate));
                // 고객사/발주처/영업대표/PM 초기화
                setSelectedCustomerId(c.customerId ?? null);
                setCustomerSearch(c.customerName || "");
                setSelectedOrdererId(c.ordererId ?? null);
                setOrdererSearch(c.ordererName || "");
                setSelectedManagerId(c.managerId ?? null);
                setPmSearch([c.managerName, c.managerRankName].filter(Boolean).join(" "));
                setSelectedSalesRepId(c.salesRepId ?? null);
                setSalesSearch([c.salesRepName, c.salesRepRankName].filter(Boolean).join(" "));
            })
            .finally(() => setLoadingDetail(false));
    }, [selectedContractId]);

    // 저장 (신규: POST → 완료, 기존: PUT)
    const handleSave = async () => {
        setSaving(true);
        try {
            const supply = supplyAmount ? Number(supplyAmount.replace(/,/g, "")) : null;
            const payload = {
                contractTitle: contractTitle || null,
                customerName: customerSearch || null,
                ordererName: ordererSearch || null,
                managerName: pmSearch || null,
                salesRepName: salesSearch || null,
                supplyAmount: supply,
                stampDuty: stampDuty ? Number(stampDuty.replace(/,/g, "")) : null,
                performanceBondRate: parseFloat(performanceBondRate) || 10,
                defectBondRate: parseFloat(defectBondRate) || 2,
                paymentSchedule,
                contractNotes,
                contractDate: formatDateStr(contractDate),
                contractStartDate: formatDateStr(contractStartDate),
                contractEndDate: formatDateStr(contractEndDate),
                expectedAmount: supply ? Math.round(supply * 1.1) : null,
            };

            if (isNewContract) {
                // 1) POST로 레코드 생성
                const createRes = await fetch("/api/contracts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ projectId, contractTitle: payload.contractTitle || `${contractList.length + 1}차 계약` }),
                });
                if (!createRes.ok) throw new Error();
                const created = await createRes.json();
                const newId: number = created.id;

                // 2) PUT으로 상세 정보 저장
                const updateRes = await fetch(`/api/contracts/${newId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!updateRes.ok) throw new Error();

                setIsNewContract(false);
                setSelectedContractId(newId);
            } else {
                if (!selectedContractId) return;
                const res = await fetch(`/api/contracts/${selectedContractId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error();
            }

            showToast("저장되었습니다.", "success");
            await onSaveSuccess();
            await fetchContractList();
        } catch {
            showToast("저장에 실패했습니다.", "error");
        } finally {
            setSaving(false);
        }
    };

    // 단계 완료
    const handleComplete = () => {
        confirm({
            title: "작성완료",
            message: "계약 단계를 완료 처리하시겠습니까?",
            onConfirm: async () => {
                await onCompleteSuccess();
            },
        });
    };

    // 계약 추가 — 로컬 폼만 초기화, 저장은 저장 버튼으로
    const handleAddContract = () => {
        setIsNewContract(true);
        setSelectedContractId(null);
        setContract(null);
        // 폼 초기화
        setContractTitle("");
        setSupplyAmount("");
        setStampDuty("");
        setPerformanceBondRate("10");
        setDefectBondRate("2");
        setPaymentSchedule("");
        setContractNotes("");
        setContractDate(undefined);
        setContractStartDate(undefined);
        setContractEndDate(undefined);
        setCustomerSearch(""); setSelectedCustomerId(null);
        setOrdererSearch(""); setSelectedOrdererId(null);
        setPmSearch(""); setSelectedManagerId(null);
        setSalesSearch(""); setSelectedSalesRepId(null);
    };

    // 계약 삭제
    const handleDeleteContract = () => {
        if (!selectedContractId) return;
        confirm({
            title: "계약 삭제",
            message: `"${contract?.contractTitle || "이 계약"}"을(를) 삭제하시겠습니까?`,
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/contracts/${selectedContractId}`, { method: "DELETE" });
                    if (!res.ok) throw new Error();
                    showToast("삭제되었습니다.", "success");
                    setSelectedContractId(null);
                    await fetchContractList();
                } catch {
                    showToast("삭제에 실패했습니다.", "error");
                }
            },
        });
    };

    // 금액 계산
    const supplyNum = Number(supplyAmount?.replace(/,/g, "") || 0);
    const tax = supplyNum ? Math.round(supplyNum * 0.1) : 0;
    const totalAmount = supplyNum + tax;

    // 기간 계산
    let durationText = "";
    if (contractStartDate && contractEndDate) {
        const days = Math.ceil((contractEndDate.getTime() - contractStartDate.getTime()) / (1000 * 60 * 60 * 24));
        if (days >= 0) durationText = `${days}일간`;
    }

    return (
        <>
            <div className="space-y-6">
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/projects/contract-status"
                            className="p-2 -ml-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-300"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 line-clamp-2 max-w-[300px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] xl:max-w-[800px] leading-snug">
                                    <span className="text-blue-600">계약</span> - {project?.name || "프로젝트"}
                                </h1>
                                <StatusBadge status={phaseStatus} className="h-9" />
                                <ProjectPhaseNav projectId={projectId} />
                            </div>
                            <p className="text-sm text-gray-600">
                                {project?.projectCode && <span className="font-mono">{project.projectCode}</span>}
                                {project?.projectCode && project?.customerName && " | "}
                                {project?.customerName && <span>{project.customerName}</span>}
                            </p>
                        </div>
                    </div>

                    {/* 헤더 우측 버튼 */}
                    {!isReadOnly && (
                        <div className="flex items-center gap-3">
                            <Button
                                variant="primary"
                                onClick={handleComplete}
                                className="flex items-center gap-2"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                작성완료
                            </Button>
                        </div>
                    )}
                </div>

                {/* ── 단일 카드: 계약 목록 + 상세 ── */}
                <div className="neo-light-card border border-border/40 overflow-hidden">

                    {/* 카드 헤더 */}
                    <div className="px-8 py-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-5 bg-primary rounded-full" />
                            <h2 className="text-base font-bold text-gray-900">계약 목록</h2>
                            {(contractList.length > 0 || isNewContract) && (
                                <span className="text-xs text-gray-400">({contractList.length + (isNewContract ? 1 : 0)}건)</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {!isReadOnly && selectedContractId && contractList.length > 1 && (
                                <button
                                    onClick={handleDeleteContract}
                                    className="inline-flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    삭제
                                </button>
                            )}
                            {!isReadOnly && (selectedContractId || isNewContract) && (
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 h-9 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-default transition-colors"
                                >
                                    <Save className="h-4 w-4" />
                                    {saving ? "저장 중..." : "저장"}
                                </button>
                            )}
                            {!isReadOnly && (
                                <button
                                    onClick={handleAddContract}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 px-3 h-9 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    계약 추가
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 계약 목록 테이블 */}
                    {loadingList ? (
                        <div className="flex items-center justify-center py-8 text-sm text-gray-400">
                            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                            불러오는 중...
                        </div>
                    ) : contractList.length === 0 ? (
                        <div className="py-16 text-center">
                            <FileSignature className="h-10 w-10 mx-auto text-gray-200 mb-3" />
                            <p className="text-sm text-gray-400">등록된 계약이 없습니다.</p>
                            {!isReadOnly && (
                                <button onClick={handleAddContract} className="mt-3 text-xs text-primary hover:underline">
                                    + 계약 추가
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="px-8 py-4">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 h-[46px]">
                                        <th className="text-center pl-4 pr-3 py-0 text-sm font-medium text-gray-600 w-12">No.</th>
                                        <th className="text-left px-3 py-0 text-sm font-medium text-gray-600">계약명</th>
                                        <th className="text-center px-3 py-0 text-sm font-medium text-gray-600 w-20">구분</th>
                                        <th className="text-center px-3 py-0 text-sm font-medium text-gray-600 w-28">계약일</th>
                                        <th className="text-center px-3 py-0 text-sm font-medium text-gray-600 w-28">착수일</th>
                                        <th className="text-center px-3 py-0 text-sm font-medium text-gray-600 w-28">완료일</th>
                                        <th className="text-right pl-3 pr-4 py-0 text-sm font-medium text-gray-600 w-36">계약금액</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {contractList.map((c, idx) => {
                                        const supply = c.supplyAmount || 0;
                                        const total = supply ? Math.round(supply * 1.1) : 0;
                                        const isSelected = c.id === selectedContractId;
                                        return (
                                            <tr
                                                key={c.id}
                                                onClick={() => { setIsNewContract(false); setSelectedContractId(c.id); }}
                                                className={cn(
                                                    "cursor-pointer transition-colors duration-150 h-[46px] hover:bg-primary/[0.02] rounded",
                                                    isSelected && "bg-primary/[0.04] border-l-2 border-l-primary"
                                                )}
                                            >
                                                <td className="pl-4 pr-3 py-0 text-sm text-center text-gray-400 font-mono">{idx + 1}</td>
                                                <td className="px-3 py-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {c.contractTitle || "본계약"}
                                                        </span>
                                                        {isSelected && <ChevronRight className="h-3 w-3 text-gray-400" />}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-0 text-sm text-center text-gray-500">
                                                    {c.contractType || "-"}
                                                </td>
                                                <td className="px-3 py-0 text-sm text-center text-gray-500 font-mono">{c.contractDate || "-"}</td>
                                                <td className="px-3 py-0 text-sm text-center text-gray-500 font-mono">{c.contractStartDate || "-"}</td>
                                                <td className="px-3 py-0 text-sm text-center text-gray-500 font-mono">{c.contractEndDate || "-"}</td>
                                                <td className="pl-3 pr-4 py-0 text-right font-mono text-sm font-semibold text-gray-900">
                                                    {total ? `${formatNumber(total)}원` : "-"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {/* 신규 미저장 임시 행 */}
                                    {isNewContract && (
                                        <tr className="bg-primary/[0.04] border-l-2 border-l-primary h-[46px]">
                                            <td className="pl-4 pr-3 py-0 text-sm text-center text-gray-400 font-mono">{contractList.length + 1}</td>
                                            <td className="px-3 py-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-500 italic">
                                                        {contractTitle || "새 계약 (미저장)"}
                                                    </span>
                                                    <span className="text-xs text-amber-500 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">미저장</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-0 text-sm text-center text-gray-400">-</td>
                                            <td className="px-3 py-0 text-sm text-center text-gray-400">-</td>
                                            <td className="px-3 py-0 text-sm text-center text-gray-400">-</td>
                                            <td className="px-3 py-0 text-sm text-center text-gray-400">-</td>
                                            <td className="pl-3 pr-4 py-0 text-right font-mono text-sm text-gray-400">-</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 구분선 */}
                    {(selectedContractId || isNewContract) && <div className="h-px bg-border/20 mx-8" />}

                    {/* 선택된 계약 상세 / 신규 입력 폼 */}
                    {(selectedContractId || isNewContract) && (
                        (!isNewContract && loadingDetail) ? (
                            <div className="flex items-center justify-center py-16 text-sm text-gray-400">
                                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                                불러오는 중...
                            </div>
                        ) : (isNewContract || contract) ? (
                            <>
                                <div className="px-8 pt-6 pb-2 flex items-center gap-3">
                                    <div className="w-1 h-5 bg-primary rounded-full" />
                                    <h2 className="text-base font-bold text-gray-900">계약 정보</h2>
                                </div>
                                <div className="p-8 pt-4 space-y-6">

                                    <div className="grid grid-cols-4 gap-x-6 gap-y-4">
                                        <Field className="col-span-3">
                                            <FieldLabel>계약명</FieldLabel>
                                            <Input
                                                value={contractTitle}
                                                onChange={e => setContractTitle(e.target.value)}
                                                placeholder="본계약, 1차 추가계약 등"
                                                disabled={isReadOnly}
                                            />
                                        </Field>
                                        <Field>
                                            <FieldLabel>계약 구분</FieldLabel>
                                            <div className="flex items-center gap-2">
                                                {["신규", "변경"].map((type) => {
                                                    const isActive = contract?.contractType === type;
                                                    return (
                                                        <span
                                                            key={type}
                                                            className={cn(
                                                                "inline-flex items-center justify-center h-10 px-4 rounded-xl text-sm font-semibold border transition-all",
                                                                isActive
                                                                    ? type === "신규"
                                                                        ? "bg-blue-50 border-blue-300 text-blue-700"
                                                                        : "bg-amber-50 border-amber-300 text-amber-700"
                                                                    : "bg-white border-gray-200 text-gray-300"
                                                            )}
                                                        >
                                                            {type}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </Field>
                                        {/* 고객사 */}
                                        <Field className="relative">
                                            <FieldLabel>고객사</FieldLabel>
                                            {isReadOnly ? (
                                                <Input value={customerSearch} disabled className="bg-gray-50" />
                                            ) : (
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={customerSearch}
                                                        onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); setSelectedCustomerId(null); }}
                                                        onFocus={() => setShowCustomerDropdown(true)}
                                                        placeholder="고객사 검색..."
                                                        className="w-full h-10 rounded-xl border border-gray-300 px-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                                                    />
                                                    {showCustomerDropdown && filteredCustomers.length > 0 && (
                                                        <div className="absolute z-50 mt-1 max-h-40 w-full overflow-auto rounded-xl border bg-white shadow-lg">
                                                            {filteredCustomers.map(c => (
                                                                <button key={c.id} type="button"
                                                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                                                                    onClick={() => { setCustomerSearch(c.name); setSelectedCustomerId(c.id); setShowCustomerDropdown(false); }}>
                                                                    {c.name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Field>
                                        {/* 발주처 */}
                                        <Field className="relative">
                                            <FieldLabel>발주처</FieldLabel>
                                            {isReadOnly ? (
                                                <Input value={ordererSearch} disabled className="bg-gray-50" />
                                            ) : (
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={ordererSearch}
                                                        onChange={e => { setOrdererSearch(e.target.value); setShowOrdererDropdown(true); setSelectedOrdererId(null); }}
                                                        onFocus={() => setShowOrdererDropdown(true)}
                                                        placeholder="발주처 검색..."
                                                        className="w-full h-10 rounded-xl border border-gray-300 px-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                                                    />
                                                    {showOrdererDropdown && filteredOrderers.length > 0 && (
                                                        <div className="absolute z-50 mt-1 max-h-40 w-full overflow-auto rounded-xl border bg-white shadow-lg">
                                                            {filteredOrderers.map(c => (
                                                                <button key={c.id} type="button"
                                                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                                                                    onClick={() => { setOrdererSearch(c.name); setSelectedOrdererId(c.id); setShowOrdererDropdown(false); }}>
                                                                    {c.name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Field>
                                        {/* 영업대표 */}
                                        <Field className="relative">
                                            <FieldLabel>영업대표</FieldLabel>
                                            {isReadOnly ? (
                                                <Input value={salesSearch} disabled className="bg-gray-50" />
                                            ) : (
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={salesSearch}
                                                        onChange={e => { setSalesSearch(e.target.value); setShowSalesDropdown(true); setSelectedSalesRepId(null); }}
                                                        onFocus={() => setShowSalesDropdown(true)}
                                                        placeholder="영업대표 검색..."
                                                        className="w-full h-10 rounded-xl border border-gray-300 px-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                                                    />
                                                    {showSalesDropdown && filteredSales.length > 0 && (
                                                        <div className="absolute z-50 mt-1 max-h-40 w-full overflow-auto rounded-xl border bg-white shadow-lg">
                                                            {filteredSales.map(u => (
                                                                <button key={u.id} type="button"
                                                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                                                                    onClick={() => { const d = [u.name, u.rank_name].filter(Boolean).join(" "); setSalesSearch(d); setSelectedSalesRepId(u.id); setShowSalesDropdown(false); }}>
                                                                    {u.name} {u.rank_name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Field>
                                        {/* PM */}
                                        <Field className="relative">
                                            <FieldLabel>PM</FieldLabel>
                                            {isReadOnly ? (
                                                <Input value={pmSearch} disabled className="bg-gray-50" />
                                            ) : (
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={pmSearch}
                                                        onChange={e => { setPmSearch(e.target.value); setShowPmDropdown(true); setSelectedManagerId(null); }}
                                                        onFocus={() => setShowPmDropdown(true)}
                                                        placeholder="PM 검색..."
                                                        className="w-full h-10 rounded-xl border border-gray-300 px-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                                                    />
                                                    {showPmDropdown && filteredPms.length > 0 && (
                                                        <div className="absolute z-50 mt-1 max-h-40 w-full overflow-auto rounded-xl border bg-white shadow-lg">
                                                            {filteredPms.map(u => (
                                                                <button key={u.id} type="button"
                                                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                                                                    onClick={() => { const d = [u.name, u.rank_name].filter(Boolean).join(" "); setPmSearch(d); setSelectedManagerId(u.id); setShowPmDropdown(false); }}>
                                                                    {u.name} {u.rank_name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Field>
                                        {/* 공급가액 */}
                                        <Field>
                                            <FieldLabel>계약일</FieldLabel>
                                            <DatePicker date={contractDate} setDate={setContractDate} disabled={isReadOnly} />
                                        </Field>
                                        <Field>
                                            <FieldLabel>시작일</FieldLabel>
                                            <DatePicker date={contractStartDate} setDate={setContractStartDate} disabled={isReadOnly} />
                                        </Field>
                                        <Field>
                                            <FieldLabel>종료일</FieldLabel>
                                            <DatePicker date={contractEndDate} setDate={setContractEndDate} disabled={isReadOnly} />
                                        </Field>
                                        <Field>
                                            <FieldLabel>계약기간</FieldLabel>
                                            <Input
                                                value={durationText || "-"}
                                                disabled
                                                className="bg-gray-50 text-left font-mono"
                                            />
                                        </Field>
                                        <Field>
                                            <FieldLabel>공급가액 (원)</FieldLabel>
                                            <Input
                                                value={supplyAmount}
                                                onChange={e => setSupplyAmount(e.target.value.replace(/[^0-9]/g, ""))}
                                                onBlur={e => {
                                                    const n = Number(e.target.value.replace(/,/g, ""));
                                                    if (n) setSupplyAmount(n.toLocaleString());
                                                }}
                                                placeholder="0"
                                                disabled={isReadOnly}
                                                className="text-right font-mono"
                                            />
                                        </Field>
                                        <Field>
                                            <FieldLabel>부가세 (10%)</FieldLabel>
                                            <Input value={formatNumber(tax)} disabled className="bg-gray-50 text-right font-mono" />
                                        </Field>
                                        <Field>
                                            <FieldLabel>합계금액</FieldLabel>
                                            <Input value={formatNumber(totalAmount)} disabled className="bg-gray-50 text-right font-mono font-bold" />
                                        </Field>
                                        <Field className="col-start-1">
                                            <FieldLabel>인지세 (원)</FieldLabel>
                                            <Input
                                                value={stampDuty}
                                                onChange={e => setStampDuty(e.target.value.replace(/[^0-9]/g, ""))}
                                                onBlur={e => {
                                                    const n = Number(e.target.value.replace(/,/g, ""));
                                                    if (n) setStampDuty(n.toLocaleString());
                                                }}
                                                placeholder="0"
                                                disabled={isReadOnly}
                                                className="text-right font-mono"
                                            />
                                        </Field>
                                        {/* 보증율 */}
                                        <Field>
                                            <FieldLabel>이행보증율 (%)</FieldLabel>
                                            <Input
                                                value={performanceBondRate}
                                                onChange={e => setPerformanceBondRate(e.target.value)}
                                                disabled={isReadOnly}
                                                className="text-right font-mono"
                                            />
                                        </Field>
                                        <Field>
                                            <FieldLabel>하자보증율 (%)</FieldLabel>
                                            <Input
                                                value={defectBondRate}
                                                onChange={e => setDefectBondRate(e.target.value)}
                                                disabled={isReadOnly}
                                                className="text-right font-mono"
                                            />
                                        </Field>
                                    </div>
                                    {/* 결제 조건 / 특이사항 */}
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <Field>
                                            <FieldLabel>지급일정</FieldLabel>
                                            <textarea
                                                value={paymentSchedule}
                                                onChange={e => setPaymentSchedule(e.target.value)}
                                                rows={3}
                                                disabled={isReadOnly}
                                                placeholder="결제 조건을 입력하세요"
                                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 disabled:cursor-default resize-none"
                                            />
                                        </Field>
                                        <Field>
                                            <FieldLabel>기타 특이사항</FieldLabel>
                                            <textarea
                                                value={contractNotes}
                                                onChange={e => setContractNotes(e.target.value)}
                                                rows={3}
                                                disabled={isReadOnly}
                                                placeholder="특이사항을 입력하세요"
                                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 disabled:cursor-default resize-none"
                                            />
                                        </Field>
                                    </div>
                                    {/* 첨부파일 */}
                                    <AttachmentSection
                                        entityType="contract"
                                        entityId={selectedContractId ?? 0}
                                        readonly={isReadOnly}
                                    />
                                </div>
                            </>
                        ) : null
                    )}
                </div>
            </div>
            {/* 드론다운 외부 클릭 닫기 */}
            {(showCustomerDropdown || showOrdererDropdown || showSalesDropdown || showPmDropdown) && (
                <div className="fixed inset-0 z-40" onClick={() => {
                    setShowCustomerDropdown(false);
                    setShowOrdererDropdown(false);
                    setShowSalesDropdown(false);
                    setShowPmDropdown(false);
                }} />
            )}
        </>
    );
}

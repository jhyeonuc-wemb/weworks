"use client";

import { use, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Plus, FileSignature, Trash2, ChevronRight, CheckCircle2, Paperclip } from "lucide-react";
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
    performanceBondAmount: number | null;
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

// DB 문자열 → Date 객체 (로컬 시간 기준 파싱, UTC 자정 방지)
const parseLocalDate = (s: string | null | undefined): Date | undefined => {
    if (!s) return undefined;
    const [y, m, d] = s.split("T")[0].split("-").map(Number);
    return new Date(y, m - 1, d);
};
// Date 객체 → "YYYY-MM-DD" 문자열 (로컬 날짜 기준)
const dateToStr = (d: Date | undefined): string => {
    if (!d) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

// ─── 메인 페이지 ──────────────────────────────────────────────────────────

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const projectId = Number(id);

    const { showToast, confirm } = useToast();
    const { status: phaseStatus, isFinalStatus, initialStatus, onSaveSuccess, onCompleteSuccess, loadPhaseStatus } = useProjectPhase(projectId, "contract");
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
    const [isNewContract, setIsNewContract] = useState(false);
    const [contract, setContract] = useState<ContractDetail | null>(null);
    const [prevContract, setPrevContract] = useState<ContractDetail | null>(null);
    const [loadingList, setLoadingList] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);

    // 폼 상태
    const [contractTitle, setContractTitle] = useState("");
    const [contractTypeForm, setContractTypeForm] = useState<"신규" | "변경">("\uc2e0\uaddc"); // 신규 | 변경
    const [supplyAmount, setSupplyAmount] = useState("");
    const [stampDuty, setStampDuty] = useState("");
    const [performanceBondAmount, setPerformanceBondAmount] = useState("0");
    const [performanceBondRate, setPerformanceBondRate] = useState("0");
    const [defectBondRate, setDefectBondRate] = useState("0");
    const [paymentSchedule, setPaymentSchedule] = useState("");
    const [contractNotes, setContractNotes] = useState("");
    const [contractDate, setContractDate] = useState("");       // "YYYY-MM-DD"
    const [contractStartDate, setContractStartDate] = useState("");
    const [contractEndDate, setContractEndDate] = useState("");

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
            .then(async (data) => {
                const c: ContractDetail = data.contract;
                setContract(c);
                setContractTitle(c.contractTitle || "");
                setContractTypeForm((c.contractType as "신규" | "변경") || "신규");
                setSupplyAmount(c.supplyAmount ? c.supplyAmount.toLocaleString() : "");
                setStampDuty(c.stampDuty ? c.stampDuty.toLocaleString() : "");
                setPerformanceBondAmount(c.performanceBondAmount != null ? c.performanceBondAmount.toLocaleString() : "0");
                setPerformanceBondRate(String(c.performanceBondRate ?? 0));
                setDefectBondRate(String(c.defectBondRate ?? 0));
                setPaymentSchedule(c.paymentSchedule || "");
                setContractNotes(c.contractNotes || "");
                setContractDate(c.contractDate?.split("T")[0] || "");
                setContractStartDate(c.contractStartDate?.split("T")[0] || "");
                setContractEndDate(c.contractEndDate?.split("T")[0] || "");
                // 고객사/발주처/영업대표/PM 초기화
                setSelectedCustomerId(c.customerId ?? null);
                setCustomerSearch(c.customerName || "");
                setSelectedOrdererId(c.ordererId ?? null);
                setOrdererSearch(c.ordererName || "");
                setSelectedManagerId(c.managerId ?? null);
                setPmSearch(c.managerName || "");
                setSelectedSalesRepId(c.salesRepId ?? null);
                setSalesSearch(c.salesRepName || "");

                // 변경 계약이면 직전 계약 로드
                if (c.contractType === "변경") {
                    const curIdx = contractList.findIndex(x => x.id === selectedContractId);
                    const prevId = curIdx > 0 ? contractList[curIdx - 1].id : null;
                    if (prevId) {
                        const prevRes = await fetch(`/api/contracts/${prevId}`);
                        if (prevRes.ok) { const pd = await prevRes.json(); setPrevContract(pd.contract); }
                    } else { setPrevContract(null); }
                } else {
                    setPrevContract(null);
                }
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
                contractType: contractTypeForm,
                customerName: customerSearch || null,
                ordererName: ordererSearch || null,
                managerName: pmSearch || null,
                salesRepName: salesSearch || null,
                supplyAmount: supply,
                stampDuty: stampDuty ? Number(stampDuty.replace(/,/g, "")) : null,
                performanceBondAmount: performanceBondAmount ? Number(performanceBondAmount.replace(/,/g, "")) : null,
                performanceBondRate: parseFloat(performanceBondRate) || 0,
                defectBondRate: parseFloat(defectBondRate) || 0,
                paymentSchedule,
                contractNotes,
                contractDate: contractDate || null,
                contractStartDate: contractStartDate || null,
                contractEndDate: contractEndDate || null,
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
                // 신규 저장 후 목록 갱신 (새 항목 추가)
                await fetchContractList();
            } else {
                if (!selectedContractId) return;
                const res = await fetch(`/api/contracts/${selectedContractId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error();

                // PUT 저장 즉시 목록 in-place 업데이트 (re-fetch 없이 바로 반영)
                setContractList(prev => prev.map(c =>
                    c.id === selectedContractId ? {
                        ...c,
                        contractTitle: contractTitle || c.contractTitle,
                        contractType: contractTypeForm,
                        supplyAmount: supply,
                        contractDate: contractDate || null,
                        contractStartDate: contractStartDate || null,
                        contractEndDate: contractEndDate || null,
                    } : c
                ));
            }

            showToast("저장되었습니다.", "success");
            await onSaveSuccess();

            // 변경 계약에서 날짜·계약금액이 바뀐 경우 → 프로젝트 정보 업데이트 여부 확인
            if (contractTypeForm === "변경" && prevContract) {
                const prevStart = prevContract.contractStartDate?.split("T")[0] || "";
                const prevEnd = prevContract.contractEndDate?.split("T")[0] || "";
                const prevSupply = prevContract.supplyAmount ?? null;
                const currentSupply = supplyAmount ? Number(supplyAmount.replace(/,/g, "")) : null;

                const startChanged = contractStartDate !== prevStart;
                const endChanged = contractEndDate !== prevEnd;
                const amountChanged = currentSupply !== prevSupply;

                if (startChanged || endChanged || amountChanged) {
                    const items = [
                        startChanged && "시작일",
                        endChanged && "종료일",
                        amountChanged && "계약금액",
                    ].filter(Boolean).join(", ");

                    confirm({
                        title: "프로젝트 정보 업데이트",
                        message: `${items}이(가) 변경되었습니다.\n프로젝트 정보도 업데이트하시겠습니까?`,
                        onConfirm: async () => {
                            const patch: Record<string, string | number | null> = {};
                            if (startChanged) patch.contractStartDate = contractStartDate || null;
                            if (endChanged) patch.contractEndDate = contractEndDate || null;
                            if (amountChanged) patch.expectedAmount = currentSupply ?? null;
                            try {
                                const r = await fetch(`/api/projects/${projectId}`, {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(patch),
                                });
                                if (r.ok) showToast("프로젝트 정보가 업데이트되었습니다.", "success");
                                else showToast("프로젝트 업데이트에 실패했습니다.", "error");
                            } catch {
                                showToast("프로젝트 업데이트에 실패했습니다.", "error");
                            }
                        },
                    });
                }
            }

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

    // 계약 추가 — 신규: 빈 폼 / 변경: 현재 계약 내용 복사
    const handleAddContract = (type: "신규" | "변경") => {
        setIsNewContract(true);
        setSelectedContractId(null);
        setContractTypeForm(type);

        if (type === "변경" && contract) {
            // 기존 계약 내용 그대로 복사
            setContractTitle(contract.contractTitle || "");
            setSupplyAmount(contract.supplyAmount ? contract.supplyAmount.toLocaleString() : "");
            setStampDuty(contract.stampDuty ? String(contract.stampDuty) : "");
            setPerformanceBondAmount(contract.performanceBondAmount != null ? contract.performanceBondAmount.toLocaleString() : "0");
            setPerformanceBondRate(String(contract.performanceBondRate ?? 0));
            setDefectBondRate(String(contract.defectBondRate ?? 0));
            setPaymentSchedule(contract.paymentSchedule || "");
            setContractNotes(contract.contractNotes || "");
            setContractDate(contract.contractDate?.split("T")[0] || "");
            setContractStartDate(contract.contractStartDate?.split("T")[0] || "");
            setContractEndDate(contract.contractEndDate?.split("T")[0] || "");
            setSelectedCustomerId(contract.customerId ?? null);
            setCustomerSearch(contract.customerName || "");
            setSelectedOrdererId(contract.ordererId ?? null);
            setOrdererSearch(contract.ordererName || "");
            setSelectedManagerId(contract.managerId ?? null);
            setPmSearch(contract.managerName || "");
            setSelectedSalesRepId(contract.salesRepId ?? null);
            setSalesSearch(contract.salesRepName || "");
        } else {
            // 신규: 빈 폼
            setContractTitle("");
            setSupplyAmount("");
            setStampDuty("");
            setPerformanceBondAmount("0");
            setPerformanceBondRate("0");
            setDefectBondRate("0");
            setPaymentSchedule("");
            setContractNotes("");
            setContractDate("");
            setContractStartDate("");
            setContractEndDate("");
            setCustomerSearch(""); setSelectedCustomerId(null);
            setOrdererSearch(""); setSelectedOrdererId(null);
            setPmSearch(""); setSelectedManagerId(null);
            setSalesSearch(""); setSelectedSalesRepId(null);
        }
        setContract(null);
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
                    // 렬쐸후 남은 계약 수 확인
                    const res2 = await fetch(`/api/contracts?projectId=${projectId}`);
                    const data2 = await res2.json();
                    const remaining = data2.contracts?.length ?? 0;
                    if (remaining === 0 && initialStatus) {
                        // 계약 0건 → 단계 상태를 첫 번째 상태(대기)로 리쌅
                        await fetch(`/api/projects/${projectId}/phase-progress`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ phaseCode: "contract", status: initialStatus }),
                        });
                        await loadPhaseStatus();
                    }
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

    // 합계금액 역산 (total 입력 → supply = total / 1.1)
    const handleTotalBlur = (val: string) => {
        const total = Number(val.replace(/,/g, ""));
        if (!total) { setSupplyAmount(""); return; }
        const supply = Math.round(total / 1.1);
        setSupplyAmount(supply.toLocaleString());
    };

    // 기간 계산 (string 기준)
    let durationText = "";
    if (contractStartDate && contractEndDate) {
        const s = parseLocalDate(contractStartDate);
        const e = parseLocalDate(contractEndDate);
        if (s && e) {
            const days = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            if (days >= 0) durationText = `${days}일간`;
        }
    }

    // ── 변경 계약: 이전 계약과 달라진 필드 감지 ─────────────────────────
    const changedFields = useMemo(() => {
        const s = new Set<string>();
        if (!contract || contract.contractType !== "변경" || !prevContract) return s;
        const eq = (a: any, b: any) => String(a ?? "").trim() === String(b ?? "").trim();
        if (!eq(contract.contractTitle, prevContract.contractTitle)) s.add("contractTitle");
        if (!eq(contract.supplyAmount, prevContract.supplyAmount)) s.add("supplyAmount");
        if (!eq(contract.stampDuty, prevContract.stampDuty)) s.add("stampDuty");
        if (!eq(contract.performanceBondAmount, prevContract.performanceBondAmount)) s.add("performanceBondAmount");
        if (!eq(contract.performanceBondRate, prevContract.performanceBondRate)) s.add("performanceBondRate");
        if (!eq(contract.defectBondRate, prevContract.defectBondRate)) s.add("defectBondRate");
        if (!eq(contract.contractDate, prevContract.contractDate)) s.add("contractDate");
        if (!eq(contract.contractStartDate, prevContract.contractStartDate)) s.add("contractStartDate");
        if (!eq(contract.contractEndDate, prevContract.contractEndDate)) s.add("contractEndDate");
        if (!eq(contract.customerName, prevContract.customerName)) s.add("customerName");
        if (!eq(contract.ordererName, prevContract.ordererName)) s.add("ordererName");
        if (!eq(contract.managerName, prevContract.managerName)) s.add("managerName");
        if (!eq(contract.salesRepName, prevContract.salesRepName)) s.add("salesRepName");
        if (!eq(contract.paymentSchedule, prevContract.paymentSchedule)) s.add("paymentSchedule");
        if (!eq(contract.contractNotes, prevContract.contractNotes)) s.add("contractNotes");
        return s;
    }, [contract, prevContract]);
    // 변경된 필드에 적용할 클래스
    const changed = (field: string) =>
        changedFields.has(field) ? "ring-2 ring-amber-400 rounded-xl bg-amber-50/40" : "";

    return (
        <>
            <div className="space-y-6">
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/projects/contract"
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
                    <div className="px-8 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-5 bg-primary rounded-full" />
                            <h2 className="text-base font-bold text-gray-900">계약 목록</h2>
                            {(contractList.length > 0 || isNewContract) && (
                                <span className="text-xs text-gray-400">({contractList.length + (isNewContract ? 1 : 0)}건)</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">

                            {!isReadOnly && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleAddContract("신규")}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 px-3 h-9 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        신규 계약
                                    </button>
                                    {contractList.length >= 1 && (
                                        <button
                                            onClick={() => handleAddContract("변경")}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 px-3 h-9 text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            변경 계약
                                        </button>
                                    )}
                                    {(selectedContractId || isNewContract) && (
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 h-9 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-default transition-colors"
                                        >
                                            <Save className="h-4 w-4" />
                                            {saving ? "저장 중..." : "저장"}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 계약 목록 테이블 */}
                    {loadingList ? (
                        <div className="flex items-center justify-center py-8 text-sm text-gray-400">
                            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                            불러오는 중...
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
                                        {!isReadOnly && <th className="w-10" />}
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
                                                {!isReadOnly && (
                                                    <td className="pr-3 py-0 text-center" onClick={e => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedContractId(c.id);
                                                                handleDeleteContract();
                                                            }}
                                                            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                            title="삭제"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </td>
                                                )}
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
                                            <td className="pr-3 py-0 text-center">
                                                <button
                                                    onClick={() => setIsNewContract(false)}
                                                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                    title="취소"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                {contractList.length > 0 && (() => {
                                    // 유효 계약금액 누적 계산
                                    // - 신규: 합산에 추가
                                    // - 변경(금액 변경): 이전 금액 빼고 새 금액 추가 (교체)
                                    // - 변경(금액 동일): 무시
                                    let total = 0;
                                    let prevAmount: number | null = null;
                                    for (const c of contractList) {
                                        if (c.supplyAmount == null) continue;
                                        if (c.contractType === "변경") {
                                            if (prevAmount !== null && c.supplyAmount !== prevAmount) {
                                                total = total - prevAmount + c.supplyAmount;
                                            }
                                        } else {
                                            // 신규: 무조건 합산
                                            total += c.supplyAmount;
                                        }
                                        prevAmount = c.supplyAmount;
                                    }
                                    const totalSum = total > 0 ? Math.round(total * 1.1) : 0;
                                    return totalSum > 0 ? (
                                        <tfoot>
                                            <tr className="bg-blue-50/60 border-t-2 border-blue-200 h-[44px]">
                                                <td colSpan={6} className="pl-4 pr-4 py-0 text-sm font-bold text-blue-700 text-right tracking-tight">
                                                    계약금액 합계
                                                </td>
                                                <td className="pl-3 pr-4 py-0 text-right font-mono text-sm font-bold text-blue-800">
                                                    {formatNumber(totalSum)}원
                                                </td>
                                                {!isReadOnly && <td />}
                                            </tr>
                                        </tfoot>
                                    ) : null;
                                })()}
                            </table>
                        </div>
                    )}

                    {/* 구분선 */}
                    <div className="h-px bg-border/20 mx-8" />

                    {/* 선택된 계약 상세 / 신규 입력 폼 */}
                    {(!isNewContract && selectedContractId && loadingDetail) ? (
                        <div className="flex items-center justify-center py-16 text-sm text-gray-400">
                            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                            불러오는 중...
                        </div>
                    ) : (isNewContract || contract || !selectedContractId) ? (
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
                                            disabled={isReadOnly}
                                            className={changed("contractTitle")}
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel>계약 구분</FieldLabel>
                                        <div className="flex items-center gap-2">
                                            {["신규", "변경"].map((type) => {
                                                const activeType = isNewContract ? contractTypeForm : (contract?.contractType || contractTypeForm);
                                                const isActive = activeType === type;
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
                                            <Input value={customerSearch} disabled className={cn("bg-gray-50", changed("customerName"))} />
                                        ) : (
                                            <div className={cn("relative", changed("customerName"))}>
                                                <input
                                                    type="text"
                                                    value={customerSearch}
                                                    onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); setSelectedCustomerId(null); }}
                                                    onFocus={() => setShowCustomerDropdown(true)}
                                                    onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 150)}
                                                    placeholder="고객사 검색..."
                                                    className="w-full h-10 rounded-xl border border-gray-300 px-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                                                />
                                                {showCustomerDropdown && filteredCustomers.length > 0 && (
                                                    <div onMouseDown={e => e.preventDefault()} className="absolute z-50 mt-1 max-h-40 w-full overflow-auto rounded-xl border bg-white shadow-lg">
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
                                            <Input value={ordererSearch} disabled className={cn("bg-gray-50", changed("ordererName"))} />
                                        ) : (
                                            <div className={cn("relative", changed("ordererName"))}>
                                                <input
                                                    type="text"
                                                    value={ordererSearch}
                                                    onChange={e => { setOrdererSearch(e.target.value); setShowOrdererDropdown(true); setSelectedOrdererId(null); }}
                                                    onFocus={() => setShowOrdererDropdown(true)}
                                                    onBlur={() => setTimeout(() => setShowOrdererDropdown(false), 150)}
                                                    placeholder="발주처 검색..."
                                                    className="w-full h-10 rounded-xl border border-gray-300 px-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                                                />
                                                {showOrdererDropdown && filteredOrderers.length > 0 && (
                                                    <div onMouseDown={e => e.preventDefault()} className="absolute z-50 mt-1 max-h-40 w-full overflow-auto rounded-xl border bg-white shadow-lg">
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
                                            <Input value={salesSearch} disabled className={cn("bg-gray-50", changed("salesRepName"))} />
                                        ) : (
                                            <div className={cn("relative", changed("salesRepName"))}>
                                                <input
                                                    type="text"
                                                    value={salesSearch}
                                                    onChange={e => { setSalesSearch(e.target.value); setShowSalesDropdown(true); setSelectedSalesRepId(null); }}
                                                    onFocus={() => setShowSalesDropdown(true)}
                                                    onBlur={() => setTimeout(() => setShowSalesDropdown(false), 150)}
                                                    placeholder="영업대표 검색..."
                                                    className="w-full h-10 rounded-xl border border-gray-300 px-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                                                />
                                                {showSalesDropdown && filteredSales.length > 0 && (
                                                    <div onMouseDown={e => e.preventDefault()} className="absolute z-50 mt-1 max-h-40 w-full overflow-auto rounded-xl border bg-white shadow-lg">
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
                                            <Input value={pmSearch} disabled className={cn("bg-gray-50", changed("managerName"))} />
                                        ) : (
                                            <div className={cn("relative", changed("managerName"))}>
                                                <input
                                                    type="text"
                                                    value={pmSearch}
                                                    onChange={e => { setPmSearch(e.target.value); setShowPmDropdown(true); setSelectedManagerId(null); }}
                                                    onFocus={() => setShowPmDropdown(true)}
                                                    onBlur={() => setTimeout(() => setShowPmDropdown(false), 150)}
                                                    placeholder="PM 검색..."
                                                    className="w-full h-10 rounded-xl border border-gray-300 px-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                                                />
                                                {showPmDropdown && filteredPms.length > 0 && (
                                                    <div onMouseDown={e => e.preventDefault()} className="absolute z-50 mt-1 max-h-40 w-full overflow-auto rounded-xl border bg-white shadow-lg">
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
                                        <div className={changed("contractDate")}>
                                            <DatePicker
                                                date={parseLocalDate(contractDate)}
                                                setDate={(d) => setContractDate(dateToStr(d))}
                                                disabled={isReadOnly}
                                            />
                                        </div>
                                    </Field>
                                    <Field>
                                        <FieldLabel>시작일</FieldLabel>
                                        <div className={changed("contractStartDate")}>
                                            <DatePicker
                                                date={parseLocalDate(contractStartDate)}
                                                setDate={(d) => setContractStartDate(dateToStr(d))}
                                                disabled={isReadOnly}
                                            />
                                        </div>
                                    </Field>
                                    <Field>
                                        <FieldLabel>종료일</FieldLabel>
                                        <div className={changed("contractEndDate")}>
                                            <DatePicker
                                                date={parseLocalDate(contractEndDate)}
                                                setDate={(d) => setContractEndDate(dateToStr(d))}
                                                disabled={isReadOnly}
                                            />
                                        </div>
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
                                            className={cn("text-right font-mono", changed("supplyAmount"))}
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel>부가세 (10%)</FieldLabel>
                                        <Input value={formatNumber(tax)} disabled className="bg-gray-50 text-right font-mono" />
                                    </Field>
                                    <Field>
                                        <FieldLabel>계약금액 (원)</FieldLabel>
                                        <Input
                                            defaultValue={formatNumber(totalAmount)}
                                            key={totalAmount}
                                            onChange={e => e.target.value}
                                            onBlur={e => handleTotalBlur(e.target.value)}
                                            placeholder="0"
                                            disabled={isReadOnly}
                                            className="text-right font-mono font-bold"
                                        />
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
                                            className={cn("text-right font-mono", changed("stampDuty"))}
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel>계약이행 (원)</FieldLabel>
                                        <Input
                                            value={performanceBondAmount}
                                            onChange={e => setPerformanceBondAmount(e.target.value.replace(/[^0-9]/g, ""))}
                                            onBlur={e => {
                                                const n = Number(e.target.value.replace(/,/g, ""));
                                                if (n) setPerformanceBondAmount(n.toLocaleString());
                                            }}
                                            placeholder="0"
                                            disabled={isReadOnly}
                                            className={cn("text-right font-mono", changed("performanceBondAmount"))}
                                        />
                                    </Field>
                                    {/* 보증율 */}
                                    <Field>
                                        <FieldLabel>계약이행 (%)</FieldLabel>
                                        <Input
                                            value={performanceBondRate}
                                            onChange={e => setPerformanceBondRate(e.target.value)}
                                            disabled={isReadOnly}
                                            className={cn("text-right font-mono", changed("performanceBondRate"))}
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel>하자이행 (%)</FieldLabel>
                                        <Input
                                            value={defectBondRate}
                                            onChange={e => setDefectBondRate(e.target.value)}
                                            disabled={isReadOnly}
                                            className={cn("text-right font-mono", changed("defectBondRate"))}
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
                                            placeholder="지급 일정을 입력하세요"
                                            className={cn("w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 disabled:cursor-default resize-none", changed("paymentSchedule"))}
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
                                            className={cn("w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 disabled:cursor-default resize-none", changed("contractNotes"))}
                                        />
                                    </Field>
                                </div>
                                {/* 첨부파일 */}
                                <FieldLabel><span className="inline-flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5" />첨부파일</span></FieldLabel>
                                <AttachmentSection
                                    entityType="contract"
                                    entityId={selectedContractId ?? 0}
                                    readonly={isReadOnly}
                                    hideTitle
                                />
                            </div>
                        </>
                    ) : null}
                </div>
            </div>

        </>
    );
}

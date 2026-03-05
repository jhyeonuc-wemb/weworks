"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Plus, FileSignature, Trash2, ChevronRight } from "lucide-react";
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
    supplyAmount: number | null;
    contractDate: string | null;
    contractStartDate: string | null;
    contractEndDate: string | null;
}

interface ContractDetail {
    id: number;
    projectId: number;
    contractTitle: string | null;
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
    customerName: string | null;
    customerCode: string | null;
    ordererName: string | null;
    ordererCode: string | null;
    managerName: string | null;
    managerRankName: string | null;
    managerDeptName: string | null;
    salesRepName: string | null;
    salesRepRankName: string | null;
    salesRepDeptName: string | null;
    currentPhase: string;
}

const toDate = (s: string | null | undefined): Date | undefined =>
    s ? new Date(s) : undefined;
const formatDateStr = (d: Date | undefined): string | null =>
    d ? d.toISOString().slice(0, 10) : null;

// ─── 계약 목록 아이템 ──────────────────────────────────────────────────────

function ContractListItem({
    contract,
    isSelected,
    onClick,
}: {
    contract: ContractSummary;
    isSelected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 group",
                isSelected
                    ? "bg-primary/5 border-primary/30 shadow-sm"
                    : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            )}
        >
            <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-semibold truncate", isSelected ? "text-primary" : "text-gray-800")}>
                    {contract.contractTitle || "본계약"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">
                    {contract.supplyAmount ? `${formatNumber(contract.supplyAmount)}원` : "금액 미입력"}
                    {contract.contractDate && ` · ${contract.contractDate}`}
                </p>
            </div>
            <ChevronRight className={cn("h-4 w-4 shrink-0 transition-colors", isSelected ? "text-primary" : "text-gray-300 group-hover:text-gray-400")} />
        </button>
    );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const projectId = Number(id);

    const { showToast, confirm } = useToast();
    const { status: phaseStatus, isFinalStatus, onCompleteSuccess } = useProjectPhase(projectId, "contract");
    const isReadOnly = isFinalStatus;
    const handleComplete = onCompleteSuccess;

    // 계약 목록
    const [contractList, setContractList] = useState<ContractSummary[]>([]);
    const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
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

    // 계약 목록 조회
    const fetchContractList = useCallback(async () => {
        setLoadingList(true);
        try {
            const res = await fetch(`/api/contracts?projectId=${projectId}`);
            const data = await res.json();
            const list: ContractSummary[] = data.contracts || [];
            setContractList(list);
            // 자동 선택: 마지막으로 선택한 것 유지, 없으면 첫 번째
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
            })
            .finally(() => setLoadingDetail(false));
    }, [selectedContractId]);

    // 저장
    const handleSave = async () => {
        if (!selectedContractId) return;
        setSaving(true);
        try {
            const supply = supplyAmount ? Number(supplyAmount.replace(/,/g, "")) : null;
            const res = await fetch(`/api/contracts/${selectedContractId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contractTitle: contractTitle || null,
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
                }),
            });
            if (!res.ok) throw new Error();
            showToast("저장되었습니다.", "success");
            await fetchContractList();
        } catch {
            showToast("저장에 실패했습니다.", "error");
        } finally {
            setSaving(false);
        }
    };

    // 계약 추가
    const handleAddContract = async () => {
        try {
            const res = await fetch("/api/contracts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    contractTitle: `${contractList.length + 1}차 계약`,
                }),
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            await fetchContractList();
            setSelectedContractId(data.id);
            showToast("계약이 추가되었습니다.", "success");
        } catch {
            showToast("계약 추가에 실패했습니다.", "error");
        }
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
        if (days >= 0) durationText = `(${days}일)`;
    }

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-start justify-between px-2">
                <div className="flex items-center gap-3">
                    <Link href="/projects/contract-status">
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">계약 현황</h1>
                        {contract && (
                            <p className="text-sm text-gray-400 mt-0.5">
                                {contract.projectCode && <span className="font-mono">[{contract.projectCode}]</span>} {contract.projectName}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {phaseStatus && <StatusBadge status={phaseStatus} />}
                    {!isReadOnly && (
                        <button
                            onClick={handleComplete}
                            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 h-9 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                        >
                            <Save className="h-4 w-4" />
                            작성완료
                        </button>
                    )}
                </div>
            </div>

            {/* Phase Nav */}
            <ProjectPhaseNav projectId={projectId} />

            {/* 본문 */}
            <div className="grid grid-cols-[280px_1fr] gap-6 items-start">

                {/* ── 좌측: 계약 목록 ── */}
                <div className="neo-light-card border border-border/40 overflow-hidden">
                    <div className="bg-muted/30 px-5 py-4 border-b border-border/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-5 bg-primary rounded-full" />
                            <span className="text-sm font-bold text-gray-900">계약 목록</span>
                            {contractList.length > 0 && (
                                <span className="text-xs text-gray-400">({contractList.length}건)</span>
                            )}
                        </div>
                        {!isReadOnly && (
                            <button
                                onClick={handleAddContract}
                                className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                추가
                            </button>
                        )}
                    </div>
                    <div className="p-3 space-y-2">
                        {loadingList ? (
                            <div className="flex items-center justify-center py-8 text-sm text-gray-400">
                                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                                불러오는 중...
                            </div>
                        ) : contractList.length === 0 ? (
                            <div className="py-8 text-center">
                                <FileSignature className="h-8 w-8 mx-auto text-gray-200 mb-2" />
                                <p className="text-sm text-gray-400">등록된 계약이 없습니다.</p>
                                {!isReadOnly && (
                                    <button onClick={handleAddContract} className="mt-2 text-xs text-primary hover:underline">
                                        + 계약 추가
                                    </button>
                                )}
                            </div>
                        ) : (
                            contractList.map(c => (
                                <ContractListItem
                                    key={c.id}
                                    contract={c}
                                    isSelected={c.id === selectedContractId}
                                    onClick={() => setSelectedContractId(c.id)}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* ── 우측: 선택된 계약 상세 ── */}
                {selectedContractId ? (
                    <div className="neo-light-card border border-border/40 overflow-hidden">
                        {/* 카드 헤더 */}
                        <div className="bg-muted/30 px-8 py-5 border-b border-border/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-5 bg-primary rounded-full" />
                                <h2 className="text-base font-bold text-gray-900">
                                    {contractTitle || "본계약"}
                                </h2>
                            </div>
                            {!isReadOnly && (
                                <div className="flex items-center gap-2">
                                    {contractList.length > 1 && (
                                        <button
                                            onClick={handleDeleteContract}
                                            className="inline-flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            삭제
                                        </button>
                                    )}
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 h-9 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
                                    >
                                        <Save className="h-4 w-4" />
                                        {saving ? "저장 중..." : "저장"}
                                    </button>
                                </div>
                            )}
                        </div>

                        {loadingDetail ? (
                            <div className="flex items-center justify-center py-20 text-sm text-gray-400">
                                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                                불러오는 중...
                            </div>
                        ) : contract ? (
                            <div className="p-8 space-y-8">

                                {/* 계약 기본 정보 */}
                                <div>
                                    <h4 className="text-sm font-bold text-slate-500 mb-4">계약 기본 정보</h4>
                                    <div className="grid grid-cols-4 gap-x-6 gap-y-4">
                                        <Field className="col-span-2">
                                            <FieldLabel>계약 구분명</FieldLabel>
                                            <Input
                                                value={contractTitle}
                                                onChange={e => setContractTitle(e.target.value)}
                                                placeholder="본계약, 1차 추가계약 등"
                                                disabled={isReadOnly}
                                            />
                                        </Field>
                                        <Field>
                                            <FieldLabel>계약일</FieldLabel>
                                            <DatePicker date={contractDate} setDate={setContractDate} label="계약일" disabled={isReadOnly} />
                                        </Field>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100" />

                                {/* 거래처 정보 */}
                                <div>
                                    <h4 className="text-sm font-bold text-slate-500 mb-4">거래처 정보</h4>
                                    <div className="grid grid-cols-4 gap-x-6 gap-y-4">
                                        <Field>
                                            <FieldLabel>영업처 (매출처)</FieldLabel>
                                            <Input value={contract.customerName || ""} disabled className="bg-gray-50" />
                                            {contract.customerCode && (
                                                <p className="text-xs text-gray-400 mt-1">사업자번호: {contract.customerCode}</p>
                                            )}
                                        </Field>
                                        <Field>
                                            <FieldLabel>발주처 (고객사)</FieldLabel>
                                            <Input value={contract.ordererName || ""} disabled className="bg-gray-50" />
                                            {contract.ordererCode && (
                                                <p className="text-xs text-gray-400 mt-1">사업자번호: {contract.ordererCode}</p>
                                            )}
                                        </Field>
                                        <Field>
                                            <FieldLabel>영업대표</FieldLabel>
                                            <Input
                                                value={[contract.salesRepName, contract.salesRepRankName].filter(Boolean).join(" ")}
                                                disabled className="bg-gray-50"
                                            />
                                            {contract.salesRepDeptName && (
                                                <p className="text-xs text-gray-400 mt-1">{contract.salesRepDeptName}</p>
                                            )}
                                        </Field>
                                        <Field>
                                            <FieldLabel>PM</FieldLabel>
                                            <Input
                                                value={[contract.managerName, contract.managerRankName].filter(Boolean).join(" ")}
                                                disabled className="bg-gray-50"
                                            />
                                            {contract.managerDeptName && (
                                                <p className="text-xs text-gray-400 mt-1">{contract.managerDeptName}</p>
                                            )}
                                        </Field>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100" />

                                {/* 계약 금액 */}
                                <div>
                                    <h4 className="text-sm font-bold text-slate-500 mb-4">계약 금액</h4>
                                    <div className="grid grid-cols-4 gap-x-6 gap-y-4">
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
                                            <FieldLabel>합계 (공급가액 + 부가세)</FieldLabel>
                                            <Input value={formatNumber(totalAmount)} disabled className="bg-gray-50 text-right font-mono font-bold" />
                                        </Field>
                                        <Field>
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
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100" />

                                {/* 계약 기간 및 보증 */}
                                <div>
                                    <h4 className="text-sm font-bold text-slate-500 mb-4">계약 기간 및 보증</h4>
                                    <div className="grid grid-cols-4 gap-x-6 gap-y-4">
                                        <Field>
                                            <FieldLabel>착수일</FieldLabel>
                                            <DatePicker date={contractStartDate} setDate={setContractStartDate} label="착수일" disabled={isReadOnly} />
                                        </Field>
                                        <Field>
                                            <FieldLabel>완료일 {durationText && <span className="font-normal text-gray-400 ml-1">{durationText}</span>}</FieldLabel>
                                            <DatePicker date={contractEndDate} setDate={setContractEndDate} label="완료일" disabled={isReadOnly} />
                                        </Field>
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
                                </div>

                                <div className="h-px bg-gray-100" />

                                {/* 결제 및 특이사항 */}
                                <div>
                                    <h4 className="text-sm font-bold text-slate-500 mb-4">결제 조건 및 특이사항</h4>
                                    <div className="grid grid-cols-4 gap-x-6 gap-y-4">
                                        <Field className="col-span-2">
                                            <FieldLabel>결제 조건</FieldLabel>
                                            <textarea
                                                value={paymentSchedule}
                                                onChange={e => setPaymentSchedule(e.target.value)}
                                                rows={3}
                                                disabled={isReadOnly}
                                                placeholder="결제 조건을 입력하세요"
                                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 resize-none"
                                            />
                                        </Field>
                                        <Field className="col-span-2">
                                            <FieldLabel>계약 특이사항</FieldLabel>
                                            <textarea
                                                value={contractNotes}
                                                onChange={e => setContractNotes(e.target.value)}
                                                rows={3}
                                                disabled={isReadOnly}
                                                placeholder="특이사항을 입력하세요"
                                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 resize-none"
                                            />
                                        </Field>
                                    </div>
                                </div>

                                {/* 첨부파일 */}
                                <div>
                                    <div className="h-px bg-gray-100 mb-6" />
                                    <AttachmentSection
                                        entityType="contract"
                                        entityId={selectedContractId}
                                        readonly={isReadOnly}
                                    />
                                </div>
                            </div>
                        ) : null}
                    </div>
                ) : (
                    <div className="neo-light-card border border-border/40 flex items-center justify-center py-32 text-gray-400">
                        <div className="text-center">
                            <FileSignature className="h-10 w-10 mx-auto text-gray-200 mb-3" />
                            <p className="text-sm">좌측에서 계약을 선택하세요</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

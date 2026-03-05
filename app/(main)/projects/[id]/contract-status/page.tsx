"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Save, CheckCircle2 } from "lucide-react";
import {
    Button,
    StatusBadge,
    useToast,
    DatePicker,
    Field,
    FieldLabel,
    Input,
} from "@/components/ui";
import { ProjectPhaseNav } from "@/components/projects/ProjectPhaseNav";
import { useProjectPhase } from "@/hooks/useProjectPhase";
import { formatNumber } from "@/lib/utils/format";
import { AttachmentSection } from "@/components/ui";

interface Contract {
    id: number;
    projectCode: string | null;
    name: string;
    // 금액
    expectedAmount: number | null;
    supplyAmount: number | null;
    stampDuty: number | null;
    performanceBondRate: number;
    defectBondRate: number;
    paymentSchedule: string;
    contractNotes: string;
    // 날짜
    contractDate: string | null;
    contractStartDate: string | null;
    contractEndDate: string | null;
    durationDays: number | null;
    // 거래처
    customerName: string | null;
    customerCode: string | null;
    ordererName: string | null;
    ordererCode: string | null;
    // 담당자
    managerName: string | null;
    managerRankName: string | null;
    managerDeptName: string | null;
    salesRepName: string | null;
    salesRepRankName: string | null;
    salesRepDeptName: string | null;
}

const toDate = (s: string | null | undefined): Date | undefined =>
    s ? new Date(s) : undefined;

const formatDateStr = (d: Date | undefined): string | null =>
    d ? d.toISOString().slice(0, 10) : null;

export default function ContractDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { showToast, confirm } = useToast();

    const [contract, setContract] = useState<Contract | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // 폼 상태
    const [supplyAmount, setSupplyAmount] = useState<string>("");
    const [stampDuty, setStampDuty] = useState<string>("");
    const [performanceBondRate, setPerformanceBondRate] = useState<string>("10");
    const [defectBondRate, setDefectBondRate] = useState<string>("2");
    const [paymentSchedule, setPaymentSchedule] = useState<string>("");
    const [contractNotes, setContractNotes] = useState<string>("");
    const [contractDate, setContractDate] = useState<Date | undefined>();
    const [contractStartDate, setContractStartDate] = useState<Date | undefined>();
    const [contractEndDate, setContractEndDate] = useState<Date | undefined>();

    // 계약 단계 상태 관리 (단일 소스: we_project_phase_progress)
    const {
        status,
        isInitialStatus,
        isFinalStatus,
        onSaveSuccess,
        onCompleteSuccess,
        loadPhaseStatus,
    } = useProjectPhase(id, "contract");

    const fetchContract = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/contracts/${id}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            const c: Contract = data.contract;
            setContract(c);
            // 폼 초기화
            setSupplyAmount(
                c.supplyAmount
                    ? String(c.supplyAmount)
                    : c.expectedAmount
                        ? String(Math.round(c.expectedAmount / 1.1))
                        : ""
            );
            setStampDuty(c.stampDuty ? String(c.stampDuty) : "");
            setPerformanceBondRate(String(c.performanceBondRate ?? 10));
            setDefectBondRate(String(c.defectBondRate ?? 2));
            setPaymentSchedule(c.paymentSchedule || "");
            setContractNotes(c.contractNotes || "");
            setContractDate(toDate(c.contractDate));
            setContractStartDate(toDate(c.contractStartDate));
            setContractEndDate(toDate(c.contractEndDate));
        } catch {
            showToast("계약 정보를 불러오는데 실패했습니다.", "error");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchContract();
    }, [fetchContract]);

    // 공급가액 → 계약금액(VAT 10%) 자동 연산
    const supply = Number(supplyAmount.replace(/,/g, "")) || 0;
    const tax = Math.round(supply * 0.1);
    const total = supply + tax;

    // 계약 기간 일수 자동 연산
    const durationDays =
        contractStartDate && contractEndDate
            ? Math.ceil(
                (contractEndDate.getTime() - contractStartDate.getTime()) /
                (1000 * 60 * 60 * 24)
            )
            : null;

    const handleSave = async () => {
        setSaving(true);
        try {
            const body = {
                supplyAmount: supply || null,
                stampDuty: Number(stampDuty) || null,
                performanceBondRate: Number(performanceBondRate),
                defectBondRate: Number(defectBondRate),
                paymentSchedule,
                contractNotes,
                contractDate: formatDateStr(contractDate),
                contractStartDate: formatDateStr(contractStartDate),
                contractEndDate: formatDateStr(contractEndDate),
            };
            const res = await fetch(`/api/contracts/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error();
            showToast("저장되었습니다.", "success");
            await onSaveSuccess();
            await fetchContract();
        } catch {
            showToast("저장에 실패했습니다.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleComplete = async () => {
        confirm({
            title: "계약 완료",
            message:
                "계약을 완료 처리하시겠습니까?\n완료 후 프로젝트 진행 단계로 자동 전환됩니다.",
            onConfirm: async () => {
                setSaving(true);
                try {
                    await handleSave();
                    await onCompleteSuccess();
                    showToast("계약이 완료되었습니다. 프로젝트 진행 단계로 전환됩니다.", "success");
                    await loadPhaseStatus();
                } catch {
                    showToast("완료 처리에 실패했습니다.", "error");
                } finally {
                    setSaving(false);
                }
            },
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    불러오는 중...
                </div>
            </div>
        );
    }

    if (!contract) {
        return (
            <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
                계약 정보를 찾을 수 없습니다.
            </div>
        );
    }

    // 읽기 전용: 완료 상태
    const isReadOnly = isFinalStatus;

    return (
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
                            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 line-clamp-2 max-w-[300px] sm:max-w-[500px] lg:max-w-[700px] leading-snug">
                                <span className="text-blue-600">계약</span> -{" "}
                                {contract.name}
                            </h1>
                            <StatusBadge status={status} className="h-9" />
                            <ProjectPhaseNav projectId={id} />
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {contract.projectCode || "-"} |{" "}
                            {contract.customerName || "-"}
                        </p>
                    </div>
                </div>
                {/* 우측 - 작성완료 */}
                {!isReadOnly && !isInitialStatus && (
                    <Button
                        variant="primary"
                        onClick={handleComplete}
                        disabled={saving}
                        className="flex items-center gap-2"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        작성완료
                    </Button>
                )}
            </div>

            {/* 본문 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-8 space-y-8">
                    {/* 타이틀 행 */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">계약 정보</h2>
                        </div>
                        {!isReadOnly && (
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 h-10 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
                            >
                                <Save className="h-4 w-4" />
                                {saving ? "저장 중..." : "저장"}
                            </button>
                        )}
                    </div>

                    {/* ── 거래처 / 프로젝트 정보 (읽기용) ── */}
                    <div>
                        <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-1 h-5 bg-primary rounded-full" />
                            기본 정보
                        </h4>
                        <div className="grid grid-cols-4 gap-x-8 gap-y-5">
                            <Field>
                                <FieldLabel>매출처 (발주사)</FieldLabel>
                                <div className="mt-1.5 h-10 flex items-center px-3 rounded-xl bg-slate-50 border border-gray-200 text-sm font-medium text-gray-700">
                                    {contract.ordererName || "-"}
                                </div>
                            </Field>
                            <Field>
                                <FieldLabel>고객사</FieldLabel>
                                <div className="mt-1.5 h-10 flex items-center px-3 rounded-xl bg-slate-50 border border-gray-200 text-sm font-medium text-gray-700">
                                    {contract.customerName || "-"}
                                </div>
                            </Field>
                            <Field className="col-span-2">
                                <FieldLabel>계약명</FieldLabel>
                                <div className="mt-1.5 min-h-10 flex items-center px-3 rounded-xl bg-slate-50 border border-gray-200 text-sm font-medium text-gray-700 py-2 leading-snug">
                                    {contract.name}
                                </div>
                            </Field>

                            <Field>
                                <FieldLabel>영업대표</FieldLabel>
                                <div className="mt-1.5 h-10 flex items-center px-3 rounded-xl bg-slate-50 border border-gray-200 text-sm font-medium text-gray-700">
                                    {contract.salesRepName || "-"}
                                    {contract.salesRepRankName && (
                                        <span className="ml-1 text-sm font-medium text-gray-700">
                                            {contract.salesRepRankName}
                                        </span>
                                    )}
                                </div>
                            </Field>
                            <Field>
                                <FieldLabel>PM</FieldLabel>
                                <div className="mt-1.5 h-10 flex items-center px-3 rounded-xl bg-slate-50 border border-gray-200 text-sm font-medium text-gray-700">
                                    {contract.managerName || "-"}
                                    {contract.managerRankName && (
                                        <span className="ml-1 text-sm font-medium text-gray-700">
                                            {contract.managerRankName}
                                        </span>
                                    )}
                                </div>
                            </Field>
                        </div>
                    </div>

                    {/* ── 금액 ── */}
                    <div>
                        <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-1 h-5 bg-primary rounded-full" />
                            계약 금액
                        </h4>
                        <div className="grid grid-cols-4 gap-x-8 gap-y-5">
                            <Field>
                                <FieldLabel>공급가액 (원)</FieldLabel>
                                <div className="relative mt-1.5">
                                    <Input
                                        type="text"
                                        value={supplyAmount ? Number(supplyAmount.replace(/,/g, "")).toLocaleString() : ""}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/,/g, "");
                                            if (/^\d*$/.test(raw)) setSupplyAmount(raw);
                                        }}
                                        placeholder="공급가액 입력"
                                        className="h-10 rounded-xl text-right font-mono pr-8"
                                        disabled={isReadOnly}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">원</span>
                                </div>
                            </Field>
                            <Field>
                                <FieldLabel>세액 (VAT 10%)</FieldLabel>
                                <div className="mt-1.5 h-10 flex items-center justify-end px-3 pr-8 relative rounded-xl bg-slate-50 border border-gray-200 font-mono text-sm text-gray-500">
                                    {supply > 0 ? formatNumber(tax) : "-"}
                                    {supply > 0 && (
                                        <span className="absolute right-3 text-xs text-gray-400">원</span>
                                    )}
                                </div>
                            </Field>
                            <Field>
                                <FieldLabel>계약 금액 (합계)</FieldLabel>
                                <div className="mt-1.5 h-10 flex items-center justify-end px-3 pr-8 relative rounded-xl bg-blue-50 border border-blue-100 font-mono text-sm font-bold text-blue-700">
                                    {supply > 0 ? formatNumber(total) : "-"}
                                    {supply > 0 && (
                                        <span className="absolute right-3 text-xs text-blue-400">원</span>
                                    )}
                                </div>
                            </Field>
                        </div>
                    </div>

                    {/* ── 계약 일정 ── */}
                    <div>
                        <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-1 h-5 bg-primary rounded-full" />
                            계약 일정
                        </h4>
                        <div className="grid grid-cols-4 gap-x-8 gap-y-5">
                            <Field>
                                <FieldLabel>계약일</FieldLabel>
                                <DatePicker
                                    date={contractDate}
                                    setDate={isReadOnly ? () => { } : setContractDate}
                                    className="w-full h-10 rounded-xl border-gray-300 mt-1.5"
                                    disabled={isReadOnly}
                                />
                            </Field>
                            <Field>
                                <FieldLabel>착공연월일</FieldLabel>
                                <DatePicker
                                    date={contractStartDate}
                                    setDate={isReadOnly ? () => { } : setContractStartDate}
                                    className="w-full h-10 rounded-xl border-gray-300 mt-1.5"
                                    disabled={isReadOnly}
                                />
                            </Field>
                            <Field>
                                <FieldLabel>준공연월일</FieldLabel>
                                <DatePicker
                                    date={contractEndDate}
                                    setDate={isReadOnly ? () => { } : setContractEndDate}
                                    className="w-full h-10 rounded-xl border-gray-300 mt-1.5"
                                    disabled={isReadOnly}
                                />
                            </Field>
                            <Field>
                                <FieldLabel>계약 기간</FieldLabel>
                                <div className="mt-1.5 h-10 flex items-center px-3 rounded-xl bg-slate-50 border border-gray-200 text-sm font-mono font-medium text-gray-700">
                                    {durationDays != null ? (
                                        <span>
                                            <span className="font-black text-gray-900">{durationDays}</span>
                                            <span className="text-gray-400 ml-1">일간</span>
                                        </span>
                                    ) : (
                                        "-"
                                    )}
                                </div>
                            </Field>
                        </div>
                    </div>

                    {/* ── 보증보험 ── */}
                    <div>
                        <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-1 h-5 bg-primary rounded-full" />
                            보증보험
                        </h4>
                        <div className="grid grid-cols-4 gap-x-8 gap-y-5">
                            <Field>
                                <FieldLabel>인지세 (원)</FieldLabel>
                                <div className="relative mt-1.5">
                                    <Input
                                        type="text"
                                        value={stampDuty ? Number(stampDuty.replace(/,/g, "")).toLocaleString() : ""}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/,/g, "");
                                            if (/^\d*$/.test(raw)) setStampDuty(raw);
                                        }}
                                        placeholder="예: 75,000"
                                        className="h-10 rounded-xl text-right font-mono pr-8"
                                        disabled={isReadOnly}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">원</span>
                                </div>
                            </Field>
                            <Field>
                                <FieldLabel>계약이행보증 (%)</FieldLabel>
                                <div className="relative mt-1.5">
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={performanceBondRate}
                                        onChange={(e) => setPerformanceBondRate(e.target.value)}
                                        className="h-10 rounded-xl text-right font-mono pr-8"
                                        disabled={isReadOnly}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                                </div>
                            </Field>
                            <Field>
                                <FieldLabel>하자이행보증 (%)</FieldLabel>
                                <div className="relative mt-1.5">
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={defectBondRate}
                                        onChange={(e) => setDefectBondRate(e.target.value)}
                                        className="h-10 rounded-xl text-right font-mono pr-8"
                                        disabled={isReadOnly}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                                </div>
                            </Field>
                        </div>
                    </div>

                    {/* ── 지급일정 / 기타 ── */}
                    <div>
                        <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-1 h-5 bg-primary rounded-full" />
                            지급일정 및 기타
                        </h4>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                            <Field>
                                <FieldLabel>지급일정</FieldLabel>
                                <textarea
                                    value={paymentSchedule}
                                    onChange={(e) => setPaymentSchedule(e.target.value)}
                                    placeholder={"지급 조건 및 일정을 입력하세요\n예) 선급 30% / 중도금 40% / 완료 후 30%"}
                                    rows={4}
                                    disabled={isReadOnly}
                                    className="mt-1.5 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 disabled:bg-slate-50 disabled:text-gray-500"
                                />
                            </Field>
                            <Field>
                                <FieldLabel>기타 특이사항</FieldLabel>
                                <textarea
                                    value={contractNotes}
                                    onChange={(e) => setContractNotes(e.target.value)}
                                    placeholder="계약 관련 특이사항을 입력하세요"
                                    rows={4}
                                    disabled={isReadOnly}
                                    className="mt-1.5 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 disabled:bg-slate-50 disabled:text-gray-500"
                                />
                            </Field>
                        </div>
                    </div>
                    {/* ── 첨부파일 ── */}
                    <div className="pt-2">
                        <div className="h-px bg-gray-100 mb-6" />
                        <AttachmentSection
                            entityType="contract"
                            entityId={Number(id)}
                            readonly={isReadOnly}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

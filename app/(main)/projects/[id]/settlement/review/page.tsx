"use client";

import { useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

// 임시 수지정산서 데이터
const settlementData = {
  id: 1,
  version: 1,
  settlementDate: "2024-12-30",
  plannedRevenue: 70000000,
  plannedCost: 50000000,
  plannedProfit: 20000000,
  actualRevenue: 68000000,
  actualCost: 52000000,
  actualProfit: 16000000,
  revenueDiff: -2000000,
  costDiff: 2000000,
  profitDiff: -4000000,
  createdAt: "2024-12-30",
};

export default function SettlementReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<
    "pending" | "approved" | "rejected" | null
  >(null);

  const handleApprove = async () => {
    if (window.confirm("수지정산서를 승인하시겠습니까?")) {
      setIsSubmitting(true);
      // TODO: API 호출
      setTimeout(() => {
        setReviewStatus("approved");
        setIsSubmitting(false);
        alert("수지정산서가 승인되었습니다.");
      }, 1000);
    }
  };

  const handleReject = async () => {
    if (!comments.trim()) {
      alert("반려 사유를 입력해주세요.");
      return;
    }
    if (window.confirm("수지정산서를 반려하시겠습니까?")) {
      setIsSubmitting(true);
      // TODO: API 호출
      setTimeout(() => {
        setReviewStatus("rejected");
        setIsSubmitting(false);
        alert("수지정산서가 반려되었습니다.");
      }, 1000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${id}/settlement`}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              수지정산서 승인
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              수지정산서 검토 및 승인/반려
            </p>
          </div>
        </div>
      </div>

      {/* 정산서 요약 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            수지정산서 요약 (버전 {settlementData.version})
          </h2>
        </div>

        {/* 계획 vs 실제 비교 */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md bg-gray-50 p-4">
            <h3 className="mb-3 text-sm font-medium text-gray-700">수지분석서 (계획)</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">매출</span>
                <span className="font-medium text-gray-900">
                  {settlementData.plannedRevenue.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">비용</span>
                <span className="font-medium text-gray-900">
                  {settlementData.plannedCost.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="text-gray-700">순이익</span>
                <span className="font-semibold text-green-600">
                  {settlementData.plannedProfit.toLocaleString()}원
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-md bg-gray-50 p-4">
            <h3 className="mb-3 text-sm font-medium text-gray-700">수지정산서 (실제)</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">매출</span>
                <span className="font-medium text-gray-900">
                  {settlementData.actualRevenue.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">비용</span>
                <span className="font-medium text-gray-900">
                  {settlementData.actualCost.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="text-gray-700">순이익</span>
                <span className="font-semibold text-green-600">
                  {settlementData.actualProfit.toLocaleString()}원
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 차이 분석 */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="rounded-md bg-blue-50 p-3">
            <label className="text-xs font-medium text-gray-500">매출 차이</label>
            <div className="mt-1 flex items-center gap-1">
              {settlementData.revenueDiff >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <p
                className={`text-sm font-semibold ${
                  settlementData.revenueDiff >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {settlementData.revenueDiff >= 0 ? "+" : ""}
                {settlementData.revenueDiff.toLocaleString()}원
              </p>
            </div>
          </div>
          <div className="rounded-md bg-blue-50 p-3">
            <label className="text-xs font-medium text-gray-500">비용 차이</label>
            <div className="mt-1 flex items-center gap-1">
              {settlementData.costDiff >= 0 ? (
                <TrendingUp className="h-3 w-3 text-red-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-green-600" />
              )}
              <p
                className={`text-sm font-semibold ${
                  settlementData.costDiff >= 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {settlementData.costDiff >= 0 ? "+" : ""}
                {settlementData.costDiff.toLocaleString()}원
              </p>
            </div>
          </div>
          <div className="rounded-md bg-blue-50 p-3">
            <label className="text-xs font-medium text-gray-500">순이익 차이</label>
            <div className="mt-1 flex items-center gap-1">
              {settlementData.profitDiff >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <p
                className={`text-sm font-semibold ${
                  settlementData.profitDiff >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {settlementData.profitDiff >= 0 ? "+" : ""}
                {settlementData.profitDiff.toLocaleString()}원
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          정산일: {settlementData.settlementDate} | 작성일: {settlementData.createdAt}
        </div>
      </div>

      {/* 검토 의견 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">검토 의견</h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="comments"
              className="block text-sm font-medium text-gray-700"
            >
              의견 <span className="text-gray-500">(반려 시 필수)</span>
            </label>
            <textarea
              id="comments"
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="검토 의견을 입력하세요"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          {/* 승인/반려 버튼 */}
          {reviewStatus === null && (
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleReject}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                반려
              </button>
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isSubmitting ? "처리 중..." : "승인"}
              </button>
            </div>
          )}

          {/* 결과 표시 */}
          {reviewStatus === "approved" && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium text-green-800">
                  수지정산서가 승인되었습니다.
                </p>
              </div>
            </div>
          )}

          {reviewStatus === "rejected" && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <p className="text-sm font-medium text-red-800">
                  수지정산서가 반려되었습니다.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 상세 정보 링크 */}
      <div className="flex justify-center">
        <Link
          href={`/projects/${id}/settlement`}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          수지정산서 상세 보기 →
        </Link>
      </div>
    </div>
  );
}

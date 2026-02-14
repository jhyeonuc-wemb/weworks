"use client";

import { useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileText, AlertCircle } from "lucide-react";

// 임시 데이터
const vrbReviewData = {
  id: 1,
  status: "approved",
  reviewedAt: "2024-01-20",
  reviewerName: "VRB 위원",
  comments: "M/D 산정이 적정하며 프로젝트 진행 승인",
};

const mdEstimationSummary = {
  version: 1,
  totalMd: 22,
  items: [
    { role: "PM", personnelCount: 1, mdPerPerson: 1, totalMd: 1 },
    { role: "개발", personnelCount: 3, mdPerPerson: 5, totalMd: 15 },
    { role: "설계", personnelCount: 2, mdPerPerson: 3, totalMd: 6 },
  ],
};

export default function ConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (
      window.confirm(
        "프로젝트를 컨펌하시겠습니까? 컨펌 후 수지분석서 작성 단계로 진행됩니다."
      )
    ) {
      setIsSubmitting(true);
      // TODO: API 호출 - 상태 변경
      setTimeout(() => {
        setIsSubmitting(false);
        alert("프로젝트가 컨펌되었습니다.");
      }, 1000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${id}`}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              프로젝트 컨펌
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              VRB 승인 후 최종 컨펌 처리
            </p>
          </div>
        </div>
      </div>

      {/* VRB 승인 확인 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">VRB 승인 확인</h2>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">승인 상태</label>
              <p className="mt-1 text-sm font-medium text-green-600">승인됨</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">승인일</label>
              <p className="mt-1 text-sm text-gray-900">{vrbReviewData.reviewedAt}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">승인자</label>
              <p className="mt-1 text-sm text-gray-900">
                {vrbReviewData.reviewerName}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">승인 의견</label>
              <p className="mt-1 text-sm text-gray-900">{vrbReviewData.comments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* M/D 산정 요약 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">M/D 산정 요약</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-md bg-gray-50 p-3">
            <span className="text-sm font-medium text-gray-700">총 M/D</span>
            <span className="text-lg font-semibold text-gray-900">
              {mdEstimationSummary.totalMd} M/D
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    역할
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    인력 수
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    인당 M/D
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    총 M/D
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {mdEstimationSummary.items.map((item, index) => (
                  <tr key={index}>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-900">
                      {item.role}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-600">
                      {item.personnelCount}명
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-600">
                      {item.mdPerPerson}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-gray-900">
                      {item.totalMd}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 컨펌 의견 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">컨펌 의견</h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="comments"
              className="block text-sm font-medium text-gray-700"
            >
              의견 <span className="text-gray-500">(선택)</span>
            </label>
            <textarea
              id="comments"
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="컨펌 의견을 입력하세요"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          {/* 컨펌 버튼 */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSubmitting ? "처리 중..." : "프로젝트 컨펌"}
            </button>
          </div>
        </div>
      </div>

      {/* 안내 */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 text-blue-600" />
          <div className="text-sm text-blue-800">
            <strong>컨펌 안내:</strong> VRB 승인 후 프로젝트를 최종 컨펌합니다.
            컨펌 완료 후 수지분석서 작성 단계로 진행할 수 있습니다.
          </div>
        </div>
      </div>
    </div>
  );
}

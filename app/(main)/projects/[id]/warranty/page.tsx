"use client";

import { useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Edit2,
  Calendar,
  Users,
} from "lucide-react";

// 임시 하자보증 데이터
const warrantyData = {
  startDate: "2025-01-01",
  endDate: "2026-01-01",
  status: "active",
  daysRemaining: 365,
};

const warrantyIssues = [
  {
    id: 1,
    title: "시스템 응답 속도 저하",
    description: "특정 모듈에서 응답 속도가 느린 현상 발생",
    reportedDate: "2025-01-15",
    reportedBy: "김고객",
    assignedTo: "이개발",
    status: "resolved",
    resolvedDate: "2025-01-20",
  },
  {
    id: 2,
    title: "데이터베이스 연결 오류",
    description: "간헐적으로 DB 연결이 끊어지는 현상",
    reportedDate: "2025-02-01",
    reportedBy: "박고객",
    assignedTo: "정개발",
    status: "in_progress",
    resolvedDate: null,
  },
];

export default function WarrantyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [issues, setIssues] = useState(warrantyIssues);
  const [isAddIssueModalOpen, setIsAddIssueModalOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
      case "closed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "open":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "resolved":
        return "해결됨";
      case "closed":
        return "종료";
      case "in_progress":
        return "진행중";
      case "open":
        return "오픈";
      default:
        return status;
    }
  };

  const handleCompleteWarranty = async () => {
    if (
      window.confirm(
        "하자보증 기간을 완료하시겠습니까? 완료 후 유상유지보수로 전환할 수 있습니다."
      )
    ) {
      // TODO: API 호출
      alert("하자보증이 완료되었습니다.");
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
              하자보증
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              하자보증 기간 관리 및 이슈 추적
            </p>
          </div>
        </div>
        <button
          onClick={handleCompleteWarranty}
          className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          <CheckCircle2 className="h-4 w-4" />
          하자보증 완료
        </button>
      </div>

      {/* 하자보증 정보 */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-500">시작일</h3>
          </div>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {warrantyData.startDate}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-500">종료일</h3>
          </div>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {warrantyData.endDate}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-500">남은 기간</h3>
          </div>
          <p className="mt-2 text-lg font-semibold text-blue-600">
            {warrantyData.daysRemaining}일
          </p>
        </div>
      </div>

      {/* 하자 이슈 목록 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">하자 이슈</h2>
          <button
            onClick={() => setIsAddIssueModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            이슈 등록
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  제목
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  보고일
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  보고자
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  담당자
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  상태
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  해결일
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {issues.map((issue) => (
                <tr key={issue.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {issue.title}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {issue.reportedDate}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {issue.reportedBy}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {issue.assignedTo}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                        issue.status
                      )}`}
                    >
                      {getStatusLabel(issue.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {issue.resolvedDate || "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium">
                    <button className="text-gray-600 hover:text-gray-900">
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {issues.length === 0 && (
          <div className="py-12 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">
              하자 이슈가 없습니다
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              하자보증 기간 중 발생한 이슈를 관리하세요.
            </p>
          </div>
        )}
      </div>

      {/* 안내 */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-2">
          <Shield className="h-5 w-5 shrink-0 text-blue-600" />
          <div className="text-sm text-blue-800">
            <strong>하자보증 안내:</strong> 하자보증 기간은 보통 프로젝트 완료 후
            1년입니다. 이 기간 동안 발생한 하자는 무상으로 보수합니다.
            하자보증 완료 후 유상유지보수 계약으로 전환할 수 있습니다.
          </div>
        </div>
      </div>
    </div>
  );
}

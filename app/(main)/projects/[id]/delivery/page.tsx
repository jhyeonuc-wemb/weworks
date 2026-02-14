"use client";

import { useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  Download,
  Plus,
} from "lucide-react";

// 임시 Delivery 데이터
const deliverables = [
  {
    id: 1,
    name: "요구사항 명세서",
    type: "문서",
    status: "completed",
    dueDate: "2024-02-15",
    completedDate: "2024-02-14",
    assignee: "이설계",
  },
  {
    id: 2,
    name: "시스템 설계서",
    type: "문서",
    status: "in_progress",
    dueDate: "2024-02-28",
    completedDate: null,
    assignee: "이설계",
  },
  {
    id: 3,
    name: "개발 환경 구축",
    type: "인프라",
    status: "completed",
    dueDate: "2024-02-10",
    completedDate: "2024-02-08",
    assignee: "김개발",
  },
  {
    id: 4,
    name: "API 개발",
    type: "개발",
    status: "in_progress",
    dueDate: "2024-03-15",
    completedDate: null,
    assignee: "김개발",
  },
  {
    id: 5,
    name: "프론트엔드 개발",
    type: "개발",
    status: "pending",
    dueDate: "2024-03-20",
    completedDate: null,
    assignee: "박프론트",
  },
];

export default function DeliveryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [deliverableList, setDeliverableList] = useState(deliverables);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "완료";
      case "in_progress":
        return "진행중";
      case "pending":
        return "대기";
      default:
        return status;
    }
  };

  const statusCounts = deliverableList.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

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
              Delivery 관리
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              프로젝트 산출물 관리 및 추적
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Upload className="h-4 w-4" />
            업로드
          </button>
          <button className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
            <Plus className="h-4 w-4" />
            산출물 추가
          </button>
        </div>
      </div>

      {/* 상태 요약 */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-500">전체</h3>
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {deliverableList.length}건
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h3 className="text-sm font-medium text-gray-500">완료</h3>
          </div>
          <p className="mt-2 text-2xl font-semibold text-green-600">
            {statusCounts.completed || 0}건
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-500">진행중</h3>
          </div>
          <p className="mt-2 text-2xl font-semibold text-blue-600">
            {statusCounts.in_progress || 0}건
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-500">대기</h3>
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-600">
            {statusCounts.pending || 0}건
          </p>
        </div>
      </div>

      {/* 산출물 목록 */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  산출물명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  유형
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  담당자
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  마감일
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  완료일
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  상태
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {deliverableList.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {item.type}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {item.assignee}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {item.dueDate}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {item.completedDate || "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="text-gray-600 hover:text-gray-900"
                        title="다운로드"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        className="text-gray-600 hover:text-gray-900"
                        title="상세보기"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 빈 상태 */}
      {deliverableList.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">
            산출물이 없습니다
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            첫 번째 산출물을 추가해보세요.
          </p>
        </div>
      )}
    </div>
  );
}

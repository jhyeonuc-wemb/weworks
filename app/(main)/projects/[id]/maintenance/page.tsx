"use client";

import { useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Wrench,
  DollarSign,
  Calendar,
  Plus,
  Edit2,
  CheckCircle2,
  Clock,
} from "lucide-react";

// 임시 유지보수 데이터
const maintenanceData = {
  contractNumber: "M2025-001",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  amount: 30000000,
  type: "preventive",
  status: "active",
  daysRemaining: 365,
};

const maintenanceTasks = [
  {
    id: 1,
    title: "월간 정기 점검",
    description: "시스템 전체 상태 점검 및 로그 확인",
    taskDate: "2026-01-15",
    assignedTo: "이운영",
    status: "completed",
    hoursSpent: 4,
    cost: 500000,
  },
  {
    id: 2,
    title: "데이터베이스 백업 확인",
    description: "주간 백업 상태 점검 및 복구 테스트",
    taskDate: "2026-02-01",
    assignedTo: "정운영",
    status: "pending",
    hoursSpent: null,
    cost: null,
  },
];

export default function MaintenancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [tasks, setTasks] = useState(maintenanceTasks);

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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "preventive":
        return "예방적 유지보수";
      case "corrective":
        return "수정 유지보수";
      case "emergency":
        return "긴급 유지보수";
      default:
        return type;
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
              유상유지보수
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              유상유지보수 계약 및 작업 관리
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Edit2 className="h-4 w-4" />
            계약 수정
          </button>
          <button className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
            <Plus className="h-4 w-4" />
            작업 추가
          </button>
        </div>
      </div>

      {/* 계약 정보 */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-500">계약 금액</h3>
          </div>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {maintenanceData.amount.toLocaleString()}원
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-500">계약 시작일</h3>
          </div>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {maintenanceData.startDate}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-500">계약 종료일</h3>
          </div>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {maintenanceData.endDate}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-500">남은 기간</h3>
          </div>
          <p className="mt-2 text-lg font-semibold text-blue-600">
            {maintenanceData.daysRemaining}일
          </p>
        </div>
      </div>

      {/* 계약 상세 정보 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">계약 정보</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">계약 번호</label>
            <p className="mt-1 text-sm text-gray-900">
              {maintenanceData.contractNumber}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">유지보수 유형</label>
            <p className="mt-1 text-sm text-gray-900">
              {getTypeLabel(maintenanceData.type)}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">계약 상태</label>
            <p className="mt-1 text-sm">
              <span
                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                  maintenanceData.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {maintenanceData.status === "active" ? "활성" : "만료"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 유지보수 작업 목록 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">유지보수 작업</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  작업명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  작업일
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  담당자
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  상태
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  소요 시간
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  비용
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {task.title}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {task.taskDate}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {task.assignedTo}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                        task.status
                      )}`}
                    >
                      {getStatusLabel(task.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {task.hoursSpent ? `${task.hoursSpent}시간` : "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {task.cost ? `${task.cost.toLocaleString()}원` : "-"}
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

        {tasks.length === 0 && (
          <div className="py-12 text-center">
            <Wrench className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">
              유지보수 작업이 없습니다
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              유지보수 작업을 추가하세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

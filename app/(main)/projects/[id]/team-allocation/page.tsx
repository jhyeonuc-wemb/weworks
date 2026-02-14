"use client";

import { useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  UserPlus,
  Users,
  Calendar,
  Save,
} from "lucide-react";
import { formatNumber, formatCurrency, Currency } from "@/lib/utils/currency";
import { AutoCalculatedField } from "@/components/AutoCalculatedField";

// 임시 인력 데이터
const teamMembers = [
  {
    id: 1,
    name: "김개발",
    role: "개발",
    startDate: "2024-01-15",
    endDate: "2024-03-31",
    allocation: 100,
    status: "active",
    hourlyRate: 120000,
  },
  {
    id: 2,
    name: "이설계",
    role: "설계",
    startDate: "2024-01-15",
    endDate: "2024-02-28",
    allocation: 100,
    status: "active",
    hourlyRate: 100000,
  },
  {
    id: 3,
    name: "박PM",
    role: "PM",
    startDate: "2024-01-10",
    endDate: "2024-04-30",
    allocation: 50,
    status: "active",
    hourlyRate: 150000,
  },
];

const availableMembers = [
  { id: 4, name: "최백엔드", role: "백엔드 개발", department: "개발팀" },
  { id: 5, name: "정프론트", role: "프론트엔드 개발", department: "개발팀" },
  { id: 6, name: "한인프라", role: "인프라", department: "운영팀" },
];

// 월별 데이터 생성 (2024년 1월 ~ 12월)
const generateMonths = () => {
  const months = [];
  for (let i = 1; i <= 12; i++) {
    months.push(`2024-${String(i).padStart(2, "0")}`);
  }
  return months;
};

const months = generateMonths();

// 월별 인력 배치 데이터 (인력 × 월)
const initialMonthlyAllocations: Record<
  number,
  Record<string, { hours: number; cost: number }>
> = {
  1: {
    "2024-01": { hours: 160, cost: 19200000 },
    "2024-02": { hours: 160, cost: 19200000 },
    "2024-03": { hours: 160, cost: 19200000 },
  },
  2: {
    "2024-01": { hours: 160, cost: 16000000 },
    "2024-02": { hours: 160, cost: 16000000 },
  },
  3: {
    "2024-01": { hours: 80, cost: 12000000 },
    "2024-02": { hours: 80, cost: 12000000 },
    "2024-03": { hours: 80, cost: 12000000 },
    "2024-04": { hours: 80, cost: 12000000 },
  },
};

// 임시 프로젝트 데이터 가져오기 함수
const getProject = (id: string) => {
  // 나중에 API로 교체
  const isNewProject = parseInt(id) === 1; // 임시: ID가 1이면 새 프로젝트로 간주
  
  return {
    id: parseInt(id),
    name: isNewProject ? "새 프로젝트" : "KOEN 스마트 도면관리시스템 구축 용역",
    currency: "KRW" as Currency, // 프로젝트에 설정된 통화
  };
};

export default function TeamAllocationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const project = getProject(id);
  const currency = project.currency; // 프로젝트 통화 사용
  const [members, setMembers] = useState(teamMembers);
  const [monthlyAllocations, setMonthlyAllocations] = useState(
    initialMonthlyAllocations
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const handleAddMember = () => {
    if (selectedMember) {
      const newMember = {
        id: selectedMember.id,
        name: selectedMember.name,
        role: selectedMember.role,
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        allocation: 100,
        status: "active",
        hourlyRate: 120000,
      };
      setMembers([...members, newMember]);
      setSelectedMember(null);
      setIsAddModalOpen(false);
    }
  };

  const handleDeleteMember = (id: number) => {
    if (window.confirm("인력을 제외하시겠습니까?")) {
      setMembers(members.filter((m) => m.id !== id));
      const newAllocations = { ...monthlyAllocations };
      delete newAllocations[id];
      setMonthlyAllocations(newAllocations);
    }
  };

  const handleHoursChange = (
    memberId: number,
    month: string,
    hours: number
  ) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    const cost = hours * member.hourlyRate;
    setMonthlyAllocations({
      ...monthlyAllocations,
      [memberId]: {
        ...(monthlyAllocations[memberId] || {}),
        [month]: { hours, cost },
      },
    });
  };

  // 월별 총합 계산
  const getMonthlyTotal = (month: string) => {
    let totalHours = 0;
    let totalCost = 0;
    members.forEach((member) => {
      const allocation = monthlyAllocations[member.id]?.[month];
      if (allocation) {
        totalHours += allocation.hours;
        totalCost += allocation.cost;
      }
    });
    return { totalHours, totalCost };
  };

  // 전체 총합 계산
  const getGrandTotal = () => {
    let totalHours = 0;
    let totalCost = 0;
    members.forEach((member) => {
      const allocations = monthlyAllocations[member.id] || {};
      Object.values(allocations).forEach((alloc) => {
        totalHours += alloc.hours;
        totalCost += alloc.cost;
      });
    });
    return { totalHours, totalCost };
  };

  const grandTotal = getGrandTotal();

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
              인력 배치
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {project.name} - 프로젝트 인력 배치 및 월별 투입 시간 관리
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
            통화: {currency === "KRW" ? "원 (KRW)" : currency === "USD" ? "달러 (USD)" : currency}
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            인력 추가
          </button>
        </div>
      </div>

      {/* 인력 현황 요약 */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-500">총 인력 수</h3>
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {formatNumber(members.length)}명
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-500">활성 인력</h3>
          </div>
          <p className="mt-2 text-2xl font-semibold text-green-600">
            {formatNumber(
              members.filter((m) => m.status === "active").length
            )}명
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-500">총 투입 시간</h3>
          </div>
          <p className="mt-2 text-2xl font-semibold text-blue-600">
            {formatNumber(grandTotal.totalHours)}시간
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-500">총 인건비</h3>
          </div>
          <AutoCalculatedField
            value={grandTotal.totalCost}
            currency={currency}
            className="mt-2"
            showIcon={false}
          />
        </div>
      </div>

      {/* 월별 인력 배치 그리드 */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">
            월별 인력 배치
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  인력
                </th>
                <th className="sticky left-16 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  역할
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  단가
                </th>
                {months.map((month) => (
                  <th
                    key={month}
                    className="min-w-[120px] px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    {month.split("-")[1]}월
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  합계
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {members.map((member) => {
                const memberAllocations = monthlyAllocations[member.id] || {};
                const memberTotal = Object.values(memberAllocations).reduce(
                  (sum, alloc) => ({
                    hours: sum.hours + alloc.hours,
                    cost: sum.cost + alloc.cost,
                  }),
                  { hours: 0, cost: 0 }
                );

                return (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 text-sm font-medium text-gray-900">
                      {member.name}
                    </td>
                    <td className="sticky left-16 z-10 bg-white px-4 py-3 text-sm text-gray-600">
                      {member.role}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {formatCurrency(member.hourlyRate, currency)}/시간
                    </td>
                    {months.map((month) => {
                      const allocation = memberAllocations[month] || {
                        hours: 0,
                        cost: 0,
                      };
                      return (
                        <td key={month} className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={allocation.hours || ""}
                            onChange={(e) =>
                              handleHoursChange(
                                member.id,
                                month,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="시간"
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-right focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                          />
                          {allocation.hours > 0 && (
                            <div className="mt-1 text-xs text-gray-500">
                              {formatCurrency(allocation.cost, currency)}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center text-sm">
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">
                          {formatNumber(memberTotal.hours)}시간
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(memberTotal.cost, currency)}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="text-gray-600 hover:text-gray-900"
                          title="수정"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="text-red-600 hover:text-red-900"
                          title="제외"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {/* 월별 합계 행 */}
              <tr className="bg-gray-50 font-medium">
                <td
                  colSpan={3}
                  className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-sm text-gray-900"
                >
                  월별 합계
                </td>
                {months.map((month) => {
                  const monthlyTotal = getMonthlyTotal(month);
                  return (
                    <td key={month} className="px-4 py-3 text-center text-sm">
                      <div className="space-y-1">
                        <div className="text-gray-900">
                          {formatNumber(monthlyTotal.totalHours)}시간
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatCurrency(monthlyTotal.totalCost, currency)}
                        </div>
                      </div>
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-center text-sm">
                  <div className="space-y-1">
                    <div className="text-gray-900">
                      {formatNumber(grandTotal.totalHours)}시간
                    </div>
                    <AutoCalculatedField
                      value={grandTotal.totalCost}
                      currency={currency}
                      className="w-auto"
                      showIcon={false}
                    />
                  </div>
                </td>
                <td className="px-4 py-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 인력 추가 모달 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              인력 추가
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  인력 선택
                </label>
                <select
                  value={selectedMember?.id || ""}
                  onChange={(e) => {
                    const member = availableMembers.find(
                      (m) => m.id === parseInt(e.target.value)
                    );
                    setSelectedMember(member || null);
                  }}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  <option value="">인력을 선택하세요</option>
                  {availableMembers
                    .filter((m) => !members.some((tm) => tm.id === m.id))
                    .map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} - {member.role} ({member.department})
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setSelectedMember(null);
                  }}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={!selectedMember}
                  className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

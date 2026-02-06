"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Currency } from "@/lib/utils/currency";
import { CurrencySelector } from "@/components/CurrencySelector";
import { DatePicker } from "@/components/ui";
import { format } from "date-fns";


interface User {
  id: number;
  name: string;
  email: string;
  role_name: string;
}

interface Client {
  id: number;
  name: string;
  type: string;
}

interface ProjectCategory {
  id: number;
  code: string;
  name: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projectCategories, setProjectCategories] = useState<ProjectCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    projectCode: "",
    name: "",
    category: "",
    customerId: "",
    ordererId: "",
    description: "",
    managerId: "",
    salesRepresentativeId: "",
    contractStartDate: "",
    contractEndDate: "",
    actualStartDate: "",
    actualEndDate: "",
    currency: "KRW" as Currency,
    expectedAmount: "",
    processStatus: "",
    riskLevel: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, clientsRes, categoriesRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/clients"),
        fetch("/api/project-categories"),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData.clients || []);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setProjectCategories(categoriesData.categories || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const [pmSearch, setPmSearch] = useState("");
  const [salesSearch, setSalesSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [ordererSearch, setOrdererSearch] = useState("");
  const [showPmDropdown, setShowPmDropdown] = useState(false);
  const [showSalesDropdown, setShowSalesDropdown] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showOrdererDropdown, setShowOrdererDropdown] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          project_code: formData.projectCode || null,
          category_id: formData.category ? parseInt(formData.category) : null,
          customer_id: formData.customerId ? parseInt(formData.customerId) : null,
          orderer_id: formData.ordererId ? parseInt(formData.ordererId) : null,
          description: formData.description,
          contract_start_date: formData.contractStartDate || null,
          contract_end_date: formData.contractEndDate || null,
          actual_start_date: formData.actualStartDate || null,
          actual_end_date: formData.actualEndDate || null,
          expected_amount: formData.expectedAmount ? parseFloat(formData.expectedAmount) : null,
          currency: formData.currency,
          manager_id: formData.managerId ? parseInt(formData.managerId) : null,
          sales_representative_id: formData.salesRepresentativeId ? parseInt(formData.salesRepresentativeId) : null,
          process_status: formData.processStatus || null,
          risk_level: formData.riskLevel || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/projects/${data.id}`);
      } else {
        const error = await response.json();
        alert(`프로젝트 생성 실패: ${error.message || "알 수 없는 오류"}`);
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error("Error creating project:", error);
      alert(`프로젝트 생성 실패: ${error.message}`);
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePmSelect = (userId: string, userName: string) => {
    setFormData((prev) => ({ ...prev, managerId: userId }));
    setPmSearch(userName);
    setShowPmDropdown(false);
  };

  const handleSalesSelect = (userId: string, userName: string) => {
    setFormData((prev) => ({ ...prev, salesRepresentativeId: userId }));
    setSalesSearch(userName);
    setShowSalesDropdown(false);
  };

  const filteredPms = users.filter(
    (user) =>
      (user.role_name === "pm" || user.role_name === "admin") &&
      (user.name.toLowerCase().includes(pmSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(pmSearch.toLowerCase()))
  );

  const filteredSales = users.filter(
    (user) =>
      user.role_name === "sales" &&
      (user.name.toLowerCase().includes(salesSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(salesSearch.toLowerCase()))
  );

  const selectedPm = users.find((u) => u.id.toString() === formData.managerId);
  const selectedSales = users.find(
    (u) => u.id.toString() === formData.salesRepresentativeId
  );
  const selectedCustomer = clients.find(
    (c) => c.id.toString() === formData.customerId
  );
  const selectedOrderer = clients.find(
    (c) => c.id.toString() === formData.ordererId
  );

  const filteredCustomers = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredOrderers = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(ordererSearch.toLowerCase())
  );

  const handleCustomerSelect = (clientId: string, clientName: string) => {
    setFormData((prev) => ({ ...prev, customerId: clientId }));
    setCustomerSearch(clientName);
    setShowCustomerDropdown(false);
  };

  const handleOrdererSelect = (clientId: string, clientName: string) => {
    setFormData((prev) => ({ ...prev, ordererId: clientId }));
    setOrdererSearch(clientName);
    setShowOrdererDropdown(false);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link
          href="/projects"
          className="text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            새 프로젝트 생성
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            프로젝트 기본 정보를 입력하세요
          </p>
        </div>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            기본 정보
          </h2>

          <div className="space-y-6">
            {/* 프로젝트 코드 - 선택사항 (계약 진행 시 자동 생성) */}
            <div>
              <label
                htmlFor="projectCode"
                className="block text-sm font-medium text-gray-700"
              >
                프로젝트 코드
              </label>
              <input
                type="text"
                id="projectCode"
                name="projectCode"
                value={formData.projectCode}
                onChange={handleChange}
                placeholder="계약 완료 후 생성됩니다 (예: P24-039, P25-019)"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>

            {/* 프로젝트명 */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                프로젝트명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="프로젝트명을 입력하세요"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>

            {/* 프로젝트 카테고리 */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700"
              >
                프로젝트 카테고리 <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                disabled={loading}
              >
                <option value="">카테고리를 선택하세요</option>
                {projectCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 고객사 선택 */}
            <div className="relative">
              <label
                htmlFor="customerId"
                className="block text-sm font-medium text-gray-700"
              >
                고객사
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  id="customerId"
                  name="customerId"
                  value={customerSearch || selectedCustomer?.name || ""}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                    if (!e.target.value) {
                      setFormData((prev) => ({ ...prev, customerId: "" }));
                    }
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="고객사명 또는 코드로 검색..."
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
                {showCustomerDropdown && filteredCustomers.length > 0 && (
                  <>
                    <div
                      className="fixed inset-0 z-0"
                      onClick={() => setShowCustomerDropdown(false)}
                    />
                    <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                      {filteredCustomers.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() =>
                            handleCustomerSelect(client.id.toString(), client.name)
                          }
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                        >
                          <div className="font-medium text-gray-900">
                            {client.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <input
                type="hidden"
                name="customerId"
                value={formData.customerId}
              />
            </div>

            {/* 발주처 선택 */}
            <div className="relative">
              <label
                htmlFor="ordererId"
                className="block text-sm font-medium text-gray-700"
              >
                발주처
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  id="ordererId"
                  name="ordererId"
                  value={ordererSearch || selectedOrderer?.name || ""}
                  onChange={(e) => {
                    setOrdererSearch(e.target.value);
                    setShowOrdererDropdown(true);
                    if (!e.target.value) {
                      setFormData((prev) => ({ ...prev, ordererId: "" }));
                    }
                  }}
                  onFocus={() => setShowOrdererDropdown(true)}
                  placeholder="발주처명 또는 코드로 검색..."
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
                {showOrdererDropdown && filteredOrderers.length > 0 && (
                  <>
                    <div
                      className="fixed inset-0 z-0"
                      onClick={() => setShowOrdererDropdown(false)}
                    />
                    <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                      {filteredOrderers.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() =>
                            handleOrdererSelect(client.id.toString(), client.name)
                          }
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                        >
                          <div className="font-medium text-gray-900">
                            {client.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <input
                type="hidden"
                name="ordererId"
                value={formData.ordererId}
              />
            </div>

            {/* 설명 */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                설명
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                placeholder="프로젝트 설명을 입력하세요"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>

            {/* PM 선택 */}
            <div className="relative">
              <label
                htmlFor="managerId"
                className="block text-sm font-medium text-gray-700"
              >
                프로젝트 매니저
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  id="managerId"
                  name="managerId"
                  value={pmSearch || selectedPm?.name || ""}
                  onChange={(e) => {
                    setPmSearch(e.target.value);
                    setShowPmDropdown(true);
                    if (!e.target.value) {
                      setFormData((prev) => ({ ...prev, managerId: "" }));
                    }
                  }}
                  onFocus={() => setShowPmDropdown(true)}
                  placeholder="PM 이름 또는 이메일로 검색..."
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
                {showPmDropdown && filteredPms.length > 0 && (
                  <>
                    <div
                      className="fixed inset-0 z-0"
                      onClick={() => setShowPmDropdown(false)}
                    />
                    <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                      {filteredPms.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handlePmSelect(user.id.toString(), user.name)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                        >
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <input
                type="hidden"
                name="managerId"
                value={formData.managerId}
              />
            </div>

            {/* 영업대표 선택 */}
            <div className="relative">
              <label
                htmlFor="salesRepresentativeId"
                className="block text-sm font-medium text-gray-700"
              >
                영업대표 <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  id="salesRepresentativeId"
                  name="salesRepresentativeId"
                  required
                  value={salesSearch || selectedSales?.name || ""}
                  onChange={(e) => {
                    setSalesSearch(e.target.value);
                    setShowSalesDropdown(true);
                    if (!e.target.value) {
                      setFormData((prev) => ({
                        ...prev,
                        salesRepresentativeId: "",
                      }));
                    }
                  }}
                  onFocus={() => setShowSalesDropdown(true)}
                  placeholder="영업대표 이름 또는 이메일로 검색..."
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
                {showSalesDropdown && filteredSales.length > 0 && (
                  <>
                    <div
                      className="fixed inset-0 z-0"
                      onClick={() => setShowSalesDropdown(false)}
                    />
                    <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                      {filteredSales.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() =>
                            handleSalesSelect(user.id.toString(), user.name)
                          }
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                        >
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <input
                type="hidden"
                name="salesRepresentativeId"
                value={formData.salesRepresentativeId}
                required
              />
            </div>

            {/* 통화 및 예상 금액 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  통화
                </label>
                <div className="mt-1">
                  <CurrencySelector
                    value={formData.currency}
                    onChange={(currency) =>
                      setFormData({ ...formData, currency })
                    }
                    className="w-full"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="expectedAmount"
                  className="block text-sm font-medium text-gray-700"
                >
                  예상 금액
                </label>
                <input
                  type="text"
                  id="expectedAmount"
                  name="expectedAmount"
                  value={formData.expectedAmount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, "");
                    setFormData({ ...formData, expectedAmount: value });
                  }}
                  placeholder="예상 금액을 입력하세요"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
                {formData.expectedAmount && (
                  <p className="mt-1 text-xs text-gray-500">
                    {parseInt(formData.expectedAmount || "0").toLocaleString()}원
                  </p>
                )}
              </div>
            </div>

            {/* 계약 기간 */}
            <div className="grid grid-cols-2 gap-4">
              <DatePicker
                label="계약 시작일"
                date={formData.contractStartDate ? new Date(formData.contractStartDate) : undefined}
                setDate={(date) => setFormData(prev => ({ ...prev, contractStartDate: date ? format(date, "yyyy-MM-dd") : "" }))}
              />
              <DatePicker
                label="계약 종료일"
                date={formData.contractEndDate ? new Date(formData.contractEndDate) : undefined}
                setDate={(date) => setFormData(prev => ({ ...prev, contractEndDate: date ? format(date, "yyyy-MM-dd") : "" }))}
              />
            </div>

            {/* 실제 기간 */}
            <div className="grid grid-cols-2 gap-4">
              <DatePicker
                label="실제 시작일"
                date={formData.actualStartDate ? new Date(formData.actualStartDate) : undefined}
                setDate={(date) => setFormData(prev => ({ ...prev, actualStartDate: date ? format(date, "yyyy-MM-dd") : "" }))}
              />
              <DatePicker
                label="실제 종료일"
                date={formData.actualEndDate ? new Date(formData.actualEndDate) : undefined}
                setDate={(date) => setFormData(prev => ({ ...prev, actualEndDate: date ? format(date, "yyyy-MM-dd") : "" }))}
              />
            </div>

            {/* 단계 및 위험도 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="processStatus"
                  className="block text-sm font-medium text-gray-700"
                >
                  단계
                </label>
                <select
                  id="processStatus"
                  name="processStatus"
                  value={formData.processStatus}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  <option value="">선택하세요</option>
                  <option value="sales">영업/PS</option>
                  <option value="md_estimation">M/D 산정</option>
                  <option value="vrb">VRB</option>
                  <option value="confirmation">컨펌</option>
                  <option value="team_allocation">인력 배치</option>
                  <option value="profitability">수지분석서</option>
                  <option value="in_progress">프로젝트 진행</option>
                  <option value="settlement">수지정산서</option>
                  <option value="warranty">하자보증</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="riskLevel"
                  className="block text-sm font-medium text-gray-700"
                >
                  위험도
                </label>
                <select
                  id="riskLevel"
                  name="riskLevel"
                  value={formData.riskLevel}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  <option value="">선택하세요</option>
                  <option value="high">상</option>
                  <option value="medium">중</option>
                  <option value="low">하</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/projects"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "생성 중..." : "프로젝트 생성"}
          </button>
        </div>
      </form>
    </div>
  );
}

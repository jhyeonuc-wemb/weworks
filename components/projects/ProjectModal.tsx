"use client";

import { useState, useEffect } from "react";
import { DraggablePanel, Button, DatePicker } from "@/components/ui";
import { Save, Search, X } from "lucide-react";
import { format } from "date-fns";
import { Currency } from "@/lib/utils/currency";
import { CurrencySelector } from "@/components/CurrencySelector";

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

interface ProjectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project?: any;
    onSave: (data: any) => void;
    triggerRect?: DOMRect | null;
}

export function ProjectModal({ open, onOpenChange, project, onSave, triggerRect }: ProjectModalProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [projectCategories, setProjectCategories] = useState<ProjectCategory[]>([]);
    const [loading, setLoading] = useState(false);

    // 폼 데이터 (new/page.tsx와 동일하게 구성)
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

    // 검색 및 드롭다운 상태
    const [pmSearch, setPmSearch] = useState("");
    const [salesSearch, setSalesSearch] = useState("");
    const [customerSearch, setCustomerSearch] = useState("");
    const [ordererSearch, setOrdererSearch] = useState("");
    const [showPmDropdown, setShowPmDropdown] = useState(false);
    const [showSalesDropdown, setShowSalesDropdown] = useState(false);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [showOrdererDropdown, setShowOrdererDropdown] = useState(false);

    useEffect(() => {
        if (open) {
            fetchReferenceData();
        }
    }, [open]);

    const fetchReferenceData = async () => {
        try {
            setLoading(true);
            const [usersRes, clientsRes, categoriesRes] = await Promise.all([
                fetch("/api/users"),
                fetch("/api/clients"),
                fetch("/api/project-categories"),
            ]);

            let loadedUsers: User[] = [];
            let loadedClients: Client[] = [];

            if (usersRes.ok) {
                const data = await usersRes.json();
                loadedUsers = data.users || [];
                setUsers(loadedUsers);
            }
            if (clientsRes.ok) {
                const data = await clientsRes.json();
                loadedClients = data.clients || [];
                setClients(loadedClients);
            }
            if (categoriesRes.ok) {
                const data = await categoriesRes.json();
                setProjectCategories(data.categories || []);
            }

            // 수정 모드일 때 초기 바인딩
            if (project) {
                setFormData({
                    projectCode: project.project_code || "",
                    name: project.name || "",
                    category: project.category_id?.toString() || "",
                    customerId: project.customer_id?.toString() || "",
                    ordererId: project.orderer_id?.toString() || "",
                    description: project.description || "",
                    managerId: project.manager_id?.toString() || "",
                    salesRepresentativeId: project.sales_representative_id?.toString() || "",
                    contractStartDate: project.contract_start_date ? project.contract_start_date.split('T')[0] : "",
                    contractEndDate: project.contract_end_date ? project.contract_end_date.split('T')[0] : "",
                    actualStartDate: project.actual_start_date ? project.actual_start_date.split('T')[0] : "",
                    actualEndDate: project.actual_end_date ? project.actual_end_date.split('T')[0] : "",
                    currency: (project.currency || "KRW") as Currency,
                    expectedAmount: project.expected_amount?.toString() || "",
                    processStatus: project.process_status || "",
                    riskLevel: project.risk_level || "",
                });

                // 이름 검색 필드 초기화
                const pm = loadedUsers.find(u => u.id === project.manager_id);
                const sales = loadedUsers.find(u => u.id === project.sales_representative_id);
                const customer = loadedClients.find(c => c.id === project.customer_id);
                const orderer = loadedClients.find(c => c.id === project.orderer_id);

                setPmSearch(pm?.name || "");
                setSalesSearch(sales?.name || "");
                setCustomerSearch(customer?.name || "");
                setOrdererSearch(orderer?.name || "");
            } else {
                // 등록 모드 초기화
                setFormData({
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
                setPmSearch("");
                setSalesSearch("");
                setCustomerSearch("");
                setOrdererSearch("");
            }
        } catch (error) {
            console.error("Error fetching reference data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // API 규격에 맞는 페이로드 생성 (new/page.tsx의 mapping 로직과 동일)
        const payload = {
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
        };
        onSave(payload);
    };

    // 필터링 로직
    const filteredCustomers = clients.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()));
    const filteredOrderers = clients.filter(c => c.name.toLowerCase().includes(ordererSearch.toLowerCase()));
    const filteredPms = users.filter(u => (u.role_name === "pm" || u.role_name === "admin") && u.name.toLowerCase().includes(pmSearch.toLowerCase()));
    const filteredSales = users.filter(u => u.role_name === "sales" && u.name.toLowerCase().includes(salesSearch.toLowerCase()));

    const selectedCustomer = clients.find(c => c.id.toString() === formData.customerId);
    const selectedOrderer = clients.find(c => c.id.toString() === formData.ordererId);
    const selectedPm = users.find(u => u.id.toString() === formData.managerId);
    const selectedSales = users.find(u => u.id.toString() === formData.salesRepresentativeId);

    return (
        <DraggablePanel
            open={open}
            onOpenChange={onOpenChange}
            triggerRect={triggerRect}
            title={project ? "프로젝트 수정" : "신규 프로젝트 등록"}
            description="프로젝트의 기본 정보와 계약 내용을 관리합니다."
            className="max-w-4xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    {/* 프로젝트 코드 */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">프로젝트 코드</label>
                        <input
                            type="text"
                            name="projectCode"
                            value={formData.projectCode}
                            onChange={handleChange}
                            placeholder="예: P24-039"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                        />
                    </div>

                    {/* 프로젝트명 */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">프로젝트명 <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="프로젝트명을 입력하세요"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                        />
                    </div>

                    {/* 카테고리 */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">카테고리</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                        >
                            <option value="">선택하세요</option>
                            {projectCategories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* 고객사 검색 */}
                    <div className="relative space-y-1">
                        <label className="text-xs font-bold text-gray-500">고객사</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={customerSearch || selectedCustomer?.name || ""}
                                onChange={(e) => {
                                    setCustomerSearch(e.target.value);
                                    setShowCustomerDropdown(true);
                                }}
                                onFocus={() => setShowCustomerDropdown(true)}
                                placeholder="고객사 검색..."
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                            />
                            {showCustomerDropdown && filteredCustomers.length > 0 && (
                                <div className="absolute z-50 mt-1 max-h-40 w-full overflow-auto rounded-md border bg-white shadow-lg">
                                    {filteredCustomers.map((c) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, customerId: c.id.toString() }));
                                                setCustomerSearch(c.name);
                                                setShowCustomerDropdown(false);
                                            }}
                                        >
                                            {c.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 발주처 검색 */}
                    <div className="relative space-y-1">
                        <label className="text-xs font-bold text-gray-500">발주처</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={ordererSearch || selectedOrderer?.name || ""}
                                onChange={(e) => {
                                    setOrdererSearch(e.target.value);
                                    setShowOrdererDropdown(true);
                                }}
                                onFocus={() => setShowOrdererDropdown(true)}
                                placeholder="발주처 검색..."
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                            />
                            {showOrdererDropdown && filteredOrderers.length > 0 && (
                                <div className="absolute z-50 mt-1 max-h-40 w-full overflow-auto rounded-md border bg-white shadow-lg">
                                    {filteredOrderers.map((c) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, ordererId: c.id.toString() }));
                                                setOrdererSearch(c.name);
                                                setShowOrdererDropdown(false);
                                            }}
                                        >
                                            {c.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* PM 검색 */}
                    <div className="relative space-y-1">
                        <label className="text-xs font-bold text-gray-500">프로젝트 매니저</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={pmSearch || selectedPm?.name || ""}
                                onChange={(e) => {
                                    setPmSearch(e.target.value);
                                    setShowPmDropdown(true);
                                }}
                                onFocus={() => setShowPmDropdown(true)}
                                placeholder="PM 검색..."
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                            />
                            {showPmDropdown && filteredPms.length > 0 && (
                                <div className="absolute z-50 mt-1 max-h-40 w-full overflow-auto rounded-md border bg-white shadow-lg">
                                    {filteredPms.map((u) => (
                                        <button
                                            key={u.id}
                                            type="button"
                                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, managerId: u.id.toString() }));
                                                setPmSearch(u.name);
                                                setShowPmDropdown(false);
                                            }}
                                        >
                                            {u.name} ({u.email})
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 영업대표 검색 */}
                    <div className="relative space-y-1">
                        <label className="text-xs font-bold text-gray-500">영업대표 <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                value={salesSearch || selectedSales?.name || ""}
                                onChange={(e) => {
                                    setSalesSearch(e.target.value);
                                    setShowSalesDropdown(true);
                                }}
                                onFocus={() => setShowSalesDropdown(true)}
                                placeholder="영업대표 검색..."
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                            />
                            {showSalesDropdown && filteredSales.length > 0 && (
                                <div className="absolute z-50 mt-1 max-h-40 w-full overflow-auto rounded-md border bg-white shadow-lg">
                                    {filteredSales.map((u) => (
                                        <button
                                            key={u.id}
                                            type="button"
                                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, salesRepresentativeId: u.id.toString() }));
                                                setSalesSearch(u.name);
                                                setShowSalesDropdown(false);
                                            }}
                                        >
                                            {u.name} ({u.email})
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 예상금액 및 통화 */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">통화</label>
                            <CurrencySelector
                                value={formData.currency}
                                onChange={(curr) => setFormData(prev => ({ ...prev, currency: curr }))}
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">예상 금액</label>
                            <input
                                type="text"
                                value={formData.expectedAmount}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^\d]/g, "");
                                    setFormData(prev => ({ ...prev, expectedAmount: val }));
                                }}
                                placeholder="0"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* 계약 시작/종료일 */}
                    <div className="grid grid-cols-2 gap-2">
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

                    {/* 실제 시작/종료일 */}
                    <div className="grid grid-cols-2 gap-2">
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
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">단계</label>
                            <select
                                name="processStatus"
                                value={formData.processStatus}
                                onChange={handleChange}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
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
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">위험도</label>
                            <select
                                name="riskLevel"
                                value={formData.riskLevel}
                                onChange={handleChange}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                            >
                                <option value="">선택하세요</option>
                                <option value="high">상</option>
                                <option value="medium">중</option>
                                <option value="low">하</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 설명 */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">설명</label>
                    <textarea
                        name="description"
                        rows={3}
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="상세 내용을 입력하세요"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                    />
                </div>

                {/* 푸터 버튼 */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                    <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
                        취소
                    </Button>
                    <Button variant="primary" type="submit" className="px-8 min-w-[120px]">
                        <Save className="h-4 w-4 mr-2" />
                        {project ? "변경사항 저장" : "프로젝트 등록"}
                    </Button>
                </div>
            </form>

            {/* 외부 영역 클릭 시 드롭다운 닫기 위한 오버레이 */}
            {(showPmDropdown || showSalesDropdown || showCustomerDropdown || showOrdererDropdown) && (
                <div
                    className="fixed inset-0 z-[40]"
                    onClick={() => {
                        setShowPmDropdown(false);
                        setShowSalesDropdown(false);
                        setShowCustomerDropdown(false);
                        setShowOrdererDropdown(false);
                    }}
                />
            )}
        </DraggablePanel>
    );
}

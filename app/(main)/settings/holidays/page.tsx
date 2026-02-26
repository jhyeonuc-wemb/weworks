"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Plus,
    Edit,
    Trash2,
    Calendar,
    ChevronLeft,
    ChevronRight,
    FolderOpen,
    Search,
    CheckCircle2,
    X
} from "lucide-react";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
    Button,
    DraggablePanel,
    useToast,
    SearchInput,
    Dropdown,
} from "@/components/ui";
import type { AlertType } from "@/components/ui";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface Holiday {
    id: number;
    holiday_date: string;
    name: string;
    is_recurring: boolean;
    description: string | null;
}

export default function HolidaysPage() {
    const { showToast, confirm } = useToast();

    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(true);
    const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
    const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

    const [formData, setFormData] = useState({
        holiday_date: format(new Date(), "yyyy-MM-dd"),
        name: "",
        is_recurring: false,
        description: "",
    });

    // 실데이터 조회
    const fetchHolidays = async (year?: string) => {
        try {
            setLoading(true);
            const targetYear = year || selectedYear;
            const response = await fetch(`/api/holidays?year=${targetYear}`);
            if (response.ok) {
                const data = await response.json();
                setHolidays(data.holidays || []);
            } else {
                showToast("데이터를 불러오는 중 오류가 발생했습니다.", "error");
            }
        } catch (error) {
            console.error("Error fetching holidays:", error);
            showToast("서버 통신 중 오류가 발생했습니다.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, [selectedYear]);

    const filteredHolidays = useMemo(() => {
        return holidays
            .filter(h =>
                h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                h.holiday_date.includes(searchTerm)
            )
            .sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));
    }, [holidays, searchTerm]);

    const paginatedHolidays = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredHolidays.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredHolidays, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredHolidays.length / itemsPerPage);

    const handleAdd = (e: React.MouseEvent) => {
        setFormData({
            holiday_date: format(new Date(), "yyyy-MM-dd"),
            name: "",
            is_recurring: false,
            description: "",
        });
        setIsAdding(true);
        setTriggerRect(e.currentTarget.getBoundingClientRect());
        setIsModalOpen(true);
    };

    const handleEdit = (holiday: Holiday, e: React.MouseEvent) => {
        setFormData({
            holiday_date: holiday.holiday_date,
            name: holiday.name,
            is_recurring: holiday.is_recurring,
            description: holiday.description || "",
        });
        setEditingHoliday(holiday);
        setIsAdding(false);
        setTriggerRect(e.currentTarget.getBoundingClientRect());
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        confirm({
            title: "휴일 삭제",
            message: "선택한 휴일 정보를 삭제하시겠습니까?",
            onConfirm: async () => {
                try {
                    const response = await fetch(`/api/holidays/${id}`, { method: "DELETE" });
                    if (response.ok) {
                        await fetchHolidays();
                        showToast("휴일이 삭제되었습니다.", "success");
                    } else {
                        showToast("삭제에 실패했습니다.", "error");
                    }
                } catch (error) {
                    console.error("Delete error:", error);
                    showToast("서버 통신 중 오류가 발생했습니다.", "error");
                }
            }
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.holiday_date) {
            showToast("이름과 날짜를 입력해주세요.", "error");
            return;
        }

        try {
            const url = isAdding ? "/api/holidays" : `/api/holidays/${editingHoliday?.id}`;
            const method = isAdding ? "POST" : "PUT";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                await fetchHolidays();
                showToast(isAdding ? "새 휴일이 등록되었습니다." : "휴일 정보가 수정되었습니다.", "success");
                setIsModalOpen(false);
            } else {
                const err = await response.json();
                showToast(`저장 실패: ${err.error || "알 수 없는 오류"}`, "error");
            }
        } catch (error) {
            console.error("Save error:", error);
            showToast("서버 통신 중 오류가 발생했습니다.", "error");
        }
    };

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex items-center justify-between px-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        휴일 관리
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        시스템 전체 휴일을 관리합니다. (프로젝트 일정 및 작업일지 연동)
                    </p>
                </div>
                <Button
                    onClick={handleAdd}
                    variant="primary"
                    className="h-11 px-6"
                >
                    <Plus className="h-4 w-4 mr-1.5" />
                    신규 휴일 등록
                </Button>
            </div>

            {/* Filter Section */}
            <div className="flex items-center justify-between gap-4 px-2">
                <div className="flex items-center gap-4 flex-1">
                    <div className="w-40">
                        <Dropdown
                            value={selectedYear}
                            onChange={(val) => setSelectedYear(val.toString())}
                            options={[
                                { value: "2024", label: "2024년" },
                                { value: "2025", label: "2025년" },
                                { value: "2026", label: "2026년" },
                                { value: "2027", label: "2027년" },
                            ]}
                            variant="premium"
                            placeholder="연도 선택"
                        />
                    </div>
                    <div className="flex-1 max-w-sm">
                        <SearchInput
                            placeholder="휴일명 또는 날짜 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="neo-light-card overflow-hidden border border-border/40 bg-white">
                <div className="overflow-x-auto custom-scrollbar-main">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="px-8 py-3 text-left text-sm text-slate-900 w-[150px] whitespace-nowrap">날짜</TableHead>
                                <TableHead className="px-8 py-3 text-left text-sm text-slate-900 w-[200px] whitespace-nowrap">휴일 이름</TableHead>
                                <TableHead className="px-8 py-3 text-center text-sm text-slate-900 w-[100px] whitespace-nowrap">매년 반복</TableHead>
                                <TableHead className="px-8 py-3 text-left text-sm text-slate-900 whitespace-nowrap">설명</TableHead>
                                <TableHead className="px-8 py-3 text-right text-sm text-slate-900 w-[120px] whitespace-nowrap">작업</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-border/10">
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="px-8 py-24 text-center border-none">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                            <p className="text-sm font-medium text-muted-foreground">데이터를 불러오고 있습니다...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedHolidays.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="px-8 py-24 text-center border-none">
                                        <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                                            <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
                                                <Calendar className="h-10 w-10 text-muted-foreground/30" />
                                            </div>
                                            <p className="text-sm font-medium text-foreground">등록된 휴일 정보가 없습니다</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedHolidays.map((holiday) => (
                                    <TableRow key={holiday.id} className="hover:bg-primary/[0.02] transition-colors group">
                                        <TableCell className="whitespace-nowrap px-8 py-4">
                                            <span className="text-sm font-bold text-foreground/80 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/10 font-mono">
                                                {holiday.holiday_date}
                                            </span>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap px-8 py-4 text-sm font-bold text-foreground tracking-tight">
                                            {holiday.name}
                                        </TableCell>
                                        <TableCell className="px-8 py-4 text-center">
                                            {holiday.is_recurring ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-8 py-4 text-sm font-medium text-muted-foreground/80">
                                            {holiday.description || <span className="text-muted-foreground/30 italic">설명 없음</span>}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap px-8 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                <button
                                                    onClick={(e) => handleEdit(holiday, e)}
                                                    className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                                                    title="수정"
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(holiday.id)}
                                                    className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90"
                                                    title="삭제"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Section */}
                <div className="bg-muted/30 px-8 py-3 border-t border-border/20 flex items-center justify-center relative min-h-[56px]">
                    <div className="absolute left-8 flex items-center gap-6">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            TOTAL : <span className="text-primary ml-1">{filteredHolidays.length}</span>
                        </div>
                        <div className="flex items-center gap-2 border-l border-border/40 pl-6">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ROWS :</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none cursor-pointer hover:text-primary transition-colors"
                            >
                                {[10, 20, 30, 50].map(size => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-lg border border-border/40 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                        "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                                        currentPage === page
                                            ? "bg-slate-900 text-white shadow-md shadow-slate-200"
                                            : "text-slate-500 hover:bg-white hover:text-slate-900"
                                    )}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded-lg border border-border/40 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal / DraggablePanel Section */}
            <DraggablePanel
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                triggerRect={triggerRect}
                title={isAdding ? "신규 휴일 등록" : "휴일 정보 수정"}
                description="휴일 날짜와 명칭을 등록합니다. 매년 반복 여부를 선택할 수 있습니다."
                className="max-w-md"
            >
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 px-1">
                                휴일 날짜 <span className="text-primary">*</span>
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.holiday_date}
                                onChange={(e) => setFormData({ ...formData, holiday_date: e.target.value })}
                                className="w-full h-10 rounded-xl border border-gray-300 px-3 text-sm focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 px-1">
                                휴일 이름 <span className="text-primary">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="예: 신정, 창립기념일"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full h-10 rounded-xl border border-gray-300 px-3 text-sm focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 outline-none transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-3 py-2 px-1">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, is_recurring: !formData.is_recurring })}
                                className={cn(
                                    "flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                    formData.is_recurring ? "bg-slate-900" : "bg-gray-200"
                                )}
                            >
                                <span
                                    className={cn(
                                        "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                        formData.is_recurring ? "translate-x-5" : "translate-x-0"
                                    )}
                                />
                            </button>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900">매년 반복 항목</span>
                                <span className="text-[11px] text-muted-foreground">매년 해당 날짜를 자동으로 휴일로 처리합니다.</span>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 px-1">설명</label>
                            <textarea
                                placeholder="상세 내용을 입력하세요"
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 outline-none transition-all resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                        <Button
                            variant="ghost"
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="font-bold text-slate-500"
                        >
                            취소
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            className="px-10 min-w-[140px] h-11"
                        >
                            {isAdding ? "등록하기" : "수정하기"}
                        </Button>
                    </div>
                </form>
            </DraggablePanel>
        </div>
    );
}

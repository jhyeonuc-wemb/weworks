"use client";

import { useState, useEffect, useMemo } from "react";
import Script from "next/script";
import {
    User as UserIcon,
    Lock,
    ShieldCheck,
    Mail,
    Building,
    Briefcase,
    HelpCircle,
    Phone,
    CreditCard,
    Calendar,
    MapPin,
    Save,
    Loader2,
    UserCircle,
    Search,
    AlertCircle
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { DraggablePanel } from "@/components/ui/DraggablePanel";
import { Input, Button, Dropdown } from "@/components/ui";
import { DatePicker } from "@/components/ui/DatePicker";
import { cn } from "@/lib/utils";

declare global {
    interface Window {
        daum: any;
    }
}

interface DropdownOption {
    value: string | number;
    label: string;
}

interface Department {
    id: number;
    name: string;
    parent_department_id: number | null;
}

interface User {
    id: string;
    username: string;
    name: string;
    email: string;
    role_id?: number | string;
    rank_id?: number | string;
    rank_name?: string;
    title?: string;
    department_id?: string;
    department_name?: string;
    employee_number?: string;
    phone?: string;
    address?: string;
    address_detail?: string;
    postcode?: string;
    user_state?: string;
    contract_type?: string;
    joined_date?: string;
    grade?: string;
}

interface UserProfilePanelProps {
    user: User;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onLogout: () => void;
    triggerRect?: DOMRect | null;
}

export function UserProfilePanel({ user: initialUser, open, onOpenChange, onLogout, triggerRect }: UserProfilePanelProps) {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [userData, setUserData] = useState<User>(initialUser);

    // Raw Data
    const [departments, setDepartments] = useState<Department[]>([]);
    const [rankOptions, setRankOptions] = useState<DropdownOption[]>([]);
    const [gradeOptions, setGradeOptions] = useState<DropdownOption[]>([]);

    // 비밀번호 변경 상태
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // 날짜 연동 유틸리티
    const parseLocalDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return undefined;
        if (dateStr.length === 10) {
            const [y, m, d] = dateStr.split('-').map(Number);
            return new Date(y, m - 1, d);
        }
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? undefined : date;
    };

    const formatDateForSubmit = (date: Date | undefined) => {
        if (!date) return null;
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const formatPhoneNumber = (value: string) => {
        if (!value) return value;
        const phoneNumber = value.replace(/[^\d]/g, "");
        const phoneNumberLength = phoneNumber.length;
        if (phoneNumberLength < 4) return phoneNumber;
        if (phoneNumberLength < 8) {
            return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
        }
        return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 11)}`;
    };

    // 사용자 정보 가져오기
    const fetchUserData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/me");
            if (res.ok) {
                const data = await res.json();
                if (data.user) {
                    setUserData(data.user);
                }
            }
        } catch (err) {
            console.error("Failed to fetch user data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // 공통 데이터 가져오기
    const fetchCommonData = async () => {
        try {
            // 직급
            const rankRes = await fetch("/api/codes?parentCode=CD_001_01");
            if (rankRes.ok) {
                const data = await rankRes.json();
                setRankOptions(data.codes.map((c: any) => ({ value: c.id.toString(), label: c.name })));
            }
            // 등급
            const gradeRes = await fetch("/api/codes?parentCode=CD_001_02");
            if (gradeRes.ok) {
                const data = await gradeRes.json();
                setGradeOptions(data.codes.map((c: any) => ({ value: c.code, label: c.name })));
            }
            // 부서
            const deptRes = await fetch("/api/departments");
            if (deptRes.ok) {
                const data = await deptRes.json();
                setDepartments(data.departments || []);
            }
        } catch (err) {
            console.error("Failed to fetch data:", err);
        }
    };

    // 부서 계층 구조 옵션 생성
    const departmentOptions = useMemo(() => {
        const buildHierarchy = (depts: Department[], parentId: number | null = null, level = 0): { value: string; label: string }[] => {
            const result: { value: string; label: string }[] = [];
            const children = depts.filter(d => d.parent_department_id === parentId);

            children.forEach(dept => {
                // (주) 위엠비 숨기기 로직 (users/page.tsx와 동일)
                if (level === 0 && (dept.name === '(주) 위엠비' || dept.name === '(주)위엠비')) {
                    result.push(...buildHierarchy(depts, dept.id, level));
                } else {
                    result.push({
                        value: dept.id.toString(),
                        label: `${"　".repeat(level)}${level > 0 ? "└ " : ""}${dept.name}`
                    });
                    result.push(...buildHierarchy(depts, dept.id, level + 1));
                }
            });
            return result;
        };
        return [{ value: "", label: "소속 없음" }, ...buildHierarchy(departments)];
    }, [departments]);

    useEffect(() => {
        if (open) {
            fetchUserData();
            fetchCommonData();
        }
    }, [open]);

    const handleAddressSearch = () => {
        if (window.daum && window.daum.Postcode) {
            new window.daum.Postcode({
                oncomplete: (data: any) => {
                    setUserData(prev => ({
                        ...prev,
                        postcode: data.zonecode,
                        address: data.address,
                        address_detail: ""
                    }));
                }
            }).open();
        } else {
            showToast("주소 검색 서비스를 불러오는 중입니다.", "info");
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch("/api/auth/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });

            if (res.ok) {
                showToast("프로필 정보가 업데이트되었습니다.", "success");
            } else {
                const data = await res.json();
                showToast(data.error || "업데이트 실패", "error");
            }
        } catch (err) {
            showToast("오류가 발생했습니다.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            showToast("새 비밀번호가 일치하지 않습니다.", "error");
            return;
        }

        if (newPassword.length < 8) {
            showToast("비밀번호는 최소 8자 이상이어야 합니다.", "error");
            return;
        }

        if (newPassword.includes(userData.username)) {
            showToast("비밀번호에 아이디를 포함할 수 없습니다.", "error");
            return;
        }

        if (/^\d+$/.test(newPassword)) {
            showToast("숫자로만 구성된 비밀번호는 사용할 수 없습니다.", "error");
            return;
        }

        if (newPassword === currentPassword) {
            showToast("기존 비밀번호와 동일하게 설정할 수 없습니다.", "error");
            return;
        }

        setIsChangingPassword(true);

        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            if (res.ok) {
                showToast("비밀번호가 변경되었습니다.", "success");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setActiveTab("profile");
            } else {
                const data = await res.json();
                showToast(data.error || "비밀번호 변경 실패", "error");
            }
        } catch (err) {
            showToast("오류 발생", "error");
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <DraggablePanel
            open={open}
            onOpenChange={onOpenChange}
            triggerRect={triggerRect}
            title="개인 정보 설정"
            description="본인의 기본 정보 및 보안 설정을 관리합니다."
            className="max-w-xl ring-1 ring-slate-200/50 shadow-2xl"
        >
            <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="afterInteractive" />

            <div className="flex border-b border-indigo-100 mb-5 p-1 bg-slate-50/50 rounded-2xl mx-1 shadow-sm">
                <button
                    onClick={() => setActiveTab("profile")}
                    className={cn(
                        "flex-1 py-2 text-sm font-bold transition-all rounded-xl relative flex items-center justify-center gap-2",
                        activeTab === "profile" ? "text-indigo-600 bg-white shadow-sm ring-1 ring-slate-200/50" : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                    )}
                >
                    <UserCircle className="w-4 h-4" />
                    내 정보
                </button>
                <button
                    onClick={() => setActiveTab("security")}
                    className={cn(
                        "flex-1 py-2 text-sm font-bold transition-all rounded-xl relative flex items-center justify-center gap-2",
                        activeTab === "security" ? "text-indigo-600 bg-white shadow-sm ring-1 ring-slate-200/50" : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                    )}
                >
                    <ShieldCheck className="w-4 h-4" />
                    보안 설정
                </button>
            </div>

            <div className="space-y-2 px-1 pb-2">
                {activeTab === "profile" ? (
                    <div className="space-y-2 animate-in slide-in-from-left-4 duration-500 ease-out">
                        {/* Profile Header */}
                        <div className="flex items-center gap-6 p-5 rounded-[2rem] bg-indigo-50/30 border border-indigo-100/50 shadow-sm overflow-hidden group">
                            <div className="w-14 h-14 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-black shadow-inner shadow-indigo-100/50 shrink-0">
                                {userData.name?.[0]}
                            </div>
                            <div className="min-w-0 overflow-hidden">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-bold text-slate-900 leading-tight truncate">{userData.name}</h3>
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-indigo-100 rounded-lg shrink-0 shadow-sm">
                                        <UserIcon className="w-2.5 h-2.5 text-indigo-400" />
                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider">
                                            {userData.username || "MEMBER"}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 mt-2 overflow-hidden">
                                    <p className="text-xs font-bold text-slate-400 truncate flex items-center gap-1.5">
                                        <Building className="w-3 h-3 shrink-0 text-slate-300" />
                                        <span className="truncate">{userData.department_name || "소속 부서 없음"}</span>
                                        <span className="shrink-0 text-slate-300">·</span>
                                        <span className="shrink-0 text-indigo-400">{userData.rank_name || "직급 미지정"}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 text-indigo-400">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <p className="text-sm font-medium">정보를 불러오는 중입니다...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleProfileUpdate} className="space-y-2">
                                {/* Row 1: 사원번호, 입사일 */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500">사원번호</label>
                                        <Input
                                            value={userData.employee_number || ""}
                                            onChange={(e) => setUserData({ ...userData, employee_number: e.target.value })}
                                            placeholder="사번 입력"
                                            className="h-10 rounded-2xl border-slate-200 font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500">입사일</label>
                                        <DatePicker
                                            date={parseLocalDate(userData.joined_date)}
                                            setDate={(date) => setUserData({ ...userData, joined_date: formatDateForSubmit(date) || undefined })}
                                        />
                                    </div>
                                </div>

                                {/* Row 2: 부서 (계층 구조) */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500">소속 부서</label>
                                    <Dropdown
                                        value={userData.department_id || ""}
                                        onChange={(val) => setUserData({ ...userData, department_id: val.toString() })}
                                        options={departmentOptions}
                                        placeholder="부서 선택"
                                        className="h-10 rounded-2xl border-slate-200"
                                    />
                                </div>

                                {/* Row 3: 직급, 직책 */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500">직급</label>
                                        <Dropdown
                                            value={userData.rank_id || ""}
                                            onChange={(val) => setUserData({ ...userData, rank_id: val.toString() })}
                                            options={rankOptions}
                                            placeholder="직급 선택"
                                            className="h-10 rounded-2xl border-slate-200"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500">직책</label>
                                        <Input
                                            value={userData.title || ""}
                                            onChange={(e) => setUserData({ ...userData, title: e.target.value })}
                                            placeholder="직책 (예: 팀장)"
                                            className="h-10 rounded-2xl border-slate-200"
                                        />
                                    </div>
                                </div>

                                {/* Row 4: 연락처, 이메일 */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500">연락처</label>
                                        <Input
                                            type="tel"
                                            value={userData.phone || ""}
                                            onChange={(e) => setUserData({ ...userData, phone: formatPhoneNumber(e.target.value) })}
                                            placeholder="010-0000-0000"
                                            maxLength={13}
                                            className="h-10 rounded-2xl border-slate-200 font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500">이메일</label>
                                        <Input
                                            type="email"
                                            value={userData.email || ""}
                                            onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                                            placeholder="email@wemb.co.kr"
                                            className="h-10 rounded-2xl border-slate-200"
                                        />
                                    </div>
                                </div>

                                {/* Row 5: 주소 */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500">주소</label>
                                    <div className="flex gap-2 w-full">
                                        <input
                                            type="text"
                                            className="w-24 h-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-mono text-center text-sm shrink-0 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                                            value={userData.postcode || ""}
                                            readOnly
                                            onClick={handleAddressSearch}
                                            placeholder="우편번호"
                                        />
                                        <input
                                            type="text"
                                            className="flex-1 min-w-0 h-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 px-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer hover:bg-slate-100"
                                            value={userData.address || ""}
                                            readOnly
                                            onClick={handleAddressSearch}
                                            placeholder="주소 검색"
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={handleAddressSearch}
                                            className="h-10 px-4 shrink-0 rounded-xl text-xs font-bold whitespace-nowrap"
                                        >
                                            주소 찾기
                                        </Button>
                                    </div>
                                </div>

                                {/* Row 6: 상세 주소 */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500">상세 주소</label>
                                    <Input
                                        value={userData.address_detail || ""}
                                        onChange={(e) => setUserData({ ...userData, address_detail: e.target.value })}
                                        placeholder="상세 정보를 입력해 주세요"
                                        className="h-10 rounded-xl border-slate-200 focus:border-indigo-500"
                                    />
                                </div>

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        disabled={isSaving}
                                        className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                변경사항 저장하기
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 ease-out pb-4">
                        {/* Original Alert Box Design */}
                        <div className="bg-blue-50/50 p-4 rounded-2xl flex gap-4 text-slate-600 border border-indigo-100/50 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-white border border-indigo-100 flex items-center justify-center shrink-0 shadow-sm text-blue-500">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-sm">보안 가이드라인</p>
                                <p className="text-xs mt-1 text-slate-500 leading-normal">
                                    NIST SP 800-63B 보안 가이드라인에 따라<br />
                                    <span className="font-bold text-blue-600">최소 8자 이상</span>의 비밀번호 설정이 필요합니다.<br />
                                    <span className="text-[10px] text-gray-400 font-normal mt-0.5 block">(복잡한 특수문자 강제 없음, 긴 비밀번호 권장)</span>
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500">현재 비밀번호</label>
                                <Input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(current) => setCurrentPassword(current.target.value)}
                                    placeholder="현재 비밀번호"
                                    required
                                    className="h-10 rounded-2xl border-slate-200"
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-gray-500">새 비밀번호</label>
                                    <div className="group relative">
                                        <HelpCircle className="h-4 w-4 text-slate-300 cursor-help hover:text-indigo-500 transition-colors" />
                                        <div className="absolute right-0 bottom-full mb-3 w-64 p-4 bg-slate-900 text-white text-[11px] rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-2xl pointer-events-none ring-1 ring-white/10 text-left">
                                            <p className="font-bold border-b border-white/10 pb-2 mb-2 text-blue-400 flex items-center gap-2">
                                                <ShieldCheck className="h-3.5 w-3.5" />
                                                비밀번호 설정 규칙 (6가지)
                                            </p>
                                            <ul className="space-y-2 opacity-90 font-medium whitespace-normal">
                                                <li className="flex gap-2">
                                                    <span className="text-blue-400">1.</span>
                                                    <span>최소 8자 이상의 길이 (NIST 표준)</span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="text-blue-400">2.</span>
                                                    <span>최대 64자 이하의 길이 (권장)</span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="text-blue-400">3.</span>
                                                    <span>아이디(계정명)를 포함하지 않음</span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="text-blue-400">4.</span>
                                                    <span>숫자로만 구성된 비밀번호 사용 불가</span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="text-blue-400">5.</span>
                                                    <span>현재 비밀번호와 다르게 설정</span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="text-blue-400">6.</span>
                                                    <span>영문/숫자/특수문자 조합 권장</span>
                                                </li>
                                            </ul>
                                            <div className="absolute top-full right-1 translate-x-[-10px] border-8 border-transparent border-t-slate-900" />
                                        </div>
                                    </div>
                                </div>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(newVal) => setNewPassword(newVal.target.value)}
                                    placeholder="8자 이상 조합 권장"
                                    required
                                    className="h-10 rounded-2xl border-slate-200"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500">비밀번호 확인</label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(conf) => setConfirmPassword(conf.target.value)}
                                    placeholder="비밀번호 재입력"
                                    required
                                    className="h-10 rounded-2xl border-slate-200"
                                />
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={isChangingPassword}
                                    className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white shadow-lg transition-all active:scale-[0.98]"
                                >
                                    {isChangingPassword ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Lock className="w-4 h-4 mr-2" />
                                            비밀번호 변경하기
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </DraggablePanel>
    );
}

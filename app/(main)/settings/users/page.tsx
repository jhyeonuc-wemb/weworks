"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    daum: any;
  }
}
import {
  Users as UsersIcon,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Shield,
  UserCog,
  Terminal as TerminalIcon,
  Code as CodeIcon,
  PenTool,
  Layout,
  Monitor,
  Headphones,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
  SearchInput,
  DraggablePanel,
  Dropdown,
  DatePicker,
} from "@/components/ui";

interface UserRole {
  id: number;
  name: string;
  is_primary: boolean;
}

interface User {
  id: number;
  username: string | null;
  name: string;
  email: string;
  employee_number: string | null;
  position: string | null;
  title: string | null;
  department_id: number | null;
  department_name: string | null;
  role_id: number | null;
  role_name: string | null;
  roles?: UserRole[];
  rank_id: number | null;
  rank_name: string | null;
  rank_code: string | null;
  grade: string | null;
  status: string;
  phone: string | null;
  address: string | null;
  address_detail: string | null;
  postcode: string | null;
  user_state: string | null;
  contract_type: string | null;
  joined_date: string | null;
  resignation_date: string | null;
  must_change_password: boolean;
}

interface Department {
  id: number;
  name: string;
  parent_department_id: number | null;
}

interface Role {
  id: number;
  name: string;
}

interface CommonCode {
  id: number;
  code: string;
  name: string;
  display_order: number;
}

function UsersContent() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDept, setSelectedDept] = useState("all");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [positions, setPositions] = useState<CommonCode[]>([]);
  const [grades, setGrades] = useState<CommonCode[]>([]);
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    employee_number: "",
    phone: "",
    address: "",
    address_detail: "",
    postcode: "",
    user_state: "",
    contract_type: "",
    department_id: "",
    role_ids: [] as number[],
    rank_id: "",
    grade: "",
    title: "",
    status: "active",
    joined_date: null as string | null,
    resignation_date: null as string | null,
    must_change_password: true,
  });


  useEffect(() => {
    const search = searchParams.get('search');
    if (search) setSearchTerm(search);
    const dept = searchParams.get('dept');
    if (dept) setSelectedDept(dept);
  }, [searchParams]);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchCommonCodes();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const timer = setTimeout(() => {
        fetchUsers();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      fetchUsers();
    }
  }, [searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/users?${params.toString()}`);
      console.log('Fetch users response:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Users data:', data);
        setUsers(data.users || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch users:', response.status, errorData);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/departments");
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };


  const fetchCommonCodes = async () => {
    try {
      // 직급(Position) 조회
      const posRes = await fetch("/api/codes?parentCode=CD_001_01");
      if (posRes.ok) {
        const data = await posRes.json();
        setPositions(data.codes || []);
      }

      // 등급(Grade) 조회
      const gradeRes = await fetch("/api/codes?parentCode=CD_001_02");
      if (gradeRes.ok) {
        const data = await gradeRes.json();
        setGrades(data.codes || []);
      }
      // 역할(Role) 조회
      const roleRes = await fetch("/api/codes?parentCode=CD_001_04");
      if (roleRes.ok) {
        const data = await roleRes.json();
        setRoles(data.codes || []);
      }
    } catch (error) {
      console.error("Error fetching common codes:", error);
    }
  };

  const handleOpenPanel = (user?: User, e?: React.MouseEvent) => {
    if (e) {
      setTriggerRect(e.currentTarget.getBoundingClientRect());
    }
    if (user) {
      setIsEditMode(true);
      setEditingUser(user);

      console.log('Opening modal for user:', user);
      console.log('User roles:', user.roles);

      // 명시적으로 숫자로 변환
      const roleIds = user.roles && user.roles.length > 0
        ? user.roles.map(r => Number(r.id))
        : (user.role_id ? [Number(user.role_id)] : []);

      console.log('Extracted role IDs:', roleIds);

      setFormData({
        username: user.username || "",
        name: user.name || "",
        email: user.email || "",
        employee_number: user.employee_number || "",
        phone: user.phone || "",
        department_id: user.department_id?.toString() || "",
        role_ids: roleIds,
        rank_id: user.rank_id?.toString() || "",
        grade: user.grade || "",
        title: user.title || "",
        status: user.status || "active",
        address: user.address || "",
        address_detail: user.address_detail || "",
        postcode: user.postcode || "",
        user_state: user.user_state || "",
        contract_type: user.contract_type || "",
        joined_date: user.joined_date || null,
        resignation_date: user.resignation_date || null,
        must_change_password: user.must_change_password || false,
      });
    } else {
      setIsEditMode(false);
      setEditingUser(null);
      setFormData({
        username: "",
        name: "",
        email: "",
        employee_number: "",
        phone: "",
        department_id: "",
        role_ids: [],
        rank_id: "",
        grade: "",
        title: "",
        status: "active",
        address: "",
        address_detail: "",
        postcode: "",
        user_state: "",
        contract_type: "",
        joined_date: null,
        resignation_date: null,
        must_change_password: true,
      });
    }
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setIsEditMode(false);
    setEditingUser(null);
    setFormData({
      username: "",
      name: "",
      email: "",
      employee_number: "",
      phone: "",
      department_id: "",
      role_ids: [],
      rank_id: "",
      grade: "",
      title: "",
      status: "active",
      address: "",
      address_detail: "",
      postcode: "",
      user_state: "",
      contract_type: "",
      joined_date: null,
      resignation_date: null,
      must_change_password: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 전화번호 형식 검사 (값이 있는 경우에만)
    if (formData.phone && !/^\d{2,3}-\d{3,4}-\d{4}$/.test(formData.phone)) {
      return alert("전화번호 형식이 올바르지 않습니다. (예: 010-0000-0000)");
    }

    setIsSubmitting(true);

    try {
      const url = isEditMode
        ? `/api/users/${editingUser?.id}`
        : "/api/users";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username || null,
          name: formData.name,
          email: formData.email,
          employee_number: formData.employee_number || null,
          phone: formData.phone || null,
          department_id: formData.department_id ? parseInt(formData.department_id) : null,
          role_ids: formData.role_ids.length > 0 ? formData.role_ids : null,
          rank_id: formData.rank_id ? parseInt(formData.rank_id) : null,
          grade: formData.grade || null,
          title: formData.title || null,
          status: formData.status,
          address: formData.address || null,
          address_detail: formData.address_detail || null,
          postcode: formData.postcode || null,
          user_state: formData.user_state || null,
          contract_type: formData.contract_type || null,
          joined_date: formData.joined_date,
          resignation_date: formData.resignation_date,
          must_change_password: formData.must_change_password,
          // 신규 사용자일 경우 초기 패스워드는 username과 동일하게 설정
          password: !isEditMode ? formData.username : undefined,
        }),
      });

      if (response.ok) {
        handleClosePanel();
        fetchUsers();
        alert(isEditMode ? "사용자가 수정되었습니다." : "사용자가 생성되었습니다.");
      } else {
        const error = await response.json();
        // 중복 에러인 경우 더 명확한 메시지 표시
        if (error.field) {
          const fieldName = error.field === 'email' ? '이메일' : error.field === 'username' ? '아이디' : error.field;
          alert(`${fieldName}: ${error.error}`);
        } else {
          alert(`오류: ${error.error || error.message || "알 수 없는 오류"}`);
        }
      }
    } catch (error: any) {
      console.error("Error saving user:", error);
      alert(`저장 실패: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`정말 "${name}"을(를) 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchUsers();
        alert("사용자가 삭제되었습니다.");
      } else {
        const error = await response.json();
        let errorMsg = error.message || "알 수 없는 오류";
        if (errorMsg.includes("we_projects_created_by_fkey") || errorMsg.includes("manager_id") || errorMsg.includes("sales_representative_id")) {
          errorMsg = "이 사용자가 생성했거나 담당(PM/영업)하고 있는 프로젝트가 존재하여 삭제할 수 없습니다. 관련 프로젝트의 담당자를 먼저 변경해 주세요.";
        } else if (errorMsg.includes("we_departments_manager_id_fkey")) {
          errorMsg = "이 사용자가 부서장으로 등록되어 있는 부서가 존재하여 삭제할 수 없습니다. 부서 관리에서 부서장을 먼저 변경해 주세요.";
        }
        alert(`삭제 실패: ${errorMsg}`);
      }
    } catch (error: any) {
      console.error("Error deleting user:", error);
      alert(`삭제 실패: ${error.message}`);
    }
  };

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();

    // 선택된 부서와 그 하위 부서 ID들을 모두 추출 (타입 호환성을 위해 Number 사용)
    const getAllChildDeptIds = (deptId: number, allDepts: Department[]): number[] => {
      let ids = [deptId];
      const children = allDepts.filter(d => d.parent_department_id !== null && Number(d.parent_department_id) === deptId);
      children.forEach(child => {
        ids = [...ids, ...getAllChildDeptIds(Number(child.id), allDepts)];
      });
      return ids;
    };

    const allowedDeptIds = selectedDept === "all"
      ? null
      : getAllChildDeptIds(Number(selectedDept), departments);

    return users.filter(user => {
      const matchesSearch =
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.username?.toLowerCase().includes(term);

      const userDeptId = user.department_id ? Number(user.department_id) : null;
      const matchesDept = !allowedDeptIds || (userDeptId !== null && allowedDeptIds.includes(userDeptId));

      return matchesSearch && matchesDept;
    });
  }, [users, searchTerm, selectedDept, departments]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDept]);

  const departmentOptions = useMemo(() => {
    const buildHierarchy = (depts: Department[], parentId: number | null = null, level = 0): { value: string; label: string }[] => {
      const result: { value: string; label: string }[] = [];
      const children = depts.filter(d => d.parent_department_id === parentId);

      // Sort by display order or name if needed (optional but good for consistency)
      // children.sort(...) 

      children.forEach(dept => {
        // (주) 위엠비 숨기기 로직
        if (level === 0 && (dept.name === '(주) 위엠비' || dept.name === '(주)위엠비')) {
          // Skip this node but process its children at level 0
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

  const handleEmailChange = (email: string) => {
    setFormData(prev => {
      const updates: any = { email };
      // 신규 등록 모드에서 이메일을 입력할 때만 아이디 자동 완성
      if (!isEditMode && email.includes('@')) {
        const usernamePart = email.split('@')[0];
        updates.username = usernamePart;
      }
      return { ...prev, ...updates };
    });
  };

  const parseLocalDate = (dateStr: string | null) => {
    if (!dateStr) return undefined;
    // YYYY-MM-DD 형식만 있는 경우 로컬 시간으로 변환
    if (dateStr.length === 10) {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    // 그 외 ISO 형식 등은 기본 Date 생성자 사용 (로컬 시간으로 자동 변환됨)
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : date;
  };

  const handleAddressSearch = () => {
    if (window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: (data: any) => {
          setFormData(prev => ({
            ...prev,
            postcode: data.zonecode,
            address: data.address,
            address_detail: ""
          }));
        }
      }).open();
    } else {
      alert("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  const getRoleIcon = (roleName: string) => {
    const name = (roleName || "").toLowerCase();
    if (name.includes("관리자") || name.includes("admin")) return <Shield size={10} className="mr-1" />;
    if (name.includes("pm") || name.includes("매니저")) return <UserCog size={10} className="mr-1" />;
    if (name.includes("개발") || name.includes("dev")) return <CodeIcon size={10} className="mr-1" />;
    if (name.includes("디자인") || name.includes("ux")) return <PenTool size={10} className="mr-1" />;
    if (name.includes("기획") || name.includes("plan")) return <Layout size={10} className="mr-1" />;
    if (name.includes("영업") || name.includes("sale")) return <Monitor size={10} className="mr-1" />;
    if (name.includes("고객") || name.includes("cs")) return <Headphones size={10} className="mr-1" />;
    return <UserIcon size={10} className="mr-1" />;
  };

  const getRoleBadgeStyle = (roleName: string, isPrimary: boolean) => {
    const name = (roleName || "").toLowerCase();
    if (name.includes("admin") || name.includes("관리자")) return "bg-purple-100 text-purple-700 shadow-sm shadow-purple-100/50";
    if (name.includes("pm") || name.includes("manager") || name.includes("팀장")) return "bg-blue-100 text-blue-700 shadow-sm shadow-blue-100/50";
    if (name.includes("dev") || name.includes("개발")) return "bg-cyan-100 text-cyan-700 shadow-sm shadow-cyan-100/50";
    if (name.includes("consultant") || name.includes("컨설턴트")) return "bg-amber-100 text-amber-700 shadow-sm shadow-amber-100/50";
    if (name.includes("sales") || name.includes("영업")) return "bg-rose-100 text-rose-700 shadow-sm shadow-rose-100/50";
    if (name.includes("design") || name.includes("디자인") || name.includes("ux")) return "bg-pink-100 text-pink-700 shadow-sm shadow-pink-100/50";

    return isPrimary ? "bg-primary/10 text-primary shadow-sm shadow-primary/10" : "bg-slate-100 text-slate-600 opacity-80";
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            사용자 관리
          </h1>
        </div>
        <Button
          onClick={(e) => handleOpenPanel(undefined, e)}
          variant="primary"
          className="h-11 px-6"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          사용자
        </Button>
      </div>

      <div className="flex items-center gap-x-4 mx-1">
        <SearchInput
          placeholder="이름, 이메일, 아이디로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <div className="w-64">
          <Dropdown
            value={selectedDept}
            onChange={(val) => setSelectedDept(val as string)}
            options={[{ value: "all", label: "전체 부서" }, ...departmentOptions]}
            placeholder="부서 필터"
            variant="standard"
          />
        </div>
      </div>

      <div className="neo-light-card overflow-hidden border border-border/40">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-sm font-medium text-muted-foreground">데이터를 불러오고 있습니다...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-40 text-center">
            <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
              <FolderOpen className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-medium text-foreground">조회된 사용자가 없습니다</p>
              <p className="text-sm text-muted-foreground">검색어를 변경하거나 신규 사용자를 등록하세요</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar-main">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="px-8 py-3 text-sm text-slate-900 text-left">아이디</TableHead>
                  <TableHead className="px-8 py-3 text-sm text-slate-900 text-left">성명</TableHead>
                  <TableHead className="px-8 py-3 text-sm text-slate-900 text-left">직급</TableHead>
                  <TableHead className="px-8 py-3 text-sm text-slate-900 text-left">등급</TableHead>
                  <TableHead className="px-8 py-3 text-sm text-slate-900 text-left">부서</TableHead>
                  <TableHead className="px-8 py-3 text-sm text-slate-900 text-left">전화</TableHead>
                  <TableHead className="px-8 py-3 text-sm text-slate-900 text-left">이메일</TableHead>
                  <TableHead className="px-8 py-3 text-sm text-slate-900 text-left">역할</TableHead>
                  <TableHead className="px-8 py-3 text-sm text-slate-900 text-center">상태</TableHead>
                  <TableHead className="px-8 py-3 text-sm text-slate-900 text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/10">
                {paginatedUsers.map((user: User) => (
                  <TableRow key={user.id} className="hover:bg-primary/[0.02] transition-colors group">
                    <TableCell className="whitespace-nowrap px-8 py-3">
                      <span className="text-sm text-slate-600 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/10">
                        {user.username || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-8 py-3">
                      <div className="text-sm text-slate-900">
                        {user.name}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-8 py-3">
                      <div className="text-sm text-slate-900">{user.rank_name || "-"}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-8 py-3">
                      <div className="text-sm text-slate-900">{user.grade || "-"}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-8 py-3">
                      <div className="text-sm text-slate-900">
                        {user.department_name ? (
                          <button
                            onClick={() => window.location.href = `/settings/departments?id=${user.department_id}`}
                            className="hover:text-primary hover:underline transition-colors text-left"
                            title="부서 관리로 이동"
                          >
                            {user.department_name}
                          </button>
                        ) : "-"}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-8 py-3">
                      <div className="text-sm text-slate-600">{user.phone || "-"}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-8 py-3">
                      <div className="text-sm text-slate-600">{user.email || "-"}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-8 py-3">
                      <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <span
                              key={role.id}
                              className={cn(
                                "pastel-badge",
                                getRoleBadgeStyle(role.name, role.is_primary)
                              )}
                              title={role.is_primary ? "Core Responsibility" : ""}
                            >
                              {getRoleIcon(role.name)}
                              {role.name}
                            </span>
                          ))
                        ) : user.role_name ? (
                          <span className={cn(
                            "pastel-badge",
                            getRoleBadgeStyle(user.role_name, false)
                          )}>
                            {getRoleIcon(user.role_name)}
                            {user.role_name}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-8 py-3 text-center">
                      <span
                        className={`pastel-badge ${user.status === "active"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-muted text-muted-foreground opacity-50 grayscale"
                          }`}
                      >
                        {user.status === "active" ? "활성" : "비활성"}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-8 py-3 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transition-transform">
                        <button
                          onClick={(e) => handleOpenPanel(user, e)}
                          className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                          title="수정"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          className="p-1.5 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90"
                          title="삭제"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="bg-muted/30 px-8 py-3 border-t border-border/20 flex items-center justify-center relative min-h-[56px]">
          <div className="absolute left-8 flex items-center gap-6">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOTAL : <span className="text-primary ml-1">{filteredUsers.length}</span></div>

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
                {[10, 20, 30, 50, 100].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-border/40 hover:bg-white disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs transition-all",
                      currentPage === page
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "text-muted-foreground hover:bg-white hover:text-foreground"
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-border/40 hover:bg-white disabled:opacity-30 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <DraggablePanel
        open={isPanelOpen}
        onOpenChange={setIsPanelOpen}
        triggerRect={triggerRect}
        title={isEditMode ? "사용자 정보 수정" : "신규 사용자 등록"}
        description="사용자의 계정 정보, 소속 및 권한을 관리합니다."
        className="max-w-5xl"
      >
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="space-y-2">
            {/* Row 1: 성명, 아이디, 이메일 */}
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">성명 <span className="text-primary">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder=""
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400">아이디 (자동 생성)</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  readOnly
                  disabled
                  placeholder="이메일 입력 시 자동 생성"
                  className="w-full rounded-md border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed outline-none focus:ring-0"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-bold text-gray-500">이메일 <span className="text-primary">*</span></label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="user@wemb.co.kr"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                />
              </div>
            </div>

            {/* Row 2: 사번, 상태, 입사일, 퇴사일 */}
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">사원번호</label>
                <input
                  type="text"
                  value={formData.employee_number}
                  onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                  placeholder=""
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">상태</label>
                <Dropdown
                  value={formData.user_state}
                  onChange={(val) => setFormData({ ...formData, user_state: val as string })}
                  options={[
                    { value: "정규직", label: "정규직" },
                    { value: "계약직", label: "계약직" },
                    { value: "프리랜서", label: "프리랜서" },
                  ]}
                  placeholder="상태 선택"
                  variant="standard"
                />
              </div>
              <DatePicker
                label="입사일"
                date={parseLocalDate(formData.joined_date)}
                setDate={(date) => {
                  if (!date) {
                    setFormData({ ...formData, joined_date: null });
                    return;
                  }
                  const y = date.getFullYear();
                  const m = String(date.getMonth() + 1).padStart(2, '0');
                  const d = String(date.getDate()).padStart(2, '0');
                  setFormData({ ...formData, joined_date: `${y}-${m}-${d}` });
                }}
              />
              <DatePicker
                label="퇴사일"
                date={parseLocalDate(formData.resignation_date)}
                setDate={(date) => {
                  if (!date) {
                    setFormData({ ...formData, resignation_date: null });
                    return;
                  }
                  const y = date.getFullYear();
                  const m = String(date.getMonth() + 1).padStart(2, '0');
                  const d = String(date.getDate()).padStart(2, '0');
                  setFormData({ ...formData, resignation_date: `${y}-${m}-${d}` });
                }}
              />
            </div>

            {/* Row 3: 부서(2칸), 직급, 직책 */}
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-bold text-gray-500">부서</label>
                <Dropdown
                  value={formData.department_id}
                  onChange={(val) => setFormData({ ...formData, department_id: val as string })}
                  options={departmentOptions}
                  placeholder="소속 선택"
                  variant="standard"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">직급</label>
                <Dropdown
                  value={formData.rank_id}
                  onChange={(val) => {
                    const rankId = val as string;
                    const rank = positions.find(p => p.id.toString() === rankId);
                    let autoGrade = formData.grade;

                    if (rank) {
                      let targetLevel = "";
                      if (rank.name.includes("사원") || rank.name.includes("책임(A)")) targetLevel = "초급";
                      else if (rank.name.includes("책임(M)")) targetLevel = "중급";
                      else if (rank.name.includes("수석(S)") || rank.name.includes("수석(L)")) targetLevel = "고급";
                      else if (["이사", "상무", "전무", "부사장", "사장"].some(title => rank.name.includes(title))) targetLevel = "특급";

                      if (targetLevel) {
                        const matchedGrade = grades.find(g => g.name.includes(targetLevel));
                        if (matchedGrade) autoGrade = matchedGrade.name;
                      }
                    }
                    setFormData({ ...formData, rank_id: rankId, grade: autoGrade });
                  }}
                  options={positions.map(p => ({ value: p.id.toString(), label: p.name }))}
                  placeholder="직급 선택"
                  variant="standard"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">직책</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder=""
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                />
              </div>
            </div>

            {/* Row 4: 전화번호, 계약구분, 등급, 사용 여부 */}
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">전화번호</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                  placeholder="010-0000-0000"
                  maxLength={13}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">계약구분</label>
                <Dropdown
                  value={formData.contract_type}
                  onChange={(val) => setFormData({ ...formData, contract_type: val as string })}
                  options={[
                    { value: "자사", label: "자사" },
                    { value: "외주", label: "외주" },
                  ]}
                  placeholder="구분 선택"
                  variant="standard"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">등급</label>
                <Dropdown
                  value={formData.grade}
                  onChange={(val) => setFormData({ ...formData, grade: val as string })}
                  options={[
                    { value: "", label: "등급 선택" },
                    ...grades.map(g => ({ value: g.name, label: g.name }))
                  ]}
                  placeholder="등급 선택"
                  variant="standard"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">사용 여부</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'active' })}
                    className={cn(
                      "px-3 rounded-xl text-xs font-bold border transition-all h-10 flex-1 shadow-sm",
                      formData.status === 'active'
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-emerald-200 shadow-md"
                        : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                    )}
                  >
                    사용
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'inactive' })}
                    className={cn(
                      "px-3 rounded-xl text-xs font-bold border transition-all h-10 flex-1 shadow-sm",
                      formData.status === 'inactive'
                        ? "bg-rose-500 border-rose-500 text-white shadow-rose-200 shadow-md"
                        : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                    )}
                  >
                    중지
                  </button>
                </div>
              </div>
            </div>

            {/* Row 5: 우편번호, 주소 */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">주소</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={formData.postcode}
                  onClick={handleAddressSearch}
                  placeholder="우편번호"
                  className="w-24 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none cursor-pointer"
                />
                <input
                  type="text"
                  readOnly
                  value={formData.address}
                  onClick={handleAddressSearch}
                  placeholder="주소 검색"
                  className="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none cursor-pointer"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9 px-4 text-xs"
                  onClick={handleAddressSearch}
                >
                  주소 찾기
                </Button>
              </div>
            </div>

            {/* Row 6: 상세 주소 */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">상세 주소</label>
              <input
                type="text"
                value={formData.address_detail}
                onChange={(e) => setFormData({ ...formData, address_detail: e.target.value })}
                placeholder="상세 주소 입력"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none transition-all focus:ring-2 focus:ring-gray-900 focus:ring-offset-0"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500">역할</label>
              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-3 rounded-md border border-gray-200 bg-gray-50/50">
                {roles.map((role) => {
                  const roleIdNum = Number(role.id);
                  const isChecked = formData.role_ids.includes(roleIdNum);
                  return (
                    <label
                      key={role.id}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 cursor-pointer border transition-all",
                        isChecked ? "bg-white border-gray-900 shadow-sm" : "bg-transparent border-transparent hover:bg-white"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, role_ids: [...formData.role_ids, roleIdNum] });
                          } else {
                            setFormData({ ...formData, role_ids: formData.role_ids.filter(id => id !== roleIdNum) });
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                      />
                      <span className="text-xs font-medium">{role.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {!isEditMode && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-gray-50 border border-gray-100">
                <input
                  id="must-change"
                  type="checkbox"
                  checked={formData.must_change_password}
                  onChange={(e) => setFormData({ ...formData, must_change_password: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <label htmlFor="must-change" className="text-xs font-medium text-gray-700 cursor-pointer">
                  처음 접속 시 비밀번호 변경 필수
                </label>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="ghost" type="button" onClick={handleClosePanel}>
              취소
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting} className="px-8 min-w-[120px]">
              <Plus className="h-4 w-4 mr-2" />
              {isEditMode ? "변경사항 저장" : "사용자 등록"}
            </Button>
          </div>
        </form>
      </DraggablePanel>

      <Script
        src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="lazyOnload"
      />
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center p-20">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <UsersContent />
    </Suspense>
  );
}

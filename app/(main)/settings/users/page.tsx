"use client";

import { useState, useEffect } from "react";
import {
  Users as UsersIcon,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Save,
} from "lucide-react";

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
  must_change_password: boolean;
}

interface Department {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
}

interface Rank {
  id: number;
  code: string;
  name: string;
  display_order: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    employee_number: "",
    phone: "",
    department_id: "",
    role_ids: [] as number[],
    rank_id: "",
    grade: "",
    title: "",
    status: "active",
    must_change_password: true,
  });

  // 등급 목록 (인력단가표와 동일)
  const GRADES = [
    "개_특",
    "개_고",
    "개_중",
    "개_초",
    "컨_특",
    "컨_고",
    "컨_중",
    "컨_초",
  ];

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchRoles();
    fetchRanks();
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

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles");
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const fetchRanks = async () => {
    try {
      const response = await fetch("/api/ranks");
      if (response.ok) {
        const data = await response.json();
        setRanks(data.ranks || []);
      }
    } catch (error) {
      console.error("Error fetching ranks:", error);
    }
  };

  const handleOpenModal = (user?: User) => {
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
        must_change_password: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
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
      must_change_password: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          must_change_password: formData.must_change_password,
          // 신규 사용자일 경우 초기 패스워드는 username과 동일하게 설정
          password: !isEditMode ? formData.username : undefined,
        }),
      });

      if (response.ok) {
        handleCloseModal();
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
        alert(`삭제 실패: ${error.message || "알 수 없는 오류"}`);
      }
    } catch (error: any) {
      console.error("Error deleting user:", error);
      alert(`삭제 실패: ${error.message}`);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            사용자 관리
          </h1>
          <p className="mt-1.5 text-sm font-medium text-muted-foreground opacity-70">
            System User Management & Authorization Nodes
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2.5 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary/25 active:scale-95 transition-all duration-300"
        >
          <Plus className="h-4 w-4" />
          신규 사용자 등록
        </button>
      </div>

      {/* 검색 및 필터 컨테이너 */}
      <div className="relative group mx-1">
        <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <input
          type="text"
          placeholder="이름, 이메일, 아이디로 정밀 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-[1.5rem] bg-white border border-border/40 py-5 pl-14 pr-8 text-base font-semibold shadow-sm focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 focus:outline-none transition-all duration-300"
        />
        <div className="absolute right-6 top-1/2 -translate-y-1/2">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted px-2 py-1 rounded-md opacity-50">Search Node</span>
        </div>
      </div>

      {/* 사용자 목록 */}
      <div className="neo-light-card overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-sm font-bold text-muted-foreground animate-pulse tracking-widest">SYNCHRONIZING USERS...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-muted/5">
            <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
              <UsersIcon className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <p className="text-base font-bold text-muted-foreground/50 italic tracking-tight">해당 조건의 노드를 찾을 수 없습니다</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar-main">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border/40">
                  <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                    User Node / Profile
                  </th>
                  <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                    Identifier
                  </th>
                  <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                    Connectivity
                  </th>
                  <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70 border-l border-border/10">
                    Positional Info
                  </th>
                  <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                    Assigns
                  </th>
                  <th className="px-6 py-5 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                    Status
                  </th>
                  <th className="relative px-8 py-5">
                    <span className="sr-only">Operations</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-primary/[0.02] transition-colors group">
                    <td className="whitespace-nowrap px-8 py-5">
                      <div className="flex items-center">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-black text-white shadow-md shadow-primary/20 rotate-3 group-hover:rotate-0 transition-transform">
                          {user.name[0]}
                        </div>
                        <div className="ml-4">
                          <div className="text-base font-bold text-foreground tracking-tight">
                            {user.name}
                          </div>
                          <div className="text-[10px] font-black text-muted-foreground opacity-50 uppercase tracking-widest mt-0.5">
                            {user.employee_number || "NO-EMS-ID"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-5">
                      <span className="text-sm font-semibold text-foreground/80 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/10">
                        {user.username || "-"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-5">
                      <div className="text-sm font-semibold text-foreground/80">{user.email}</div>
                      <div className="text-[10px] font-medium text-muted-foreground mt-0.5">{user.phone || "-"}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 border-l border-border/10">
                      <div className="text-sm font-bold text-foreground/80">{user.rank_name || "-"}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black text-muted-foreground/60 uppercase">{user.department_name || "UNASSIGNED"}</span>
                        {user.grade && <span className="text-[9px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded font-black">{user.grade}</span>}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-5">
                      <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <span
                              key={role.id}
                              className={`pastel-badge ${role.is_primary
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground opacity-70"
                                }`}
                              title={role.is_primary ? "Core Responsibility" : ""}
                            >
                              {role.name}
                            </span>
                          ))
                        ) : user.role_name ? (
                          <span className="pastel-badge bg-muted text-muted-foreground opacity-70">
                            {user.role_name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40 text-[10px] font-bold italic tracking-widest">N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-center">
                      <span
                        className={`pastel-badge ${user.status === "active"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-muted text-muted-foreground opacity-50 grayscale"
                          }`}
                      >
                        {user.status === "active" ? "OPERATIONAL" : "OFFLINE"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transition-transform">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                          title="Modify Node"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90"
                          title="Purge Node"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="bg-muted/30 px-8 py-5 border-t border-border/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] opacity-60">Global Registry Index</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <div className="text-xs font-bold text-foreground/60 tracking-tight">TOTAL AGENTS: <span className="text-primary font-black ml-1">{filteredUsers.length} Units</span></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">System Synchronized</span>
          </div>
        </div>
      </div>

      {/* 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
            onClick={handleCloseModal}
          />
          <div className="relative z-10 w-full max-w-3xl neo-light-card bg-white p-0 border-white/60 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between px-10 py-8 border-b border-border/30 bg-muted/5">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 transition-transform hover:rotate-12">
                  <UsersIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground tracking-tight">
                    {isEditMode ? "User Integrity Revision" : "New Agent Initialization"}
                  </h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">Configuration & Permissions Matrix</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-3 rounded-2xl bg-muted/30 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-10 py-10">
              <div className="space-y-10">
                <div className="grid grid-cols-2 gap-8">
                  <div className="relative group/field">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase mb-2.5 block ml-1 tracking-widest opacity-60 group-focus-within/field:text-primary transition-colors">
                      Full Name / 실명 <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full bg-muted/20 border-transparent rounded-[1.25rem] px-6 py-4 text-base font-semibold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all duration-300"
                      placeholder="입력 필요..."
                    />
                  </div>
                  <div className="relative group/field">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase mb-2.5 block ml-1 tracking-widest opacity-60 group-focus-within/field:text-primary transition-colors">
                      Network ID / 아이디 <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      disabled={isEditMode}
                      className="w-full bg-muted/20 border-transparent rounded-[1.25rem] px-6 py-4 text-base font-semibold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all duration-300 disabled:opacity-50 disabled:grayscale-[0.5]"
                      placeholder="입력 필요..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="relative group/field">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase mb-2.5 block ml-1 tracking-widest opacity-60 group-focus-within/field:text-primary transition-colors">
                      Primary Email / 이메일 <span className="text-primary">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full bg-muted/20 border-transparent rounded-[1.25rem] px-6 py-4 text-base font-semibold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all duration-300"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="relative group/field">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase mb-2.5 block ml-1 tracking-widest opacity-60 group-focus-within/field:text-primary transition-colors">
                      Employee Serial / 사원번호
                    </label>
                    <input
                      type="text"
                      value={formData.employee_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          employee_number: e.target.value,
                        })
                      }
                      className="w-full bg-muted/20 border-transparent rounded-[1.25rem] px-6 py-4 text-base font-semibold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all duration-300"
                      placeholder="WEMB-XXXX"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="relative group/field">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase mb-2.5 block ml-1 tracking-widest opacity-60 group-focus-within/field:text-primary transition-colors">
                      Department / 부서 소속
                    </label>
                    <select
                      value={formData.department_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          department_id: e.target.value,
                        })
                      }
                      className="w-full bg-muted/20 border-transparent rounded-[1.25rem] px-6 py-4 text-base font-semibold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all duration-300 appearance-none"
                    >
                      <option value="">소속 선택</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative group/field">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase mb-2.5 block ml-1 tracking-widest opacity-60 group-focus-within/field:text-primary transition-colors">
                      Rank Node / 직급
                    </label>
                    <select
                      value={formData.rank_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rank_id: e.target.value,
                        })
                      }
                      className="w-full bg-muted/20 border-transparent rounded-[1.25rem] px-6 py-4 text-base font-semibold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all duration-300 appearance-none"
                    >
                      <option value="">직급 선택</option>
                      {ranks
                        .sort((a, b) => a.display_order - b.display_order)
                        .map((rank) => (
                          <option key={rank.id} value={rank.id}>
                            {rank.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-10 pt-4">
                  <div className="space-y-8">
                    <div className="relative group/field">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase mb-2.5 block ml-1 tracking-widest opacity-60 group-focus-within/field:text-primary transition-colors">
                        Protocol Role / 직책
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        className="w-full bg-muted/20 border-transparent rounded-[1.25rem] px-6 py-4 text-base font-semibold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all duration-300"
                        placeholder="EX: 팀장, 본부장"
                      />
                    </div>

                    <div className="relative group/field">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase mb-2.5 block ml-1 tracking-widest opacity-60 group-focus-within/field:text-primary transition-colors">
                        Expertise Grade / 등급
                      </label>
                      <select
                        value={formData.grade}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            grade: e.target.value,
                          })
                        }
                        className="w-full bg-muted/20 border-transparent rounded-[1.25rem] px-6 py-4 text-base font-semibold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all duration-300 appearance-none"
                      >
                        <option value="">등급 선택</option>
                        {GRADES.map((grade) => (
                          <option key={grade} value={grade}>
                            {grade}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="relative group/field">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase mb-2.5 block ml-1 tracking-widest opacity-60 group-focus-within/field:text-primary transition-colors">
                        Contact Number / 전화번호
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full bg-muted/20 border-transparent rounded-[1.25rem] px-6 py-4 text-base font-semibold text-foreground focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all duration-300"
                        placeholder="010-XXXX-XXXX"
                      />
                    </div>

                    <div className="relative group/field">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase mb-2.5 block ml-1 tracking-widest opacity-60 group-focus-within/field:text-primary transition-colors">
                        Registry Status / 상태
                      </label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {['active', 'inactive'].map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setFormData({ ...formData, status })}
                            className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${formData.status === status
                              ? "bg-primary text-white border-transparent shadow-md shadow-primary/20"
                              : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted"
                              }`}
                          >
                            {status === 'active' ? 'OPERATIONAL' : 'OFFLINE'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground uppercase mb-3 block ml-1 tracking-widest opacity-60 transition-colors">
                      Assignment Matrix / 권한 설정
                    </label>
                    <div className="max-h-[20rem] overflow-y-auto rounded-[1.5rem] bg-muted/10 border border-border/10 p-5 custom-scrollbar">
                      {roles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 opacity-30">
                          <span className="text-xs font-bold italic">NO ROLES DEFINED</span>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {roles.map((role) => {
                            const roleIdNum = Number(role.id);
                            const isChecked = formData.role_ids.includes(roleIdNum);
                            return (
                              <label
                                key={role.id}
                                className={`flex items-center gap-4 rounded-2xl px-5 py-4 cursor-pointer transition-all border-2 ${isChecked
                                  ? "bg-primary/5 border-primary shadow-sm"
                                  : "bg-white border-transparent hover:bg-white hover:shadow-md"
                                  }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({
                                        ...formData,
                                        role_ids: [...formData.role_ids, roleIdNum],
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        role_ids: formData.role_ids.filter(
                                          (id) => id !== roleIdNum
                                        ),
                                      });
                                    }
                                  }}
                                  className="h-5 w-5 rounded-lg border-muted-foreground/30 text-primary focus:ring-primary/20 transition-all"
                                />
                                <span className={`text-sm font-bold tracking-tight ${isChecked
                                  ? "text-primary"
                                  : "text-foreground/70"
                                  }`}>
                                  {role.name}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {formData.role_ids.length > 0 && (
                      <p className="mt-3 text-[10px] font-black text-primary uppercase tracking-[0.2em] px-2 opacity-80 animate-pulse">
                        ✓ {formData.role_ids.length} Matrix Interlinkages Active
                      </p>
                    )}
                  </div>
                </div>

                {!isEditMode && (
                  <div className="bg-primary/5 p-6 rounded-[1.25rem] border border-primary/10 transition-all hover:bg-primary/10 group">
                    <label className="flex items-center gap-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.must_change_password}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            must_change_password: e.target.checked,
                          })
                        }
                        className="h-6 w-6 rounded-lg border-primary/30 text-primary focus:ring-primary/20 transition-all"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-primary tracking-tight">처음 접속 시 비밀번호 변경 필수</span>
                        <span className="text-[10px] font-medium text-primary/60 uppercase">Mandatory Credential Reset on Initialization</span>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-6 mt-16 pt-8 border-t border-border/20">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-10 py-5 rounded-2xl border-2 border-border/50 text-muted-foreground font-bold hover:bg-muted/50 transition-all active:scale-[0.98]"
                >
                  ABORT
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] px-10 py-5 rounded-2xl bg-primary text-white font-bold text-lg hover:translate-y-[-1px] hover:shadow-2xl hover:shadow-primary/30 active:scale-[0.95] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "COMMITING..." : isEditMode ? "PUSH UPDATES" : "INITIALIZE NODE"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

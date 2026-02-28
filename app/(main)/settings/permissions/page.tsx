"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Shield, Check, Minus, ChevronRight, Save, AlertCircle } from "lucide-react";
import {
    Button,
    useToast,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell
} from "@/components/ui";
import { cn } from "@/lib/utils";

interface RoleCode {
    code: string;
    name: string;
    display_order: number;
}

interface MenuItem {
    id?: number;
    menuKey: string;
    label: string;
    level: 1 | 2;
    group: string | null;
    displayOrder: number;
}

interface Permission {
    menu_key: string;
    can_access: boolean;
    can_create: boolean;
    can_update: boolean;
    can_delete: boolean;
}

type PermissionMap = Record<string, Permission>;

const ACTION_KEYS: Array<{ key: keyof Permission; label: string }> = [
    { key: "can_access", label: "접근" },
    { key: "can_create", label: "추가" },
    { key: "can_update", label: "수정" },
    { key: "can_delete", label: "삭제" },
];

export default function PermissionsPage() {
    const { showToast, confirm } = useToast();

    const [roles, setRoles] = useState<RoleCode[]>([]);
    const [menus, setMenus] = useState<MenuItem[]>([]);
    const [selectedRole, setSelectedRole] = useState<RoleCode | null>(null);
    const [permMap, setPermMap] = useState<PermissionMap>({});
    const [savedMap, setSavedMap] = useState<PermissionMap>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const isDirty = JSON.stringify(permMap) !== JSON.stringify(savedMap);

    // 역할 목록 로드 (공통코드 CD_001_04)
    useEffect(() => {
        fetch("/api/common-codes?parentCode=CD_001_04")
            .then((r) => r.json())
            .then((data) => {
                setRoles(data.codes || []);
            });
    }, []);

    // 메뉴 마스터 로드
    useEffect(() => {
        fetch("/api/permissions")
            .then((r) => r.json())
            .then((data) => {
                setMenus(data.menus || []);
            });
    }, []);

    // 역할 선택 시 권한 로드
    const loadPermissions = useCallback(async (role: RoleCode) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/permissions/${encodeURIComponent(role.code)}`);
            const data = await res.json();
            const map: PermissionMap = {};
            (data.permissions || []).forEach((p: Permission) => {
                map[p.menu_key] = p;
            });
            setPermMap(map);
            setSavedMap(map);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSelectRole = (role: RoleCode) => {
        if (isDirty) {
            confirm({
                message: "저장하지 않은 변경사항이 있습니다. 역할을 바꾸면 변경사항이 사라집니다. 계속하시겠습니까?",
                title: "변경사항 확인",
                onConfirm: () => {
                    setSelectedRole(role);
                    loadPermissions(role);
                },
            });
        } else {
            setSelectedRole(role);
            loadPermissions(role);
        }
    };

    // level-1 <-> level-2 관계 맵 (트리 cascade + 상향 동기화 용)
    const { childrenMap, parentMap } = useMemo(() => {
        const labelToKey: Record<string, string> = {};
        menus.filter((m) => m.level === 1).forEach((m) => { labelToKey[m.label] = m.menuKey; });
        const cMap: Record<string, string[]> = {};
        const pMap: Record<string, string> = {}; // childKey → parentKey
        menus.filter((m) => m.level === 2).forEach((m) => {
            if (m.group) {
                const parentKey = labelToKey[m.group];
                if (parentKey) {
                    (cMap[parentKey] ??= []).push(m.menuKey);
                    pMap[m.menuKey] = parentKey;
                }
            }
        });
        return { childrenMap: cMap, parentMap: pMap };
    }, [menus]);

    const defaultPerm = (key: string): Permission => ({ menu_key: key, can_access: false, can_create: false, can_update: false, can_delete: false });

    // 자식 상태로부터 부모 permMap 에트리 재계산
    const syncParent = (next: PermissionMap, parentKey: string) => {
        const siblings = childrenMap[parentKey] ?? [];
        if (siblings.length === 0) return;
        type BoolKey = "can_access" | "can_create" | "can_update" | "can_delete";
        const BOOL_KEYS: BoolKey[] = ["can_access", "can_create", "can_update", "can_delete"];
        const parentEntry: Permission = { ...(next[parentKey] ?? defaultPerm(parentKey)) };
        for (const ak of BOOL_KEYS) {
            parentEntry[ak] = siblings.every((k) => (next[k] ?? defaultPerm(k))[ak]);
        }
        next[parentKey] = parentEntry;
    };

    const handleToggle = (menuKey: string, actionKey: keyof Permission, value: boolean) => {
        setPermMap((prev) => {
            const applyRule = (key: string, base: Permission, ak: keyof Permission, val: boolean): Permission => {
                let next = { ...base, [ak]: val };
                if (ak === "can_access" && !val) next = { ...next, can_create: false, can_update: false, can_delete: false };
                if (ak !== "can_access" && val) next = { ...next, can_access: true };
                return next;
            };

            const current = prev[menuKey] ?? defaultPerm(menuKey);
            const next: PermissionMap = { ...prev, [menuKey]: applyRule(menuKey, current, actionKey, value) };

            // 1레벨 → 하위 자식 cascade
            for (const childKey of childrenMap[menuKey] ?? []) {
                next[childKey] = applyRule(childKey, prev[childKey] ?? defaultPerm(childKey), actionKey, value);
            }

            // 2레벨 → 부모 상향 동기화 (모두 해제되면 부모도 해제, 일부면 부분 상태)
            const parentKey = parentMap[menuKey];
            if (parentKey) syncParent(next, parentKey);

            return next;
        });
    };

    const handleToggleAll = (menuKey: string, allChecked: boolean) => {
        const newVal = !allChecked;
        setPermMap((prev) => {
            const next: PermissionMap = {
                ...prev,
                [menuKey]: { menu_key: menuKey, can_access: newVal, can_create: newVal, can_update: newVal, can_delete: newVal },
            };
            // 1레벨 항목이면 children cascade
            for (const childKey of childrenMap[menuKey] ?? []) {
                next[childKey] = { menu_key: childKey, can_access: newVal, can_create: newVal, can_update: newVal, can_delete: newVal };
            }
            // 2레벨이면 부모 상향 동기화
            const parentKey = parentMap[menuKey];
            if (parentKey) syncParent(next, parentKey);
            return next;
        });
    };

    const handleSave = async () => {
        if (!selectedRole) return;
        setSaving(true);
        try {
            const permissions = menus.map((m) => ({
                menu_key: m.menuKey,
                can_access: permMap[m.menuKey]?.can_access ?? false,
                can_create: permMap[m.menuKey]?.can_create ?? false,
                can_update: permMap[m.menuKey]?.can_update ?? false,
                can_delete: permMap[m.menuKey]?.can_delete ?? false,
            }));

            const res = await fetch(`/api/permissions/${encodeURIComponent(selectedRole.code)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ permissions }),
            });

            if (res.ok) {
                setSavedMap({ ...permMap });
                showToast(`'${selectedRole.name}' 역할의 권한이 저장되었습니다.`, "success");
            } else {
                showToast("저장에 실패했습니다.", "error");
            }
        } finally {
            setSaving(false);
        }
    };

    // level 1 = 1레벨 (bold 행), level 2 = 2레벨 (들여쓰기 행)

    return (
        <div className="space-y-8">
            {/* 헤더 */}
            <div className="flex items-start justify-between px-2">
                <div>
                    <div className="h-10 flex items-center">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            권한 관리
                        </h1>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* 좌측: 역할 목록 */}
                <aside className="w-full md:w-[270px] shrink-0 neo-light-card overflow-hidden border border-border/40 bg-white sticky top-6 self-start">
                    <div className="px-8 py-5 border-b border-border/10 bg-muted/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Shield size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 tracking-tight">역할 목록</h3>
                                <p className="text-[10px] font-bold text-muted-foreground opacity-50 uppercase tracking-widest leading-none">Roles</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-2">
                        {roles.length === 0 ? (
                            <div className="px-4 py-20 text-center">
                                <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">로딩 중...</p>
                            </div>
                        ) : (
                            roles.map((role) => {
                                const isSelected = selectedRole?.code === role.code;
                                return (
                                    <button
                                        key={role.code}
                                        onClick={() => handleSelectRole(role)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 h-11 rounded-xl transition-all text-sm group relative overflow-hidden mb-1",
                                            isSelected
                                                ? "bg-slate-900 text-white shadow-md shadow-slate-200 font-bold"
                                                : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium"
                                        )}
                                    >
                                        <span className="relative z-10 truncate">{role.name}</span>
                                        {isSelected && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-r-full z-10" />
                                        )}
                                        <ChevronRight className={cn(
                                            "h-3.5 w-3.5 shrink-0 relative z-10 transition-transform",
                                            isSelected ? "text-white translate-x-0" : "text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5"
                                        )} />
                                    </button>
                                );
                            })
                        )}
                    </div>

                    <div className="bg-muted/30 px-8 py-3 border-t border-border/10 flex items-center min-h-[56px]">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOTAL : <span className="text-primary ml-1">{roles.length}</span></div>
                    </div>
                </aside>

                {/* 우측: 권한 매트릭스 */}
                <div className="flex-1 neo-light-card overflow-hidden border border-border/40 bg-white">
                    {/* 우측 헤더 */}
                    <div className="px-8 py-5 border-b border-border/10 bg-muted/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Check size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                                    {selectedRole ? `${selectedRole.name} 권한 설정` : "역할을 선택하세요"}
                                </h3>
                                <p className="text-[10px] font-bold text-muted-foreground opacity-50 uppercase tracking-widest leading-none">Permissions</p>
                            </div>
                            {isDirty && selectedRole && (
                                <span className="flex items-center gap-1 text-sm font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full ml-2">
                                    <AlertCircle className="h-3 w-3" />
                                    변경사항 있음
                                </span>
                            )}
                        </div>
                        {selectedRole && (
                            <button
                                onClick={handleSave}
                                disabled={!isDirty || saving}
                                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 h-9 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
                            >
                                <Save className="h-4 w-4" />
                                {saving ? "저장 중..." : "저장"}
                            </button>
                        )}
                    </div>

                    {/* 매트릭스 테이블 */}
                    {!selectedRole ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4 opacity-40 text-center">
                            <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center">
                                <Shield className="h-10 w-10 text-muted-foreground/30" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-base font-medium text-foreground">역할이 선택되지 않았습니다</p>
                                <p className="text-sm text-muted-foreground">왼쪽 역할 목록에서 역할을 선택하여 권한을 설정하세요</p>
                            </div>
                        </div>
                    ) : loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">권한 로드 중...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="border-collapse divide-y-0">
                                <TableHeader className="bg-muted/30 sticky top-0 z-10 border-b border-border/10">
                                    <TableRow className="h-[46px] border-none">
                                        <TableHead className="px-8 py-0 text-left text-sm text-slate-900 w-[200px] whitespace-nowrap">
                                            메뉴
                                        </TableHead>
                                        {ACTION_KEYS.map(({ key, label }) => (
                                            <TableHead
                                                key={key}
                                                align="center"
                                                className="px-4 py-0 text-sm text-slate-900 w-24 whitespace-nowrap"
                                            >
                                                {label}
                                            </TableHead>
                                        ))}
                                        <TableHead align="center" className="px-4 py-0 text-sm text-slate-900 w-20 whitespace-nowrap">
                                            전체
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-border/10 bg-transparent">
                                    {/* 메뉴 목록: level 1 = 굵은 행 + 체크박스, level 2 = 들여쓰기 행 + 체크박스 */}
                                    {menus.map((menu) => {
                                        const perm = permMap[menu.menuKey];
                                        const isLevel1 = menu.level === 1;
                                        const children = childrenMap[menu.menuKey] ?? [];
                                        const hasChildren = children.length > 0;

                                        // 레벨-1 여부에 따라 체크 상태 계산 (자식이 있으면 자식에서 파생)
                                        const getState = (permKey: keyof Permission) => {
                                            if (!isLevel1 || !hasChildren) {
                                                return { checked: perm?.[permKey] ?? false, partial: false };
                                            }
                                            const n = children.filter((k) => permMap[k]?.[permKey] ?? false).length;
                                            return { checked: n === children.length && n > 0, partial: n > 0 && n < children.length };
                                        };

                                        // 전체(모든 허용) 컨트롤
                                        // "전체 = 자식 중 4개 모두 체크된 자식 수" 기준
                                        const allKeys: Array<keyof Permission> = ["can_access", "can_create", "can_update", "can_delete"];
                                        const getAllState = () => {
                                            if (!isLevel1 || !hasChildren) {
                                                const v = allKeys.every((k) => perm?.[k] ?? false);
                                                return { checked: v, partial: false };
                                            }
                                            // 자식 중 4가지 모두 체크된 것의 수
                                            const fullChildren = children.filter((ck) =>
                                                allKeys.every((k) => permMap[ck]?.[k] ?? false)
                                            ).length;
                                            return {
                                                checked: fullChildren === children.length && children.length > 0,
                                                partial: fullChildren > 0 && fullChildren < children.length,
                                            };
                                        };
                                        const allState = getAllState();

                                        return (
                                            <TableRow
                                                key={menu.menuKey}
                                                className={cn(
                                                    "h-[46px] transition-colors group border-none",
                                                    isLevel1 ? "bg-slate-50/60 font-bold" : "bg-white hover:bg-primary/[0.01]"
                                                )}
                                            >
                                                <TableCell className={cn(
                                                    "px-8 py-0",
                                                    isLevel1 ? "" : "pl-14"
                                                )}>
                                                    <span className={isLevel1
                                                        ? "text-sm font-bold text-slate-900"
                                                        : "text-sm font-medium text-slate-600"
                                                    }>{menu.label}</span>
                                                </TableCell>
                                                {ACTION_KEYS.map(({ key, label }) => {
                                                    const { checked, partial } = getState(key as keyof Permission);
                                                    const disabled = key !== "can_access" && !getState("can_access").checked && !getState("can_access").partial;
                                                    return (
                                                        <TableCell key={key} align="center" className="px-4 py-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => !disabled && handleToggle(menu.menuKey, key as keyof Permission, !checked && !partial)}
                                                                disabled={disabled}
                                                                title={label}
                                                                className={cn(
                                                                    "w-5 h-5 rounded border-2 flex items-center justify-center mx-auto transition-all active:scale-90",
                                                                    disabled
                                                                        ? "border-slate-100 bg-slate-50 cursor-default opacity-40 text-transparent"
                                                                        : checked
                                                                            ? key === "can_access"
                                                                                ? "bg-slate-900 border-slate-900 text-white hover:bg-slate-800"
                                                                                : "bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
                                                                            : partial
                                                                                ? key === "can_access"
                                                                                    ? "bg-indigo-50 border-indigo-200 text-indigo-500"
                                                                                    : "bg-emerald-50 border-emerald-200 text-emerald-500"
                                                                                : "border-slate-200 bg-white hover:border-slate-400 cursor-pointer"
                                                                )}
                                                            >
                                                                {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                                                                {partial && !checked && <Minus className="h-3 w-3" strokeWidth={3} />}
                                                            </button>
                                                        </TableCell>
                                                    );
                                                })}
                                                <TableCell align="center" className="px-4 py-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleAll(menu.menuKey, allState.checked)}
                                                        className={cn(
                                                            "w-5 h-5 rounded border-2 flex items-center justify-center mx-auto transition-all active:scale-90",
                                                            allState.checked
                                                                ? "bg-slate-700 border-slate-700 text-white hover:bg-slate-800 shadow-sm"
                                                                : allState.partial
                                                                    ? "bg-slate-100 border-slate-300 text-slate-500"
                                                                    : "border-slate-200 bg-white hover:border-slate-400 cursor-pointer"
                                                        )}
                                                    >
                                                        {allState.checked && <Check className="h-3 w-3" strokeWidth={3} />}
                                                        {allState.partial && !allState.checked && <Minus className="h-3 w-3" strokeWidth={3} />}
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* 하단 */}
                    {selectedRole && !loading && (
                        <div className="bg-muted/30 px-8 py-3 border-t border-border/10 flex items-center justify-between min-h-[56px]">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-6">
                                <span>TOTAL MENUS : <span className="text-primary ml-1">{menus.length}</span></span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

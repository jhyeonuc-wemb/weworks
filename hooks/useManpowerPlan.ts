import { useState, useEffect, useCallback } from "react";
import type { ManpowerPlanItem, ProjectUnitPrice, Project } from "@/types/profitability";
import { ProfitabilityService } from "@/services/profitability.service";
import {
    mapRankToJobLevel,
    getDefaultGradeByRank,
    determineAffiliationGroup,
} from "@/lib/utils/rank-mapping";

interface User {
    id: number;
    name: string;
    rankName: string;
    departmentName: string;
    grade: string | null;
}

export function useManpowerPlan(
    projectId?: number,
    projectUnitPrices: ProjectUnitPrice[] = [],
    project?: Project | null,
    profitabilityId?: number
) {
    const [items, setItems] = useState<ManpowerPlanItem[]>([
        {
            id: 1,
            projectName: "",
            role: "",
            detailedTask: "",
            companyName: "(주)위엠비",
            affiliationGroup: "",
            wmbRank: "",
            grade: "",
            name: "",
            userId: null,
            monthlyAllocation: {},
            proposedUnitPrice: null,
            proposedAmount: null,
            internalUnitPrice: null,
            internalAmount: null,
        },
    ]);

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [startMonth, setStartMonth] = useState("");
    const [endMonth, setEndMonth] = useState("");

    // 사용자 목록 로딩
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch("/api/users");
                if (!res.ok) return;
                const data = await res.json();
                const fetchedUsers = (data.users || []).map((u: any) => ({
                    id: u.id,
                    name: u.name,
                    rankName: u.rank_name,
                    departmentName: u.department_name,
                    grade: u.grade,
                }));
                setUsers(fetchedUsers);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        fetchUsers();
    }, []);

    // 프로젝트 기간 초기화 (최초 1회 또는 프로젝트 변경 시 초기값이 없을 때만)
    useEffect(() => {
        // 이미 날짜가 설정되어 있다면 (사용자가 수동으로 변경했거나 이미 로드됨) 덮어쓰지 않음
        if (startMonth && endMonth) return;

        if (project?.contractStartDate) {
            const startDate = new Date(project.contractStartDate);
            setStartMonth(
                `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(
                    2,
                    "0"
                )}`
            );

            if (project.contractEndDate) {
                const endDate = new Date(project.contractEndDate);
                setEndMonth(
                    `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(
                        2,
                        "0"
                    )}`
                );
            } else {
                // 종료일이 없으면 시작일 + 11개월
                const end = new Date(startDate);
                end.setMonth(startDate.getMonth() + 11);
                setEndMonth(`${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}`);
            }
        } else if (!startMonth) {
            // 프로젝트 시작일조차 없으면 오늘 날짜 기준으로 초기화
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            setStartMonth(`${year}-${month}`);

            const end = new Date(now);
            end.setMonth(now.getMonth() + 11);
            setEndMonth(`${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}`);
        }
    }, [project, startMonth, endMonth]);

    // 프로젝트별 저장된 인력 계획 로딩
    const loadManpowerPlan = useCallback(async () => {
        if (!projectId) return;
        try {
            setLoading(true);
            const data = await ProfitabilityService.fetchManpowerPlan(projectId, profitabilityId);

            if (data.items && data.items.length > 0) {
                setItems(data.items);
            }
            if (data.analysisStartMonth) {
                setStartMonth(data.analysisStartMonth);
            }
            if (data.analysisEndMonth) {
                setEndMonth(data.analysisEndMonth);
            }
        } catch (error) {
            console.error("Error loading manpower plan:", error);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        loadManpowerPlan();
    }, [loadManpowerPlan, profitabilityId]);

    // ... (rest of the file)



    // 행 추가
    const addRow = useCallback((projectName: string = "") => {
        setItems((prev) => {
            const newId = prev.length > 0 ? Math.max(...prev.map((m) => m.id)) + 1 : 1;
            return [
                ...prev,
                {
                    id: newId,
                    projectName: projectName,
                    role: "",
                    detailedTask: "",
                    companyName: "(주)위엠비",
                    affiliationGroup: "",
                    wmbRank: "",
                    grade: "",
                    name: "",
                    userId: null,
                    monthlyAllocation: {},
                    proposedUnitPrice: null,
                    proposedAmount: null,
                    internalUnitPrice: null,
                    internalAmount: null,
                },
            ];
        });
    }, []);

    // 행 삭제
    const deleteRow = useCallback((id: number) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    }, []);

    // 행 업데이트
    const updateItem = useCallback(
        (
            id: number,
            field: keyof ManpowerPlanItem,
            value: string | number | { [month: string]: number } | null
        ) => {
            setItems((prev) =>
                prev.map((item) => {
                    if (item.id !== id) return item;

                    const updated = { ...item, [field]: value } as ManpowerPlanItem;

                    // 소속 및 직군, 위엠비 직급이 변경되면 내부단가 재매칭 (등급 제외)
                    if (field === "affiliationGroup" || field === "wmbRank") {
                        const matchedUnitPrice = projectUnitPrices.find(
                            (up) =>
                                up.affiliationGroup ===
                                (field === "affiliationGroup"
                                    ? (value as string)
                                    : item.affiliationGroup) &&
                                up.jobLevel === (field === "wmbRank" ? (value as string) : item.wmbRank)
                        );
                        updated.internalUnitPrice = matchedUnitPrice?.internalApplied || null;
                    }

                    // 제안 단가/내부 단가가 변경되면 수동 입력된 금액 초기화 (자동 계산 모드로 전환)
                    if (field === "proposedUnitPrice") {
                        updated.proposedAmount = null;
                    }
                    if (field === "internalUnitPrice" || field === "affiliationGroup" || field === "wmbRank") {
                        updated.internalAmount = null;
                    }

                    return updated;
                })
            );
        },
        [projectUnitPrices]
    );

    // 사용자 선택 시 자동 채우기
    const selectUser = useCallback(
        (
            itemId: number,
            userName: string
        ) => {
            const selectedUser = users.find((u) => u.name === userName);
            if (!selectedUser) {
                // 사용자를 찾지 못하면 이름만 업데이트
                updateItem(itemId, "name", userName);
                return;
            }

            // 직급 매핑
            const jobLevel = mapRankToJobLevel(selectedUser.rankName);

            // 소속 및 직군 결정 (직책 정보가 없으므로 null 전달)
            const affiliationGroup = determineAffiliationGroup(
                selectedUser.departmentName,
                null
            );

            // 등급 결정 (사용자 grade가 있으면 사용, 없으면 rank로부터 추론)
            const grade =
                selectedUser.grade || getDefaultGradeByRank(selectedUser.rankName);

            // 인력단가에서 내부단가 조회 (소속 및 직군 + 직급만으로 매칭)
            const matchedUnitPrice = projectUnitPrices.find(
                (up) =>
                    up.affiliationGroup === affiliationGroup && up.jobLevel === jobLevel
            );

            // 항목 업데이트
            setItems((prev) =>
                prev.map((item) => {
                    if (item.id !== itemId) return item;

                    return {
                        ...item,
                        name: userName,
                        userId: selectedUser.id,
                        affiliationGroup,
                        wmbRank: jobLevel || "",
                        grade: grade || "",
                        internalUnitPrice: matchedUnitPrice?.internalApplied || null,
                    };
                })
            );
        },
        [users, projectUnitPrices, updateItem]
    );

    // 저장
    const saveManpowerPlan = useCallback(async () => {
        if (!projectId) return;

        try {
            setSaving(true);

            // 저장하기 전에 금액 계산 (수동 입력이 있는 경우는 유지, 없는 경우만 자동 계산)
            const itemsWithCalculatedAmounts = items.map(item => {
                const totalMM = Object.values(item.monthlyAllocation || {}).reduce((sum, val) => sum + (val || 0), 0);

                // 내부단가 금액: 수동 입력이 있으면 그것을 사용, 없으면 단가 * M/M으로 계산
                const internalAmount = (item.internalAmount !== null && item.internalAmount !== undefined)
                    ? item.internalAmount
                    : (item.internalUnitPrice && totalMM > 0 ? Math.round(item.internalUnitPrice * totalMM) : null);

                // 제안가 금액: 수동 입력이 있으면 그것을 사용, 없으면 단가 * M/M으로 계산
                const proposedAmount = (item.proposedAmount !== null && item.proposedAmount !== undefined)
                    ? item.proposedAmount
                    : (item.proposedUnitPrice && totalMM > 0 ? Math.round(item.proposedUnitPrice * totalMM) : null);

                return {
                    ...item,
                    internalAmount,
                    proposedAmount
                };
            });

            await ProfitabilityService.saveManpowerPlan(
                projectId,
                itemsWithCalculatedAmounts,
                startMonth,
                endMonth,
                profitabilityId
            );
            return true;
        } catch (error) {
            console.error("Error saving manpower plan:", error);
            throw error;
        } finally {
            setSaving(false);
        }
    }, [projectId, items, startMonth, endMonth]);

    return {
        items,
        users,
        loading,
        saving,
        startMonth,
        setStartMonth,
        endMonth,
        setEndMonth,
        addRow,
        deleteRow,
        updateItem,
        selectUser,
        saveManpowerPlan,
        refresh: loadManpowerPlan,
    };
}

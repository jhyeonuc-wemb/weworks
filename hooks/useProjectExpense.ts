import { useState, useEffect, useCallback, useMemo } from "react";
import type { ProjectExpenseItem, Project, StandardExpense, ManpowerPlanItem } from "@/types/profitability";
import { ProfitabilityService } from "@/services/profitability.service";

export function useProjectExpense(
    projectId: number,
    project: Project | null,
    manpowerPlanItems: ManpowerPlanItem[] = [],
    standardExpenses: StandardExpense[] = []
) {
    const [items, setItems] = useState<ProjectExpenseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasSavedData, setHasSavedData] = useState(false); // 저장된 데이터가 있는지 여부 (Snapshot 모드 확인)

    // 프로젝트 기간 관리 (ManpowerPlanTab과 동일한 로직)
    const [startMonth, setStartMonth] = useState("");
    const [endMonth, setEndMonth] = useState("");

    useEffect(() => {
        if (startMonth && endMonth) return;

        if (project?.contractStartDate) {
            const startDate = new Date(project.contractStartDate);
            setStartMonth(`${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`);

            if (project.contractEndDate) {
                const endDate = new Date(project.contractEndDate);
                setEndMonth(`${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}`);
            } else {
                const end = new Date(startDate);
                end.setMonth(startDate.getMonth() + 11);
                setEndMonth(`${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}`);
            }
        } else if (!startMonth) {
            const now = new Date();
            setStartMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
            const end = new Date(now);
            end.setMonth(now.getMonth() + 11);
            setEndMonth(`${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}`);
        }
    }, [project, startMonth, endMonth]);

    // 자동 계산된 M/M 합계 (당사/외주별)
    const mmSummary = useMemo(() => {
        const summary: { [month: string]: { wemb: number; external: number } } = {};

        manpowerPlanItems.forEach(item => {
            const isExternal = item.affiliationGroup?.startsWith("외주") || false;
            if (item.monthlyAllocation) {
                Object.entries(item.monthlyAllocation).forEach(([month, mm]) => {
                    if (!summary[month]) summary[month] = { wemb: 0, external: 0 };
                    if (isExternal) {
                        summary[month].external += mm;
                    } else {
                        summary[month].wemb += mm;
                    }
                });
            }
        });

        return summary;
    }, [manpowerPlanItems]);

    // 기준-경비 값들 (천원 단위)
    const expenseStandards = useMemo(() => {
        const standards: { [key: number]: number } = {};
        standardExpenses.forEach(exp => {
            if (exp.inputValue !== null && exp.calculatedValue !== null) {
                standards[exp.id] = exp.inputValue * exp.calculatedValue;
            } else {
                standards[exp.id] = exp.finalAmount;
            }
        });
        return standards;
    }, [standardExpenses]);

    // 계산 로직 (단일 아이템에 대해 계산된 monthlyValues 반환)
    const calculateMonthlyValues = useCallback((item: ProjectExpenseItem) => {
        // 기준 데이터 찾기 (ID 우선, 이름 차선)
        const getStandard = (id: number, name: string) => {
            if (expenseStandards[id] !== undefined) return expenseStandards[id];
            const std = standardExpenses.find(s => s.item === name || (id === 1 && s.item === "야근식대"));
            if (std) {
                return (std.inputValue !== null && std.calculatedValue !== null)
                    ? std.inputValue * std.calculatedValue
                    : std.finalAmount;
            }
            return 0;
        };

        const newMonthlyValues = { ...item.monthlyValues };
        const allMonths = Object.keys(mmSummary);

        allMonths.forEach(month => {
            const { wemb, external } = mmSummary[month];
            let calculated = 0;

            if (item.id === 1 || item.item.includes("야근식대")) {
                calculated = wemb * getStandard(1, "야근식대");
            } else if (item.id === 2 || item.item.includes("프로젝트부서비_내부")) {
                calculated = wemb * getStandard(2, "프로젝트부서비");
            } else if (item.id === 3 || item.item.includes("프로젝트부서비_외부")) {
                calculated = external * getStandard(3, "프로젝트부서비");
            } else if (item.id === 6 || item.item.includes("임차비")) {
                calculated = (wemb + external) * getStandard(6, "지방 임차비");
            } else if (item.id === 7 || item.item.includes("출장비")) {
                calculated = (wemb + external) * getStandard(7, "지방 출장비(월 22일 기준 일 20,000원 반영)");
            } else if (item.id === 8 || item.item.includes("교통비")) {
                calculated = (wemb + external) * getStandard(8, "출장교통비 - 항공권,KTX,렌터카,주유비 등");
            }

            if (calculated >= 0) {
                newMonthlyValues[month] = calculated;
            } else {
                delete newMonthlyValues[month];
            }
        });

        return newMonthlyValues;
    }, [mmSummary, expenseStandards, standardExpenses]);

    const refresh = useCallback(async () => {
        if (!projectId) return;
        try {
            setLoading(true);
            const data = await ProfitabilityService.fetchProjectExpensePlan(projectId);
            const savedItems = data.items || [];

            if (data.analysisStartMonth) setStartMonth(data.analysisStartMonth);
            if (data.analysisEndMonth) setEndMonth(data.analysisEndMonth);

            setHasSavedData(savedItems.length > 0); // 저장된 데이터가 있는지 확인

            const defaultItems: ProjectExpenseItem[] = [
                { id: 1, category: "일반경비", item: "야근식대_당사", monthlyValues: {}, isAutoCalculated: true },
                { id: 2, category: "일반경비", item: "프로젝트부서비_내부", monthlyValues: {}, isAutoCalculated: true },
                { id: 3, category: "일반경비", item: "프로젝트부서비_외부", monthlyValues: {}, isAutoCalculated: true },
                { id: 4, category: "특별경비", item: "워크샵", monthlyValues: {}, isAutoCalculated: false },
                { id: 5, category: "특별경비", item: "Kic-Off비용", monthlyValues: {}, isAutoCalculated: false },
                { id: 6, category: "특별경비", item: "임차비(지방)", monthlyValues: {}, isAutoCalculated: true },
                { id: 7, category: "특별경비", item: "출장비(지방)", monthlyValues: {}, isAutoCalculated: true },
                { id: 8, category: "특별경비", item: "교통비(지방)", monthlyValues: {}, isAutoCalculated: true },
                { id: 9, category: "특별경비", item: "기타(렌탈)", monthlyValues: {}, isAutoCalculated: false },
            ];

            const mergedItems = defaultItems.map((def, index) => {
                // 저장된 데이터가 있으면 순서(index)대로 매칭하여 명칭 변경 시에도 데이터 유지
                // API에서 category ASC, id ASC 순으로 정렬되어 오므로 순서 매칭이 유효함
                const saved = savedItems[index];

                if (saved && (saved.item === def.item || def.id === 9 || saved.category === def.category)) {
                    return {
                        ...def,
                        item: saved.item || def.item, // 저장된 명칭(ABC 등) 사용
                        monthlyValues: saved.monthlyValues || {},
                        // 저장된 데이터가 있으면 저장된 상태를 우선, 없으면 Default
                        isAutoCalculated: saved.isAutoCalculated ?? def.isAutoCalculated
                    };
                }

                // 순서가 맞지 않을 경우 이름으로 찾기 (폴백)
                const savedByName = savedItems.find((s: any) => s.item === def.item);
                if (savedByName) {
                    return {
                        ...def,
                        monthlyValues: savedByName.monthlyValues || {},
                        isAutoCalculated: savedByName.isAutoCalculated ?? def.isAutoCalculated
                    };
                }
                return def;
            });

            // 저장된 데이터가 없는 경우 (Live Sync 모드), 즉시 최신 기준 데이터로 자동 계산 수행
            if (savedItems.length === 0) {
                const initialCalculated = mergedItems.map(item => {
                    if (!item.isAutoCalculated) return item;
                    const calculated = calculateMonthlyValues(item);
                    return { ...item, monthlyValues: calculated };
                });
                setItems(initialCalculated);
            } else {
                setItems(mergedItems);
            }
        } catch (error) {
            console.error("Error loading project expense plan:", error);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    // 전체 재계산 (수동 갱신 또는 초기 연동)
    const recalculateData = useCallback(() => {
        setItems(prev => prev.map(item => {
            if (!item.isAutoCalculated) return item;
            const newValues = calculateMonthlyValues(item);
            return { ...item, monthlyValues: newValues };
        }));
    }, [calculateMonthlyValues]);

    // Live Sync (저장 전까지만 자동 동기화)
    useEffect(() => {
        if (!loading && !hasSavedData) {
            recalculateData();
        }
    }, [recalculateData, loading, hasSavedData]);

    // 초기 로딩
    useEffect(() => {
        refresh();
    }, [refresh]);

    // 값 업데이트 (수동 입력 시 자동 계산 해제)
    const updateItemValue = useCallback((id: number, month: string, value: number) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item;

            const newMonthlyValues = { ...item.monthlyValues };
            newMonthlyValues[month] = value;

            return {
                ...item,
                monthlyValues: newMonthlyValues,
                isAutoCalculated: false // 수동 입력 시 자동 계산 해제
            };
        }));
    }, []);

    // 항목명 업데이트 (기타 항목 등 명칭 변경용)
    const updateItemName = useCallback((id: number, name: string) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item;
            return { ...item, item: name };
        }));
    }, []);

    // 자동 계산 토글 (토글 시 즉시 재계산)
    const toggleAutoCalculate = useCallback((id: number) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item;

            const newAuto = !item.isAutoCalculated;
            let newValues = item.monthlyValues;

            // 켜는 순간 재계산
            if (newAuto) {
                // 여기서 calculateMonthlyValues를 호출하려면 items map 내부라 어려움.
                // 대신 setState 내부에서 처리해야 하므로 calculateMonthlyValues가 dependency로 필요하지만
                // 로직 중복을 피하기 위해 재계산 로직을 포함시켜야 함.
                // 하지만 calculateMonthlyValues는 useCallback으로 감싸져있어 사용 가능.
                // 다만 prev.map 내부에서 호출하면 dependency가 꼬일 수 있음.
                // 안전하게 하기 위해 effect로 처리하거나, 여기서 직접 호출.
                // calculateMonthlyValues는 item을 받아서 결과를 리턴하므로 안전함.
                // *주의: calculateMonthlyValues는 최신 state(standards etc)를 closure로 가짐.
                // setItems functional update 내부에서 외부 closure(calculateMonthlyValues) 호출은 가능.
            }

            return { ...item, isAutoCalculated: newAuto };
        }));

        // 상태 업데이트 후 재계산 적용 (Auto로 켜진 항목만)
        // 위 map에서 직접 호출하기보다, 상태 변경 후 한 번 더 업데이트하는 것이 깔끔할 수 있으나
        // 즉각적인 반응을 위해 functional update 내에서 처리 시도
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item;
            if (!item.isAutoCalculated) return item;

            // Auto로 켜졌으므로 즉시 재계산
            const calculated = calculateMonthlyValues(item);
            return { ...item, monthlyValues: calculated };
        }));

    }, [calculateMonthlyValues]);

    const saveExpensePlan = useCallback(async () => {
        if (!projectId) return;
        try {
            setSaving(true);
            await ProfitabilityService.saveProjectExpensePlan(
                projectId,
                items,
                startMonth,
                endMonth
            );
            setHasSavedData(true); // 저장 완료 시 Snapshot 모드로 전환
            return true;
        } catch (error) {
            console.error("Error saving project expense plan:", error);
            throw error;
        } finally {
            setSaving(false);
        }
    }, [projectId, items, startMonth, endMonth]);

    return {
        items,
        loading,
        saving,
        startMonth,
        setStartMonth,
        endMonth,
        setEndMonth,
        updateItemValue,
        updateItemName,
        toggleAutoCalculate,
        saveExpensePlan,
        mmSummary,
        refresh,            // DB Reload
        recalculateData,    // Manual Recalc (From Props)
    };
}

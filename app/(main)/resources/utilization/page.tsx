"use client";

import React, { useState, useEffect, useMemo } from "react";
import { format, getDaysInMonth, isWeekend } from "date-fns";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    AreaChart,
    Area,
    ReferenceLine,
    LabelList
} from "recharts";
import {
    ArrowLeft,
    Users,
    Target,
    AlertTriangle,
    TrendingUp,
    Search,
    Building2
} from "lucide-react";
import { Button } from "@/components/ui/Button";

// --- Types ---
interface User {
    id: number;
    name: string;
    grade: string;
    position: string;
    department_name: string;
    department_id: number;
    rank_name: string;
}

interface Department {
    id: number;
    name: string;
    parent_department_id: number | null;
    display_order: number;
}

interface Category {
    code: string;
    name: string;
}

interface Holiday {
    date: string;
    name: string;
}

interface WorkLog {
    user_id: number;
    date: string;
    category_code: string;
    hours: string | number; // JSON from pg comes as string for sums
}

type ViewState = "MAIN" | "DEPT_DETAIL" | "USER_DETAIL" | "TASK_DETAIL";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function UtilizationDashboard() {
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear().toString());

    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allDepts, setAllDepts] = useState<Department[]>([]);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [logs, setLogs] = useState<WorkLog[]>([]);

    const [filterDept, setFilterDept] = useState<string>("ALL");

    const [viewState, setViewState] = useState<ViewState>("MAIN");
    const [viewHistory, setViewHistory] = useState<ViewState[]>([]);
    const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [selectedTaskCode, setSelectedTaskCode] = useState<string | null>(null);

    const navigateTo = (nextView: ViewState) => {
        setViewHistory(prev => [...prev, viewState]);
        setViewState(nextView);
    };

    const handleBack = () => {
        const last = viewHistory[viewHistory.length - 1];
        if (last) {
            setViewState(last);
            setViewHistory(prev => prev.slice(0, -1));
        } else {
            setViewState("MAIN");
        }
    };

    useEffect(() => {
        fetchData();
    }, [year]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/resources/utilization?year=${year}`);
            if (!res.ok) throw new Error("Failed to fetch data");
            const data = await res.json();

            setAllUsers(data.users || []);
            setAllDepts(data.departments || []);
            setAllCategories(data.categories || []);
            setHolidays(data.holidays || []);
            setLogs(data.logs || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // --- Data Processing (Memoized) ---

    // 1. Calculate Monthly Working Hours (Denominator)
    const monthlyWorkingHours = useMemo(() => {
        const hours: number[] = new Array(12).fill(0);
        const y = parseInt(year);
        if (isNaN(y)) return hours;

        const holidayDates = new Set(holidays.map(h => h.date));

        for (let month = 0; month < 12; month++) {
            const days = getDaysInMonth(new Date(y, month));
            let workDays = 0;
            for (let d = 1; d <= days; d++) {
                const date = new Date(y, month, d);
                const dateStr = format(date, "yyyy-MM-dd");
                if (!isWeekend(date) && !holidayDates.has(dateStr)) {
                    workDays++;
                }
            }
            hours[month] = workDays * 8;
        }
        return hours;
    }, [year, holidays]);

    const totalYearlyWorkingHours = monthlyWorkingHours.reduce((acc, v) => acc + v, 0);
    const currentMonthIdx = new Date().getFullYear() === parseInt(year) ? new Date().getMonth() : 11;
    const targetWorkingHoursCurrent = monthlyWorkingHours.slice(0, currentMonthIdx + 1).reduce((acc, v) => acc + v, 0);

    // 2. Process Logs (Capping at 8 hours max per day per user for utilization)
    // structure: processedLogs[user_id][month_idx][category_code] = hours
    const processedLogs = useMemo(() => {
        const userDateSums: Record<number, Record<string, Record<string, number>>> = {};

        logs.forEach(log => {
            const u = log.user_id;
            const d = log.date;
            const c = log.category_code;
            const h = Number(log.hours);

            if (!userDateSums[u]) userDateSums[u] = {};
            if (!userDateSums[u][d]) userDateSums[u][d] = {};
            userDateSums[u][d][c] = (userDateSums[u][d][c] || 0) + h;
        });

        const result: Record<number, Record<number, Record<string, number>>> = {};

        Object.keys(userDateSums).forEach(uStr => {
            const u = parseInt(uStr);
            result[u] = {};
            for (let i = 0; i < 12; i++) result[u][i] = {};

            Object.keys(userDateSums[u]).forEach(dateStr => {
                const dateObj = new Date(dateStr);
                const monthIdx = dateObj.getMonth();
                const dailyRecord = userDateSums[u][dateStr];

                let totalUtilHours = 0;
                Object.values(dailyRecord).forEach(h => totalUtilHours += h);

                const scale = totalUtilHours > 8 ? 8 / totalUtilHours : 1;

                Object.keys(dailyRecord).forEach(cat => {
                    result[u][monthIdx][cat] = (result[u][monthIdx][cat] || 0) + (dailyRecord[cat] * scale);
                });
            });
        });
        return result;
    }, [logs]);

    // Find users/depts with data
    const usersWithData = useMemo(() => {
        const userIds = new Set(Object.keys(processedLogs).map(Number));
        return allUsers.filter(u => userIds.has(u.id));
    }, [allUsers, processedLogs]);

    const deptsWithData = useMemo(() => {
        const deptIds = new Set(usersWithData.map(u => u.department_id).filter(Boolean));
        return allDepts.filter(d => deptIds.has(d.id));
    }, [allDepts, usersWithData]);

    // Business Division Root
    const businessDiv = useMemo(() => allDepts.find(d => d.name === "사업본부"), [allDepts]);

    // IDs to include based on the current active filter (selected dept + all its descendants)
    const activeFilterDeptIds = useMemo(() => {
        const rootId = filterDept === "ALL"
            ? (businessDiv ? Number(businessDiv.id) : null)
            : Number(filterDept);

        if (rootId === null) return new Set<number>();

        const ids = new Set<number>();
        ids.add(rootId);

        const findChildren = (pid: number) => {
            allDepts.forEach(d => {
                if (d.parent_department_id && Number(d.parent_department_id) === pid) {
                    const dId = Number(d.id);
                    if (!ids.has(dId)) {
                        ids.add(dId);
                        findChildren(dId);
                    }
                }
            });
        };
        findChildren(rootId);
        return ids;
    }, [allDepts, filterDept, businessDiv]);

    // 3. Filtered Data
    const filteredUsers = useMemo(() => {
        return allUsers.filter(u => activeFilterDeptIds.has(Number(u.department_id)));
    }, [allUsers, activeFilterDeptIds]);

    // Departments for Dropdown (descendants of 사업본부)
    const displayDepts = useMemo(() => {
        if (!businessDiv) return [];

        const results: { id: number; displayName: string }[] = [];

        const buildHierarchy = (parentId: number, parentName: string) => {
            // Sort by ID or display order if available to keep a consistent list
            const children = allDepts.filter(d => d.parent_department_id && Number(d.parent_department_id) === parentId);

            children.forEach(d => {
                const currentPath = parentName === "사업본부" ? d.name : `${parentName} > ${d.name}`;
                results.push({ id: Number(d.id), displayName: currentPath });
                buildHierarchy(Number(d.id), currentPath);
            });
        };

        buildHierarchy(Number(businessDiv.id), "사업본부");
        return results;
    }, [allDepts, businessDiv]);

    // Helper: total util hours by a list of users
    const getUtilSummaryForUsers = (users: User[]) => {
        let totalHours = 0;
        const monthlySum = new Array(12).fill(0);
        const categorySum: Record<string, number> = {};

        users.forEach(u => {
            const uLogs = processedLogs[u.id];
            if (!uLogs) return;

            for (let m = 0; m < 12; m++) {
                Object.keys(uLogs[m]).forEach(cat => {
                    const h = uLogs[m][cat];
                    monthlySum[m] += h;
                    totalHours += h;
                    categorySum[cat] = (categorySum[cat] || 0) + h;
                });
            }
        });

        return { totalHours, monthlySum, categorySum };
    };

    const { totalHours: overallHours, monthlySum: overallMonthlySum, categorySum: overallCategorySum } = getUtilSummaryForUsers(filteredUsers);

    // Calculate Target capacities for filtered users
    // If we filter, the max possible hours is (number of users * monthly target)
    const targetTotal = filteredUsers.length * targetWorkingHoursCurrent;
    const overallAvgUtil = targetTotal > 0 ? (overallHours / targetTotal) * 100 : 0;

    // Overload/Underload
    const userUtils = filteredUsers.map(u => {
        const uLogs = processedLogs[u.id];
        let sum = 0;
        if (uLogs) {
            for (let m = 0; m < 12; m++) {
                Object.values(uLogs[m]).forEach(h => sum += h);
            }
        }
        const rate = targetWorkingHoursCurrent > 0 ? (sum / targetWorkingHoursCurrent) * 100 : 0;
        return { ...u, hours: sum, rate };
    });

    const overloadCount = userUtils.filter(u => u.rate > 90).length;
    const underloadCount = userUtils.filter(u => u.rate < 60).length;

    // Render logic for different views
    const renderHeader = () => (
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{year}년 프로젝트 구성원 가동률 대시보드</h1>
                    <p className="text-sm text-gray-500">조직 및 인력의 업무 투입 현황을 분석하고 시각화합니다.</p>
                </div>
                <div className="flex gap-2">
                    <select
                        className="border-gray-300 rounded-md text-sm cursor-pointer shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={year}
                        onChange={e => setYear(e.target.value)}
                    >
                        {[2024, 2025, 2026, 2027].map(y => (
                            <option key={y} value={y}>{y}년</option>
                        ))}
                    </select>
                    {viewState === "MAIN" && (
                        <>
                            <select
                                className="border-gray-300 rounded-md text-sm cursor-pointer shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={filterDept}
                                onChange={e => setFilterDept(e.target.value)}
                            >
                                <option value="ALL">사업본부</option>
                                {displayDepts.map(d => (
                                    <option key={d.id} value={d.id}>{d.displayName}</option>
                                ))}
                            </select>
                        </>
                    )}
                </div>
            </div>

            {viewState !== "MAIN" && (
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={handleBack} className="flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4" /> 이전으로 돌아가기
                    </Button>
                    <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        {viewState === "DEPT_DETAIL" ? "조직 상세 조회" :
                            viewState === "USER_DETAIL" ? "개인 상세 조회" : "업무 분류 상세 조회"}
                    </span>
                </div>
            )}
        </div>
    );

    const renderMain = () => {
        // Trend Chart Data
        const trendData = monthlyWorkingHours.map((workingHour, m) => {
            const activeUsers = filteredUsers.length;
            const targetMonthHours = activeUsers * workingHour;
            const actualMonthHours = overallMonthlySum[m];
            const rate = targetMonthHours > 0 ? (actualMonthHours / targetMonthHours) * 100 : 0;
            return {
                month: `${m + 1}월`,
                rate: Number(rate.toFixed(1)),
                target: 80
            };
        }).slice(0, currentMonthIdx + 1);

        // Pie Chart Data
        const pieData = Object.keys(overallCategorySum).map(code => {
            const category = allCategories.find(c => c.code === code);
            return {
                name: category ? category.name : code,
                value: Number(overallCategorySum[code].toFixed(1)),
                code: code
            };
        }).filter(d => d.value > 0);

        // Helper to get full hierarchical sort path based on display_order
        const getDeptSortPath = (deptId: number) => {
            const path: string[] = [];
            let currentId: number | null = deptId;
            while (currentId !== null) {
                const dept = allDepts.find(d => Number(d.id) === currentId);
                if (dept) {
                    path.unshift((dept.display_order ?? 0).toString().padStart(10, '0'));
                    currentId = dept.parent_department_id ? Number(dept.parent_department_id) : null;
                } else {
                    currentId = null;
                }
            }
            return path.join('_');
        };

        const orgData = Array.from(new Set(filteredUsers.map(u => u.department_id).filter(Boolean))).map(deptId => {
            const deptUsers = filteredUsers.filter(u => u.department_id === deptId);
            const summ = getUtilSummaryForUsers(deptUsers);
            const target = deptUsers.length * targetWorkingHoursCurrent;
            const rate = target > 0 ? (summ.totalHours / target) * 100 : 0;
            const department = allDepts.find(d => d.id === deptId);
            const deptName = department?.name || '기타';
            const sortPath = getDeptSortPath(deptId);
            return { deptId, name: deptName, rate: Number(rate.toFixed(1)), sortPath };
        }).sort((a, b) => a.sortPath.localeCompare(b.sortPath));

        // Top/Bottom Users
        const sortedUsers = [...userUtils].sort((a, b) => b.rate - a.rate);
        const top5 = sortedUsers.slice(0, 5);
        const bottom5 = sortedUsers.slice(-5).filter(u => u.rate > 0 || sortedUsers.length <= 5).reverse(); // Remove strict 0 if too many

        return (
            <div className="space-y-6">
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">전체 평균 가동률</p>
                            <p className="text-2xl font-bold text-gray-900">{overallAvgUtil.toFixed(1)}%</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">조직원 인원수</p>
                            <p className="text-2xl font-bold text-gray-900">{filteredUsers.length}명</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                            <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">가동률 목표(80%) 달성률</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {overallAvgUtil > 0 ? ((overallAvgUtil / 80) * 100).toFixed(1) : 0}%
                            </p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">과부하 / 저조 인원</p>
                            <p className="text-2xl font-bold text-gray-900">
                                <span className="text-red-500">{overloadCount}</span> <span className="text-gray-400 text-lg">/</span> <span className="text-orange-500">{underloadCount}</span>
                                <span className="text-sm text-gray-500 font-normal ml-1">명</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold mb-4 text-gray-800">월별 평균 가동률 추이</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} domain={[0, 120]} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any) => [`${value}%`, '가동률']}
                                    />
                                    <Legend verticalAlign="top" height={36} iconType="circle" />
                                    <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" label={{ position: 'top', value: '목표 80%', fill: '#ef4444', fontSize: 12 }} />
                                    <Line type="monotone" dataKey="rate" name="평균 가동률" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold mb-4 text-gray-800">업무 분류별 가동률 비율</h3>
                        <div className="h-72 cursor-pointer">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 0, right: 140, left: 0, bottom: 0 }}>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                        labelLine={true}
                                        label={(props: any) => props.percent !== undefined ? `${(props.percent * 100).toFixed(1)}%` : ""}
                                        onClick={(data) => {
                                            if (data.payload && data.payload.code) {
                                                setSelectedTaskCode(data.payload.code);
                                                navigateTo("TASK_DETAIL");
                                            }
                                        }}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                const total = pieData.reduce((acc, curr) => acc + curr.value, 0);
                                                const pct = total > 0 ? ((data.value / total) * 100).toFixed(1) : "0.0";
                                                return (
                                                    <div className="bg-white p-3 border border-gray-100 rounded-lg shadow-md">
                                                        <p className="font-bold text-gray-800 mb-1">{data.name}</p>
                                                        <p className="text-sm text-gray-600">투입 시간: <span className="font-medium text-gray-900">{data.value.toFixed(1)} hrs</span></p>
                                                        <p className="text-sm text-gray-600">비율: <span className="font-medium text-gray-900">{pct}%</span></p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend
                                        verticalAlign="middle"
                                        align="right"
                                        layout="vertical"
                                        iconType="circle"
                                        wrapperStyle={{ paddingLeft: '20px' }}
                                        formatter={(value, entry: any) => {
                                            const total = pieData.reduce((acc, curr) => acc + curr.value, 0);
                                            const currentVal = entry.payload?.value || 0;
                                            const pct = total > 0 ? ((currentVal / total) * 100).toFixed(1) : "0.0";
                                            return <span className="text-sm font-medium text-gray-700 inline-block min-w-[120px]">{value} ({pct}%)</span>;
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <p className="text-xs text-center text-gray-400 mt-2">* 차트 조각을 클릭하면 해당 업무 상세 내역으로 이동합니다.</p>
                        </div>
                    </div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold mb-4 text-gray-800">조직별 평균 가동률</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={orgData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                    <XAxis type="number" domain={[0, 120]} hide />
                                    <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 12, fontWeight: 500 }} />
                                    <Tooltip
                                        cursor={{ fill: '#F3F4F6' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any) => [`${value}%`, '가동률']}
                                    />
                                    <ReferenceLine x={80} stroke="#ef4444" strokeDasharray="4 4" />
                                    <Bar dataKey="rate" radius={[0, 4, 4, 0]} barSize={20}
                                        onClick={(data: any) => {
                                            setSelectedDeptId(data.deptId);
                                            navigateTo("DEPT_DETAIL");
                                        }}
                                        className="cursor-pointer"
                                    >
                                        {orgData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.rate > 90 ? '#ef4444' : entry.rate < 60 ? '#f59e0b' : '#3b82f6'} />
                                        ))}
                                        <LabelList dataKey="rate" position="right" formatter={(v: any) => `${v}%`} style={{ fill: '#4B5563', fontSize: 11, fontWeight: 600 }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            <p className="text-xs text-left text-gray-400 mt-2">* 막대를 클릭하면 부서 상세 내역으로 이동합니다.</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                        <h3 className="text-lg font-bold mb-4 text-gray-800">개인별 가동률 TOP 5 / BOTTOM 5</h3>
                        <div className="flex-1 flex gap-4 min-h-[250px]">
                            <div className="flex-1 bg-blue-50/50 rounded-lg p-3">
                                <h4 className="text-sm font-bold text-blue-800 mb-3 text-center">TOP 5 (과부하 주의)</h4>
                                <div className="space-y-3">
                                    {top5.map((u, i) => (
                                        <div
                                            key={u.id}
                                            className="flex justify-between items-center group cursor-pointer hover:bg-white p-1.5 rounded transition"
                                            onClick={() => { setSelectedUserId(u.id); navigateTo("USER_DETAIL"); }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex justify-center items-center text-xs font-bold">{i + 1}</span>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800 group-hover:text-blue-600">{u.name} {u.rank_name}</p>
                                                    <p className="text-[10px] text-gray-500">{u.department_name}</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-extrabold text-blue-700">{u.rate.toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 bg-orange-50/50 rounded-lg p-3">
                                <h4 className="text-sm font-bold text-orange-800 mb-3 text-center">BOTTOM 5 (여력 있음)</h4>
                                <div className="space-y-3">
                                    {bottom5.map((u, i) => (
                                        <div
                                            key={u.id}
                                            className="flex justify-between items-center group cursor-pointer hover:bg-white p-1.5 rounded transition"
                                            onClick={() => { setSelectedUserId(u.id); navigateTo("USER_DETAIL"); }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 bg-orange-500 text-white rounded-full flex justify-center items-center text-xs font-bold">{bottom5.length - i}</span>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800 group-hover:text-orange-600">{u.name} {u.rank_name}</p>
                                                    <p className="text-[10px] text-gray-500">{u.department_name}</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-extrabold text-orange-600">{u.rate.toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderDeptDetail = () => {
        if (!selectedDeptId) return null;
        const dept = allDepts.find(d => d.id === selectedDeptId);
        const deptUsers = allUsers.filter(u => u.department_id === selectedDeptId);

        // Monthly Table
        const months = Array.from({ length: 12 }, (_, i) => i);

        return (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{dept?.name} 가동률 상세 현황</h2>
                    <p className="text-sm text-gray-500 mb-6">부서 소속 인원: {deptUsers.length}명</p>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-center border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600">
                                    <th className="p-3 font-semibold border-b">구성원</th>
                                    {months.map(m => (
                                        <th key={m} className={`p-3 font-semibold border-b ${m > currentMonthIdx ? 'text-gray-300' : ''}`}>{m + 1}월</th>
                                    ))}
                                    <th className="p-3 font-bold border-b bg-blue-50 text-blue-700">YTD 평균</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {deptUsers.map(u => {
                                    const uLogs = processedLogs[u.id];
                                    let ytdHours = 0;

                                    return (
                                        <tr key={u.id} className="hover:bg-blue-50/30 transition cursor-pointer" onClick={() => { setSelectedUserId(u.id); navigateTo("USER_DETAIL"); }}>
                                            <td className="p-3 font-medium text-left">{u.name} {u.rank_name}</td>
                                            {months.map(m => {
                                                let totalH = 0;
                                                if (uLogs && uLogs[m]) {
                                                    Object.values(uLogs[m]).forEach(h => totalH += h);
                                                }
                                                if (m <= currentMonthIdx) ytdHours += totalH;

                                                let rate = monthlyWorkingHours[m] > 0 ? (totalH / monthlyWorkingHours[m]) * 100 : 0;

                                                // Heatmap cell
                                                let bgColor = 'bg-transparent';
                                                if (m <= currentMonthIdx) {
                                                    if (rate > 100) bgColor = 'bg-red-100 text-red-800';
                                                    else if (rate > 85) bgColor = 'bg-orange-100 text-orange-800';
                                                    else if (rate >= 60) bgColor = 'bg-green-100 text-green-800';
                                                    else if (rate > 0) bgColor = 'bg-blue-100 text-blue-800';
                                                    else bgColor = 'bg-gray-100 text-gray-500';
                                                }

                                                return (
                                                    <td key={m} className="p-2">
                                                        {m <= currentMonthIdx ? (
                                                            <div className={`py-1.5 px-1 rounded mx-auto ${bgColor}`}>
                                                                {rate.toFixed(0)}%
                                                            </div>
                                                        ) : '-'}
                                                    </td>
                                                );
                                            })}
                                            <td className="p-3 font-bold bg-blue-50/30 text-blue-700">
                                                {targetWorkingHoursCurrent > 0 ? ((ytdHours / targetWorkingHoursCurrent) * 100).toFixed(1) : 0}%
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderUserDetail = () => {
        if (!selectedUserId) return null;
        const user = allUsers.find(u => u.id === selectedUserId);
        if (!user) return null;

        const uLogs = processedLogs[user.id];

        // Monthly trend data
        const months = Array.from({ length: currentMonthIdx + 1 }, (_, i) => i);
        const trendData = months.map(m => {
            let mTotal = 0;
            let categories: Record<string, number> = {};
            if (uLogs && uLogs[m]) {
                Object.keys(uLogs[m]).forEach(code => {
                    mTotal += uLogs[m][code];
                    const catName = allCategories.find(c => c.code === code)?.name || code;
                    categories[catName] = uLogs[m][code];
                });
            }
            return {
                month: `${m + 1}월`,
                rate: Number((monthlyWorkingHours[m] > 0 ? (mTotal / monthlyWorkingHours[m]) * 100 : 0).toFixed(1)),
                ...categories,
                target: 80
            };
        });

        const catNames = allCategories.map(c => c.name);

        return (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold">
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{user.name} <span className="text-lg font-medium text-gray-500">{user.rank_name}</span></h2>
                        <div className="flex gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {user.department_name}</span>
                            <span>직책: {user.position || '-'}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold mb-4 text-gray-800">월별 가동률 추이</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} domain={[0, 120]} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any) => [`${value}%`, '가동률']}
                                    />
                                    <Legend verticalAlign="top" height={36} iconType="circle" />
                                    <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" />
                                    <Line type="monotone" dataKey="rate" name="개인 가동률" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold mb-4 text-gray-800">업무 분류별 투입 현황 (시간)</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend verticalAlign="top" height={36} iconType="circle" />
                                    {catNames.map((name, i) => (
                                        <Bar key={name} dataKey={name} stackId="a" fill={COLORS[i % COLORS.length]} barSize={24} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderTaskDetail = () => {
        if (!selectedTaskCode) return null;
        const category = allCategories.find(c => c.code === selectedTaskCode);

        // Who participated in this task type?
        const participants: { user: User, hours: number, rate: number }[] = [];
        allUsers.forEach(u => {
            const uLogs = processedLogs[u.id];
            if (!uLogs) return;

            let sum = 0;
            for (let m = 0; m <= currentMonthIdx; m++) {
                sum += (uLogs[m][selectedTaskCode] || 0);
            }
            if (sum > 0) {
                participants.push({
                    user: u,
                    hours: sum,
                    rate: targetWorkingHoursCurrent > 0 ? (sum / targetWorkingHoursCurrent) * 100 : 0
                });
            }
        });

        participants.sort((a, b) => b.hours - a.hours);

        // Monthly Area Chart
        const months = Array.from({ length: currentMonthIdx + 1 }, (_, i) => i);
        const trendData = months.map(m => {
            let mTotal = 0;
            participants.forEach(p => {
                const uLogs = processedLogs[p.user.id];
                if (uLogs && uLogs[m]) mTotal += (uLogs[m][selectedTaskCode] || 0);
            });
            return {
                month: `${m + 1}월`,
                hours: Number(mTotal.toFixed(1))
            };
        });

        return (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{category?.name} 업무 현황</h2>
                    <p className="text-sm text-gray-500 mb-6">투입된 총 인원: {participants.length}명</p>

                    <div className="h-64 mb-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="hours" name="총 투입 시간" stroke="#10b981" fillOpacity={1} fill="url(#colorHours)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <h3 className="text-lg font-bold mb-4">참여 인원 목록</h3>
                    <div className="overflow-hidden border border-gray-200 rounded-lg">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">이름</th>
                                    <th className="px-4 py-3 font-semibold">소속</th>
                                    <th className="px-4 py-3 font-semibold text-right">총 투입 시간</th>
                                    <th className="px-4 py-3 font-semibold text-right">개별 가동률 점유율</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {participants.map((p, idx) => (
                                    <tr key={p.user.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedUserId(p.user.id); navigateTo("USER_DETAIL"); }}>
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {p.user.name} <span className="text-gray-500 text-xs ml-1">{p.user.rank_name}</span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{p.user.department_name}</td>
                                        <td className="px-4 py-3 text-right font-medium">{p.hours.toFixed(1)} hrs</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-xs text-gray-500">{p.rate.toFixed(1)}%</span>
                                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-green-500" style={{ width: `${Math.min(100, p.rate)}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-8 space-y-4">
                <div className="h-8 w-64 bg-gray-200 animate-pulse rounded"></div>
                <div className="grid grid-cols-4 gap-4"><div className="h-24 bg-gray-200 animate-pulse rounded-xl"></div><div className="h-24 bg-gray-200 animate-pulse rounded-xl"></div><div className="h-24 bg-gray-200 animate-pulse rounded-xl"></div><div className="h-24 bg-gray-200 animate-pulse rounded-xl"></div></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto bg-gray-50/50 min-h-[calc(100vh-theme(spacing.16))]">
            {renderHeader()}

            {viewState === "MAIN" && renderMain()}
            {viewState === "DEPT_DETAIL" && renderDeptDetail()}
            {viewState === "USER_DETAIL" && renderUserDetail()}
            {viewState === "TASK_DETAIL" && renderTaskDetail()}

        </div>
    );
}

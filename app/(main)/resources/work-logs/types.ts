// 작업일지 공유 타입
export interface WorkLog {
    id?: number;
    workDate: string;
    startTime: string | null;
    endTime: string | null;
    workHours?: number | null;
    logType: "plan" | "actual";
    category: string;
    subCategory?: string | null;   // R&D 지원 / 일반 업무 하위 항목
    projectId?: number | null;
    projectName?: string | null;
    projectCode?: string | null;
    userName?: string | null;
    title: string | null;
    memo: string | null;
}

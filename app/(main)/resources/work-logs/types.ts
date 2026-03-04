// 작업일지 공유 타입
export interface WorkLog {
    id?: number;
    workDate: string;
    startTime: string | null;
    endTime: string | null;
    workHours?: number | null;
    logType: "plan" | "actual";
    category: string;
    projectId?: number | null;
    projectName?: string | null;
    projectCode?: string | null;
    userName?: string | null;
    title: string | null;
    memo: string | null;
}

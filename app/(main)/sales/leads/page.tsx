"use client";

import { Target } from "lucide-react";

export default function LeadsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between px-2">
                <div className="h-10 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Target size={18} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">리드 현황</h1>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Leads</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-40">
                <Target className="w-16 h-16 text-muted-foreground/30" />
                <div className="text-center space-y-1">
                    <p className="text-base font-semibold text-foreground">준비 중입니다</p>
                    <p className="text-sm text-muted-foreground">리드 관리 기능이 곧 제공될 예정입니다.</p>
                </div>
            </div>
        </div>
    );
}

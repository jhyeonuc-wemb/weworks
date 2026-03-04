"use client";

import { Wrench } from "lucide-react";

export default function MaintenanceFreePage() {
    return (
        <div className="space-y-8 max-w-[1920px]">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        무상 유지보수 현황
                    </h1>
                </div>
            </div>

            {/* 준비 중 */}
            <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-40">
                <Wrench className="w-16 h-16 text-muted-foreground/30" />
                <div className="text-center space-y-1">
                    <p className="text-base font-semibold text-foreground">준비 중입니다</p>
                    <p className="text-sm text-muted-foreground">무상 유지보수 현황 기능이 곧 제공될 예정입니다.</p>
                </div>
            </div>
        </div>
    );
}

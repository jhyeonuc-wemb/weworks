"use client";

import { SWRConfig } from "swr";
import { swrConfig } from "@/lib/swr";

/**
 * SWR 글로벌 Provider
 * app/(main)/layout.tsx의 LayoutContent에 래핑하여 사용
 * 모든 하위 컴포넌트에서 동일한 캐시를 공유 → 자동 deduplication
 */
export function SWRProvider({ children }: { children: React.ReactNode }) {
    return (
        <SWRConfig value={swrConfig}>
            {children}
        </SWRConfig>
    );
}

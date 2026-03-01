import Link from "next/link";
import { ShieldX, ArrowLeft } from "lucide-react";

interface ForbiddenPageProps {
    searchParams: Promise<{ home?: string }>;
}

export default async function ForbiddenPage({ searchParams }: ForbiddenPageProps) {
    const { home } = await searchParams;
    const homeHref = home || '/dashboard';

    return (
        <div className="min-h-screen bg-[#FBFBFC] flex items-center justify-center">
            <div className="text-center space-y-6 max-w-sm px-4">
                <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
                    <ShieldX className="h-10 w-10 text-red-400" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900">접근 권한이 없습니다</h1>
                    <p className="text-sm text-slate-500">
                        해당 페이지에 접근할 권한이 없습니다.<br />
                        관리자에게 권한을 요청하세요.
                    </p>
                </div>
                <Link
                    href={homeHref}
                    className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    돌아가기
                </Link>
            </div>
        </div>
    );
}

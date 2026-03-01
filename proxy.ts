import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// menu_key → URL 경로 매핑
const MENU_KEY_TO_PATH: Record<string, string> = {
    'dashboard': '/dashboard',
    'sales': '/sales',
    'projects': '/projects',
    'vrb-review': '/vrb-review',
    'contract-status': '/contract-status',
    'profitability': '/profitability',
    'settlement': '/settlement',
    'maintenance/free': '/maintenance/free',
    'maintenance/paid': '/maintenance/paid',
    'resources/work-logs': '/resources/work-logs',
    'settings/clients': '/settings/clients',
    'settings/codes': '/settings/codes',
    'settings/departments': '/settings/departments',
    'settings/users': '/settings/users',
    'settings/permissions': '/settings/permissions',
    'settings/difficulty-checklist': '/settings/difficulty-checklist',
    'settings/md-estimation': '/settings/md-estimation',
    'settings/holidays': '/settings/holidays',
};

// URL 경로 → menu_key 매핑 (긴 경로 우선 정렬 - 매칭용)
const PATH_ENTRIES = Object.entries(MENU_KEY_TO_PATH)
    .sort((a, b) => b[1].length - a[1].length);

function getMenuKey(pathname: string): string | null {
    for (const [menuKey, path] of PATH_ENTRIES) {
        if (pathname === path || pathname.startsWith(path + '/')) {
            return menuKey;
        }
    }
    return null;
}

function getFirstAllowedPath(allowedMenuKeys: string[]): string {
    for (const key of allowedMenuKeys) {
        const path = MENU_KEY_TO_PATH[key];
        if (path) return path;
    }
    return '/';
}

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 공개 경로 통과
    if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/403') ||
        pathname.startsWith('/_next') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // 세션 확인
    const session = request.cookies.get('session');
    if (!session) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    let sessionData: { id?: string | number; allowedMenuKeys?: string[] } = {};
    try {
        sessionData = JSON.parse(session.value);
    } catch {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (!sessionData?.id) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // allowedMenuKeys가 있을 때만 권한 체크 (없으면 전체 허용)
    const allowedMenuKeys = sessionData.allowedMenuKeys;
    if (allowedMenuKeys && allowedMenuKeys.length > 0) {
        const menuKey = getMenuKey(pathname);
        if (menuKey && !allowedMenuKeys.includes(menuKey)) {
            const firstAllowedPath = getFirstAllowedPath(allowedMenuKeys);
            const url403 = new URL('/403', request.url);
            url403.searchParams.set('home', firstAllowedPath);
            return NextResponse.redirect(url403);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};

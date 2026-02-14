import { NextRequest } from 'next/server';

export interface SessionUser {
    id: string | number;
    username: string;
    name: string;
    role?: string;
    rank?: string;
    position?: string;
    departmentId?: string | number;
}

export function getCurrentUser(request: NextRequest): SessionUser | null {
    try {
        const session = request.cookies.get('session');
        if (!session) return null;

        const userData = JSON.parse(session.value);
        return userData as SessionUser;
    } catch (error) {
        console.error('Failed to parse session cookie:', error);
        return null;
    }
}

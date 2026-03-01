import { redirect } from "next/navigation";
import { cookies } from "next/headers";

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

export default async function Home() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');

  if (session) {
    try {
      const sessionData = JSON.parse(session.value);
      const allowedMenuKeys: string[] = sessionData.allowedMenuKeys ?? [];

      // 첫 번째 접근 가능한 경로로 이동
      for (const key of allowedMenuKeys) {
        const path = MENU_KEY_TO_PATH[key];
        if (path) redirect(path);
      }
    } catch {
      // 세션 파싱 실패 시 대시보드로
    }
  }

  redirect("/dashboard");
}

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getMenuKeyToPath } from "@/lib/menu-config";

export default async function Home() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');

  if (session) {
    try {
      const sessionData = JSON.parse(session.value);
      const allowedMenuKeys: string[] = sessionData.allowedMenuKeys ?? [];
      const MENU_KEY_TO_PATH = getMenuKeyToPath();

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

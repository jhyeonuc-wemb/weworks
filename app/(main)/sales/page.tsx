import { redirect } from "next/navigation";

// /sales 로 접근하면 첫 번째 하위 메뉴로 자동 이동
export default function SalesPage() {
    redirect("/sales/leads");
}

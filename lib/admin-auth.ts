import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, isValidAdminToken } from "@/lib/admin-session";

export async function isAdmin(): Promise<boolean> {
  return isValidAdminToken((await cookies()).get(ADMIN_COOKIE)?.value);
}

/**
 * 관리자 화면과 관리자 서버 액션의 첫 줄에서 부른다.
 *
 * middleware만 믿으면 안 된다. 서버 액션은 /admin 이 아닌 주소로도 불릴 수 있어서
 * 액션마다 직접 확인해야 한다.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

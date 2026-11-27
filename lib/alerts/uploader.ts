import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isOperator } from "@/lib/alerts/operator-session";

export type Uploader = { role: "operator"; userId: null } | { role: "teacher"; userId: string };

/**
 * 공문을 올리고 게시할 수 있는 사람인지. 운영자이거나, 초대받은 선생님.
 *
 * 선생님 로그인은 브라우저에 있으므로 화면이 로그인 토큰을 함께 보내고,
 * 서버가 그 토큰을 Supabase에 확인한 뒤 teachers 표에서 초대 여부를 본다.
 */
export async function getUploader(request: Request): Promise<Uploader | null> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (token && supabaseAdmin) {
    const { data } = await supabaseAdmin.auth.getUser(token);
    if (data.user) {
      const { data: teacher } = await supabaseAdmin
        .from("teachers")
        .select("user_id")
        .eq("user_id", data.user.id)
        .is("revoked_at", null)
        .maybeSingle();
      if (teacher) return { role: "teacher", userId: data.user.id };
    }
  }
  return (await isOperator()) ? { role: "operator", userId: null } : null;
}

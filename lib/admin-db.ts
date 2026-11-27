import "server-only";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * 관리자 쓰기용 DB 연결. 로그인을 확인한 다음에만 서버 전용 키를 내준다.
 *
 * programs · community_posts · reports 는 공개 키로 고치거나 지울 수 없다
 * (reports는 넣기만 된다). 관리자가 바꾸는 일은 전부 여기를 거친다.
 * 키가 없으면 조용히 넘어가지 않고 실패한다 — "저장된 줄 알았는데 아니었다"를 막는다.
 */
export async function adminDb() {
  await requireAdmin();
  if (!supabaseAdmin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY 환경변수가 없어서 저장할 수 없어요. 넣고 다시 배포해주세요.");
  }
  return supabaseAdmin;
}

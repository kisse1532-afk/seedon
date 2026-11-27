import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Program } from "@/lib/data";
import { kstToday } from "@/lib/alerts/options";
import { isOpen, matches, type AlertCard } from "@/lib/alerts/match";

/**
 * 이 카드를 알려줄 학생의 계정 id. 알림을 보내는 코드가 서버에서만 부른다.
 *
 *   const ids = await findMatchingStudentIds(programId);
 *
 * 보내는 쪽이 지킬 것
 * - 돌려받은 목록을 화면·로그·응답에 싣지 않는다(필요하면 몇 명인지만).
 * - 알림·메일 제목·잠금화면 문구는 중립으로("새 기회가 있어요").
 * - 교육급여 선택 여부는 일부러 읽지도 돌려주지도 않는다. 교육급여를 먼저 뽑는
 *   기회라도 조건이 맞는 학생 모두에게 알린다.
 * - 알림을 받겠다는 동의(앱 알림 허용, 메일 수신)는 보내는 쪽에서 따로 확인한다.
 *
 * 게시 전·마감 지남·맞춤 알림 카드가 아니면 빈 목록. DB를 못 읽으면 에러를 던진다
 * (조용히 빈 목록을 주면 "보낼 사람이 없었다"와 구별이 안 된다).
 */
export async function findMatchingStudentIds(card: string | (AlertCard & Pick<Program, "id">)): Promise<string[]> {
  if (!supabaseAdmin) throw new Error("SUPABASE_SERVICE_ROLE_KEY가 없어 알림 대상을 고를 수 없어요.");

  let program: AlertCard;
  if (typeof card === "string") {
    const { data, error } = await supabaseAdmin.from("programs").select("*").eq("id", card).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return [];
    program = data as Program;
  } else {
    program = card;
  }

  const today = kstToday();
  const grades = program.target_grades;
  if (!grades?.length || !isOpen(program, today)) return [];

  const PAGE = 1000;
  const ids: string[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin
      .from("alert_settings")
      .select("user_id, grade, sido, sigungu, interests")
      .in("grade", grades)
      .order("user_id")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    for (const row of data) {
      if (matches(program, row, today)) ids.push(row.user_id as string);
    }
    if (data.length < PAGE) return ids;
  }
}

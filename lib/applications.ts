import { supabase } from "@/lib/supabase";

/**
 * 관심 등록(신청 내역).
 *
 * 왜 브라우저에서 저장하는가: 원래는 서버 액션에서 저장했는데, 서버 쪽 클라이언트는
 * 로그인 세션을 모른다. 그래서 누가 넣었는지(`user_id`)가 계속 비어 있었고,
 * 결과적으로 청소년 본인은 자기가 뭘 등록했는지 볼 수 없었다 — 운영자만 볼 수 있는
 * 명단이 되어 있었다. 브라우저에서 넣으면 세션이 붙으므로 본인 것으로 기록된다.
 *
 * 안전 장치는 DB에 있다. `applications`의 INSERT 정책이
 * `user_id IS NULL OR auth.uid() = user_id`라서, 남의 id를 적어 보내도 거절된다.
 * 읽기 정책은 `auth.uid() = user_id`라 남의 등록 내역은 조회되지 않는다.
 */

export type MyApplication = {
  id: string;
  program_id: string;
  status: string;
  created_at: string;
};

/**
 * 관심 등록을 저장한다. 로그인 안 했으면 `user_id` 없이 저장된다 —
 * 로그인부터 하라고 막으면 거기서 나가버리기 때문에 그대로 받는다.
 */
export async function submitInterest(
  programId: string,
  name: string,
  contact: string
): Promise<{ ok: true; linkedToAccount: boolean } | { ok: false; message: string }> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id ?? null;

  const { error } = await supabase.from("applications").insert({
    program_id: programId,
    applicant_name: name,
    applicant_contact: contact,
    user_id: userId,
  });

  if (error) {
    return {
      ok: false,
      message: "지금 저장이 안 됐어요. 잠깐 뒤에 다시 눌러봐 주세요.",
    };
  }

  return { ok: true, linkedToAccount: Boolean(userId) };
}

/** 내가 관심 등록한 것들. 로그인 안 했으면 빈 배열 (RLS가 남의 것은 안 준다). */
export async function loadMyApplications(): Promise<MyApplication[]> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return [];

  const { data: rows, error } = await supabase
    .from("applications")
    .select("id, program_id, status, created_at")
    .order("created_at", { ascending: false });

  if (error || !rows) return [];
  return rows as MyApplication[];
}

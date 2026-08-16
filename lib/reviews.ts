import { supabase } from "@/lib/supabase";

/**
 * 프로그램 후기 — "이거 해봤어요".
 *
 * 왜 자유 게시판이 아닌가: 커뮤니티 화면에 "다른 청소년들이 도움받은 이야기"라고
 * 적혀 있었지만 청소년이 글을 쓸 방법이 아예 없었다. 지키지 못할 약속이었다.
 * 그렇다고 아무나 바로 올라가는 게시판을 열면, 지켜보는 사람이 적은 서비스에서
 * 걸러지지 않은 글이 그대로 청소년에게 간다. 그래서 받아두고 운영자가 승인한
 * 것만 공개한다.
 *
 * 막는 건 DB가 한다. INSERT 정책이 status='pending'을 강제해서 스스로 공개할 수
 * 없고, SELECT 정책이 published만 내주므로 승인 전 글은 아무에게도 안 보인다.
 *
 * 절대규칙 1·2: 이름·연락처를 받지 않는다. 부르고 싶은 이름만 선택 항목으로 받는다.
 */

export type Review = {
  id: string;
  program_id: string;
  body: string;
  nickname: string | null;
  created_at: string;
};

export async function submitReview(
  programId: string,
  body: string,
  nickname: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const text = body.trim();
  if (text.length < 5) {
    return { ok: false, message: "조금만 더 적어주세요. 다섯 글자는 넘어야 해요." };
  }
  if (text.length > 500) {
    return { ok: false, message: "너무 길어요. 500자 안쪽으로 줄여주세요." };
  }

  const { data } = await supabase.auth.getUser();

  const { error } = await supabase.from("program_reviews").insert({
    program_id: programId,
    body: text,
    nickname: nickname.trim() || null,
    user_id: data.user?.id ?? null,
    status: "pending",
  });

  if (error) {
    return { ok: false, message: "지금 저장이 안 됐어요. 잠깐 뒤에 다시 눌러봐 주세요." };
  }
  return { ok: true };
}

/** 승인된 후기만. RLS가 알아서 걸러주지만 조건을 같이 적어 의도를 남긴다. */
export async function loadReviews(programId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("program_reviews")
    .select("id, program_id, body, nickname, created_at")
    .eq("program_id", programId)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as Review[];
}

/** 프로그램을 가리지 않고 최근 승인된 후기. 커뮤니티 화면이 쓴다. */
export async function loadRecentReviews(limit = 10): Promise<Review[]> {
  const { data, error } = await supabase
    .from("program_reviews")
    .select("id, program_id, body, nickname, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as Review[];
}

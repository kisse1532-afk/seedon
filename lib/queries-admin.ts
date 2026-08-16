import "server-only";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * 관리자 화면 전용 조회.
 *
 * 왜 queries.ts에서 분리했는가: queries.ts는 북마크 화면 같은 클라이언트
 * 컴포넌트에서도 불러 쓴다. 거기에 서버 전용 키를 쓰는 코드를 섞으면 그 키가
 * 브라우저 번들로 딸려 나간다. 실제로 빌드가 그걸 잡아냈다.
 * 개인정보를 읽는 코드는 여기에만 둔다.
 */

export async function fetchHelpRequests() {
  // 이름·연락처가 들어 있어 서버 전용 키로만 읽는다. 키가 없으면 빈 목록이고,
  // 관리자 화면이 "서버 키를 넣어달라"고 안내한다.
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("help_requests")
    .select("*")
    .neq("status", "completed")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data as {
    id: string;
    program_id: string | null;
    name: string;
    contact: string;
    message: string | null;
    status: "pending" | "contacted" | "completed";
    created_at: string;
  }[];
}


export type PendingReview = {
  id: string;
  program_id: string;
  body: string;
  nickname: string | null;
  created_at: string;
};

/**
 * 승인 대기 중인 후기.
 *
 * 승인 전에는 RLS가 아무에게도 안 보여주므로, 이 화면이 없으면 청소년이 남긴
 * 글이 그대로 묻힌다. 받아만 두고 안 보는 건 안 받느니만 못하다.
 */
export async function fetchPendingReviews(): Promise<PendingReview[]> {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("program_reviews")
    .select("id, program_id, body, nickname, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) return [];
  return data as PendingReview[];
}

export type Application = {
  id: string;
  program_id: string | null;
  applicant_name: string;
  applicant_contact: string;
  /** 폼으로 갓 들어온 건 'submitted'. 관리자가 누르면 contacted → completed. */
  status: "submitted" | "contacted" | "completed" | null;
  created_at: string;
};

/**
 * 신청(관심 등록) 목록.
 *
 * 2026-08-15까지 이 표를 읽는 코드가 아예 없었다. 청소년이 이름과 연락처를
 * 남기면 저장은 됐지만 아무도 볼 수 없었고, 그래서 핵심 파일럿 지표인
 * "폼 제출 완료"를 측정할 수가 없었다.
 */
export async function fetchApplications() {  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data as Application[];
}


/**
 * 전환율을 이 시각 이후 것만 센다.
 *
 * 그 전 기록은 서버 렌더링마다 찍혀서 검색봇·링크 미리보기·우리가 점검하려고
 * 연 것까지 섞여 있다(카드 클릭 22건에 상세 조회 64건이라는 말이 안 되는
 * 숫자였다). 섞인 채로 세면 파일럿 판단을 그르친다.
 *
 * 지우지는 않는다 — 되돌리기 원칙상 데이터는 남기고 계산에서만 뺀다.
 * 나중에 옛 기록이 필요하면 이 값을 내리면 된다.
 */
export const MEASURE_SINCE = "2026-08-16T07:30:00Z";

export type EventStats = {
  windowDays: number;
  /** 실제로 세기 시작한 시각. 화면에 그대로 보여줘서 숫자가 작은 이유를 알게 한다. */
  measuringSince: string;
  cardClicks: number;
  pageViews: number;
  applyClicks: number;
  submissions: number; // 폼 제출 완료 (applications에 실제로 쌓인 건수)
  viewRate: number | null; // cardClicks -> pageViews
  applyRate: number | null; // pageViews -> applyClicks
  submitRate: number | null; // pageViews -> submissions
  topPrograms: { program_id: string; clicks: number }[];
};

/* 이벤트에 user_id가 붙으면서 이 표도 개인정보가 됐다("누가 무엇을 봤나").
   공개 키 읽기 정책을 없앴으므로 집계는 서버 전용 키로만 한다. */
async function countEvents(eventType: string, sinceIso: string) {
  if (!supabaseAdmin) return 0;
  const { count } = await supabaseAdmin
    .from("program_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", eventType)
    .gte("created_at", sinceIso);
  return count ?? 0;
}

export async function fetchEventStats(windowDays = 30): Promise<EventStats> {
  const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
  // 측정 기준선보다 이전은 세지 않는다(위 MEASURE_SINCE 설명 참고).
  const since = windowStart > MEASURE_SINCE ? windowStart : MEASURE_SINCE;

  const [cardClicks, pageViews, applyClicks] = await Promise.all([
    countEvents("category_card_click", since),
    countEvents("apply_page_view", since),
    countEvents("apply_link_click", since),
  ]);

  const { data: applyClickRows } = supabaseAdmin
    ? await supabaseAdmin
        .from("program_events")
        .select("program_id")
        .eq("event_type", "apply_link_click")
        .gte("created_at", since)
    : { data: null };

  const tally = new Map<string, number>();
  for (const row of applyClickRows || []) {
    const pid = (row as { program_id: string | null }).program_id;
    if (!pid) continue;
    tally.set(pid, (tally.get(pid) || 0) + 1);
  }
  const topPrograms = [...tally.entries()]
    .map(([program_id, clicks]) => ({ program_id, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  /* 폼 제출은 이벤트가 아니라 실제로 저장된 신청 건수로 센다.
     이벤트는 클릭만 찍히지만 신청은 저장이 끝나야 의미가 있고, 파일럿 지표의
     마지막 칸("폼 제출 완료")이 바로 이 숫자다. */
  let submissions = 0;
  if (supabaseAdmin) {
    const { count } = await supabaseAdmin
      .from("applications")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since);
    submissions = count || 0;
  }

  return {
    windowDays,
    measuringSince: since,
    cardClicks,
    pageViews,
    applyClicks,
    submissions,
    viewRate: cardClicks > 0 ? Math.round((pageViews / cardClicks) * 1000) / 10 : null,
    applyRate: pageViews > 0 ? Math.round((applyClicks / pageViews) * 1000) / 10 : null,
    submitRate: pageViews > 0 ? Math.round((submissions / pageViews) * 1000) / 10 : null,
    topPrograms,
  };
}

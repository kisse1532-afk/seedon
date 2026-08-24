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
/* program_events가 아니라 program_events_counted를 센다.
   그 뷰가 우리 점검 도구가 만든 기록(source<>web)과 운영자 계정(is_internal)을
   이미 빼놓은 것이다. 원본을 세면 우리가 화면 찍은 것까지 성과로 잡힌다. */
async function countEvents(eventType: string, sinceIso: string) {
  if (!supabaseAdmin) return 0;
  const { count } = await supabaseAdmin
    .from("program_events_counted")
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
        .from("program_events_counted")
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


/**
 * "올려둔 카드 중 몇 장이 실제로 닿았나."
 *
 * 왜 이 숫자인가 (2026.08.19 로드 결정)
 * ------------------------------------
 * 그동안 "가입자 몇 명"을 성적표로 봤는데, 우리가 파는 건 회원이 아니다.
 * 기관이 궁금한 건 "너희 앱에 몇 명 가입했나"가 아니라 "우리 사업이
 * 청소년에게 닿았나"다. 그래서 세는 단위를 카드로 바꾼다.
 *
 * 로드 지적: "카드 42건 말고 계속 늘어나기는 할 거니까."
 * 맞다. 그래서 비율만 보면 안 된다 — 카드를 열심히 늘릴수록 비율은 떨어진다.
 * 닿은 카드 수(늘어나야 하는 것)와 비율(넓이) 둘 다 돌려준다.
 *
 * 한 번도 안 열린 카드 목록은 리서치팀 작업거리가 된다 — 아무도 안 누르는
 * 카드는 잘못 쓰였거나 잘못 분류됐을 가능성이 있다.
 */
export type CardReach = {
  windowDays: number;
  published: number;      // 지금 올라가 있는 카드 수 (분모, 계속 늘어난다)
  opened: number;         // 그중 상세를 한 번이라도 연 카드 수
  reachedApply: number;   // 그중 기관 신청 페이지까지 넘어간 카드 수
  openedRate: number | null;
  reachedRate: number | null;
  untouched: string[];    // 아무도 안 연 카드 (최대 20개)
};

export async function fetchCardReach(windowDays = 30): Promise<CardReach> {
  const empty: CardReach = {
    windowDays,
    published: 0,
    opened: 0,
    reachedApply: 0,
    openedRate: null,
    reachedRate: null,
    untouched: [],
  };
  if (!supabaseAdmin) return empty;

  const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
  const since = windowStart > MEASURE_SINCE ? windowStart : MEASURE_SINCE;

  const [{ data: programs }, { data: events }] = await Promise.all([
    supabaseAdmin.from("programs").select("id").eq("status", "published"),
    supabaseAdmin
      .from("program_events_counted")
      .select("program_id, event_type")
      .gte("created_at", since)
      .in("event_type", ["apply_page_view", "apply_link_click"]),
  ]);

  const ids = (programs || []).map((p) => (p as { id: string }).id);
  const opened = new Set<string>();
  const reached = new Set<string>();
  for (const e of events || []) {
    const row = e as { program_id: string | null; event_type: string };
    if (!row.program_id) continue;
    opened.add(row.program_id);
    if (row.event_type === "apply_link_click") reached.add(row.program_id);
  }

  // 이미 내린 카드가 눌린 기록은 세지 않는다 — 지금 올라가 있는 것만 분모다.
  const live = new Set(ids);
  const openedLive = [...opened].filter((id) => live.has(id));
  const reachedLive = [...reached].filter((id) => live.has(id));

  return {
    windowDays,
    published: ids.length,
    opened: openedLive.length,
    reachedApply: reachedLive.length,
    openedRate: ids.length > 0 ? Math.round((openedLive.length / ids.length) * 1000) / 10 : null,
    reachedRate: ids.length > 0 ? Math.round((reachedLive.length / ids.length) * 1000) / 10 : null,
    untouched: ids.filter((id) => !opened.has(id)).slice(0, 20),
  };
}


/**
 * 카드별 성적표 — "이 카드는 몇 번 열렸고, 그중 몇 번이 기관 사이트로 넘어갔나."
 *
 * 왜 이게 본체인가 (2026.08.19 로드 지적)
 * ---------------------------------------
 * 로드: "그냥 그 카드에 몇 번 눌렸고 홈페이지 들어간 전환율이 어떻게 됐는지
 *        뭐 그런 거를 보는 게 더 중요한 거 아니야?"
 *
 * 맞다. "42장 중 1장"은 넓이만 보는 숫자다. 정작 손댈 곳을 알려주는 건 카드별이다.
 *   · 20번 열렸는데 신청까지 1번 → 문구가 안 와닿거나 링크가 엉뚱하다
 *   · 3번 열렸는데 2번 넘어감    → 좋은 카드다. 이런 카드를 더 찾으면 된다
 *
 * 그래서 이 표가 리서치팀 작업 지시서가 되고, 기관에 보여줄 근거가 된다.
 * "귀 기관 사업이 몇 번 열려서 몇 명이 신청 페이지까지 갔습니다."
 */
export type CardFunnelRow = {
  programId: string;
  title: string;
  category: string;
  cardClicks: number;   // 목록에서 카드를 누른 횟수
  pageViews: number;    // 상세를 연 횟수
  applyClicks: number;  // 기관 신청 페이지로 넘어간 횟수
  /** 상세를 연 것 중 몇 %가 기관으로 넘어갔나. 이게 그 카드의 성적이다. */
  reachRate: number | null;
};

export async function fetchCardFunnel(windowDays = 30): Promise<CardFunnelRow[]> {
  if (!supabaseAdmin) return [];

  const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
  const since = windowStart > MEASURE_SINCE ? windowStart : MEASURE_SINCE;

  const [{ data: programs }, { data: events }] = await Promise.all([
    supabaseAdmin.from("programs").select("id, title, category").eq("status", "published"),
    supabaseAdmin
      .from("program_events_counted")
      .select("program_id, event_type")
      .gte("created_at", since),
  ]);

  const rows = new Map<string, CardFunnelRow>();
  for (const p of programs || []) {
    const row = p as { id: string; title: string; category: string };
    rows.set(row.id, {
      programId: row.id,
      title: row.title,
      category: row.category,
      cardClicks: 0,
      pageViews: 0,
      applyClicks: 0,
      reachRate: null,
    });
  }

  for (const e of events || []) {
    const ev = e as { program_id: string | null; event_type: string };
    if (!ev.program_id) continue;
    const row = rows.get(ev.program_id);
    if (!row) continue; // 이미 내린 카드는 세지 않는다
    if (ev.event_type === "category_card_click") row.cardClicks += 1;
    else if (ev.event_type === "apply_page_view") row.pageViews += 1;
    else if (ev.event_type === "apply_link_click") row.applyClicks += 1;
  }

  for (const row of rows.values()) {
    row.reachRate =
      row.pageViews > 0 ? Math.round((row.applyClicks / row.pageViews) * 1000) / 10 : null;
  }

  /* 열린 카드를 먼저, 그 안에서 많이 열린 순. 한 번도 안 열린 카드는 뒤로 몰되
     목록에서 빼지 않는다 — 그게 "손대야 할 카드"라서 오히려 봐야 한다. */
  return [...rows.values()].sort((a, b) => {
    if (b.pageViews !== a.pageViews) return b.pageViews - a.pageViews;
    if (b.cardClicks !== a.cardClicks) return b.cardClicks - a.cardClicks;
    return a.title.localeCompare(b.title, "ko");
  });
}

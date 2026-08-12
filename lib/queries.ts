import { supabase } from "@/lib/supabase";
import type { Category, Program, CommunityPost } from "@/lib/data";

// Supabase에서 게시된 프로그램을 가져온다.
// (과거엔 조회 실패/빈 결과 시 mock 데이터로 폴백했으나, 실제 DB에 없는 프로그램 ID로
// 신청서를 제출하면 FK 제약으로 저장이 조용히 실패하면서도 "신청 완료" 화면이 뜨는
// 문제가 있어 제거함. 이제 DB 데이터가 6개 카테고리 전부 채워져 있어 폴백이 불필요함.)
export async function fetchProgramsByCategory(category: Category): Promise<Program[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("status", "published")
    .eq("category", category)
    .or(`apply_deadline.is.null,apply_deadline.gte.${today}`);

  if (error || !data) return [];
  return data as Program[];
}

export async function fetchProgram(id: string): Promise<Program | undefined> {
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return undefined;
  return data as Program;
}

// --- 관리자용 쿼리 (전체 상태 조회) ---
export async function fetchAllPrograms() {
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data as (Program & { status: string; link: string | null; last_verified_at: string })[];
}

export async function fetchReports() {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data as {
    id: string;
    source_type: "link" | "text";
    content: string;
    status: string;
    created_at: string;
  }[];
}

export async function fetchHelpRequests() {
  const { data, error } = await supabase
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

// --- 전환율 이벤트 집계 (관리자 대시보드용) ---
export type EventStats = {
  windowDays: number;
  cardClicks: number;
  pageViews: number;
  applyClicks: number;
  viewRate: number | null; // cardClicks -> pageViews
  applyRate: number | null; // pageViews -> applyClicks
  topPrograms: { program_id: string; clicks: number }[];
};

async function countEvents(eventType: string, sinceIso: string) {
  const { count } = await supabase
    .from("program_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", eventType)
    .gte("created_at", sinceIso);
  return count ?? 0;
}

export async function fetchEventStats(windowDays = 30): Promise<EventStats> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  const [cardClicks, pageViews, applyClicks] = await Promise.all([
    countEvents("category_card_click", since),
    countEvents("apply_page_view", since),
    countEvents("apply_link_click", since),
  ]);

  const { data: applyClickRows } = await supabase
    .from("program_events")
    .select("program_id")
    .eq("event_type", "apply_link_click")
    .gte("created_at", since);

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

  return {
    windowDays,
    cardClicks,
    pageViews,
    applyClicks,
    viewRate: cardClicks > 0 ? Math.round((pageViews / cardClicks) * 1000) / 10 : null,
    applyRate: pageViews > 0 ? Math.round((applyClicks / pageViews) * 1000) / 10 : null,
    topPrograms,
  };
}

// --- 홈: 카테고리별 등록 개수 (리서치팀이 프로그램을 올리면 자동으로 늘어남) ---
export async function fetchCategoryCounts(): Promise<Record<string, number>> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("programs")
    .select("category")
    .eq("status", "published")
    .or(`apply_deadline.is.null,apply_deadline.gte.${today}`);

  if (error || !data) return {};

  const counts: Record<string, number> = {};
  for (const row of data as { category: string }[]) {
    counts[row.category] = (counts[row.category] || 0) + 1;
  }
  return counts;
}

// --- 홈: 지금 신청할 수 있는 프로그램 (마감 임박순 → 상시모집순) ---
export async function fetchOpenPrograms(limit = 5): Promise<Program[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("status", "published")
    .or(`apply_deadline.is.null,apply_deadline.gte.${today}`)
    .order("apply_deadline", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error || !data) return [];
  return data as Program[];
}

// --- 홈 신뢰 지표 (사랑의열매 CSR허브 벤치마킹) ---
export async function fetchPlatformStats() {
  const { data, error } = await supabase.from("programs").select("category").eq("status", "published");
  if (error || !data) {
    return { total: 0, categoryCount: 0 };
  }
  const categorySet = new Set((data as { category: string }[]).map((row) => row.category));
  return { total: data.length, categoryCount: categorySet.size };
}

// --- "전화 한 통이면 돼요" 테마 (임팩트닷커리어 벤치마킹 — phone 필드가 있는 프로그램만) ---
export async function fetchProgramsWithPhone(): Promise<Program[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("status", "published")
    .not("phone", "is", null)
    .or(`apply_deadline.is.null,apply_deadline.gte.${today}`);
  if (error || !data) return [];
  return data as Program[];
}

// --- 커뮤니티 (관리자 큐레이션형 — 유저 게시/DM 없음) ---

export async function fetchCommunityPosts(): Promise<CommunityPost[]> {
  const { data, error } = await supabase
    .from("community_posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as CommunityPost[];
}

export async function fetchCommunityPost(id: string): Promise<CommunityPost | undefined> {
  const { data, error } = await supabase.from("community_posts").select("*").eq("id", id).single();
  if (error || !data) return undefined;
  return data as CommunityPost;
}

export async function fetchAllCommunityPosts(): Promise<CommunityPost[]> {
  const { data, error } = await supabase.from("community_posts").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as CommunityPost[];
}

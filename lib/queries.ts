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

/**
 * 여러 프로그램을 한 번에 가져온다.
 *
 * 북마크·신청 내역 화면은 id 목록만 갖고 있어서, 예전에는 id마다 fetchProgram을
 * 한 번씩 불렀다. 20개를 저장해둔 사람은 화면을 열 때마다 조회가 20번 나가서
 * 목록이 뜨는 데 눈에 띄게 오래 걸렸다. 한 번에 가져온다.
 */
export async function fetchProgramsByIds(ids: string[]): Promise<Program[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("programs").select("*").in("id", ids);
  if (error || !data) return [];
  return data as Program[];
}

// --- 관리자용 쿼리 (전체 상태 조회) ---
export async function fetchAllPrograms() {
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data as (Program & {
    status: string;
    link: string | null;
    last_verified_at: string;
    review_note: string | null;
  })[];
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

// --- 전환율 이벤트 집계 (관리자 대시보드용) ---

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

// --- 홈: 지금 신청할 수 있는 프로그램 ---
// reopen_note가 있는 프로그램(= 이번 회차 모집 종료)은 두 목록 모두에서 제외한다.
// 카테고리·검색에는 계속 보이되, 지금 신청 못 하는 걸 신청 가능한 것처럼 띄우지 않기 위함.
//
// "언제까지 해야 하는 것"과 "아무 때나 되는 것"은 청소년이 해야 할 행동이 다르다.
// 앞엣것은 날짜를 놓치면 끝이고, 뒤엣것은 마음이 준비됐을 때 하면 된다.
// 한 목록에 섞어 놓으면 그 차이가 도장 하나로만 남아 잘 안 읽혀서 둘로 나눈다
// (2026-08-15 로드 요청).

/** 신청 기간이 정해져 있고 아직 안 지난 것. 마감이 가까운 순. */
export async function fetchDeadlinePrograms(limit = 6): Promise<Program[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("status", "published")
    .is("reopen_note", null)
    .not("apply_deadline", "is", null)
    .gte("apply_deadline", today)
    .order("apply_deadline", { ascending: true })
    .limit(limit);

  if (error || !data) return [];
  return data as Program[];
}

/**
 * 마감일 없이 아무 때나 신청·이용할 수 있는 것.
 *
 * enrollment_status가 비어 있는 건(= 접수 방식을 아직 확인 못 한 것) 일부러
 * 제외한다. 확인도 안 된 걸 "아무 때나 돼요"라고 띄우면 청소년이 헛걸음하고,
 * 그건 정보 비대칭을 없애는 게 아니라 새로 만드는 것이다.
 */
export async function fetchAlwaysOpenPrograms(limit = 8): Promise<Program[]> {
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("status", "published")
    .is("reopen_note", null)
    .is("apply_deadline", null)
    .not("enrollment_status", "is", null)
    .order("created_at", { ascending: false })
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

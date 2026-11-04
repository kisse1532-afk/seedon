import "server-only";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * /admin/office — "AI 팀 사무실" 화면이 읽는 기록.
 *
 * 왜 (2026.11.04 로드 "함 보고싶긴하니까 가벼운 판 한번 만들어봐줄래?"):
 * 인스타에서 본 「Claude Code 오피스」처럼, 병준(4팀)이 실제로 무엇을 했는지
 * 사무실 그림으로 보여 준다. 실시간(hooks) 판은 새 표와 비밀 키가 필요해서
 * 나중으로 미뤘다. 이 "가벼운 판"은 새 표·새 키 없이, 이미 쌓이는 기록만 읽는다.
 *
 *   콘텐츠팀  orgs(기관 명부: 새로 넣은 기관·오늘 확인한 기관)
 *             programs(새 카드 후보 = status pending)
 *   제품팀    GitHub 공개 저장소의 PR(열림·머지)
 *   운영팀    landing_events(광고 페이지 방문 수), reports·card_reports(들어온 제보 수)
 *   사업팀    DB에 남는 기록이 없다 → 늘 휴게실
 *
 * 개인정보는 읽지 않는다. 제보는 "몇 건"만 세고 내용은 가져오지 않는다.
 */

export type TeamId = "content" | "product" | "ops" | "biz";

export type OfficeEvent = {
  at: string; // ISO
  team: TeamId;
  text: string;
  /** 시각을 모르고 날짜만 아는 기록(예: 기관 확인일) */
  dateOnly?: boolean;
};

export type OfficeData = {
  day: string; // KST YYYY-MM-DD
  events: OfficeEvent[];
  counts: Record<TeamId, number>;
  sourcesMissing: string[];
};

const KST = 9 * 60 * 60 * 1000;
export function kstDay(d: Date = new Date()) {
  return new Date(d.getTime() + KST).toISOString().slice(0, 10);
}
function dayStartUtc(day: string) {
  return new Date(new Date(`${day}T00:00:00Z`).getTime() - KST).toISOString();
}
function dayEndUtc(day: string) {
  return new Date(new Date(`${day}T00:00:00Z`).getTime() - KST + 24 * 3600 * 1000).toISOString();
}

export async function fetchOffice(day: string): Promise<OfficeData> {
  const from = dayStartUtc(day);
  const to = dayEndUtc(day);
  const events: OfficeEvent[] = [];
  const sourcesMissing: string[] = [];

  // 콘텐츠팀 — 기관 명부
  const [newOrgs, checkedOrgs, newCards] = await Promise.all([
    supabase.from("orgs").select("name, created_at").gte("created_at", from).lt("created_at", to).limit(500),
    supabase.from("orgs").select("id", { count: "exact", head: true }).eq("last_checked", day),
    (supabaseAdmin ?? supabase)
      .from("programs")
      .select("title, created_at, status")
      .gte("created_at", from)
      .lt("created_at", to)
      .limit(100),
  ]);

  if (newOrgs.error) sourcesMissing.push("기관 명부");
  const orgRows = newOrgs.data ?? [];
  if (orgRows.length) {
    const last = orgRows.map((o) => o.created_at).sort().at(-1)!;
    events.push({
      at: last,
      team: "content",
      text: `새 기관 ${orgRows.length}곳을 명부에 넣었어요 (${orgRows.slice(0, 2).map((o) => o.name).join(", ")}${orgRows.length > 2 ? " 외" : ""})`,
    });
  }
  if ((checkedOrgs.count ?? 0) > 0) {
    events.push({
      at: `${day}T12:00:00+09:00`,
      team: "content",
      text: `기관 ${checkedOrgs.count}곳의 공고 게시판을 확인했어요`,
      dateOnly: true,
    });
  }
  for (const p of newCards.data ?? []) {
    events.push({
      at: p.created_at,
      team: "content",
      text: `새 카드 후보를 만들었어요 — ${p.title}${p.status === "pending" ? " (로드 확인 대기)" : ""}`,
    });
  }

  // 제품팀 — GitHub PR (공개 저장소, 키 없이 읽음. 5분마다 새로 읽음)
  try {
    const res = await fetch(
      "https://api.github.com/repos/kisse1532-afk/seedon/pulls?state=all&sort=updated&direction=desc&per_page=20",
      { headers: { Accept: "application/vnd.github+json" }, next: { revalidate: 300 } }
    );
    if (!res.ok) throw new Error(String(res.status));
    const prs = (await res.json()) as {
      number: number; title: string; created_at: string; merged_at: string | null;
    }[];
    for (const pr of prs) {
      if (pr.created_at >= from && pr.created_at < to)
        events.push({ at: pr.created_at, team: "product", text: `PR #${pr.number}을 올렸어요 — ${pr.title}` });
      if (pr.merged_at && pr.merged_at >= from && pr.merged_at < to)
        events.push({ at: pr.merged_at, team: "product", text: `PR #${pr.number}이 합쳐졌어요 — ${pr.title}` });
    }
  } catch {
    sourcesMissing.push("GitHub");
  }

  // 운영팀 — 숫자 세기·제보 (서버 키가 있어야 읽힘)
  if (supabaseAdmin) {
    const [landing, reports, cardReports] = await Promise.all([
      supabaseAdmin.from("landing_events").select("created_at, event_type").eq("source", "web")
        .gte("created_at", from).lt("created_at", to).limit(5000),
      supabaseAdmin.from("reports").select("created_at").gte("created_at", from).lt("created_at", to).limit(500),
      supabaseAdmin.from("card_reports").select("created_at").gte("created_at", from).lt("created_at", to).limit(500),
    ]);
    const lrows = landing.data ?? [];
    if (lrows.length) {
      const views = lrows.filter((r) => r.event_type === "start_view").length;
      const clicks = lrows.filter((r) => r.event_type === "start_fakedoor_click").length;
      events.push({
        at: lrows.map((r) => r.created_at).sort().at(-1)!,
        team: "ops",
        text: `광고 페이지 방문 ${views}번 · 「해 보기」 ${clicks}번을 셌어요`,
      });
    }
    const rcount = (reports.data?.length ?? 0) + (cardReports.data?.length ?? 0);
    if (rcount) {
      const last = [...(reports.data ?? []), ...(cardReports.data ?? [])].map((r) => r.created_at).sort().at(-1)!;
      events.push({ at: last, team: "ops", text: `제보·질문 ${rcount}건이 들어와서 받아 뒀어요` });
    }
  } else {
    sourcesMissing.push("서버 키(운영팀 숫자)");
  }

  events.sort((a, b) => (a.at < b.at ? 1 : -1));
  const counts: Record<TeamId, number> = { content: 0, product: 0, ops: 0, biz: 0 };
  for (const e of events) counts[e.team]++;
  return { day, events, counts, sourcesMissing };
}

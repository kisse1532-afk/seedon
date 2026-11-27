/**
 * 「맞춤 알림」 알림함에 알림을 만든다. 서버에서만.
 *
 * 학생 id는 응답·로그에 싣지 않는다. 몇 개 만들었는지만 돌려준다.
 *
 * TODO(푸시): 저장소에 웹 푸시도 Expo 푸시도 아직 없어서 알림함에만 쌓는다.
 * 푸시를 붙일 때는 insert가 새로 만든 줄에만 보내고, 기기 알림 허용 동의를
 * 따로 받고, 문구는 lib/alerts/notify-text.ts 것만 쓴다(잠금화면에 보인다).
 */
import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { findMatchingStudentIds } from "@/lib/alerts/match-students";
import { kstToday } from "@/lib/alerts/options";
import { REMIND_DAYS, sendNew, sendReminder, type AlertStore, type NotifyCard } from "@/lib/alerts/notify-core";

/** 한 번에 물어보는 학생 수. 주소(URL)가 너무 길어지지 않게. */
const CHUNK = 200;
const PAGE = 1000;

function chunks<T>(list: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += CHUNK) out.push(list.slice(i, i + CHUNK));
  return out;
}

type Page = PromiseLike<{ data: unknown; error: { message: string } | null }>;

async function readAll<T>(query: (from: number, to: number) => Page): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await query(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE) return out;
  }
}

function adminClient() {
  if (!supabaseAdmin) throw new Error("SUPABASE_SERVICE_ROLE_KEY가 없어 알림을 만들 수 없어요.");
  return supabaseAdmin;
}

function supabaseStore(): AlertStore {
  const db = adminClient();
  return {
    matchingIds: (card) => findMatchingStudentIds(card),

    async appliedIds(programId, userIds) {
      const applied = new Set<string>();
      for (const ids of chunks(userIds)) {
        const clicks = await readAll<{ user_id: string }>((from, to) =>
          db
            .from("program_events")
            .select("user_id")
            .eq("program_id", programId)
            .eq("event_type", "apply_link_click")
            .in("user_id", ids)
            .order("user_id")
            .range(from, to)
        );
        const registered = await readAll<{ user_id: string }>((from, to) =>
          db
            .from("applications")
            .select("user_id")
            .eq("program_id", programId)
            .in("user_id", ids)
            .order("user_id")
            .range(from, to)
        );
        for (const row of [...clicks, ...registered]) applied.add(row.user_id);
      }
      return applied;
    },

    async newAlertDates(programId, userIds) {
      const dates = new Map<string, string>();
      for (const ids of chunks(userIds)) {
        const { data, error } = await db
          .from("alert_notifications")
          .select("user_id, created_at")
          .eq("program_id", programId)
          .eq("kind", "new")
          .in("user_id", ids);
        if (error) throw new Error(error.message);
        for (const row of data) dates.set(row.user_id, kstToday(new Date(row.created_at)));
      }
      return dates;
    },

    async insert(rows) {
      let made = 0;
      for (const part of chunks(rows)) {
        const { data, error } = await db
          .from("alert_notifications")
          .upsert(part, { onConflict: "user_id,program_id,kind", ignoreDuplicates: true })
          .select("id");
        if (error) throw new Error(error.message);
        made += data.length;
      }
      return made;
    },
  };
}

/**
 * 카드를 게시한 직후에 부른다. 실패해도 게시는 그대로여야 해서 에러를 삼킨다
 * (빠진 알림은 매일 도는 작업이 48시간 안에 다시 챙긴다).
 */
export async function notifyPublished(programId: string): Promise<void> {
  try {
    const { data, error } = await adminClient().from("programs").select("*").eq("id", programId).maybeSingle();
    if (error) throw new Error(error.message);
    if (data) await sendNew(supabaseStore(), data as NotifyCard);
  } catch (e) {
    console.error("[notifyPublished] failed", programId, e instanceof Error ? e.message : e);
  }
}

export type DailyResult = { new: number; deadline: number; failed: number };

/** 하루 한 번: 최근 게시분의 빠진 알림을 챙기고, 마감 3일 전 알림을 만든다. */
export async function runDailyAlerts(now = new Date()): Promise<DailyResult> {
  const db = adminClient();
  const store = supabaseStore();
  const today = kstToday(now);
  const result: DailyResult = { new: 0, deadline: 0, failed: 0 };

  const each = async (cards: NotifyCard[], kind: "new" | "deadline") => {
    const send = kind === "new" ? sendNew : sendReminder;
    for (const card of cards) {
      try {
        result[kind] += await send(store, card, today);
      } catch (e) {
        result.failed += 1;
        console.error("[runDailyAlerts] failed", card.id, e instanceof Error ? e.message : e);
      }
    }
  };

  const since = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  const recent = await db.from("notices").select("program_id").gte("published_at", since).not("program_id", "is", null);
  if (recent.error) throw new Error(recent.error.message);
  if (recent.data.length) {
    const { data, error } = await db
      .from("programs")
      .select("*")
      .in("id", recent.data.map((n) => n.program_id));
    if (error) throw new Error(error.message);
    await each(data as NotifyCard[], "new");
  }

  const last = new Date(Date.parse(today) + REMIND_DAYS * 86_400_000).toISOString().slice(0, 10);
  const closing = await db
    .from("programs")
    .select("*")
    .eq("status", "published")
    .not("target_grades", "is", null)
    .gt("apply_deadline", today)
    .lte("apply_deadline", last);
  if (closing.error) throw new Error(closing.error.message);
  await each(closing.data as NotifyCard[], "deadline");

  return result;
}

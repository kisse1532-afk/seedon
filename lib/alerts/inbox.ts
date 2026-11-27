/** 학생 본인의 알림함 (브라우저에서, 본인 것만 — RLS). */
import { supabase } from "@/lib/supabase";

export type InboxItem = {
  id: string;
  programId: string;
  title: string;
  deadline: string | null;
  createdAt: string;
  read: boolean;
};

type Row = {
  id: string;
  program_id: string;
  created_at: string;
  read_at: string | null;
  programs: { title: string; status: string; apply_deadline: string | null } | null;
};

/** 내려간 카드의 알림은 보여주지 않는다. 읽기에 실패하면 에러를 던진다. */
export async function loadInbox(): Promise<InboxItem[]> {
  const { data, error } = await supabase
    .from("alert_notifications")
    .select("id, program_id, created_at, read_at, programs(title, status, apply_deadline)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data as unknown as Row[]).flatMap((row) =>
    row.programs?.status === "published"
      ? [
          {
            id: row.id,
            programId: row.program_id,
            title: row.programs.title,
            deadline: row.programs.apply_deadline,
            createdAt: row.created_at,
            read: Boolean(row.read_at),
          },
        ]
      : []
  );
}

export async function markRead(id: string): Promise<void> {
  await supabase.from("alert_notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
}

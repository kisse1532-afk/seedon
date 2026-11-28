import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { purgeNoticeSources, type DueNotice, type PurgeStore } from "@/lib/alerts/purge-core";

/** 하루 작업 한 번. 한 번에 상태별 500건까지, 남으면 다음 날 이어서 한다. */
export async function runNoticePurge() {
  const db = supabaseAdmin;
  if (!db) throw new Error("SUPABASE_SERVICE_ROLE_KEY가 없어요.");

  const store: PurgeStore = {
    async listDue(status, cutoff) {
      const { data, error } = await db
        .from("notices")
        .select("id, status, file_path")
        .eq("status", status)
        .is("source_purged_at", null)
        .lte(status === "published" ? "published_at" : "created_at", cutoff)
        .order("created_at")
        .limit(500);
      if (error) throw new Error(error.message);
      return data as DueNotice[];
    },
    async removeFile(path) {
      const { error } = await db.storage.from("notice-files").remove([path]);
      return !error;
    },
    async clearSource(notice, purgedAt) {
      const { error } = await db
        .from("notices")
        .update({ source_text: null, draft: null, file_path: null, source_purged_at: purgedAt, updated_at: purgedAt })
        .eq("id", notice.id)
        .eq("status", notice.status);
      return !error;
    },
  };

  return purgeNoticeSources(store);
}

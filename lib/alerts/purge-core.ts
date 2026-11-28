/**
 * 올린 공문 원본 30일 삭제 (2026.11.29 대표 결정).
 *
 * 기준 시각: 게시한 것은 게시한 때, 게시하지 않은 초안은 올린 때.
 * 비우는 것: 원문 글, 초안, 저장소의 PDF. 남기는 것: 누가·언제·상태·카드 연결.
 * 행은 지우지 않는다(저장소 규칙).
 *
 * DB를 직접 부르지 않고 store를 받는다 — 시험에서 가짜를 끼우려고.
 */
export const RETENTION_DAYS = 30;

/** 기준 시각이 이 값과 같거나 그 전이면 30일이 다 찼다. */
export function purgeCutoff(now: Date): string {
  return new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export type DueNotice = { id: string; status: "draft" | "published"; file_path: string | null };

export type PurgeStore = {
  /** 아직 안 비운 것 중, 상태가 status이고 기준 시각이 cutoff 이하인 것 */
  listDue(status: DueNotice["status"], cutoff: string): Promise<DueNotice[]>;
  /** 저장소에서 파일을 지운다. 이미 없으면 성공으로 친다. */
  removeFile(path: string): Promise<boolean>;
  /** 그 상태 그대로일 때만 원본 칸을 비우고 비운 시각을 남긴다. */
  clearSource(notice: DueNotice, purgedAt: string): Promise<boolean>;
};

export async function purgeNoticeSources(store: PurgeStore, now = new Date()) {
  const cutoff = purgeCutoff(now);
  const due = [...(await store.listDue("published", cutoff)), ...(await store.listDue("draft", cutoff))];

  let purged = 0;
  let failed = 0;
  for (const notice of due) {
    // 파일을 먼저 지운다. 실패하면 file_path를 남겨둬야 내일 다시 시도할 수 있다.
    const fileGone = !notice.file_path || (await store.removeFile(notice.file_path));
    if (fileGone && (await store.clearSource(notice, now.toISOString()))) purged++;
    else failed++;
  }
  return { purged, failed };
}

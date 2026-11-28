// 공문 원본 30일 삭제 시험
//   node --import ./scripts/lib/ts-alias.mjs scripts/test-purge.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { purgeCutoff, purgeNoticeSources } from "@/lib/alerts/purge-core";

const NOW = new Date("2027-01-31T00:00:00.000Z");
const DAY30 = "2027-01-01T00:00:00.000Z"; // 딱 30일 전

const row = (id, patch) => ({
  id, status: "published", created_at: "2026-01-01T00:00:00.000Z", published_at: DAY30,
  source_text: "원문", draft: {}, file_path: `d/${id}.pdf`, source_purged_at: null,
  created_by: "teacher-1", program_id: `alert-${id}`, ...patch,
});

function fakeStore(rows, { brokenFile } = {}) {
  const removed = [];
  return {
    removed,
    async listDue(status, cutoff) {
      const at = status === "published" ? "published_at" : "created_at";
      return rows.filter((r) => r.status === status && !r.source_purged_at && r[at] <= cutoff);
    },
    async removeFile(path) {
      if (path === brokenFile) return false;
      removed.push(path);
      return true;
    },
    async clearSource(notice, purgedAt) {
      Object.assign(rows.find((r) => r.id === notice.id), { source_text: null, draft: null, file_path: null, source_purged_at: purgedAt });
      return true;
    },
  };
}

test("기준 시각은 딱 30일 전", () => assert.equal(purgeCutoff(NOW), DAY30));

test("게시한 것: 30일이 차면 지우고, 1ms 모자라면 남긴다", async () => {
  const rows = [row("due", {}), row("early", { published_at: "2027-01-01T00:00:00.001Z" })];
  const store = fakeStore(rows);
  assert.deepEqual(await purgeNoticeSources(store, NOW), { purged: 1, failed: 0 });
  assert.deepEqual(store.removed, ["d/due.pdf"]);
  assert.equal(rows[0].source_text, null);
  assert.equal(rows[0].source_purged_at, NOW.toISOString());
  // 최소 기록은 남는다
  assert.equal(rows[0].created_by, "teacher-1");
  assert.equal(rows[0].program_id, "alert-due");
  assert.equal(rows[0].status, "published");
  assert.equal(rows[1].source_text, "원문");
});

test("게시한 것은 올린 날이 아니라 게시한 날부터 센다", async () => {
  const rows = [row("old-upload", { published_at: "2027-01-30T00:00:00.000Z" })];
  assert.equal((await purgeNoticeSources(fakeStore(rows), NOW)).purged, 0);
});

test("게시 안 한 초안: 올린 지 30일", async () => {
  const draft = (id, created_at) => row(id, { status: "draft", published_at: null, created_at, program_id: null });
  const rows = [draft("due", DAY30), draft("early", "2027-01-01T00:00:00.001Z")];
  assert.equal((await purgeNoticeSources(fakeStore(rows), NOW)).purged, 1);
  assert.equal(rows[0].source_text, null);
  assert.equal(rows[1].source_text, "원문");
});

test("PDF를 못 지우면 그 건은 비우지 않고 다음에 다시 한다", async () => {
  const rows = [row("a", {}), row("b", { file_path: null })];
  assert.deepEqual(await purgeNoticeSources(fakeStore(rows, { brokenFile: "d/a.pdf" }), NOW), { purged: 1, failed: 1 });
  assert.equal(rows[0].file_path, "d/a.pdf");
  assert.equal(rows[0].source_purged_at, null);
  assert.deepEqual(await purgeNoticeSources(fakeStore(rows), NOW), { purged: 1, failed: 0 });
  assert.deepEqual(await purgeNoticeSources(fakeStore(rows), NOW), { purged: 0, failed: 0 });
});

// 공개 키로 데이터가 바뀌지 않게 지키는 시험
//   node scripts/test-db-access.mjs
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));
const sources = ["app", "lib", "mobile/src"].flatMap((dir) =>
  readdirSync(join(root, dir), { recursive: true })
    .filter((f) => /\.tsx?$/.test(f))
    .map((f) => {
      const file = `${dir}/${f.replaceAll("\\", "/")}`;
      return { file, source: readFileSync(join(root, file), "utf8") };
    })
);

/* 공개 키 연결(supabase.)로 하는 쓰기. 남겨도 되는 것은 제보 「넣기」뿐이다. */
test("공개 키로 programs·community_posts·reports를 고치거나 지우는 코드가 없다", () => {
  const writes = [];
  for (const { file, source } of sources) {
    const pattern =
      /\bsupabase\s*\.from\(\s*["'](programs|community_posts|reports)["']\s*\)\s*\.(insert|update|upsert|delete)\b/g;
    for (const [, table, verb] of source.matchAll(pattern)) writes.push(`${file}: ${table}.${verb}`);
  }
  assert.deepEqual(writes.sort(), [
    "app/apply/[programId]/helper-question-actions.ts: reports.insert",
    "app/report/actions.ts: reports.insert",
  ]);
});

test("제보함 읽기는 서버 전용 키로만 한다", () => {
  const readers = sources
    .filter(({ source }) => /\bsupabase\s*\.from\(\s*["']reports["']\s*\)\s*\.select\b/.test(source))
    .map(({ file }) => file);
  assert.deepEqual(readers, []);
});

test("관리자 조회 함수는 로그인을 먼저 확인한다", () => {
  const source = readFileSync(join(root, "lib/queries-admin.ts"), "utf8");
  for (const name of [
    "fetchAllProgramsForAdmin",
    "fetchProgramForAdmin",
    "fetchReports",
    "fetchAllCommunityPosts",
    "fetchCommunityPostForAdmin",
  ]) {
    const body = source.split(`function ${name}(`)[1]?.split(/\nexport /)[0];
    assert.ok(body?.includes("await requireAdmin();"), name);
  }
  assert.match(readFileSync(join(root, "lib/admin-db.ts"), "utf8"), /await requireAdmin\(\);\s+if \(!supabaseAdmin\)/);
});

/* 마이그레이션이 넓은 정책을 다시 만들지 않는지. */
test("마이그레이션은 제보 넣기 정책 하나만 만든다", () => {
  const sql = readFileSync(join(root, "supabase/migrations/20261128_lock_public_writes.sql"), "utf8")
    .replace(/--.*$/gm, "");
  assert.equal(sql.match(/drop policy if exists/g).length, 12);
  const created = [...sql.matchAll(/create policy "([^"]+)" on public\.(\w+)\s+for (\w+)/g)].map((m) => m.slice(1));
  assert.deepEqual(created, [["public can submit pending report", "reports", "insert"]]);
  for (const kept of ["public read published programs", "community_posts_select_published"]) {
    assert.ok(!sql.includes(kept), kept);
  }
});

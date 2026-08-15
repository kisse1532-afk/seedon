/**
 * 점검 스크립트들이 쓰는 Supabase 접속 정보를 찾아준다.
 *
 * 왜 필요한가: 스크립트가 "환경변수가 필요해요"라고만 하고 끝나면, 매일 새로
 * 시작하는 데일리 에이전트는 거기서 막힌다. 어디서 얻는지를 같이 알려줘야 한다.
 *
 * 또 하나, 로컬에서 화면을 확인하려고 .env.local을 가짜 서버로 돌려놓는 일이
 * 있다(2026-08-15에 실제로 그랬다). 그 상태로 점검을 돌리면 프로그램이 0건으로
 * 나오는데, 그걸 "데이터가 다 날아갔다"로 착각하기 딱 좋다. 그래서 주소가
 * 로컬을 가리키면 진짜 서버가 아니라고 알려준다.
 */

import { readFileSync, existsSync } from "node:fs";

const PROJECT_ID = "ssxxqiwlywcgmgkdgmtz";
const isLocal = (u) => /127\.0\.0\.1|localhost|0\.0\.0\.0/.test(u || "");

/** .env.local에서 값을 읽는다(있으면). 셸에 이미 있는 값이 우선이다. */
function fromEnvFile() {
  const f = new URL("../../.env.local", import.meta.url).pathname;
  if (!existsSync(f)) return {};
  const out = {};
  for (const line of readFileSync(f, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

function bail(reason) {
  console.error(`\n${reason}\n`);
  console.error("이렇게 채우면 돼요:");
  console.error(`  export NEXT_PUBLIC_SUPABASE_URL="https://${PROJECT_ID}.supabase.co"`);
  console.error('  export NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon 키>"');
  console.error("");
  console.error(`anon 키는 Supabase MCP 도구로 얻어요 — get_publishable_keys(project_id: "${PROJECT_ID}")`);
  console.error("(.env.local 값은 로컬 확인용 가짜일 수 있으니 주소가 127.0.0.1이면 쓰지 말 것)");
  process.exit(1);
}

/** 진짜 Supabase 주소와 읽기 키를 돌려준다. 없으면 안내하고 끝낸다. */
export function requireSupabase() {
  const file = fromEnvFile();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || file.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || file.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) bail("Supabase 주소와 키가 없어요.");
  if (isLocal(url)) {
    bail(`지금 주소가 로컬(${url})이에요. 이건 화면 확인용 가짜 서버라 실제 프로그램이 안 보여요.`);
  }
  return { url, key };
}

/** --fix 처럼 쓰기가 필요한 곳에서 쓴다. 없으면 읽기 키로 대신한다. */
export function writeKey(readKey) {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || readKey;
}

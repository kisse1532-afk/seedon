/**
 * 등록된 프로그램 링크가 실제로 열리는지 점검한다.
 *
 * 왜 필요한가: "매일 최소 3건 링크를 열어 확인한다"는 규칙이 있었지만 사람이
 * 하나씩 눌러보는 방식이라 실제로는 잘 안 됐고, 그 사이 죽은 링크가 쌓였다
 * (2026-08-15 전수 점검에서 3건 발견 — 도메인 변경 1건, 인증서 불일치 1건,
 * www 없는 주소 연결 실패 1건).
 *
 * 쓰는 법:
 *   node scripts/check-links.mjs            # 게시된 것 전부
 *   node scripts/check-links.mjs --all      # 대기·반려까지 전부
 *
 * 필요한 환경변수: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * 클라우드 세션에서는 바깥으로 나가는 요청이 프록시를 거쳐야 하는데, Node의
 * fetch는 기본적으로 HTTPS_PROXY를 안 본다. 그대로 두면 전부 403으로 튕겨
 * "링크가 다 죽었다"는 잘못된 결과가 나오므로 여기서 직접 켜준다.
 *
 * ⚠️ 읽는 법 주의 — 실패했다고 다 죽은 링크가 아니다.
 * 기관 사이트 상당수가 데이터센터 IP를 막아서(방화벽·해외 접속 차단) 우리 쪽
 * 요청만 튕겨낸다. 실제 청소년의 폰에서는 멀쩡히 열린다. 그래서 결과를
 * DEAD(진짜 죽음)와 BLOCKED(우리만 못 봄)로 나눠서 보여준다.
 * BLOCKED는 링크를 갈아끼우지 말고 브라우저로 직접 확인할 것.
 */

if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY) {
  // 이 값은 Node가 시작할 때 읽으므로, 켜서 자기 자신을 한 번 다시 실행한다.
  const { spawnSync } = await import("node:child_process");
  const r = spawnSync(process.execPath, [...process.argv.slice(1)], {
    stdio: "inherit",
    env: { ...process.env, NODE_USE_ENV_PROXY: "1", NODE_NO_WARNINGS: "1" },
  });
  process.exit(r.status ?? 1);
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 가 필요해요.");
  process.exit(1);
}

const all = process.argv.includes("--all");
const query = all
  ? "select=id,title,link,link_kind,status&link=not.is.null"
  : "select=id,title,link,link_kind,status&status=eq.published&link=not.is.null";

const res = await fetch(`${url}/rest/v1/programs?${query}`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
if (!res.ok) {
  console.error("프로그램 목록을 못 읽었어요:", res.status, await res.text());
  process.exit(1);
}
const programs = await res.json();

/** 한 건을 확인한다. 리다이렉트를 따라가고 최종 주소를 같이 돌려준다. */
async function check(link) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 25_000);
  try {
    const r = await fetch(link, {
      redirect: "follow",
      signal: ac.signal,
      headers: { "User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9" },
    });
    return { status: r.status, finalUrl: r.url };
  } catch (e) {
    return { status: 0, error: String(e?.cause?.code || e?.message || e) };
  } finally {
    clearTimeout(timer);
  }
}

const dead = [];
const blocked = [];
const moved = [];
const ok = [];

for (const p of programs) {
  const r = await check(p.link);
  const row = { ...p, ...r };

  if (r.status >= 200 && r.status < 400) {
    // 최종 주소가 등록값과 다르면 도메인이 바뀌었을 수 있으니 따로 모은다.
    const same = r.finalUrl?.replace(/\/$/, "") === p.link.replace(/\/$/, "");
    (same ? ok : moved).push(row);
  } else if (r.status === 403 || r.status === 401 || r.status === 429) {
    // 방화벽이 우리 IP를 막은 것. 링크가 죽었다는 뜻이 아니다.
    blocked.push(row);
  } else if (r.status === 0) {
    // 주소를 찾을 수 없으면(DNS 실패) 도메인 자체가 없어진 것 — 진짜 죽었다.
    // 반면 연결이 끊기거나 시간이 초과된 건 "확인을 못 했다"는 뜻이지
    // "링크가 죽었다"는 증거가 아니다. 기관 사이트가 데이터센터 IP를 느리게
    // 처리하거나 막는 일이 흔해서, 같은 주소가 잠시 뒤엔 열리기도 한다.
    // 이걸 죽은 링크로 몰면 멀쩡한 프로그램을 내리게 된다.
    const gone = /ENOTFOUND|EAI_AGAIN|ERR_TLS|CERT/i.test(r.error || "");
    (gone ? dead : blocked).push(row);
  } else if (r.status === 404 || r.status === 410 || r.status >= 500) {
    dead.push(row);
  } else {
    blocked.push(row);
  }
}

function print(title, rows, hint) {
  if (rows.length === 0) return;
  console.log(`\n## ${title} (${rows.length}건)`);
  if (hint) console.log(`   ${hint}`);
  for (const r of rows) {
    console.log(`   - ${r.id} · ${r.title}`);
    console.log(`     ${r.link}`);
    if (r.finalUrl && r.finalUrl.replace(/\/$/, "") !== r.link.replace(/\/$/, ""))
      console.log(`     → 최종 도착: ${r.finalUrl}`);
    if (r.error) console.log(`     사유: ${r.error}`);
  }
}

console.log(`총 ${programs.length}건 점검 (${new Date().toISOString().slice(0, 10)})`);
print("고쳐야 함 — 링크가 안 열림", dead, "대체 주소를 찾아 갈아끼우고, 못 찾으면 status='pending'.");
print("주소가 바뀜 — 확인 후 갈아끼우기", moved, "최종 도착지가 맞으면 그 주소로 교체.");
print("확인 못 함 — 갈아끼우지 말 것", blocked, "기관 방화벽·응답 지연으로 우리 쪽에서만 안 열리는 경우. 브라우저로 직접 확인.");
console.log(`\n## 정상 ${ok.length}건`);

// 고쳐야 할 게 있으면 실패로 끝내 CI·스크립트에서 잡히게 한다.
process.exit(dead.length > 0 ? 1 : 0);

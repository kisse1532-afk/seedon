#!/usr/bin/env node
/**
 * 조사팀이 찾아온 기관을 명부(DB)에 한 번에 넣는다.
 *
 * 왜 만들었나 (2026.08.25)
 * -----------------------
 * 로드: *"조사팀한테 일단 42개의 카드는 냅두고, 조사할 기관들에 대해서 db를 만들라고 하고
 * 그거 맨날 가져오게 해줘. 그리고 2개는 너무 적지 않겠니 — 기관만 조사해서 db에 넣는 거니까
 * 최대한 많이 할 수 있도록 해."*
 *
 * 조사팀에게는 DB에 쓰는 도구가 없다(일부러 그렇게 뒀다 — 2026.08.19에 글자 깨진 페이지를 읽고
 * 없는 프로그램을 지어낸 사고가 있었다). 그래서 실장이 옮겨 적어야 하는데,
 * **하루에 수십 곳씩 들어오면 그 옮겨 적기가 곧 병목이 된다.**
 *
 * 그래서 조사팀이 정해진 형식으로 내면 **그대로 옮겨지게** 만든다.
 * 사람이 눈으로 보는 단계는 남긴다 — 무엇이 들어가는지 다 찍어주고,
 * `--sql`을 붙여야 넣는 파일이 만들어진다.
 *
 * 조사팀이 내는 형식 (한 줄에 한 기관, 탭 또는 `|`로 구분)
 *   이름 | 종류 | 지역 | 대문주소 | 공고주소 | 칸(쉼표로) | 메모
 *
 *   예) 성남시청소년재단 | 공공 | 경기 | https://www.snyouth.or.kr | https://www.snyouth.or.kr/notice | 문화체험,진로·취업 | 시 단위 재단
 *
 * ⚠️ 이 도구는 DB에 직접 쓰지 않는다. **넣는 SQL을 만들어준다.**
 *    명부(`orgs`)는 아무나 못 쓰게 잠겨 있고, 그건 그대로 두는 게 맞다 —
 *    열어두면 누구나 명부를 오염시킬 수 있다.
 *    대신 마이그레이션 파일로 뽑아서 실장이 눈으로 보고 적용한다.
 *    부수 효과로 **어느 기관이 언제 들어왔는지가 저장소에 영구히 남는다.**
 *
 * 쓰는 법
 *   node scripts/orgs-add.mjs docs/새기관.txt          # 뭐가 들어갈지 보기만
 *   node scripts/orgs-add.mjs docs/새기관.txt --sql    # 마이그레이션 파일로 뽑기
 *   cat 목록.txt | node scripts/orgs-add.mjs - --sql
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const argv = process.argv.slice(2);
const emit = argv.includes("--sql");
const src = argv.find((a) => !a.startsWith("--"));
if (!src) {
  console.log(`쓰는 법:
  node scripts/orgs-add.mjs <파일>          뭐가 들어갈지 보기만
  node scripts/orgs-add.mjs <파일> --sql    넣는 SQL을 마이그레이션 파일로 뽑기

  파일 형식 (한 줄에 한 기관):
  이름 | 종류 | 지역 | 대문주소 | 공고주소 | 칸(쉼표로) | 메모`);
  process.exit(1);
}

const raw = src === "-" ? readFileSync(0, "utf-8") : readFileSync(src, "utf-8");

/* 칸 이름을 DB가 쓰는 말로 바꾼다. 조사팀은 한국어로 쓰는 게 자연스럽다. */
const CAT = {
  "교육": "education", "심리상담": "counseling", "주거": "housing",
  "경제·생활비": "living", "경제생활비": "living", "생활비": "living",
  "진로·취업": "career", "진로취업": "career", "진로": "career",
  "문화체험": "culture", "문화": "culture",
  "공모전·대회": "contest", "공모전": "contest",
};

/* 이름에서 id를 만든다. 한글은 못 쓰므로 도메인에서 딴다.
   주소가 없는 곳(전화번호만 아는 자립지원관 등)은 지역+종류로 만든다 —
   `org`, `org-2`처럼 번호만 붙으면 나중에 아무도 뭐가 뭔지 모른다. */
const REGION = {
  서울:"seoul", 부산:"busan", 대구:"daegu", 인천:"incheon", 광주:"gwangju", 대전:"daejeon",
  울산:"ulsan", 세종:"sejong", 경기:"gyeonggi", 강원:"gangwon", 충북:"chungbuk", 충남:"chungnam",
  전북:"jeonbuk", 전남:"jeonnam", 경북:"gyeongbuk", 경남:"gyeongnam", 제주:"jeju", 전국:"kr",
};
const KIND = [
  ["자립지원관","jarip"], ["상담복지센터","counsel"], ["활동진흥센터","activity"],
  ["청소년재단","youthfnd"], ["수련관","training"], ["장학재단","scholar"],
  ["복지재단","welfare"], ["재단","fnd"], ["쉼터","shelter"], ["센터","center"],
];

function makeId(name, site, notice, region) {
  const host = (() => {
    try { return new URL(site || notice).hostname; } catch { return ""; }
  })();
  if (host) {
    // www, www2 같은 앞머리는 버린다 — 그걸 id로 쓰면 뭐가 뭔지 모른다
    // www·www2 같은 앞머리와 숫자만 있는 조각(1388.cbyouth.net의 "1388")은 버린다
    const parts = host.split(".").filter((x) => !/^www\d*$/.test(x) && !/^\d+$/.test(x));
    if (parts.length) return parts[0].slice(0, 40);
  }
  // 주소가 없으면 지역 + 종류로 만든다
  const r = REGION[region] || "kr";
  const k = KIND.find(([ko]) => name.includes(ko))?.[1] || "org";
  return `${r}-${k}`;
}

const rows = [];
const skipped = [];
for (const line of raw.split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#") || t.startsWith("이름")) continue;
  const c = t.split(/\s*[|\t]\s*/);
  if (c.length < 2) { skipped.push([t, "칸이 모자라요"]); continue; }
  const [name, org_type, region, site, notice_url, cats, note] = c;
  if (!name) { skipped.push([t, "이름이 없어요"]); continue; }

  const categories = (cats || "").split(/\s*,\s*/).map((x) => CAT[x] || null).filter(Boolean);
  rows.push({
    id: makeId(name, site, notice_url, region),
    name,
    org_type: org_type || "미상",
    region: region || "전국",
    categories: categories.length ? categories : null,
    site: site || null,
    notice_url: notice_url || null,
    reachable: /실장 확인 200/.test(note || "") ? "open"
             : /실장 확인 (503|연결 안 됨)/.test(note || "") ? "blocked"
             : "unknown",
    harvest_cycle: "monthly",
    programs_found: 0,
    note: note || null,
  });
}

// 같은 id가 여러 번 오면 뒤엣것에 번호를 붙인다
const used = new Map();
for (const r of rows) {
  const n = (used.get(r.id) ?? 0) + 1;
  used.set(r.id, n);
  if (n > 1) r.id = `${r.id}-${n}`;
}

console.log(`읽은 줄 ${rows.length}개${skipped.length ? ` · 건너뛴 줄 ${skipped.length}개` : ""}\n`);
for (const r of rows) {
  console.log(`  ${r.name} [${r.id}] · ${r.org_type} · ${r.region}` +
    `${r.notice_url ? " · 공고O" : " · 공고X"}${r.categories ? " · " + r.categories.join(",") : ""}`);
}
for (const [line, why] of skipped) console.log(`  ✕ ${why}: ${line.slice(0, 60)}`);

const q = (v) => (v == null ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const arr = (v) => (v == null ? "null" : `array[${v.map(q).join(",")}]::text[]`);

if (!emit) {
  console.log(`\n넣는 SQL을 뽑으려면 뒤에 --sql 을 붙이세요.`);
  console.log(`⚠️ 뽑기 전에 위 목록을 눈으로 한 번 보세요 — 이름이 이상하거나 주소가 빈 게 있으면 그 줄을 고치고 다시 돌리세요.`);
  process.exit(0);
}

const today = new Date().toISOString().slice(0, 10);
const stamp = today.replace(/-/g, "");
const out = `supabase/migrations/${stamp}_orgs_add.sql`;

const undoIds = rows.map((r) => "'" + r.id + "'").join(", ");
const body = rows.map((r) => `  (${[
  q(r.id), q(r.name), q(r.org_type), q(r.region), arr(r.categories),
  q(r.site), q(r.notice_url), q(r.reachable), q(r.harvest_cycle), q(r.note),
].join(", ")})`).join(",\n");

const sql = `-- ${today} — 조사팀이 찾아온 기관 ${rows.length}곳을 명부에 넣는다
--
-- 이 파일은 \`scripts/orgs-add.mjs\`가 만들었다. 조사팀이 낸 목록을 그대로 옮긴 것이다.
-- 명부는 아무나 못 쓰게 잠겨 있어서(그게 맞다) 마이그레이션으로만 들어간다.
--
-- 되돌리는 법:
--   delete from public.orgs where id in (${undoIds});

insert into public.orgs
  (id, name, org_type, region, categories, site, notice_url, reachable, harvest_cycle, note)
values
${body}
on conflict (id) do update set
  name         = excluded.name,
  org_type     = excluded.org_type,
  region       = excluded.region,
  categories   = coalesce(excluded.categories, public.orgs.categories),
  site         = coalesce(excluded.site, public.orgs.site),
  notice_url   = coalesce(excluded.notice_url, public.orgs.notice_url),
  note         = coalesce(excluded.note, public.orgs.note);
`;

mkdirSync("supabase/migrations", { recursive: true });
writeFileSync(out, sql);
console.log(`\n✅ ${out} 에 ${rows.length}곳을 넣는 SQL을 뽑았어요.`);
console.log(`   실장이 눈으로 보고 Supabase에 적용한 뒤 \`node scripts/org-sync.mjs\`를 돌리세요.`);

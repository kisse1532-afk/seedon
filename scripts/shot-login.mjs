#!/usr/bin/env node
/**
 * 로그인한 상태의 화면을 찍는다.
 *
 * 왜 만들었나 (2026.08.24)
 * -----------------------
 * 커뮤니티·북마크·맞춤추천 결과는 로그인해야 내용이 보인다. 그런데 8/18 이후
 * 그 상태를 **한 번도 못 찍었다.** 제작 관점은 매번 "코드로만 본 추정"이라고
 * 적을 수밖에 없었고, 화면점검표에도 "실장이 로그인 세션을 심어 찍어줘야 한다"가
 * 며칠째 그대로 남아 있었다.
 *
 * scripts/shot.mjs는 iframe 안에 넣어 찍기 때문에 로그인을 시킬 수가 없다.
 * 그래서 이 도구는 크롬을 직접 조종한다(원격 디버깅 연결).
 *
 * 어떻게 로그인시키나
 * -----------------
 * 씨드온은 세션을 브라우저 저장소(localStorage)에 둔다(lib/supabase.ts는
 * @supabase/supabase-js의 기본 브라우저 클라이언트다). 그래서
 *   1) 여기 Node에서 촬영용 계정으로 로그인해 세션을 받고
 *   2) 그 세션을 **페이지가 뜨기 전에** 브라우저 저장소에 심는다
 * 로그인 화면을 사람처럼 눌러 통과하는 것보다 훨씬 덜 깨진다.
 *
 * 촬영용 계정
 * ----------
 * `seedon_shot` — 사람이 쓰지 않는다. 비밀번호는 이 도구가 처음 돌 때
 * 무작위로 만들어 `.shot-account.json`에 두고, 그 파일은 저장소에 안 올라간다.
 * 이 계정은 `internal_emails`에 넣어둬서 **카드 성적표 집계에서 빠진다**
 * (20260824_shot_account_internal.sql + 20260824_exclude_internal_by_email.sql).
 * 뒤엣것이 왜 필요했나: 운영자 표시는 프로필이 만들어질 때 붙는데, 이 계정은
 * 가입만 하고 프로필을 안 만들어서 표시가 안 붙었다. 그래서 메일 주소 목록으로도
 * 직접 거르게 고쳤다.
 *
 * 쓰는 법
 *   NODE_USE_ENV_PROXY=1 node scripts/shot-login.mjs /community /bookmarks
 *   node scripts/shot-login.mjs /community --width 390 --out .shots
 */
import { execFile, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { join, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ssxxqiwlywcgmgkdgmtz.supabase.co";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_n7WGjrvj1vpLeG1qsdS8kw_ppUgzudu";
const PROJECT_REF = new URL(SUPABASE_URL).hostname.split(".")[0];
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;

const USERNAME = "seedon_shot";
const EMAIL = `${USERNAME}@id.seedon.app`;
const ACCOUNT_FILE = resolve(".shot-account.json");

// ── 옵션 ─────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const width = parseInt(flag("width", "390"), 10);
const tall = parseInt(flag("tall", "2600"), 10);
const outDir = resolve(flag("out", ".shots"));
const base = flag("base", "http://127.0.0.1:3000");
/* 로그인 안 한 상태로 찍고 싶을 때. 같은 기다림 규칙을 쓰므로
   "화면이 다 그려진 뒤의 비로그인 화면"을 볼 수 있다 — iframe으로 찍으면
   덜 그려진 채로 찍히는 일이 있었다(2026.08.24 마이페이지). */
const guest = argv.includes("--guest");
const paths = argv.filter((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"));

if (!paths.length) {
  console.log(`찍을 경로를 하나 이상 주세요.
  예: node scripts/shot-login.mjs /community /bookmarks /recommend/results`);
  process.exit(1);
}

function findChrome() {
  for (const root of [process.env.PLAYWRIGHT_BROWSERS_PATH, "/opt/pw-browsers"].filter(Boolean)) {
    if (!existsSync(root)) continue;
    for (const dir of readdirSync(root)) {
      const p = join(root, dir, "chrome-linux", "chrome");
      if (existsSync(p)) return p;
    }
  }
  for (const p of ["/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"]) {
    if (existsSync(p)) return p;
  }
  return null;
}

// ── 1. 촬영용 계정으로 로그인해 세션을 받는다 ────────────────
async function getSession() {
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let password = null;
  if (existsSync(ACCOUNT_FILE)) {
    try { password = JSON.parse(readFileSync(ACCOUNT_FILE, "utf-8")).password; } catch {}
  }

  if (password) {
    const { data, error } = await sb.auth.signInWithPassword({ email: EMAIL, password });
    if (!error && data.session) return data.session;
    console.log(`  저장된 비밀번호로 못 들어갔어요(${error?.message}). 새로 만들어 볼게요.`);
  }

  // 없거나 안 맞으면 새로 만든다
  password = randomBytes(18).toString("base64url");
  const { data, error } = await sb.auth.signUp({ email: EMAIL, password });
  if (error) {
    if (/already/i.test(error.message)) {
      console.log(`
촬영용 계정(${USERNAME})은 이미 있는데 비밀번호를 모릅니다.
  .shot-account.json이 지워졌거나 다른 곳에서 만든 계정이에요.
  Supabase 대시보드에서 그 계정을 지우고 다시 돌리면 됩니다.`);
    } else {
      console.log(`촬영용 계정을 못 만들었어요: ${error.message}`);
    }
    process.exit(1);
  }
  writeFileSync(ACCOUNT_FILE, JSON.stringify({ username: USERNAME, email: EMAIL, password }, null, 2));
  console.log(`  촬영용 계정을 새로 만들었어요 → .shot-account.json (저장소에 안 올라감)`);
  if (data.session) return data.session;

  const again = await sb.auth.signInWithPassword({ email: EMAIL, password });
  if (again.error || !again.data.session) {
    console.log(`계정은 만들었는데 로그인이 안 돼요: ${again.error?.message}`);
    process.exit(1);
  }
  return again.data.session;
}

// ── 2. 크롬을 원격 조종한다 (CDP) ───────────────────────────
function cdp(ws) {
  let id = 0;
  const waiting = new Map();
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && waiting.has(msg.id)) {
      const { ok, no } = waiting.get(msg.id);
      waiting.delete(msg.id);
      msg.error ? no(new Error(msg.error.message)) : ok(msg.result);
    }
  });
  return (method, params = {}, sessionId) =>
    new Promise((ok, no) => {
      const n = ++id;
      waiting.set(n, { ok, no });
      ws.send(JSON.stringify({ id: n, method, params, sessionId }));
      setTimeout(() => { if (waiting.delete(n)) no(new Error(`${method} 응답이 없어요`)); }, 45000);
    });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = findChrome();
if (!chrome) { console.log("크롬을 못 찾았어요."); process.exit(1); }

console.log(`크롬: ${chrome}`);
console.log(`저장: ${outDir}\n`);

const session = guest ? null : await getSession();
console.log(guest ? `  로그인 안 한 상태로 찍어요\n` : `  로그인 성공 — ${USERNAME}\n`);

mkdirSync(outDir, { recursive: true });
const profile = join(outDir, "_chrome-profile");
rmSync(profile, { recursive: true, force: true });
mkdirSync(profile, { recursive: true });

const port = 9222 + Math.floor(process.pid % 500);
const proc = execFile(chrome, [
  "--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
  "--no-first-run", "--no-default-browser-check", "--hide-scrollbars",
  `--window-size=${width},${tall}`, "about:blank",
]);
proc.on("error", (e) => { console.log(`크롬을 못 띄웠어요: ${e.message}`); process.exit(1); });

// 크롬이 뜰 때까지 기다린다
let wsUrl = null;
for (let i = 0; i < 40; i++) {
  await sleep(300);
  try {
    const r = await fetch(`http://127.0.0.1:${port}/json/version`);
    wsUrl = (await r.json()).webSocketDebuggerUrl;
    if (wsUrl) break;
  } catch {}
}
if (!wsUrl) { console.log("크롬이 안 떴어요."); proc.kill(); process.exit(1); }

const ws = new WebSocket(wsUrl);
await new Promise((ok, no) => {
  ws.addEventListener("open", ok, { once: true });
  ws.addEventListener("error", () => no(new Error("크롬에 연결 못 했어요")), { once: true });
});
const send = cdp(ws);

const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
const S = (m, p) => send(m, p, sessionId);

await S("Page.enable");
await S("Runtime.enable");
await S("Emulation.setDeviceMetricsOverride", {
  width, height: 900, deviceScaleFactor: 1, mobile: width < 700,
});

/* 세션을 페이지가 뜨기 전에 심는다. 페이지가 뜬 뒤에 심으면 앱이 이미
   "로그인 안 됨"으로 판단한 뒤라서 소용이 없다. */
if (!guest) {
const payload = JSON.stringify({
  access_token: session.access_token,
  refresh_token: session.refresh_token,
  expires_at: session.expires_at,
  expires_in: session.expires_in,
  token_type: session.token_type,
  user: session.user,
});
await S("Page.addScriptToEvaluateOnNewDocument", {
  source: `try{localStorage.setItem(${JSON.stringify(STORAGE_KEY)}, ${JSON.stringify(payload)})}catch(e){}`,
});
}

/* ── 브라우저 대신 Node가 바깥에 다녀온다 ────────────────────────
   이 환경의 크롬은 바깥으로 못 나간다(프록시를 못 씀 — scripts/shot.mjs 맨 위 주석).
   그래서 로그인한 척 해놔도 화면이 자기 정보를 못 읽어와서 영원히 "불러오는 중"에
   멈춘다. 2026.08.25에 북마크 화면이 텅 빈 걸 보고 "버그인가" 했는데,
   재보니 브라우저가 수파베이스에 못 닿는 것이었다.

   Node는 프록시를 쓸 수 있으니, 브라우저가 보내려는 요청을 가로채서
   Node가 대신 다녀오고 결과만 돌려준다. */
await S("Fetch.enable", {
  patterns: [{ urlPattern: "*supabase.co*", requestStage: "Request" }],
});

let inFlight = 0;   // 브라우저가 기다리고 있는 요청 수. 0이 돼야 화면이 다 그려진 것이다
const HOP = new Set(["host", "connection", "content-length", "accept-encoding"]);
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "access-control-expose-headers": "*",
};

ws.addEventListener("message", async (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.method !== "Fetch.requestPaused") return;
  const { requestId, request } = msg.params;
  inFlight++;
  const debug = (extra) => {
    if (process.env.SHOT_DEBUG) console.log(`    ↔ ${request.method} ${request.url.slice(0, 80)} ${extra}`);
  };

  // 미리 물어보는 요청(OPTIONS)은 그 자리에서 답해준다
  if (request.method === "OPTIONS") {
    await S("Fetch.fulfillRequest", {
      requestId, responseCode: 204,
      responseHeaders: Object.entries(CORS).map(([name, value]) => ({ name, value })),
    }).catch(() => {});
    inFlight--;
    return;
  }

  try {
    const headers = {};
    for (const [k, v] of Object.entries(request.headers)) {
      if (!HOP.has(k.toLowerCase())) headers[k] = v;
    }
    const res = await fetch(request.url, {
      method: request.method,
      headers,
      body: request.postData ?? undefined,
      redirect: "follow",
    });
    const buf = Buffer.from(await res.arrayBuffer());
    debug(`→ ${res.status} · ${buf.length}바이트`);
    const out = { ...CORS };
    for (const [k, v] of res.headers.entries()) {
      const lk = k.toLowerCase();
      if (lk === "content-encoding" || lk === "content-length" || lk.startsWith("access-control-")) continue;
      out[k] = v;
    }
    await S("Fetch.fulfillRequest", {
      requestId,
      responseCode: res.status,
      responseHeaders: Object.entries(out).map(([name, value]) => ({ name, value })),
      body: buf.toString("base64"),
    });
  } catch (e) {
    debug(`→ 실패: ${e.message}`);
    await S("Fetch.failRequest", { requestId, errorReason: "Failed" }).catch(() => {});
  } finally {
    inFlight--;
  }
});

const made = [];
for (const p of paths) {
  const url = p.startsWith("http") ? p : base + p;
  const name = (p.replace(/[?#].*$/, "").replace(/\/+$/, "").split("/").filter(Boolean).join("-") || "home");
  const file = join(outDir, `${name}-${width}-${guest ? "guest" : "login"}.png`);

  await S("Page.navigate", { url });
  await sleep(1200);

  /* 로그인 확인이 끝나야 내용이 나온다. 처음엔 "다 그려졌나"만 봤는데
     돌아가는 표시(스피너)가 도는 중에 찍혀서 빈 화면이 나왔다(2026.08.24).
     그래서 ① 스피너가 사라졌고 ② 글자 수가 더 안 늘어날 때까지 기다린다. */
  let last = -1, stable = 0;
  for (let i = 0; i < 40; i++) {
    const { result } = await S("Runtime.evaluate", {
      expression: `(()=>{
        const spinning = document.querySelector('.animate-spin, [role="status"], [aria-busy="true"]');
        return JSON.stringify({ spinning: !!spinning,
                                ready: document.readyState === 'complete',
                                len: (document.body?.innerText || '').length });
      })()`,
      returnByValue: true,
    });
    const st = JSON.parse(result.value);
    if (st.ready && !st.spinning && inFlight === 0 && st.len === last && st.len > 0) {
      if (++stable >= 2) break;
    } else {
      stable = 0;
    }
    last = st.len;
    await sleep(400);
  }
  await sleep(600);

  const { result: who } = await S("Runtime.evaluate", {
    expression: `(()=>{try{const r=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});return r?'로그인됨':'로그인 안 됨'}catch(e){return '못 읽음'}})()`,
    returnByValue: true,
  });

  /* 페이지 실제 높이를 재서 그만큼만 찍는다. 높이를 미리 크게 잡아두면
     크롬이 "폭 0"이라며 거절하는 일이 있다(2026.08.24에 겪음). */
  const metrics = await S("Page.getLayoutMetrics");
  const css = metrics.cssContentSize || metrics.contentSize;
  const h = Math.min(Math.max(Math.ceil(css?.height || 900), 200), tall);
  await S("Emulation.setDeviceMetricsOverride", {
    width, height: h, deviceScaleFactor: 1, mobile: width < 700,
  });
  await sleep(300);
  const { data } = await S("Page.captureScreenshot", {
    format: "png",
    clip: { x: 0, y: 0, width, height: h, scale: 1 },
  });
  writeFileSync(file, Buffer.from(data, "base64"));
  made.push({ file, state: who.value });
  console.log(`  ✅ ${name}-${width}-${guest ? "guest" : "login"}.png · ${who.value}`);
}

ws.close();
proc.kill();
/* 크롬이 완전히 죽기 전에 지우면 ENOTEMPTY로 도구 자체가 죽는다.
   찍은 그림은 이미 다 저장된 뒤라, 정리에 실패했다고 죽을 이유가 없다. */
await new Promise((r) => setTimeout(r, 500));
try {
  rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
} catch {
  /* 다음 실행이 어차피 새로 지우고 만든다 */
}

console.log(`\n${made.length}장 찍었어요.`);
console.log(`부서에게 이렇게 넘기세요 — "Read 도구로 아래 그림을 직접 보고 판단해라":`);
for (const m of made) console.log(`  ${m.file}`);
console.log(`\n⚠️ 이 계정이 누른 것은 카드 성적표에서 자동으로 빠집니다(internal_emails).`);

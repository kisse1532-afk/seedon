#!/usr/bin/env node
/**
 * 카톡 미리보기 카드에서 로고의 잎과 토글이 붙어 보이지 않는지 잰다.
 *
 * 왜 만들었나: 2026-08-16에 로드가 "잎이랑 버튼이 겹친다"고 네 번 지적했다.
 * 그때마다 1200px 원본을 눈으로 보고 "떨어져 있다"고 답했는데, 카톡은 이 그림을
 * **폭 370px로 줄여서** 보여준다. 그 크기에서는 원본의 간격이 1픽셀도 안 남고,
 * 게다가 잎(#72CF5E)과 토글(#2BBE8C)이 둘 다 초록이라 경계가 뭉개져 한 덩어리로
 * 보였다. 원본 크기로 확인한 게 처음부터 잘못이었다.
 *
 *   node scripts/check-og-logo.mjs                       # 배포된 것
 *   node scripts/check-og-logo.mjs http://localhost:3000 # 로컬 확인
 *   node scripts/check-og-logo.mjs ./어떤그림.png
 *
 * app/opengraph-image.tsx의 로고 좌표(LEAF_SHIFT 등)를 건드렸으면 반드시 이걸
 * 돌려볼 것. 눈으로 보고 판단하지 말 것 — 실제로 네 번 틀렸다.
 */
import { inflateSync } from "node:zlib";
import { readFileSync } from "node:fs";

if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY) {
  // 이 값은 Node가 시작할 때 읽으므로, 켜서 자기 자신을 한 번 다시 실행한다.
  // (check-links.mjs와 같은 방식)
  const { spawnSync } = await import("node:child_process");
  const r = spawnSync(process.execPath, [...process.argv.slice(1)], {
    stdio: "inherit",
    env: { ...process.env, NODE_USE_ENV_PROXY: "1", NODE_NO_WARNINGS: "1" },
  });
  process.exit(r.status ?? 1);
}

/** 카톡이 실제로 보여주는 카드 폭. 이 숫자가 이 검사의 핵심이다. */
const CARD_W = 370;
/** 이만큼은 떨어져 있어야 폰에서 두 덩어리로 보인다 (2026-08-16 실측 기준). */
const MIN_GAP = 8;

const SPROUT = [114, 207, 94]; // 잎
const PRIMARY = [43, 190, 140]; // 토글

// ── PNG 읽기 (라이브러리 없이) ────────────────────────────────────────────
function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("PNG 파일이 아니에요");
  let pos = 8;
  let w = 0;
  let h = 0;
  let colorType = 0;
  let bitDepth = 0;
  let interlace = 0;
  const idat = [];

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    pos += len + 12;
  }

  if (bitDepth !== 8) throw new Error(`8비트 그림만 읽을 수 있어요 (지금 ${bitDepth}비트)`);
  if (interlace !== 0) throw new Error("인터레이스 PNG는 못 읽어요");
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (!channels) throw new Error(`RGB/RGBA만 읽을 수 있어요 (colorType ${colorType})`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * channels;
  const out = Buffer.alloc(w * h * channels);

  // 스캔라인 필터 풀기 (PNG 규격 그대로)
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? cur[i - channels] : 0;
      const b = prev ? prev[i] : 0;
      const c = prev && i >= channels ? prev[i - channels] : 0;
      let v = line[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[i] = v & 0xff;
    }
  }
  return { w, h, channels, data: out };
}

/** 카톡이 줄여 보여주는 크기로 축소한다 (여러 픽셀을 평균 — 브라우저와 같은 방식). */
function shrink(img, targetW) {
  const scale = img.w / targetW;
  const h = Math.max(1, Math.round(img.h / scale));
  const out = new Uint8ClampedArray(targetW * h * 3);
  for (let y = 0; y < h; y++) {
    const y0 = Math.floor(y * scale);
    const y1 = Math.min(img.h, Math.max(y0 + 1, Math.floor((y + 1) * scale)));
    for (let x = 0; x < targetW; x++) {
      const x0 = Math.floor(x * scale);
      const x1 = Math.min(img.w, Math.max(x0 + 1, Math.floor((x + 1) * scale)));
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * img.w + xx) * img.channels;
          r += img.data[i];
          g += img.data[i + 1];
          b += img.data[i + 2];
          n++;
        }
      }
      const o = (y * targetW + x) * 3;
      out[o] = r / n;
      out[o + 1] = g / n;
      out[o + 2] = b / n;
    }
  }
  return { w: targetW, h, data: out };
}

const near = (r, g, b, [R, G, B], t = 26) =>
  Math.abs(r - R) < t && Math.abs(g - G) < t && Math.abs(b - B) < t;

// ── 본체 ─────────────────────────────────────────────────────────────────
const arg = process.argv[2] || "https://seedon.vercel.app";
let buf;
if (arg.startsWith("http")) {
  const url = arg.endsWith(".png") || arg.includes("opengraph-image")
    ? arg
    : `${arg.replace(/\/$/, "")}/opengraph-image`;
  console.log(`가져오는 곳: ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`못 가져왔어요 (HTTP ${res.status})`);
    process.exit(1);
  }
  buf = Buffer.from(await res.arrayBuffer());
} else {
  buf = readFileSync(arg);
}

const full = decodePng(buf);
const card = shrink(full, CARD_W);
console.log(`원본 ${full.w}×${full.h}px → 카톡 카드 크기 ${card.w}×${card.h}px로 줄여서 잽니다\n`);

const leaf = [];
const pill = [];
for (let y = 0; y < card.h; y++) {
  for (let x = 0; x < card.w; x++) {
    const i = (y * card.w + x) * 3;
    const [r, g, b] = [card.data[i], card.data[i + 1], card.data[i + 2]];
    if (near(r, g, b, SPROUT)) leaf.push([x, y]);
    else if (near(r, g, b, PRIMARY)) pill.push([x, y]);
  }
}

if (!leaf.length || !pill.length) {
  console.error(`로고를 못 찾았어요 (잎 ${leaf.length}px, 토글 ${pill.length}px).`);
  console.error("브랜드 색이 바뀌었으면 이 파일 위쪽 SPROUT·PRIMARY 값도 같이 고쳐야 해요.");
  process.exit(1);
}

let best = Infinity;
let at = null;
for (const [lx, ly] of leaf) {
  for (const [px, py] of pill) {
    const d = (lx - px) ** 2 + (ly - py) ** 2;
    if (d < best) {
      best = d;
      at = [lx, ly, px, py];
    }
  }
}
const gap = Math.sqrt(best);

// 사이에 배경(크림)이 실제로 보이는지 — 초록끼리 섞인 중간색만 있으면 붙어 보인다
let creamBetween = 0;
const steps = Math.ceil(gap * 2);
for (let s = 1; s < steps; s++) {
  const x = Math.round(at[0] + ((at[2] - at[0]) * s) / steps);
  const y = Math.round(at[1] + ((at[3] - at[1]) * s) / steps);
  const i = (y * card.w + x) * 3;
  if (card.data[i] > 230 && card.data[i + 1] > 222 && card.data[i + 2] > 205) creamBetween++;
}

console.log(`잎 ${leaf.length}px · 토글 ${pill.length}px`);
console.log(`잎-토글 최단 거리: ${gap.toFixed(2)}px  (필요: ${MIN_GAP}px 이상)`);
console.log(`사이에 낀 배경색 픽셀: ${creamBetween}개  (0이면 초록끼리 붙어 보여요)`);

if (gap >= MIN_GAP && creamBetween > 0) {
  console.log("\n✅ 폰에서 잎과 토글이 따로 보여요.");
} else {
  console.log("\n❌ 폰에서 한 덩어리로 보여요. app/opengraph-image.tsx의 LEAF_SHIFT를 더 벌리세요.");
  process.exit(1);
}

/**
 * 화면 캡처에서 필요한 부분만 잘라 브리핑에 바로 넣을 수 있게 만든다.
 *
 * 왜 필요한가 (2026.08.19)
 * -----------------------
 * 로드: "홈페이지에 바뀐게 뭔지 캡쳐 형식으로 보여줘"
 * 브리핑은 아티팩트(웹페이지)로 올라가는데, 아티팩트는 바깥 주소의 그림을
 * 못 불러온다. 그림을 글자로 바꿔서(data URI) 페이지 안에 통째로 넣어야 한다.
 * 통짜 캡처는 너무 커서, 볼 부분만 잘라 폭을 줄인다.
 *
 * 쓰기:
 *   node scripts/clip.mjs <그림파일> --box 상,좌,폭,높이 [--w 520] [--out 이름]
 *   node scripts/clip.mjs <그림파일> --find "찾을높이비율" ...
 *
 * 결과: .clips/<이름>.png 와 .clips/<이름>.txt (txt 안에 <img src="data:...">가 통째로)
 */

import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
if (!file) {
  console.error(`쓰는 법:
  node scripts/clip.mjs .shots/edu-01-390-light.png --box 300,0,390,420 --w 520 --out 카드-전
    --box  자를 자리: 위,왼쪽,폭,높이 (원본 픽셀 기준)
    --w    결과 폭 (기본 520). 클수록 선명하고 파일이 커진다
    --out  결과 이름 (기본 원본 이름)`);
  process.exit(1);
}
const val = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };

const outW = Number(val("--w", 520));
const name = val("--out", basename(file).replace(/\.png$/, ""));
const box = val("--box", null);

mkdirSync(".clips", { recursive: true });

let img = sharp(file);
const meta = await img.metadata();

if (box) {
  const [top, left, width, height] = box.split(",").map(Number);
  const safe = {
    top: Math.max(0, Math.min(top, meta.height - 1)),
    left: Math.max(0, Math.min(left, meta.width - 1)),
    width: Math.min(width, meta.width - left),
    height: Math.min(height, meta.height - top),
  };
  img = img.extract(safe);
}

const buf = await img.resize({ width: outW, withoutEnlargement: false })
  .png({ compressionLevel: 9, palette: true, quality: 88 })
  .toBuffer();

writeFileSync(`.clips/${name}.png`, buf);
const uri = `data:image/png;base64,${buf.toString("base64")}`;
writeFileSync(`.clips/${name}.txt`, `<img src="${uri}" alt="${name}">`);

const kb = Math.round(buf.length / 1024);
console.log(`.clips/${name}.png  ${outW}px · ${kb}KB`);
if (kb > 400) console.log(`  ⚠️  ${kb}KB는 큽니다. --w를 줄이거나 --box로 더 좁게 자르세요`);
console.log(`  브리핑에 넣을 때: .clips/${name}.txt 내용을 그대로 붙여넣으세요`);

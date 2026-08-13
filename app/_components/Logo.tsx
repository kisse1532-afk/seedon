/**
 * 씨드온 로고 — 브랜드 에셋 v1.0
 * 원본 SVG: public/brand/logo/ · 규칙: public/brand/BRAND.md
 *
 * 심볼(토글+새싹)은 원본 도형을 그대로 옮겼다. 규칙상 그라데이션·회전·
 * 비율 왜곡을 하지 않으므로 크기는 height 하나로만 조절한다.
 *
 * 노브(가운데 원)는 원본 기본형(seedon-symbol.svg)과 같은 흰색을 쓴다.
 * cream/dark 변형은 노브를 배경색으로 칠해 "뚫린 구멍"처럼 보이게 하지만,
 * 실제 화면에서는 토글 버튼이 아니라 배경이 파인 것처럼 읽혀 어색했다
 * (2026.08.13 로드 확인). 몸통·잎 색은 배경 톤에 따라 계속 나눈다.
 *
 * 워드마크("씨드온")를 원본 SVG의 <text>가 아니라 HTML 글자로 그리는 이유:
 * 원본은 Pretendard를 지정하는데 사이트에 그 폰트가 아직 없다. <img>로
 * 넣으면 SVG가 별도 문서라 페이지 폰트도 못 받아서 엉뚱한 폰트로 나온다.
 * Pretendard를 설치하기 전까지는 이 방식이 어긋남 없이 안전하다.
 */

type Tone = "dark" | "cream";

const TONE = {
  // 어두운 배경(헤더·푸터) 위
  dark: { body: "#5FDDA8", leaf: "#8FDC6A", knob: "#FFFFFF", text: "#FFFFFF" },
  // 크림 배경(본문, Cream #FAF6EE) 위
  cream: { body: "#2BBE8C", leaf: "#72CF5E", knob: "#FFFFFF", text: "#487A4E" },
} as const satisfies Record<Tone, Record<string, string>>;

export function SeedonSymbol({
  tone = "cream",
  height = 24,
  className,
}: {
  tone?: Tone;
  height?: number;
  className?: string;
}) {
  const c = TONE[tone];
  return (
    <svg
      viewBox="0 0 96 64"
      height={height}
      width={(height * 96) / 64}
      className={className}
      role="img"
      aria-label="씨드온"
    >
      <rect x="2" y="20" width="76" height="44" rx="22" fill={c.body} />
      <path d="M68 21 A24 24 0 0 1 92 2 A24 24 0 0 1 68 21 Z" fill={c.leaf} />
      <circle cx="56" cy="42" r="15" fill={c.knob} />
    </svg>
  );
}

/** 가로 조합형 — 심볼 + 워드마크 */
export default function Logo({
  tone = "cream",
  height = 24,
  className = "",
}: {
  tone?: Tone;
  height?: number;
  className?: string;
}) {
  const c = TONE[tone];
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <SeedonSymbol tone={tone} height={height} />
      <span
        className="font-bold tracking-tight"
        style={{ color: c.text, fontSize: height * 0.75 }}
      >
        씨드온
      </span>
    </span>
  );
}

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
 * <img>로 넣으면 SVG가 별도 문서라 페이지 폰트를 못 받아 엉뚱한 폰트로 나온다.
 * HTML 글자로 그리면 페이지에 깔린 Pretendard를 그대로 쓴다.
 * (2026.08.15에 Pretendard를 실제로 불러오도록 고쳤다 — layout.tsx 참고)
 */

type Tone = "dark" | "cream";

/** Pretendard Bold로 "씨드온"을 실제로 재서 얻은 값 (글자 크기 대비 비율). */
const INK = { ascent: 0.77, descent: 0.16, ink: 0.93, symbolInk: 0.97, fontRatio: 0.97 / 0.93 };

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
      viewBox="0 -3 99 67"
      height={height}
      width={(height * 99) / 67}
      className={className}
      role="img"
      aria-label="씨드온"
    >
      <rect x="2" y="20" width="76" height="44" rx="22" fill={c.body} />
      {/* 잎을 원본보다 위·오른쪽으로 3만큼 띄운다 (2026-08-16 로드 결정 B안).
          원본은 잎 끝이 토글 모서리에 닿아 있는데, 작게 줄면 둘이 뭉쳐서
          "겹쳐 보인다". 카톡 카드에서 실제로 그렇게 보였다.
          앱과 카드가 어긋나지 않게 양쪽 모두 같은 값을 쓴다
          (여기와 app/opengraph-image.tsx). 한쪽만 바꾸지 말 것. */}
      <path
        d="M68 21 A24 24 0 0 1 92 2 A24 24 0 0 1 68 21 Z"
        transform="translate(3,-3)"
        fill={c.leaf}
      />
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
  /* 글자 크기·위치는 눈으로 맞추지 말 것.
     예전엔 fontSize를 심볼 높이의 0.75로 두고 세로 가운데정렬만 했는데,
     그러면 글자가 심볼보다 확연히 작고 윗선·밑선이 서로 안 맞아 어색했다
     (2026.08.17 로드 지적).

     지금은 **글자의 실제 잉크 높이를 심볼 잉크 높이에 맞춘다.**
     - 심볼: viewBox(0 -3 99 67) 안에서 내용이 y=-1..64를 차지하므로
       잉크 높이는 상자의 0.97배이고, 잉크 밑선이 상자 밑선과 같다.
     - 글자: Pretendard Bold로 "씨드온"을 재보면 잉크 높이가 글자 크기의
       0.93배(윗선 0.77 위, 밑선 0.16 아래)다.
     그래서 fontSize = 0.97 × height ÷ 0.93 ≈ height × 1.043.
     밑선을 맞추려고 baseline 정렬 대신 아래를 기준으로 세우고 미세 보정한다.

     바꿀 일이 있으면 scratchpad/logofit.mjs로 재서 확인할 것. */
  const fontSize = height * INK.fontRatio;

  return (
    <span className={`inline-flex items-end gap-2 ${className}`}>
      <SeedonSymbol tone={tone} height={height} />
      <span
        className="font-bold tracking-tight"
        style={{
          color: c.text,
          fontSize,
          lineHeight: 1,
          // 글자 잉크 밑선(baseline 아래 0.16em)을 심볼 상자 밑선에 맞춘다.
          transform: `translateY(${(INK.descent * fontSize).toFixed(2)}px)`,
        }}
      >
        씨드온
      </span>
    </span>
  );
}

import { ImageResponse } from "next/og";

/**
 * 카톡·문자·SNS에 링크를 붙였을 때 뜨는 미리보기 그림.
 *
 * 왜 필요한가: 청소년이 씨드온을 알게 되는 경로는 대개 "선생님이 카톡으로
 * 링크를 보내주는 것"이다. 그런데 지금은 미리보기가 아예 없어서 주소 한 줄만
 * 뜬다(2026-08-16 확인, og 태그 0개). 받는 쪽에서는 이게 뭔지, 광고인지,
 * 눌러도 되는지 알 수 없어서 안 누른다.
 *
 * 그림 파일을 따로 두지 않고 코드로 그린다. 문구를 고치면 그림이 따라오고,
 * 브랜드 색이 바뀌어도 여기 한 곳만 고치면 된다.
 */
export const alt = "씨드온 — 몰라서 못 받는 지원을 찾아주는 곳";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 브랜드 v1.0 토큰 (public/brand/tokens.css와 같은 값)
const CREAM = "#FAF6EE";
const PRIMARY = "#2BBE8C";
const PRIMARY_DEEP = "#17916A";
const SPROUT = "#72CF5E";
const INK = "#2A2A24";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 92px",
          background: CREAM,
        }}
      >
        {/* 로고 — public/brand/logo/seedon-symbol-cream.svg의 좌표를 그대로 쓴다.
            처음엔 눈대중으로 그렸다가 잎이 토글 손잡이 위로 올라탔다(2026-08-16
            로드 확인). 브랜드 에셋이 있는데 다시 그릴 이유가 없다.
            노브는 배경색과 같아야 하므로 CREAM (BRAND.md 로고 규칙). */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <svg width="129" height="86" viewBox="0 0 96 64">
            <rect x="2" y="20" width="76" height="44" rx="22" fill={PRIMARY} />
            <path d="M68 21 A24 24 0 0 1 92 2 A24 24 0 0 1 68 21 Z" fill={SPROUT} />
            <circle cx="56" cy="42" r="15" fill={CREAM} />
          </svg>
          <span style={{ fontSize: 50, fontWeight: 800, color: PRIMARY_DEEP }}>씨드온</span>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 62,
            fontWeight: 800,
            color: INK,
            lineHeight: 1.28,
            marginTop: 44,
            letterSpacing: "-0.02em",
          }}
        >
          몰라서 못 받는 지원,
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 62,
            fontWeight: 800,
            color: PRIMARY_DEEP,
            lineHeight: 1.28,
            letterSpacing: "-0.02em",
          }}
        >
          여기서 찾아보세요
        </div>

        <div style={{ display: "flex", fontSize: 30, color: "#6B6B60", marginTop: 34 }}>
          교육 · 심리상담 · 주거 · 생활비 · 진로 · 문화체험 · 공모전
        </div>
      </div>
    ),
    size
  );
}

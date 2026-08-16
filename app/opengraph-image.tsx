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

/**
 * 새싹 잎.
 *
 * 원본 브랜드 SVG는 이 모양을 호(`A`) 명령으로 그리는데, 그림을 만드는 도구가
 * 브라우저와 다르게 그려서 잎이 토글 오른쪽 위 모서리를 파고들었다
 * (2026-08-16 로드가 두 번 지적). 좌표는 맞는데 곡선 해석이 달랐던 것.
 *
 * 그래서 브라우저가 실제로 그리는 곡선 위의 점을 48개 뽑아 직선으로 이었다.
 * 이 크기에서는 곡선으로 보이고, 무엇보다 **어떤 도구로 그려도 같은 모양**이 된다.
 * 좌표를 손으로 고치지 말 것 — 원본 SVG가 바뀌면 다시 뽑아야 한다.
 */
const LEAF =
  "M68 21L68.326 19.656L68.729 18.333L69.207 17.035L69.76 15.768L70.384 14.534" +
  "L71.079 13.338L71.843 12.185L72.671 11.077L73.562 10.02L74.512 9.015" +
  "L75.519 8.066L76.578 7.177L77.686 6.35L78.84 5.588L80.036 4.894L81.27 4.27" +
  "L82.538 3.717L83.836 3.239L85.159 2.837L86.503 2.512L87.864 2.265" +
  "L89.237 2.098L90.617 2.009L92 2L91.674 3.344L91.271 4.667L90.793 5.965" +
  "L90.24 7.232L89.616 8.466L88.921 9.662L88.157 10.815L87.329 11.923" +
  "L86.438 12.98L85.488 13.985L84.481 14.934L83.422 15.823L82.314 16.65" +
  "L81.16 17.412L79.964 18.106L78.73 18.73L77.462 19.283L76.164 19.761" +
  "L74.841 20.163L73.497 20.488L72.136 20.735L70.763 20.902L69.383 20.991Z";

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
        {/* 로고 — public/brand/logo/seedon-symbol-cream.svg와 같은 좌표.
            노브는 배경색과 같아야 하므로 CREAM (BRAND.md 로고 규칙). */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <svg width="129" height="86" viewBox="0 0 96 64">
            <rect x="2" y="20" width="76" height="44" rx="22" fill={PRIMARY} />
            <path d={LEAF} fill={SPROUT} />
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

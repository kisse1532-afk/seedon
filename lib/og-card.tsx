/**
 * 카톡·문자·SNS에 링크를 붙였을 때 뜨는 미리보기 그림.
 *
 * 왜 필요한가: 청소년이 씨드온을 알게 되는 경로는 대개 "선생님이 카톡으로
 * 링크를 보내주는 것"이다. 미리보기가 없으면 주소 한 줄만 떠서, 받는 쪽에서는
 * 이게 뭔지·광고인지·눌러도 되는지 알 수 없어 안 누른다.
 *
 * 그림 파일을 따로 두지 않고 코드로 그린다. 문구를 고치면 그림이 따라오고,
 * 브랜드 색이 바뀌어도 여기 한 곳만 고치면 된다.
 *
 * 이 파일은 그리기만 한다. 실제로 내보내는 곳은 둘이다:
 *   - app/og/[v]/card.png/route.tsx  ← 카톡이 실제로 가져가는 주소
 *   - app/opengraph-image/route.tsx   ← 카톡이 예전에 기억해간 옛 주소
 */
import type { ReactElement } from "react";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT = "씨드온 — 몰라서 못 받는 지원을 찾아주는 곳";

/**
 * 그림 주소에 들어가는 판 번호. **그림을 고쳤으면 이 숫자를 반드시 올릴 것.**
 *
 * 왜 주소에 번호를 넣나: 카톡은 한 번 가져간 그림을 주소 기준으로 오래 기억한다.
 * Next가 기본으로 붙여주는 `?해시`는 카톡이 무시하는 것으로 보인다 — 내용을
 * 두 번 바꾸고 카카오 캐시 초기화까지 했는데도 예전 그림이 계속 떴다
 * (2026-08-16 로드 확인). 그래서 주소의 **경로 자체**가 바뀌게 만들었다.
 * `/og/v4/card.png` → `/og/v5/card.png`가 되면 카톡에게는 처음 보는 그림이다.
 */
export const OG_VERSION = "v5";
export const OG_IMAGE_PATH = `/og/${OG_VERSION}/card.png`;

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

/**
 * 로고 크기와 잎 간격.
 *
 * 이 셋은 같이 움직인다. 로고를 줄이면 잎-토글 간격도 같은 비율로 줄어서, 카톡
 * 카드 크기(폭 370px)에서 다시 붙어 보이게 된다. **하나만 고치지 말 것.**
 * 고쳤으면 `node scripts/check-og-logo.mjs`로 실제 카드 크기에서 다시 재볼 것 —
 * 눈으로 보고 판단해서 네 번 틀렸다(2026-08-16).
 *
 * 화면 안 로고(app/_components/Logo.tsx)는 원본 좌표 그대로 둔다. 이 예외는
 * 줄여서 보여주는 미리보기 그림에만 필요하다.
 */
const LOGO_W = 136; // 토글 높이가 글자 "씨드온"(76px)과 비슷해지는 크기
const VIEWBOX = { x: 0, y: -12, w: 110, h: 76 };
const LOGO_H = Math.round((LOGO_W * VIEWBOX.h) / VIEWBOX.w);
const LEAF_SHIFT = "translate(9.5,-8.5)";
const LEAF_HALO = 4.8; // 잎 둘레 크림색 띠 두께 (viewBox 단위)

export function ogCard(): ReactElement {
  return (
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
      <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
        <svg
          width={LOGO_W}
          height={LOGO_H}
          viewBox={`${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`}
        >
          <rect x="2" y="20" width="76" height="44" rx="22" fill={PRIMARY} />
          {/* 잎 밑에 크림색을 한 겹 더 깔아 토글과 사이에 밝은 띠를 만든다.
              이게 없으면 두 색(#2BBE8C·#72CF5E)이 둘 다 초록이라, 카톡 카드
              크기(폭 370px)로 줄어들 때 경계가 뭉개져 한 덩어리로 보인다.
              간격을 벌리는 것만으로는 안 됐다 — 실제로 5.8px 떨어져 있는데도
              로드가 "겹친다"고 네 번 지적했다. */}
          <path
            d={LEAF}
            transform={LEAF_SHIFT}
            fill={CREAM}
            stroke={CREAM}
            strokeWidth={LEAF_HALO}
            strokeLinejoin="round"
          />
          <path d={LEAF} transform={LEAF_SHIFT} fill={SPROUT} />
          <circle cx="56" cy="42" r="15" fill={CREAM} />
        </svg>
        <span style={{ fontSize: 76, fontWeight: 800, color: PRIMARY_DEEP }}>씨드온</span>
      </div>

      <div
        style={{
          display: "flex",
          fontSize: 62,
          fontWeight: 800,
          color: INK,
          lineHeight: 1.28,
          marginTop: 34,
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
  );
}

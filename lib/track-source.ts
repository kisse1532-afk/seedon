/**
 * 이 기록이 "실제 사이트에서 온 것"인지 "우리가 만든 것"인지 판단한다.
 *
 * 왜 필요한가 (2026.08.19)
 * -----------------------
 * `scripts/shot.mjs`가 화면을 찍을 때 진짜 크롬을 띄운다. 그러면 자바스크립트가
 * 돌면서 "카드를 봤다" 기록이 남는데, 로컬에서 찍어도 바라보는 데이터베이스는
 * 실서비스와 같은 곳이라 집계에 섞인다.
 *
 * 8월 16일에도 같은 종류의 사고가 있었다 — 검색봇과 카톡 미리보기까지
 * "청소년이 봤다"로 세어져 96건을 통째로 버렸다. 그때는 서버에서 세던 것을
 * 브라우저로 옮겨 막았고, 이번엔 어디서 열렸는지를 같이 남겨 막는다.
 *
 * 로드가 로그인하고 누른 것은 여기서 못 거른다 — 그건 계정에 표시해서
 * 데이터베이스 쪽에서 뺀다(`user_profiles.is_internal`).
 */
export function trackSource(): "web" | "internal" {
  if (typeof window === "undefined") return "internal";
  const h = window.location.hostname;
  const local =
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "::1" ||
    h.endsWith(".local") ||
    /^192\.168\./.test(h) ||
    /^10\./.test(h) ||
    /^0\.0\.0\.0$/.test(h);
  return local ? "internal" : "web";
}

/**
 * 로그인하러 보내기 전에 "원래 가려던 곳"을 기억해둔다.
 *
 * 이게 없으면 북마크를 보려다 로그인한 사람이 마이페이지에 떨어진다. 자기가
 * 뭘 하려고 했는지 다시 찾아 들어가야 하고, 그 한 단계에서 그냥 나가버린다.
 *
 * 주소창(?next=)이 아니라 브라우저 임시 저장소를 쓴다. 로그인은 이메일 입력 →
 * 약관 → 완료처럼 화면을 여러 번 거치는데, 그 전부에 파라미터를 손으로 이어
 * 붙이면 한 군데만 빠뜨려도 조용히 사라진다. 탭을 닫으면 같이 지워진다.
 */
const KEY = "seedon_next";

/** 앱 안의 경로만 받는다. 바깥 주소를 그대로 넣어두면 로그인 직후 남의 사이트로 튕길 수 있다. */
export function rememberNext(path: string): void {
  if (typeof window === "undefined") return;
  if (!path.startsWith("/") || path.startsWith("//")) return;
  sessionStorage.setItem(KEY, path);
}

/** 꺼내면서 지운다. 한 번 쓰고 남아 있으면 다음 로그인 때 엉뚱한 데로 간다. */
export function takeNext(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const saved = sessionStorage.getItem(KEY);
  sessionStorage.removeItem(KEY);
  return saved && saved.startsWith("/") && !saved.startsWith("//") ? saved : fallback;
}

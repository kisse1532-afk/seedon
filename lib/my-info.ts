/**
 * "내 정보" — 한 번 입력하면 다음부터 자동으로 채워지는 이름·연락처.
 *
 * 왜 만들었나 (2026.08.16 로드 지시, 원스톱 1단계):
 * 지금은 프로그램마다 이름·연락처를 처음부터 다시 쓴다. 청소년이 여러 개를
 * 신청하려면 그때마다 같은 걸 또 적어야 하고, 거기서 그만두게 된다.
 *
 * 왜 브라우저에만 저장하나:
 * 1. **대부분 로그인을 안 한다.** 신청은 로그인 없이도 되게 만들어놨다
 *    (막으면 거기서 나가버리기 때문). 계정에만 저장하면 정작 대부분에게
 *    아무 도움이 안 된다.
 * 2. **새 개인정보 보관처를 만들지 않기 위해서.** 이름·연락처를 DB에 한 벌 더
 *    쌓아두는 대신, 그 폰 안에만 둔다. 서버로 나가지 않는다.
 *
 * 절대규칙 2: 여기에 소득·자격·가정환경 같은 항목을 절대 추가하지 말 것.
 * 이름과 연락처는 "연락할 방법"이지 "자격을 가리는 정보"가 아니라서 담는다.
 */

const KEY = "seedon.myinfo.v1";

/**
 * 저장된 값이 바뀌었다고 알리는 신호.
 *
 * 왜 필요한가 (2026.08.17 디자인팀 지적으로 발견):
 * 신청 상세 화면에는 이 정보를 쓰는 폼이 **둘** 있다(관심 등록, 도움 요청).
 * 각자 자기 state에 값을 들고 있어서, 한쪽에서 "지우기"를 눌러도 다른 쪽 칸에는
 * 그대로 남아 있었다. 거기서 등록을 누르면 다시 저장돼 **방금 지운 게 되살아났다.**
 * "지운다"고 적어놓고 안 지워지는 건 몰래 갖고 있는 것보다 신뢰를 더 깎는다.
 */
const CHANGED = "seedon:myinfo-changed";

function announce(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CHANGED));
}

/** 저장·삭제가 일어나면 알려준다. 해제 함수를 돌려주므로 useEffect에서 그대로 쓴다. */
export function onMyInfoChange(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGED, handler);
  // 다른 탭에서 지운 경우도 같이 반영한다.
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGED, handler);
    window.removeEventListener("storage", handler);
  };
}

export type MyInfo = {
  name: string;
  contact: string;
  /** 저장 시각. "언제 저장한 건지" 화면에 말해주기 위한 것. */
  savedAt: string;
};

function canUse(): boolean {
  // 서버 렌더 중에는 window가 없다. 사파리 시크릿 모드 등에서 localStorage
  // 접근 자체가 예외를 던지는 경우가 있어 실제로 읽어봐야 안다.
  if (typeof window === "undefined") return false;
  try {
    const probe = "__seedon_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/** 저장된 내 정보. 없거나 못 읽으면 null. */
export function loadMyInfo(): MyInfo | null {
  if (!canUse()) return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MyInfo>;
    const name = typeof parsed.name === "string" ? parsed.name.trim() : "";
    const contact = typeof parsed.contact === "string" ? parsed.contact.trim() : "";
    if (!name || !contact) return null;
    return {
      name,
      contact,
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : "",
    };
  } catch {
    // 저장된 값이 깨졌으면 없는 것으로 친다. 여기서 예외가 나면 신청 화면
    // 자체가 안 뜨는데, 그건 자동 채움이 안 되는 것보다 훨씬 나쁘다.
    return null;
  }
}

/** 신청이 성공한 뒤에만 부른다. 실패한 입력을 저장해두면 다음에 또 틀린다. */
export function saveMyInfo(name: string, contact: string): void {
  if (!canUse()) return;
  const trimmedName = name.trim();
  const trimmedContact = contact.trim();
  if (!trimmedName || !trimmedContact) return;
  try {
    const value: MyInfo = {
      name: trimmedName,
      contact: trimmedContact,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(KEY, JSON.stringify(value));
    announce();
  } catch {
    // 저장 못 해도 신청은 이미 끝났다. 조용히 넘어간다.
  }
}

/** 저장된 정보를 지운다. 이 길이 화면에 보여야 한다 — 미성년자 정보다. */
export function clearMyInfo(): void {
  if (!canUse()) return;
  try {
    window.localStorage.removeItem(KEY);
    announce();
  } catch {
    /* 지울 게 없으면 그만이다 */
  }
}

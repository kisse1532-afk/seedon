/**
 * 아이디로 가입·로그인하기.
 *
 * 왜 이메일이 아니라 아이디인가 (2026.08.17 로드 지시):
 * 청소년이 쓰는 서비스인데 이메일을 요구하면 거기서 멈춘다. 메일 주소가
 * 없거나, 있어도 부모 계정이거나, 확인 메일이 스팸함으로 가면 못 들어온다.
 * 아이디는 그 자리에서 정하면 끝이다.
 *
 * 어떻게 만드나: Supabase 인증은 이메일을 요구하므로, 아이디를
 * `아이디@id.seedon.app` 형태의 **내부용 주소**로 바꿔서 넘긴다.
 * 청소년에게는 이 주소를 보여주지 않는다 — 화면에서는 끝까지 "아이디"다.
 *
 * 대신 잃는 것: **비밀번호를 잊으면 메일로 못 찾는다.** 실제 메일함이
 * 없기 때문이다. 나중에 "비밀번호 찾기"가 필요해지면 별도 방법
 * (관리자 재설정 등)을 만들어야 한다. 지금은 그 기능 자체가 없다.
 */

/** 내부용 주소의 도메인. 실제로 메일이 오가지 않는 자리표시용이다. */
const ID_DOMAIN = "id.seedon.app";

/** 아이디 규칙: 영문 소문자·숫자·밑줄, 4~20자, 첫 글자는 영문. */
const RULE = /^[a-z][a-z0-9_]{3,19}$/;

export const USERNAME_HINT = "영문 소문자로 시작하고, 영문·숫자·밑줄만 4~20자";

/** 사람이 대문자나 공백을 섞어 써도 받아준다. 저장은 항상 소문자다. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** 규칙에 맞으면 null, 아니면 무엇이 잘못됐는지 청소년이 읽을 말로 돌려준다. */
export function checkUsername(raw: string): string | null {
  const id = normalizeUsername(raw);
  if (!id) return "아이디를 적어주세요.";
  if (id.includes("@")) return "이메일 말고 아이디를 적어주세요. 예: seedon_kim";
  if (id.length < 4) return "아이디는 4자 이상으로 만들어주세요.";
  if (id.length > 20) return "아이디는 20자까지 쓸 수 있어요.";
  if (!/^[a-z]/.test(id)) return "아이디는 영문으로 시작해야 해요. 예: seedon_kim";
  if (!RULE.test(id)) return "아이디에는 영문·숫자·밑줄(_)만 쓸 수 있어요. 예: seedon_kim";
  return null;
}

/** 아이디 → Supabase에 넘길 내부용 주소. */
export function usernameToEmail(raw: string): string {
  return `${normalizeUsername(raw)}@${ID_DOMAIN}`;
}

/** 내부용 주소 → 아이디. 마이페이지에서 "내 아이디"를 보여줄 때 쓴다. */
export function emailToUsername(email: string | null | undefined): string | null {
  if (!email) return null;
  const [id, domain] = email.split("@");
  return domain === ID_DOMAIN ? id : null;
}

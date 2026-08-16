import { supabase } from "@/lib/supabase";

/**
 * 가입 시 받은 동의를 기록한다.
 *
 * 왜 필요한가: 동의 화면은 처음부터 있었지만 체크만 받고 아무 데도 저장하지
 * 않았다(2026-08-15 로드 지적). 동의는 "받았다는 사실을 남겨야" 의미가 있다 —
 * 나중에 무엇에 언제 동의했는지 확인할 수 없으면 받지 않은 것과 같다.
 */

// 버전은 약관 본문과 같은 곳(lib/policy.ts)에서 관리한다. 두 군데 두면
// 내용은 바뀌었는데 버전은 그대로인 상태가 생긴다.
export { POLICY_VERSION } from "@/lib/policy";
import { POLICY_VERSION as VERSION } from "@/lib/policy";

export type Consent = {
  terms: boolean;
  privacy: boolean;
  marketing: boolean;
  /** 만 14세 이상임을 본인이 확인(절대규칙 4). 생년월일은 받지 않는다. */
  age14: boolean;
};

/**
 * 동의 내용을 저장한다. 로그인 전이면 브라우저에 잠깐 맡겨뒀다가
 * 로그인 완료 시점에 올린다 — 가입 흐름 중간에는 아직 세션이 없을 수 있다.
 */
const PENDING_KEY = "seedon_pending_consent";

export async function saveConsent(consent: Consent): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;

  if (!userId) {
    if (typeof window !== "undefined") {
      localStorage.setItem(PENDING_KEY, JSON.stringify(consent));
    }
    return;
  }

  await supabase.from("user_profiles").upsert(
    {
      user_id: userId,
      agreed_terms: consent.terms,
      agreed_privacy: consent.privacy,
      agreed_marketing: consent.marketing,
      confirmed_age_14: consent.age14,
      agreed_at: new Date().toISOString(),
      policy_version: VERSION,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (typeof window !== "undefined") localStorage.removeItem(PENDING_KEY);
}

/**
 * 회원 정보.
 *
 * 개인정보보호법 최소수집 원칙에 맞춰 목적이 분명한 것만 받는다.
 * - 몇 년생: 만 14세 확인(법정대리인 동의 기준)과 나이 조건 프로그램 안내 — 필수
 * - 별명·사는 지역: 안 적어도 서비스를 쓸 수 있다 — 선택
 *
 * 실명·주민번호·주소·학교명·연락처는 받지 않는다. 소득이나 급식카드 여부는
 * 절대규칙 2에 따라 앞으로도 받지 않는다.
 */
export type MemberProfile = {
  /** 어른 계정은 몇 년생인지를 받지 않으므로 없을 수 있다. */
  birthYear: number | null;
  birthdayPassed: boolean | null;
  nickname: string;
  region: string;
};

export async function saveMemberProfile(profile: MemberProfile): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return false;

  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: userId,
      birth_year: profile.birthYear,
      birthday_passed: profile.birthdayPassed,
      // 선택 항목은 안 적으면 빈 값이 아니라 "없음"으로 둔다. 빈 문자열을 넣으면
      // "적었는데 지웠다"와 "처음부터 안 적었다"를 구분할 수 없다.
      nickname: profile.nickname.trim() || null,
      region: profile.region || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  return !error;
}

/** 청소년 본인인지 곁에 있는 어른인지. 파일럿 지표를 나눠 보려면 이게 있어야 한다. */
export async function saveRole(role: "youth" | "adult", adultKind: string): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return false;

  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: userId,
      role,
      adult_kind: role === "adult" ? adultKind || null : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  return !error;
}

export type StoredProfile = {
  role: "youth" | "adult" | null;
  adult_kind: string | null;
  birth_year: number | null;
  birthday_passed: boolean | null;
  nickname: string | null;
  region: string | null;
  agreed_marketing: boolean;
  agreed_at: string | null;
  policy_version: string | null;
};

/** 내 정보 보기. 개인정보보호법상 열람권 — 무엇이 저장돼 있는지 본인이 볼 수 있어야 한다. */
export async function loadMyProfile(): Promise<StoredProfile | null> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  const { data: row, error } = await supabase
    .from("user_profiles")
    .select(
      "role, adult_kind, birth_year, birthday_passed, nickname, region, agreed_marketing, agreed_at, policy_version"
    )
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (error || !row) return null;
  return row as StoredProfile;
}

/** 마케팅 수신 동의만 따로 끄고 켠다. 선택 항목이므로 언제든 바꿀 수 있어야 한다. */
export async function setMarketingConsent(on: boolean): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return false;

  const { error } = await supabase
    .from("user_profiles")
    .update({ agreed_marketing: on, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  return !error;
}

/** 선택 항목만 지운다(정정·삭제권). 몇 년생인지는 나이 확인 근거라 남긴다. */
export async function clearOptionalProfile(): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return false;

  const { error } = await supabase
    .from("user_profiles")
    .update({ nickname: null, region: null, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  return !error;
}

/** 가입 설문("어떻게 알게 됐나요?") 답변. 이것도 그동안 묻고 버리고 있었다. */
export async function saveReferralSource(source: string): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return;

  await supabase.from("user_profiles").upsert(
    { user_id: userId, referral_source: source, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
}

/** 로그인 전에 체크해둔 동의가 있으면 계정에 올린다. */
export async function flushPendingConsent(): Promise<void> {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(PENDING_KEY);
  if (!raw) return;
  try {
    await saveConsent(JSON.parse(raw) as Consent);
  } catch {
    /* 형식이 깨졌으면 버린다 — 동의는 다시 받으면 된다 */
    localStorage.removeItem(PENDING_KEY);
  }
}

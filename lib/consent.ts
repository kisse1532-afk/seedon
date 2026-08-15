import { supabase } from "@/lib/supabase";

/**
 * 가입 시 받은 동의를 기록한다.
 *
 * 왜 필요한가: 동의 화면은 처음부터 있었지만 체크만 받고 아무 데도 저장하지
 * 않았다(2026-08-15 로드 지적). 동의는 "받았다는 사실을 남겨야" 의미가 있다 —
 * 나중에 무엇에 언제 동의했는지 확인할 수 없으면 받지 않은 것과 같다.
 */

/**
 * 지금 화면에 걸려 있는 약관의 버전.
 *
 * 약관 내용을 고치면 이 날짜도 같이 올린다. 그래야 "이 사람은 옛 약관에만
 * 동의했다"는 걸 구분할 수 있고, 다시 받아야 할 사람을 찾을 수 있다.
 */
export const POLICY_VERSION = "2026-08-15";

export type Consent = {
  terms: boolean;
  privacy: boolean;
  marketing: boolean;
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
      agreed_at: new Date().toISOString(),
      policy_version: POLICY_VERSION,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (typeof window !== "undefined") localStorage.removeItem(PENDING_KEY);
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

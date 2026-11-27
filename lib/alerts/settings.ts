/**
 * 학생 본인의 맞춤 설정 읽기·쓰기 (브라우저에서, 본인 것만 — RLS).
 *
 * 교육급여 선택은 따로 저장한다. 별도 선택 동의라서 다른 설정과 묶어 보내지
 * 않고, 끄면 그 자리에서 바로 지워진다(동의 시각은 DB가 찍고 지운다).
 * 이 값은 브라우저 저장소(localStorage)에 남기지 않는다.
 */
import { supabase } from "@/lib/supabase";
import { loadMyProfile } from "@/lib/consent";
import { needsOnboarding } from "@/lib/role";
import { checkAge } from "@/lib/age";
import type { AlertProfile } from "@/lib/alerts/match";

export type AlertSettings = AlertProfile & { eduBenefit: boolean };

export type Student =
  | { state: "ok"; userId: string; region: string | null }
  | { state: "onboarding" | "adult" | "young" };

/** 맞춤 설정은 회원 정보를 채운 만 14세 이상 청소년 계정만 쓴다. */
export async function loadStudent(): Promise<Student> {
  const { data } = await supabase.auth.getUser();
  const profile = await loadMyProfile();
  if (!data.user || !profile || needsOnboarding(profile)) return { state: "onboarding" };
  if (profile.role === "adult") return { state: "adult" };
  if (!checkAge(profile.birth_year, profile.birthday_passed).ok) return { state: "young" };
  return { state: "ok", userId: data.user.id, region: profile.region };
}

/** 저장한 적 없으면 null. 읽기에 실패하면 에러를 던진다. */
export async function loadSettings(userId: string): Promise<AlertSettings | null> {
  const { data, error } = await supabase
    .from("alert_settings")
    .select("grade, sido, sigungu, interests, edu_benefit")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    grade: data.grade,
    sido: data.sido,
    sigungu: data.sigungu,
    interests: data.interests ?? [],
    eduBenefit: data.edu_benefit,
  };
}

export async function saveSettings(userId: string, s: AlertProfile): Promise<boolean> {
  const { error } = await supabase.from("alert_settings").upsert(
    {
      user_id: userId,
      grade: s.grade,
      sido: s.sido,
      sigungu: s.sido ? s.sigungu?.trim() || null : null,
      interests: s.interests,
    },
    { onConflict: "user_id" }
  );
  return !error;
}

export async function setEduBenefit(userId: string, on: boolean): Promise<boolean> {
  const { error } = await supabase
    .from("alert_settings")
    .upsert({ user_id: userId, edu_benefit: on }, { onConflict: "user_id" });
  return !error;
}

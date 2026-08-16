/**
 * 만 나이 계산.
 *
 * 절대규칙 4에 따라 씨드온은 만 14세 이상만 받는다. 만 14세 미만은 법정대리인
 * 동의가 있어야 개인정보를 받을 수 있어서, 지금 단계에서는 가입을 막는다.
 *
 * "올해 - 태어난 해"는 만 나이가 아니다. 생일이 안 지났으면 한 살 적다.
 * 여기서 대충 계산하면 만 13세가 그대로 들어온다.
 *
 * 그렇다고 생년월일을 다 받지는 않는다(최소수집 원칙). 연도만 받고, 만 나이가
 * 애매해지는 한 해에만 "올해 생일 지났어요?"를 추가로 묻는다. 대부분은 연도만
 * 답하면 끝난다.
 */

export const MIN_AGE = 14;

export function thisYear(today = new Date()): number {
  return today.getFullYear();
}

/** 연도만으로 나이가 확정되는지. 확정 안 되는 한 해에만 생일을 되묻는다. */
export function needsBirthdayQuestion(birthYear: number, today = new Date()): boolean {
  const diff = thisYear(today) - birthYear;
  // diff가 딱 MIN_AGE면, 생일 전이면 13세·후면 14세라 갈린다. 이때만 물어본다.
  return diff === MIN_AGE;
}

export type AgeCheck =
  | { ok: true; age: number }
  | { ok: false; reason: "too_young" | "unknown" | "invalid" };

/**
 * 가입할 수 있는 나이인지 판단한다.
 * 모르면 통과시키지 않는다 — 애매할 때 열어주면 규칙이 없는 것과 같다.
 */
export function checkAge(
  birthYear: number | null | undefined,
  birthdayPassed: boolean | null | undefined,
  today = new Date()
): AgeCheck {
  if (!birthYear || !Number.isInteger(birthYear)) return { ok: false, reason: "invalid" };

  const year = thisYear(today);
  if (birthYear > year || birthYear < year - 100) return { ok: false, reason: "invalid" };

  const diff = year - birthYear;

  if (diff > MIN_AGE) return { ok: true, age: diff }; // 생일과 무관하게 넘는다
  if (diff < MIN_AGE) return { ok: false, reason: "too_young" }; // 생일이 지나도 모자라다

  // 딱 걸치는 해 — 생일을 지났어야 만 14세다
  if (birthdayPassed === true) return { ok: true, age: MIN_AGE };
  if (birthdayPassed === false) return { ok: false, reason: "too_young" };
  return { ok: false, reason: "unknown" };
}

/** 화면에 뿌릴 연도 목록. 최근 연도가 위로 온다. */
export function selectableBirthYears(today = new Date()): number[] {
  const year = thisYear(today);
  // 만 14세 미만 연도도 고를 수 있게 둔다.
  //
  // 처음엔 14세 이상만 목록에 넣었는데, 그러면 12살짜리는 자기 연도가 아예 없어서
  // 왜 안 되는지 설명도 못 보고 위 연도를 고르게 된다. 나이를 속이도록 만드는
  // 화면이 된 셈이다. 정직하게 고르게 두고, 안 되는 이유를 말해주는 쪽이 낫다.
  const newest = year - 8;
  const oldest = year - 40;
  return Array.from({ length: newest - oldest + 1 }, (_, i) => newest - i);
}

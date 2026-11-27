/**
 * 「맞춤 알림」에서 카드와 학생 설정이 같이 쓰는 선택지.
 *
 * 값은 supabase/migrations/20261128_custom_alerts.sql의 check 조건과 같아야 한다.
 * 관심 분야는 새로 만들지 않고 카드 분류(lib/data.ts categories)를 그대로 쓴다.
 */

import { REGIONS, regionAliases } from "@/lib/regions";

export const GRADES = [
  { value: "m1", label: "중1" },
  { value: "m2", label: "중2" },
  { value: "m3", label: "중3" },
  { value: "h1", label: "고1" },
  { value: "h2", label: "고2" },
  { value: "h3", label: "고3" },
] as const;

export type Grade = (typeof GRADES)[number]["value"];

export const GRADE_VALUES = GRADES.map((g) => g.value) as Grade[];

export function isGrade(value: unknown): value is Grade {
  return GRADE_VALUES.includes(value as Grade);
}

/** "경기도 수원시" → "경기 수원시". 시·도를 못 알아보면 null. 시·군·구는 선택이다. */
export function normalizeRegion(raw: string): string | null {
  const [first, ...rest] = raw.trim().split(/\s+/);
  if (!first) return null;
  const sido = REGIONS.find((r) => regionAliases(r).includes(first));
  if (!sido) return null;
  return [sido, ...rest].join(" ");
}

/** 한국 날짜(YYYY-MM-DD). 서버는 UTC라 그냥 자르면 아침 9시까지 어제가 된다. */
export function kstToday(now = new Date()): string {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

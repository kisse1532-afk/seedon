/**
 * 공문·공고에서 만드는 「쉬운 안내」 초안의 모양과 게시 전 검사.
 *
 * 화면(app/notices)과 서버(app/api/notices)가 같이 쓴다. 여기 검사는 서버가
 * 게시 직전에 다시 돌린다 — 화면에서만 막으면 막은 게 아니다.
 */

import { categories, ENROLLMENT_STATUSES, type Category } from "@/lib/data";
import { isGrade, normalizeRegion, type Grade } from "@/lib/alerts/options";

export type NoticeDraft = {
  title: string;
  org: string;
  /** 무엇 */
  description: string;
  /** 누가 */
  who: string;
  /** 신청 방법 */
  applyMethod: string;
  /** YYYY-MM-DD 또는 빈 값 */
  deadline: string;
  /** 마감일이 없을 때 셋 중 하나 */
  enrollment: string;
  /** 공식 신청·안내 링크 */
  link: string;
  /** 링크가 신청 페이지인지, 기관 안내 페이지인지 */
  linkKind: "apply" | "info";
  phone: string;
  category: Category | "";
  grades: Grade[];
  /** 쉼표로 나눈 글. 빈 값이면 전국. */
  regions: string;
  interests: Category[];
  eduBenefitPriority: boolean;
  needsRecommendation: boolean;
};

export const EMPTY_DRAFT: NoticeDraft = {
  title: "",
  org: "",
  description: "",
  who: "",
  applyMethod: "",
  deadline: "",
  enrollment: "",
  link: "",
  linkKind: "info",
  phone: "",
  category: "",
  grades: [],
  regions: "",
  interests: [],
  eduBenefitPriority: false,
  needsRecommendation: false,
};

export const MAX_SOURCE_CHARS = 30_000;
/** Vercel이 받는 요청 크기(4.5MB)보다 작아야 한다. */
export const MAX_PDF_BYTES = 4 * 1024 * 1024;

const SLUGS = categories.map((c) => c.slug) as string[];
const isCategory = (v: unknown): v is Category => SLUGS.includes(v as string);
const text = (v: unknown, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** 바깥에서 온 값(AI 답, 화면에서 보낸 JSON)을 초안 모양으로 맞춘다. */
export function cleanDraft(input: unknown): NoticeDraft {
  const d = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  return {
    title: text(d.title, 120),
    org: text(d.org, 80),
    description: text(d.description),
    who: text(d.who, 1000),
    applyMethod: text(d.applyMethod, 1000),
    deadline: text(d.deadline, 10),
    enrollment: text(d.enrollment, 20),
    link: text(d.link, 500),
    linkKind: d.linkKind === "apply" ? "apply" : "info",
    phone: text(d.phone, 60),
    category: isCategory(d.category) ? d.category : "",
    grades: [...new Set(list(d.grades).filter(isGrade))],
    regions: Array.isArray(d.regions) ? d.regions.map((r) => text(r, 30)).filter(Boolean).join(", ") : text(d.regions, 300),
    interests: [...new Set(list(d.interests).filter(isCategory))],
    eduBenefitPriority: d.eduBenefitPriority === true,
    needsRecommendation: d.needsRecommendation === true,
  };
}

export function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const t = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(t.getTime()) && t.toISOString().slice(0, 10) === value;
}

export function parseRegions(raw: string): { regions: string[]; unknown: string[] } {
  const regions: string[] = [];
  const unknown: string[] = [];
  for (const part of raw.split(/[,\n]/).map((p) => p.trim()).filter(Boolean)) {
    if (part === "전국") continue;
    const r = normalizeRegion(part);
    if (r) regions.push(r);
    else unknown.push(part);
  }
  return { regions: [...new Set(regions)], unknown };
}

/** 절대규칙 1·3: 화면에 나가면 안 되는 말. 걸리면 게시를 막는다. */
const BLOCKED = /저소득|지원\s*대상자|취약\s*계층|결손\s*가정|차상위|수급자|중위\s*소득|소득\s*인정액|게시판/g;
/** 풀어 쓰는 게 좋은 행정 말. 막지는 않고 알려만 준다. */
const HARD = /가구원|산정|선정|의뢰서|배분\s*신청|이수|연계/g;

const textFields = (d: NoticeDraft) => [d.title, d.org, d.description, d.who, d.applyMethod, d.phone].join("\n");

export function hardWords(d: NoticeDraft): string[] {
  return [...new Set(textFields(d).match(HARD) ?? [])];
}

/** 게시를 막아야 하는 이유들. 빈 배열이면 게시할 수 있다. */
export function checkDraft(d: NoticeDraft, today: string): string[] {
  const errors: string[] = [];
  if (!d.title) errors.push("이름을 적어주세요.");
  if (!d.org) errors.push("운영하는 곳을 적어주세요.");
  if (!d.description) errors.push("무엇을 해주는지 적어주세요.");
  if (!d.who) errors.push("누가 신청할 수 있는지 적어주세요.");
  if (!d.applyMethod) errors.push("신청 방법을 적어주세요.");
  if (!d.category) errors.push("분류를 골라주세요.");
  if (d.grades.length === 0) errors.push("대상 학년을 하나 이상 골라주세요.");

  if (d.deadline) {
    if (!isRealDate(d.deadline)) errors.push("마감일은 2026-12-01처럼 적어주세요.");
    else if (d.deadline < today) errors.push("마감일이 이미 지났어요.");
  } else if (!(ENROLLMENT_STATUSES as readonly string[]).includes(d.enrollment)) {
    errors.push("마감일을 적거나, 마감일이 없으면 접수 방식을 골라주세요.");
  }

  if (!d.link) errors.push("공식 신청·안내 링크를 적어주세요.");
  else if (!/^https:\/\/[^\s]+\.[^\s]+$/.test(d.link)) errors.push("링크는 https://로 시작하는 주소여야 해요.");

  const { unknown } = parseRegions(d.regions);
  if (unknown.length) errors.push(`지역을 못 알아봤어요: ${unknown.join(", ")} (예: 경기, 서울 강남구)`);

  const blocked = [...new Set(textFields(d).match(BLOCKED) ?? [])];
  if (blocked.length) {
    errors.push(`화면에 쓰지 않는 말이 있어요: ${blocked.join(", ")}. 조건을 숫자나 쉬운 말로 풀어 써주세요.`);
  }
  return errors;
}

/** programs 표에 넣을 한 줄. checkDraft를 통과한 초안만 넘긴다. */
export function toProgramRow(
  d: NoticeDraft,
  opts: { id: string; today: string; uploader: "operator" | "teacher" }
) {
  const { regions } = parseRegions(d.regions);
  return {
    id: opts.id,
    title: d.title,
    org: d.org,
    description: d.description,
    category: d.category as Category,
    tags: [] as string[],
    link: d.link,
    link_kind: d.linkKind,
    org_type: "public",
    apply_method: d.applyMethod,
    phone: d.phone || null,
    apply_deadline: d.deadline || null,
    enrollment_status: d.deadline ? null : d.enrollment,
    reopen_note: null,
    status: "published",
    last_verified_at: opts.today,
    // programs는 누구나 읽는 표다. 올린 사람 이름·아이디는 절대 여기 적지 않는다.
    review_note: `맞춤 알림으로 올림(${opts.uploader === "teacher" ? "선생님" : "운영자"}이 확인하고 게시, ${opts.today}). 근거 원문은 notices 표`,
    target_grades: d.grades,
    target_regions: regions.length ? regions : null,
    target_interests: d.interests.length ? d.interests : null,
    edu_benefit_priority: d.eduBenefitPriority,
    needs_recommendation: d.needsRecommendation,
    who_text: d.who,
  };
}

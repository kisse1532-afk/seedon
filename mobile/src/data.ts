import { supabase } from "./supabase";

/* 웹 lib/data.ts에서 앱이 쓰는 부분만 옮겼다. 카테고리를 바꾸면 웹과 같이 바꾼다. */
export type Category = "education" | "counseling" | "housing" | "living" | "career" | "culture" | "contest";

export const categories: { slug: Category; label: string; emoji: string }[] = [
  { slug: "education", label: "교육", emoji: "📚" },
  { slug: "counseling", label: "심리상담", emoji: "💬" },
  { slug: "housing", label: "주거", emoji: "🏠" },
  { slug: "living", label: "경제·생활비", emoji: "💳" },
  { slug: "career", label: "진로·취업", emoji: "🧭" },
  { slug: "culture", label: "문화체험", emoji: "🎨" },
  { slug: "contest", label: "공모전·대회", emoji: "🏆" },
];

export type ApplyStep = { icon: string; title: string; subtitle: string };

export type Program = {
  id: string;
  title: string;
  org: string;
  description: string;
  category: Category;
  tags: string[];
  link?: string | null;
  link_kind?: "apply" | "info" | null;
  apply_method?: string | null;
  apply_link_label?: string | null;
  apply_steps?: ApplyStep[] | null;
  phone?: string | null;
  enrollment_status?: string | null;
  apply_deadline?: string | null;
  reopen_note?: string | null;
};

/** 게시된 카드 전부. 웹 fetchPublishedPrograms와 같은 규칙:
 *  마감 지난 건 빼고, 지금 열린 것 먼저, 그 안에서 마감 가까운 순. */
export async function fetchPrograms(): Promise<Program[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("programs")
    .select(
      "id,title,org,description,category,tags,link,link_kind,apply_method,apply_link_label,apply_steps,phone,enrollment_status,apply_deadline,reopen_note",
    )
    .eq("status", "published")
    .or(`apply_deadline.is.null,apply_deadline.gte.${today}`)
    .order("reopen_note", { ascending: true, nullsFirst: true })
    .order("apply_deadline", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as Program[];
}

/** 카드 위 작은 표시. 날짜가 확인된 것만 날짜로 말한다 — 추측 금지(콘텐츠 규칙 6). */
export function statusLabel(p: Program): string | null {
  if (p.reopen_note) return p.reopen_note;
  if (p.apply_deadline) {
    const [, m, d] = p.apply_deadline.split("-");
    return `${Number(m)}월 ${Number(d)}일까지`;
  }
  return p.enrollment_status ?? null;
}

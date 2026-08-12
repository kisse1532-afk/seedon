import Link from "next/link";
import { notFound } from "next/navigation";
import { categories } from "@/lib/data";
import { fetchProgram } from "@/lib/queries";
import { updateProgram } from "../../../actions";

export default async function EditProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const program = await fetchProgram(id);
  if (!program) return notFound();

  const update = updateProgram.bind(null, id);
  const full = program as typeof program & {
    status?: string;
    link?: string;
    org_type?: string;
    apply_method?: string;
    phone?: string;
    last_verified_at?: string;
    apply_deadline?: string;
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link href="/admin" className="text-sm text-neutral-400 hover:text-neutral-600">
        ← 관리자 홈
      </Link>
      <h1 className="text-lg font-bold">프로그램 수정</h1>
      {full.last_verified_at && (
        <p className="text-xs text-neutral-400">
          마지막 확인일: {full.last_verified_at}
        </p>
      )}

      <form action={update} className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">프로그램명</label>
          <input name="title" defaultValue={program.title} required className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">운영 기관</label>
          <input name="org" defaultValue={program.org} required className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">운영 주체</label>
          <select name="org_type" defaultValue={full.org_type || "public"} className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm">
            <option value="public">공공기관</option>
            <option value="nonprofit">비영리기관</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">설명 (쉬운글로)</label>
          <textarea name="description" defaultValue={program.description} required rows={4} className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">실제 신청 방법</label>
          <textarea name="apply_method" defaultValue={full.apply_method || ""} required rows={2} className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">카테고리</label>
          <select name="category" defaultValue={program.category} required className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm">
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.emoji} {c.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">공식 링크</label>
          <input name="link" defaultValue={full.link || ""} required className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">문의 전화 (선택)</label>
          <input name="phone" defaultValue={full.phone || ""} className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">신청 마감일 (선택, 비워두면 상시모집)</label>
          <input name="apply_deadline" type="date" defaultValue={full.apply_deadline || ""} className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">태그 (쉼표로 구분)</label>
          <input name="tags" defaultValue={program.tags.join(", ")} className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">상태</label>
          <select name="status" defaultValue={full.status || "published"} className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm">
            <option value="published">게시됨</option>
            <option value="pending">대기중</option>
            <option value="rejected">반려됨</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-xs text-neutral-500">
          <input type="checkbox" name="reverify" className="rounded" />
          지금 정보를 다시 확인했어요 (최종 확인일 갱신)
        </label>
        <button type="submit" className="w-full rounded-full bg-emerald-600 text-white text-sm font-medium py-3 hover:bg-emerald-700">
          저장하기
        </button>
      </form>
    </div>
  );
}

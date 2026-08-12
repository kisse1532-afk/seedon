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
    reopen_note?: string;
    review_note?: string;
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
          <label className="text-xs text-neutral-500">신청 마감일 (모집 기간이 정해진 경우만)</label>
          <input name="apply_deadline" type="date" defaultValue={full.apply_deadline || ""} className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">
            마감일이 없다면 어떤 경우인가요? (홈 목록 도장 문구가 여기서 나옴)
          </label>
          <select name="enrollment_status" defaultValue={full.enrollment_status || ""} className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm">
            <option value="">아직 확인 못 함 (&quot;상시 안내&quot;로 표시)</option>
            <option value="상시 신청">상시 신청 — 연중 아무 때나 본인이 신청 가능</option>
            <option value="언제든 이용">언제든 이용 — 신청 절차 없이 바로 쓰는 서비스·사이트·전화</option>
            <option value="기관 통해 신청">기관 통해 신청 — 학교·주민센터·복지기관 추천으로만 가능</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">
            이번 회차 모집 종료 시 안내 (선택) — 입력하면 홈 &quot;지금 신청할 수 있어요&quot;에서 빠지고 이 문구가 대신 표시됨
          </label>
          <input
            name="reopen_note"
            type="text"
            defaultValue={full.reopen_note || ""}
            placeholder="예: 매년 4~6월 모집"
            className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">
            검토 메모 (내부용, 공개 화면에 안 나옴) — 내리거나 보류한 사유를 남겨두세요
          </label>
          <input
            name="review_note"
            type="text"
            defaultValue={full.review_note || ""}
            placeholder="예: 2026-08-12 공식 링크 접속 불가로 대기중 전환"
            className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm"
          />
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

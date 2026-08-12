import Link from "next/link";
import { categories } from "@/lib/data";
import { createProgram } from "../../actions";

export default async function NewProgramPage({
  searchParams,
}: {
  searchParams: Promise<{ prefill?: string }>;
}) {
  const { prefill } = await searchParams;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link href="/admin" className="text-sm text-neutral-400 hover:text-neutral-600">
        ← 관리자 홈
      </Link>
      <h1 className="text-lg font-bold">새 프로그램 등록</h1>
      <p className="text-xs text-neutral-400">
        운영팀이 리서치한 프로그램을 여기에 등록해요. 실제 공식 페이지·연락처를
        꼭 확인하고 넣어주세요 (쉬운글로, 신청 방법까지 구체적으로).
      </p>

      {prefill && (
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-700">
          제보 원문: {prefill}
        </div>
      )}

      <form action={createProgram} className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">ID (영문, 고유값)</label>
          <input name="id" required placeholder="예: edu-02" className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">프로그램명</label>
          <input name="title" required className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">운영 기관</label>
          <input name="org" required className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">운영 주체</label>
          <select name="org_type" defaultValue="public" className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm">
            <option value="public">공공기관</option>
            <option value="nonprofit">비영리기관</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">설명 (쉬운글로, 대상·지원내용 구체적으로)</label>
          <textarea name="description" defaultValue={prefill} required rows={4} className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">실제 신청 방법 (구체적으로)</label>
          <textarea name="apply_method" required rows={2} placeholder="예: OO 홈페이지에서 온라인 신청, 또는 주민센터 방문" className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">카테고리</label>
          <select name="category" required className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm">
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.emoji} {c.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">공식 링크 (출처)</label>
          <input name="link" required placeholder="https://..." className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">문의 전화 (선택)</label>
          <input name="phone" placeholder="1388" className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">신청 마감일 (선택, 비워두면 상시모집)</label>
          <input name="apply_deadline" type="date" className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">
            이번 회차 모집 종료 시 안내 (선택) — 입력하면 홈 &quot;지금 신청할 수 있어요&quot;에서 빠지고 이 문구가 대신 표시됨
          </label>
          <input
            name="reopen_note"
            type="text"
            placeholder="예: 매년 4~6월 모집"
            className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">태그 (쉼표로 구분)</label>
          <input name="tags" placeholder="무료, 온라인신청" className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm" />
        </div>
        <button type="submit" className="w-full rounded-full bg-emerald-600 text-white text-sm font-medium py-3 hover:bg-emerald-700">
          등록하기
        </button>
      </form>
    </div>
  );
}

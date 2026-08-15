import { submitReport } from "./actions";

export default function ReportPage() {
  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-lg font-bold">제보하기</h1>
      <p className="text-sm text-ink-60">
        알고 있는 지원 프로그램의 링크나 글을 붙여넣어 주세요. 관리자가 검토 후 등록할게요.
      </p>
      <form action={submitReport} className="space-y-3">
        <input
          type="text"
          name="link"
          placeholder="관련 링크를 붙여넣어주세요"
          className="w-full rounded-xl border border-sage-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div className="text-center text-xs text-meta">또는</div>
        <textarea
          name="text"
          rows={4}
          placeholder="내용을 직접 입력해주세요"
          className="w-full rounded-2xl border border-sage-border p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="submit"
          className="w-full rounded-full bg-primary-deep text-white text-sm font-medium py-3 hover:brightness-110"
        >
          제보하기
        </button>
      </form>
    </div>
  );
}

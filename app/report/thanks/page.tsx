import Link from "next/link";

export default function ReportThanksPage() {
  return (
    <div className="max-w-md mx-auto text-center py-16 space-y-4">
      <div className="text-4xl">🙌</div>
      <h1 className="text-lg font-semibold">제보 감사해요</h1>
      <p className="text-sm text-neutral-500">
        검토 후 프로그램으로 등록할게요.
      </p>
      <Link href="/" className="inline-block rounded-full bg-emerald-600 text-white text-sm px-6 py-2.5 hover:bg-emerald-700 mt-2">
        홈으로 돌아가기
      </Link>
    </div>
  );
}

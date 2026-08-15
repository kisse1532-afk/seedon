import Link from "next/link";

export default function ReportThanksPage() {
  return (
    <div className="max-w-md mx-auto text-center py-16 space-y-4">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint text-primary-deep">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-7 w-7"
          aria-hidden
        >
          <path d="m6 12.5 4 4 8-9" />
        </svg>
      </div>
      <h1 className="text-lg font-extrabold tracking-tight text-ink">제보 감사해요</h1>
      <p className="text-sm text-ink-60">
        검토 후 프로그램으로 등록할게요.
      </p>
      <Link href="/" className="inline-block rounded-full bg-primary-deep text-white text-sm px-6 py-2.5 hover:brightness-110 mt-2">
        홈으로 돌아가기
      </Link>
    </div>
  );
}

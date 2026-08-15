import Link from "next/link";
import { fetchProgram } from "@/lib/queries";

export default async function ApplyCompletePage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  const program = await fetchProgram(programId);

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
      <h1 className="text-lg font-extrabold tracking-tight text-ink">관심 등록 완료했어요</h1>
      <p className="text-sm leading-relaxed text-ink-60">
        {program ? `"${program.title}"` : "이 프로그램"} 관련 소식이 있으면
        씨드온이 챙겨드릴게요. 실제 신청은 이전 페이지에 안내된 공식 경로로
        직접 진행해주셔야 해요.
      </p>
      <Link
        href="/"
        className="inline-block rounded-full bg-primary-deep text-white text-sm px-6 py-2.5 hover:opacity-90 transition-opacity mt-2"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}

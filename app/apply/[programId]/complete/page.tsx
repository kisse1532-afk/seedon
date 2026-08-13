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
      <div className="text-4xl">🌱</div>
      <h1 className="text-lg font-semibold">관심 등록 완료했어요</h1>
      <p className="text-sm text-neutral-500">
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

import Link from "next/link";

export default async function HelpCompletePage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;

  return (
    <div className="max-w-md mx-auto text-center py-16 space-y-4">
      <div className="text-4xl">🙋</div>
      <h1 className="text-lg font-semibold">도움 요청을 받았어요</h1>
      <p className="text-sm text-neutral-500">
        씨드온 운영팀이 남겨주신 연락처로 곧 연락드려서 신청을 도와드릴게요.
        급하게 확인이 필요하면 프로그램 상세 페이지의 문의 전화로 먼저 연락해도 좋아요.
      </p>
      <Link
        href={`/apply/${programId}`}
        className="inline-block rounded-full bg-neutral-100 text-neutral-600 text-sm px-6 py-2.5 hover:bg-neutral-200 mt-2"
      >
        프로그램으로 돌아가기
      </Link>
    </div>
  );
}

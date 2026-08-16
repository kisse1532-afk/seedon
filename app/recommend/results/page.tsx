import Link from "next/link";
import { fetchPublishedPrograms } from "@/lib/queries";
import ResultsList from "./ResultsList";
import RequireLogin from "@/app/_components/RequireLogin";

export default async function RecommendResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q } = await searchParams;
  const programs = await fetchPublishedPrograms();

  return (
    <RequireLogin reason="적어준 상황에 맞는 걸 찾아드리려면 로그인이 필요해요. 저장해둔 것까지 같이 봐서 더 잘 골라줄 수 있어요.">
    <div className="space-y-4">
      <div>
        <Link href="/recommend" className="text-[13px] font-medium text-meta transition hover:text-ink">
          ← 다시 입력하기
        </Link>
        <h1 className="mt-2 text-xl font-extrabold tracking-tight text-ink">추천 결과</h1>
        {q && <p className="mt-1 text-sm text-ink-60">&quot;{q}&quot;에 대해 찾아봤어요.</p>}
      </div>

      <ResultsList q={q ?? ""} programs={programs} />

      <p className="pt-2 text-center text-[11px] leading-relaxed text-meta">
        적어주신 말에 걸리는 프로그램을 찾아 순서대로 보여드려요. 딱 맞지 않을 수
        있으니 <Link href="/" className="underline hover:text-body">카테고리 목록</Link>도 함께 둘러보세요.
      </p>
    </div>
    </RequireLogin>
  );
}

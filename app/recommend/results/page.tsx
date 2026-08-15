import Link from "next/link";
import { categories, type Category } from "@/lib/data";
import { fetchProgramsByCategory } from "@/lib/queries";
import TrackedLink from "@/app/_components/TrackedLink";
import BookmarkButton from "@/app/_components/BookmarkButton";
import EnrollmentBadge from "@/app/_components/EnrollmentBadge";
import CategoryIcon from "@/app/_components/CategoryIcon";

export default async function RecommendResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const matched = categories.find((c) => c.slug === category);
  const items = matched ? await fetchProgramsByCategory(matched.slug as Category) : [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/recommend" className="text-sm text-neutral-400 hover:text-neutral-600">
          ← 다시 입력하기
        </Link>
        <h1 className="text-xl font-bold mt-2">추천 결과</h1>
        {q && <p className="text-sm text-neutral-500 mt-1">&quot;{q}&quot;에 대해 찾아봤어요.</p>}
      </div>

      {!matched && (
        <p className="text-sm text-neutral-400 py-8 text-center">
          입력하신 내용으로는 딱 맞는 카테고리를 못 찾았어요. 조금 더 구체적으로 적어주시거나,{" "}
          <Link href="/" className="underline hover:text-neutral-600">
            카테고리 목록
          </Link>
          에서 직접 둘러봐 주세요.
        </p>
      )}

      {matched && (
        <>
          <p className="inline-flex items-center gap-1.5 rounded-full border border-mint bg-mint px-3.5 py-1.5 text-xs font-semibold text-primary-deep">
            <CategoryIcon slug={matched.slug} className="h-[15px] w-[15px]" />
            {matched.label} 관련 프로그램을 찾았어요
          </p>
          <div className="grid gap-3">
            {items.length === 0 && (
              <p className="text-sm text-neutral-400 py-8 text-center">
                아직 이 카테고리에 등록된 프로그램이 없어요.
              </p>
            )}
            {items.map((p) => (
              <div key={p.id} className="relative rounded-2xl border border-neutral-200 bg-white p-5 flex flex-col gap-2">
                <BookmarkButton
                  programId={p.id}
                  className="absolute top-4 right-4 text-neutral-300 hover:text-emerald-600"
                />
                <div className="flex items-start justify-between gap-2 pr-8">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-semibold">{p.title}</h3>
                      <EnrollmentBadge program={p} />
                    </div>
                    <p className="text-xs text-neutral-400">{p.org}</p>
                  </div>
                </div>
                <p className="text-sm text-neutral-600">{p.description}</p>
                <div className="flex items-center justify-end mt-2">
                  <TrackedLink
                    href={`/apply/${p.id}`}
                    event="category_card_click"
                    programId={p.id}
                    category={p.category}
                    className="text-sm font-medium bg-emerald-600 text-white rounded-full px-4 py-1.5 hover:bg-emerald-700"
                  >
                    신청 알아보기 →
                  </TrackedLink>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

import Link from "next/link";
import { fetchAllPrograms } from "@/lib/queries";
import TrackedLink from "@/app/_components/TrackedLink";
import BookmarkButton from "@/app/_components/BookmarkButton";
import EnrollmentBadge from "@/app/_components/EnrollmentBadge";
import { categories } from "@/lib/data";
import { matchCategory } from "@/lib/recommend";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q || "").trim();
  const today = new Date().toISOString().slice(0, 10);
  const all = await fetchAllPrograms();
  const published = all.filter(
    (p) => p.status === "published" && (!p.apply_deadline || p.apply_deadline >= today)
  );

  const textMatches = query
    ? published.filter((p) => {
        const qLower = query.toLowerCase();
        return (
          p.title.toLowerCase().includes(qLower) ||
          p.org.toLowerCase().includes(qLower) ||
          p.description.toLowerCase().includes(qLower) ||
          p.tags?.some((t) => t.toLowerCase().includes(qLower))
        );
      })
    : [];

  // 단어로 안 걸리면(= 문장을 적었을 가능성) 키워드 매칭으로 카테고리를 찾아준다.
  const matched = query && textMatches.length === 0 ? matchCategory(query) : null;
  const matchedCategory = matched ? categories.find((c) => c.slug === matched) : undefined;
  const results = matched ? published.filter((p) => p.category === matched) : textMatches;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-600">
          ← 홈으로
        </Link>
        <h1 className="text-xl font-bold mt-2">검색 결과</h1>
      </div>

      <form action="/search" className="max-w-md">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="지금 어떤 상황인지 적어보세요. 예: 학원비가 부담돼요"
          className="w-full rounded-lg border border-sage-border bg-white px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </form>

      {!query && (
        <p className="text-sm text-neutral-400 py-8 text-center">
          단어로 검색해도 되고, 문장으로 적어도 맞는 지원을 찾아드려요.
        </p>
      )}

      {matchedCategory && (
        <p className="rounded-lg border border-sage-border bg-white px-4 py-3 text-sm text-neutral-600">
          적어주신 내용을 보고 <b className="text-seed-700">{matchedCategory.emoji} {matchedCategory.label}</b> 쪽으로 찾아봤어요.
          딱 맞지 않으면 아래 카테고리도 둘러보세요.
        </p>
      )}

      {query && (
        <div className="grid gap-3">
          {results.length === 0 && (
            <p className="text-sm text-neutral-400 py-8 text-center">
              &quot;{query}&quot;에 대한 결과가 없어요. 다른 말로 적어보거나, 카테고리에서 둘러보세요.
            </p>
          )}
          {results.map((p) => (
            <div key={p.id} className="relative rounded-lg border border-sage-border bg-white p-5 flex flex-col gap-2">
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
                  className="text-sm font-medium bg-emerald-800 text-white rounded-lg px-4 py-1.5 hover:bg-emerald-900"
                >
                  신청 알아보기 →
                </TrackedLink>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

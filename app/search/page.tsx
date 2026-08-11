import Link from "next/link";
import { fetchAllPrograms } from "@/lib/queries";
import TrackedLink from "@/app/_components/TrackedLink";
import BookmarkButton from "@/app/_components/BookmarkButton";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q || "").trim();
  const all = await fetchAllPrograms();
  const published = all.filter((p) => p.status === "published");

  const results = query
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
          placeholder="예: 학원비, 심리상담, 문화체험 카드..."
          className="w-full rounded-full border border-neutral-300 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
        />
      </form>

      {!query && <p className="text-sm text-neutral-400 py-8 text-center">검색어를 입력해주세요.</p>}

      {query && (
        <div className="grid gap-3">
          {results.length === 0 && (
            <p className="text-sm text-neutral-400 py-8 text-center">
              &quot;{query}&quot;에 대한 결과가 없어요. 다른 검색어로 시도해보세요.
            </p>
          )}
          {results.map((p) => (
            <div key={p.id} className="relative rounded-2xl border border-neutral-200 bg-white p-5 flex flex-col gap-2">
              <BookmarkButton
                programId={p.id}
                className="absolute top-4 right-4 text-neutral-300 hover:text-emerald-600"
              />
              <div className="flex items-start justify-between gap-2 pr-8">
                <div>
                  <h3 className="font-semibold">{p.title}</h3>
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
      )}
    </div>
  );
}

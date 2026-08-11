import Link from "next/link";
import { notFound } from "next/navigation";
import { categories, type Category } from "@/lib/data";
import { fetchProgramsByCategory } from "@/lib/queries";
import TrackedLink from "@/app/_components/TrackedLink";
import BookmarkButton from "@/app/_components/BookmarkButton";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category) return notFound();

  const items = await fetchProgramsByCategory(slug as Category);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-600">
          ← 홈으로
        </Link>
        <h1 className="text-xl font-bold mt-2">
          {category.emoji} {category.label}
        </h1>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              c.slug === slug
                ? "bg-emerald-600 text-white border-emerald-600"
                : "border-neutral-300 text-neutral-500 hover:border-emerald-400"
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-3">
        {items.length === 0 && (
          <p className="text-sm text-neutral-400 py-8 text-center">
            아직 등록된 프로그램이 없어요. 곧 추가될 예정이에요.
          </p>
        )}
        {items.map((p) => (
          <div
            key={p.id}
            className="relative rounded-2xl border border-neutral-200 bg-white p-5 flex flex-col gap-2"
          >
            <BookmarkButton
              programId={p.id}
              className="absolute top-4 right-4 text-neutral-300 hover:text-emerald-600"
            />
            <div className="flex items-start justify-between gap-2 pr-8">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold">{p.title}</h3>
                  {p.org_type && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        p.org_type === "public"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-purple-50 text-purple-600"
                      }`}
                    >
                      {p.org_type === "public" ? "공공" : "비영리"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400">{p.org}</p>
              </div>
              {p.last_verified_at && (
                <span className="text-[10px] text-neutral-400 whitespace-nowrap shrink-0">
                  ✓ {p.last_verified_at} 확인
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-600">{p.description}</p>
            <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
              <div className="flex gap-1.5 flex-wrap">
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[11px] text-neutral-500 bg-neutral-100 rounded-full px-2 py-0.5"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {p.link && (
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-neutral-400 underline hover:text-neutral-600"
                  >
                    공식 페이지
                  </a>
                )}
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
          </div>
        ))}
      </div>
    </div>
  );
}

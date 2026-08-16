import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categories, type Category } from "@/lib/data";
import { fetchProgramsByCategory } from "@/lib/queries";
import TrackedLink from "@/app/_components/TrackedLink";
import BookmarkButton from "@/app/_components/BookmarkButton";
import EnrollmentBadge from "@/app/_components/EnrollmentBadge";
import CategoryIcon from "@/app/_components/CategoryIcon";
import SosBanner from "@/app/_components/SosBanner";

/** 카테고리 링크를 보냈을 때도 자기 이름을 말하게 한다(홈 카드가 뜨지 않게). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category) return {};

  const path = `/category/${category.slug}`;
  const title = `${category.label} 지원 찾기`;
  const desc = `청소년이 신청할 수 있는 ${category.label} 지원을 모아뒀어요. 어디서 어떻게 신청하는지 쉬운 말로 정리해뒀어요.`;

  return {
    title,
    description: desc,
    alternates: { canonical: path },
    openGraph: { type: "website", title, description: desc, url: path },
    twitter: { card: "summary_large_image", title, description: desc },
  };
}

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
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-meta transition hover:text-ink"
        >
          ← 홈으로
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mint text-primary-deep">
            <CategoryIcon slug={category.slug} className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
              {category.label}
            </h1>
            <p className="mt-0.5 text-xs text-meta sm:text-[13px]">
              {items.length}개를 찾았어요
            </p>
          </div>
        </div>
      </div>

      {/* 다른 카테고리로 옮겨 다니는 줄. 화면이 좁으면 옆으로 밀어서 본다. */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:px-0">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
              c.slug === slug
                ? "border-primary-deep bg-primary-deep text-white"
                : "border-sage-border bg-white text-ink-60 hover:border-primary hover:text-primary-deep"
            }`}
          >
            <CategoryIcon slug={c.slug} className="h-[15px] w-[15px]" />
            {c.label}
          </Link>
        ))}
      </div>

      {slug === "counseling" && <SosBanner />}

      <div className="grid gap-3">
        {items.length === 0 && (
          <p className="py-12 text-center text-sm text-meta">
            아직 등록된 프로그램이 없어요. 곧 추가될 예정이에요.
          </p>
        )}
        {items.map((p) => (
          <div
            key={p.id}
            className="relative flex flex-col gap-2 rounded-card border border-sage-border bg-white p-5 transition hover:border-primary/50 hover:shadow-[0_10px_28px_-18px_rgba(23,145,106,0.5)]"
          >
            <BookmarkButton
              programId={p.id}
              className="absolute top-4 right-4 text-sage-border hover:text-primary-deep"
            />
            <div className="flex items-start justify-between gap-2 pr-8">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="font-bold text-ink">{p.title}</h3>
                  {p.org_type && (
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                        p.org_type === "public"
                          ? "bg-mint text-primary-deep"
                          : "bg-brand-border/60 text-ink-60"
                      }`}
                    >
                      {p.org_type === "public" ? "공공" : "비영리"}
                    </span>
                  )}
                  <EnrollmentBadge program={p} />
                </div>
                <p className="mt-1 text-xs text-meta">{p.org}</p>
              </div>
              {p.last_verified_at && (
                <span className="shrink-0 text-[10px] whitespace-nowrap text-meta">
                  ✓ {p.last_verified_at} 확인
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-body">{p.description}</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-cream px-2 py-0.5 text-[11px] text-ink-60"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3">
                {p.link && (
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-meta underline transition hover:text-ink"
                  >
                    {/* 기관 대문으로 가는 링크를 "공식 페이지"라고 부르면 이 프로그램
                        페이지로 가는 줄 알고 눌렀다가 헤맨다. 이름을 사실대로 쓴다. */}
                    {p.link_kind === "info" ? "기관 홈페이지" : "공식 페이지"}
                  </a>
                )}
                <TrackedLink
                  href={`/apply/${p.id}`}
                  event="category_card_click"
                  programId={p.id}
                  category={p.category}
                  className="rounded-xl bg-primary-deep px-4 py-2 text-[13px] font-bold text-white transition hover:brightness-110"
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

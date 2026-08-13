import Link from "next/link";
import { categories, getDeadlineStamp } from "@/lib/data";
import PhoneLink from "@/app/_components/PhoneLink";
import { fetchCategoryCounts, fetchOpenPrograms } from "@/lib/queries";
import TrackedLink from "@/app/_components/TrackedLink";

// 홈은 매 요청마다 DB를 다시 읽는다. 이게 없으면 빌드 시점 데이터로 고정되어,
// 리서치팀이 프로그램을 등록해도 재배포 전까지 카테고리 개수·목록이 안 바뀐다.
export const dynamic = "force-dynamic";

const situations = [
  { label: "💳 생활비가 급해요", href: "/category/living" },
  { label: "🏠 지낼 곳이 필요해요", href: "/category/housing" },
  { label: "💬 얘기할 사람이 필요해요", href: "/category/counseling" },
  { label: "🧭 진로가 고민이에요", href: "/category/career" },
];

const stampTone = {
  soon: "text-[13px] text-terracotta",
  normal: "text-[13px] text-seed-700",
  always: "text-[11px] text-neutral-400",
} as const;

export default async function HomePage() {
  const [counts, open] = await Promise.all([
    fetchCategoryCounts(),
    fetchOpenPrograms(5),
  ]);

  const today = new Date();
  const todayLabel = `${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <div className="space-y-6">
      {/* 진입부 — 검색이 첫 화면에 오도록.
          화면 끝까지 채우려고 full-bleed 처리(안쪽 내용만 max-w로 다시 묶음) */}
      {/* 빛은 검색창 높이(≈66%)에 맞춰 깐다. 크기를 %로 잡아 화면 폭이
          바뀌어도 검색창을 계속 감싸게 했다. */}
      <section className="-mt-6 w-screen ml-[calc(50%-50vw)] bg-seed-900 bg-[radial-gradient(60%_55%_at_50%_66%,var(--color-hero-glow)_0%,transparent_70%)]">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14 lg:py-16 text-center">
          <p className="text-xs sm:text-[13px] font-semibold text-seed-mint mb-3">
            청소년 지원 정보 플랫폼, 씨드온
          </p>
          <h1 className="text-[26px] sm:text-4xl lg:text-[42px] font-extrabold leading-[1.25] tracking-tight text-white text-balance">
            이미 있는 지원을,
            <br />
            눈치 보지 않고
          </h1>
          <p className="mt-4 mb-6 mx-auto max-w-[44ch] text-[13px] sm:text-sm leading-relaxed text-white/60">
            교육·주거·상담·생활비까지. 단어로 검색해도 되고, 문장으로 적어도 맞는 지원을 찾아드려요.
          </p>

          <form
            action="/search"
            className="mx-auto flex max-w-[560px] items-center gap-2 h-12 sm:h-14 rounded-lg bg-white pl-4 pr-2"
          >
            <input
              type="text"
              name="q"
              placeholder="지금 어떤 상황인지 적어보세요. 예: 학원비가 부담돼요"
              className="flex-1 min-w-0 text-[13px] sm:text-sm bg-transparent focus:outline-none placeholder:text-neutral-400"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-seed-700 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-[13px] font-bold text-white hover:brightness-110"
            >
              찾기
            </button>
          </form>

          <div className="mt-4 flex flex-wrap justify-center gap-1.5 sm:gap-2">
            {situations.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="rounded-lg border border-white/15 bg-white/15 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-[13px] font-semibold text-white/90 hover:bg-white/25 hover:text-white transition"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 카테고리 — 개수는 DB에서 자동 반영 */}
      <section>
        <div className="flex items-end justify-between gap-3 mb-3">
          <h2 className="text-sm sm:text-base font-extrabold tracking-tight">카테고리</h2>
          <Link href="/search" className="text-xs sm:text-[13px] font-semibold text-seed-700">
            전체 보기 →
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="rounded-lg border border-sage-border bg-white px-1 py-3 sm:py-5 flex flex-col items-center gap-1.5 sm:gap-2 hover:border-seed-700 hover:shadow-sm transition"
            >
              <span className="text-lg sm:text-2xl leading-none">{c.emoji}</span>
              <span className="text-[11.5px] sm:text-[13px] font-bold text-center leading-tight">
                {c.label}
              </span>
              <span className="text-[10.5px] sm:text-[11.5px] text-neutral-400 tabular-nums">
                {counts[c.slug] ?? 0}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 지금 신청할 수 있는 프로그램 — 마감 임박순 */}
      <section>
        <div className="flex items-end justify-between gap-3 mb-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-sm sm:text-base font-extrabold tracking-tight">지금 신청할 수 있어요</h2>
            <span className="text-[11.5px] sm:text-xs text-neutral-400">
              {todayLabel} 기준 · 마감된 건 자동으로 내려가요
            </span>
          </div>
          <Link
            href="/search"
            className="text-xs sm:text-[13px] font-semibold text-seed-700 whitespace-nowrap"
          >
            전체 →
          </Link>
        </div>

        <div className="rounded-lg border border-sage-border bg-white overflow-hidden">
          {open.length === 0 && (
            <p className="text-sm text-neutral-400 py-10 text-center">
              아직 등록된 프로그램이 없어요. 곧 추가될 예정이에요.
            </p>
          )}
          {open.map((p) => {
            const stamp = getDeadlineStamp(p);
            return (
              <TrackedLink
                key={p.id}
                href={`/apply/${p.id}`}
                event="category_card_click"
                programId={p.id}
                category={p.category}
                className="grid grid-cols-[62px_1fr_auto] sm:grid-cols-[76px_1fr_auto] gap-3 sm:gap-4 items-center px-3.5 sm:px-5 py-3 sm:py-4 border-b border-sage-line last:border-b-0 hover:bg-sage/40 transition"
              >
                <span className="text-center border-r border-sage-line pr-2.5 sm:pr-3.5">
                  <span
                    className={`block font-extrabold tabular-nums leading-tight ${stampTone[stamp.tone]}`}
                  >
                    {stamp.label}
                  </span>
                  <span className="block text-[9.5px] sm:text-[10.5px] text-neutral-400 mt-0.5">
                    {stamp.caption}
                  </span>
                </span>

                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 flex-wrap text-[13.5px] sm:text-[15px] font-bold leading-snug">
                    {p.title}
                    {p.org_type && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg ${
                          p.org_type === "public"
                            ? "bg-mint text-ink"
                            : "bg-brand-border/60 text-ink-60"
                        }`}
                      >
                        {p.org_type === "public" ? "공공" : "비영리"}
                      </span>
                    )}
                  </span>
                  <span className="block text-[11.5px] sm:text-xs text-neutral-400 mt-0.5 truncate">
                    {p.org}
                  </span>
                </span>

                <span className="hidden sm:inline-block shrink-0 rounded-lg bg-seed-700 px-3.5 py-2 text-xs sm:text-[13px] font-bold text-white whitespace-nowrap">
                  신청 알아보기
                </span>
              </TrackedLink>
            );
          })}
        </div>
      </section>

      {/* 긴급 상담 */}
      <section className="rounded-lg bg-warm-brown p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[13.5px] sm:text-[15px] font-bold text-white mb-0.5">
            지금 많이 힘들다면
          </h2>
          <p className="text-[11.5px] sm:text-xs text-white/60">
            청소년전화 1388 · 무료이고, 24시간 언제 걸어도 돼요.
          </p>
        </div>
        <PhoneLink
          number="1388"
          className="rounded-lg bg-terracotta px-5 sm:px-6 py-2.5 sm:py-3 text-[13px] sm:text-sm font-bold text-white hover:brightness-110"
        >
          📞 1388 전화하기
        </PhoneLink>
      </section>

      {/* 신뢰 한 줄 */}
      <section className="rounded-lg border border-sage-border bg-white px-4 sm:px-5 py-3.5 sm:py-4 grid sm:grid-cols-3 gap-2.5 sm:gap-5">
        <p className="text-[11.5px] sm:text-xs leading-relaxed text-neutral-600">
          <b className="block text-xs sm:text-[13px] text-neutral-900 mb-0.5">공식 링크만</b>
          출처 확인된 것만 올려요
        </p>
        <p className="text-[11.5px] sm:text-xs leading-relaxed text-neutral-600">
          <b className="block text-xs sm:text-[13px] text-neutral-900 mb-0.5">매일 확인</b>
          마감된 건 자동으로 내려가요
        </p>
        <p className="text-[11.5px] sm:text-xs leading-relaxed text-neutral-600">
          <b className="block text-xs sm:text-[13px] text-neutral-900 mb-0.5">최소한만</b>
          소득·가정 상황 안 물어봐요
        </p>
      </section>
    </div>
  );
}

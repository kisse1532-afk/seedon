import Link from "next/link";
import { categories, getDeadlineStamp } from "@/lib/data";
import PhoneLink from "@/app/_components/PhoneLink";
import CategoryIcon from "@/app/_components/CategoryIcon";
import { fetchCategoryCounts, fetchOpenPrograms } from "@/lib/queries";
import TrackedLink from "@/app/_components/TrackedLink";
import type { Category } from "@/lib/data";

// 홈은 매 요청마다 DB를 다시 읽는다. 이게 없으면 빌드 시점 데이터로 고정되어,
// 리서치팀이 프로그램을 등록해도 재배포 전까지 카테고리 개수·목록이 안 바뀐다.
export const dynamic = "force-dynamic";

// 상황별 입구. 카테고리와 짝이 지어져 있어 아이콘을 그대로 빌려 쓴다.
const situations: { label: string; slug: Category }[] = [
  { label: "생활비가 급해요", slug: "living" },
  { label: "지낼 곳이 필요해요", slug: "housing" },
  { label: "얘기할 사람이 필요해요", slug: "counseling" },
  { label: "진로가 고민이에요", slug: "career" },
];

// 긴급 연락 3종. head/tail로 나눈 건 "1577-0199"에서 국번만 크게 보이게
// 하려는 것 — 세 칸 폭이 같아야 해서 뒷자리는 작게 붙인다.
// 설명을 두 줄로 나눠 두는 건 칸이 옆으로 퍼지지 않게 하려는 것 —
// 한 줄로 흘리면 칸 폭이 글자 길이만큼 벌어져 세 칸이 멀어진다.
const sosLines = [
  { number: "1388", head: "1388", tail: "", name: "청소년전화", desc: ["무슨 얘기든", "24시간"] },
  { number: "1577-0199", head: "1577", tail: "-0199", name: "마음이 힘들 때", desc: ["정신건강", "위기상담"] },
  { number: "117", head: "117", tail: "", name: "학교폭력", desc: ["신고하고", "상담받기"] },
];

// 왼쪽 도장의 색. 마감이 가까운 것만 따뜻한 색으로 튀게 하고,
// 상시는 눈에 덜 띄게 눌러 목록에 리듬을 준다.
const stampTone = {
  soon: "bg-sos-tile border-sos-line text-sos-num",
  normal: "bg-mint border-mint text-primary-deep",
  always: "bg-transparent border-sage-line text-meta",
} as const;

const trustPoints = [
  {
    title: "공식 링크만",
    body: "출처 확인된 것만 올려요",
    icon: <path d="M9.5 12.5 11.4 14.4l3.4-3.9M12 3.6l7 2.4v5.4c0 3.6-2.7 6.9-7 8.6-4.3-1.7-7-5-7-8.6V6Z" />,
  },
  {
    title: "매일 확인",
    body: "마감된 건 자동으로 내려가요",
    icon: (
      <>
        <circle cx="12" cy="12" r="8.2" />
        <path d="M12 7.4V12l3 1.8" />
      </>
    ),
  },
  {
    title: "최소한만",
    body: "소득·가정 상황 안 물어봐요",
    icon: (
      <>
        <rect x="4.6" y="10.4" width="14.8" height="9.2" rx="2.2" />
        <path d="M8.2 10.4V7.9a3.8 3.8 0 0 1 7.6 0v2.5" />
      </>
    ),
  },
];

export default async function HomePage() {
  const [counts, open] = await Promise.all([
    fetchCategoryCounts(),
    fetchOpenPrograms(5),
  ]);

  const today = new Date();
  const todayLabel = `${today.getMonth() + 1}월 ${today.getDate()}일`;
  const totalOpen = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return (
    <div className="space-y-10 sm:space-y-14">
      {/* 진입부 — 검색이 첫 화면에 오도록.
          화면 끝까지 채우려고 full-bleed 처리(안쪽 내용만 max-w로 다시 묶음) */}
      <section className="relative -mt-6 w-screen ml-[calc(50%-50vw)] overflow-hidden bg-seed-900">
        {/* 배경 1층: 아주 옅은 점무늬. 단색 면이 넓게 깔리면 화면이 비어 보이는데,
            점을 깔면 면에 결이 생겨 "인쇄된 종이" 같은 밀도가 난다. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.5] [background-image:radial-gradient(rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:20px_20px]"
        />
        {/* 배경 2층: 검색창 뒤에 까는 은은한 빛. 빛이 있는 쪽으로 눈이 가므로
            검색창 높이(≈62%)에 맞춘다. 크기를 %로 잡아 화면 폭이 바뀌어도 따라간다. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background-image:radial-gradient(58%_52%_at_50%_62%,var(--color-hero-glow)_0%,transparent_72%)]"
        />

        <div className="relative mx-auto max-w-3xl px-4 py-11 text-center sm:py-14 lg:py-16">
          {/* 지금 몇 개가 열려 있는지 — 실제 DB 숫자다. 들어오자마자 "빈 사이트가
              아니구나"가 보이게 하려는 것이라, 0이면 아예 감춘다. */}
          {totalOpen > 0 && (
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 py-1.5 pl-2.5 pr-3.5 text-[11.5px] font-semibold text-white/85 sm:text-xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-dark-primary opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-dark-primary" />
              </span>
              지금 신청할 수 있는 지원 {totalOpen}개
            </p>
          )}

          <h1 className="text-[30px] font-extrabold leading-[1.22] tracking-[-0.02em] text-white text-balance sm:text-[44px] lg:text-[52px]">
            이미 있는 지원을,
            <br />
            <span className="text-dark-primary">눈치 보지 않고</span>
          </h1>
          <p className="mt-4 mb-7 mx-auto max-w-[42ch] text-[13.5px] leading-relaxed text-white/65 sm:text-[15px]">
            교육·주거·상담·생활비까지. 단어로 검색해도 되고, 문장으로 적어도 맞는 지원을 찾아드려요.
          </p>

          {/* 검색창 — 화면에서 가장 앞으로 나와야 하는 요소라 그림자를 준다. */}
          <form
            action="/search"
            className="mx-auto flex h-14 max-w-[580px] items-center gap-2 rounded-2xl bg-white p-2 pl-4 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.45)] sm:h-16 sm:pl-5"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="hidden h-5 w-5 shrink-0 text-meta sm:block"
              aria-hidden
            >
              <circle cx="11" cy="11" r="6.4" />
              <path d="m20 20-3.6-3.6" />
            </svg>
            <input
              type="text"
              name="q"
              placeholder="어떤 상황인지 적어보세요"
              aria-label="지원 프로그램 검색"
              className="min-w-0 flex-1 bg-transparent text-sm text-body focus:outline-none placeholder:text-neutral-400 sm:text-[15px]"
            />
            <button
              type="submit"
              className="h-full shrink-0 rounded-xl bg-seed-700 px-5 text-[13px] font-bold text-white transition hover:brightness-110 sm:px-7 sm:text-sm"
            >
              찾기
            </button>
          </form>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {situations.map((s) => (
              <Link
                key={s.slug}
                href={`/category/${s.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white/85 transition hover:border-white/35 hover:bg-white/20 hover:text-white sm:text-[13px]"
              >
                <CategoryIcon slug={s.slug} className="h-[15px] w-[15px] opacity-80" />
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 카테고리 — 개수는 DB에서 자동 반영 */}
      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
              어떤 게 필요해요?
            </h2>
            <p className="mt-1 text-xs text-meta sm:text-[13px]">
              6가지로 나눠뒀어요. 눌러서 둘러보세요.
            </p>
          </div>
          <Link
            href="/search"
            className="shrink-0 text-xs font-semibold text-seed-700 hover:underline sm:text-[13px]"
          >
            전체 보기 →
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6 sm:gap-3">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="group flex flex-col items-center gap-2 rounded-card border border-sage-border bg-white px-1 py-4 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_10px_24px_-14px_rgba(23,145,106,0.55)] sm:py-5"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-mint text-primary-deep transition group-hover:bg-primary group-hover:text-white sm:h-12 sm:w-12">
                <CategoryIcon slug={c.slug} className="h-[22px] w-[22px] sm:h-6 sm:w-6" />
              </span>
              <span className="text-center text-[12px] font-bold leading-tight text-ink sm:text-[13.5px]">
                {c.label}
              </span>
              <span className="text-[10.5px] tabular-nums text-meta sm:text-[11.5px]">
                {counts[c.slug] ?? 0}개
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 지금 신청할 수 있는 프로그램 — 마감 임박순 */}
      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
              지금 신청할 수 있어요
            </h2>
            <p className="mt-1 text-xs text-meta sm:text-[13px]">
              {todayLabel} 기준 · 마감된 건 자동으로 내려가요
            </p>
          </div>
          <Link
            href="/search"
            className="shrink-0 text-xs font-semibold text-seed-700 hover:underline sm:text-[13px]"
          >
            전체 →
          </Link>
        </div>

        <div className="overflow-hidden rounded-card border border-sage-border bg-white">
          {open.length === 0 && (
            <p className="py-12 text-center text-sm text-meta">
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
                className="group grid grid-cols-[58px_1fr] items-center gap-3.5 border-b border-sage-line px-3.5 py-3.5 transition last:border-b-0 hover:bg-mint/40 sm:grid-cols-[74px_1fr_auto] sm:gap-4 sm:px-5 sm:py-4"
              >
                {/* 왼쪽 도장 — 마감이 가까울수록 눈에 띄게 */}
                <span
                  className={`flex flex-col items-center justify-center rounded-xl border py-1.5 ${stampTone[stamp.tone]}`}
                >
                  <span className="text-[13px] font-extrabold tabular-nums leading-tight sm:text-[14px]">
                    {stamp.label}
                  </span>
                  <span className="mt-0.5 text-[9px] leading-none opacity-75 sm:text-[10px]">
                    {stamp.caption}
                  </span>
                </span>

                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-1.5 text-[14px] font-bold leading-snug text-ink sm:text-[15.5px]">
                    {p.title}
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
                  </span>
                  <span className="mt-1 block truncate text-[11.5px] text-meta sm:text-xs">
                    {p.org}
                  </span>
                  {/* 넓은 화면에서는 한 줄 요약까지 — 오른쪽 버튼을 걷어낸 자리가
                      비어 보이지 않게 하고, 제목만으로는 뭔지 모를 때 판단을 돕는다. */}
                  <span className="mt-1.5 hidden truncate text-xs leading-relaxed text-ink-60 sm:block">
                    {p.description}
                  </span>
                </span>

                {/* 행 전체가 링크라 여기에 버튼을 또 두면 같은 버튼이 다섯 줄 내내
                    반복돼 목록이 무거워진다. 화살표만 두고, 마우스를 올렸을 때만
                    브랜드색으로 살아나게 한다. */}
                <span className="hidden shrink-0 items-center justify-center text-sage-border transition group-hover:translate-x-0.5 group-hover:text-primary-deep sm:flex">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-[18px] w-[18px]"
                    aria-hidden
                  >
                    <path d="m9 5 7 7-7 7" />
                  </svg>
                </span>
              </TrackedLink>
            );
          })}
        </div>
      </section>

      {/* 긴급 연락 — 1388 하나만 두면 "그 번호가 내 상황이 아닌" 청소년은
          갈 곳이 없다. 세 번호를 나란히 두고, 번호마다 "이럴 때 거는 데"를
          붙여야 실제로 고를 수 있다. */}
      {/* 번호는 제목 아래에 두고 전체를 가운데로 모은다. 넓은 화면에서
          세 칸을 폭에 맞춰 늘리면 번호끼리 멀어져 한 덩어리로 안 읽히므로,
          칸 묶음의 최대 폭을 잡아 가운데에 세운다. */}
      <section className="rounded-card border border-sos-line bg-sos-tile/45 px-4 py-6 text-center sm:px-5 sm:py-8">
        <h2 className="mb-1 text-[18px] font-extrabold tracking-tight text-sos-ink sm:text-[22px]">
          힘들 땐 전화해도 돼요
        </h2>
        <p className="mb-5 text-[12.5px] text-sos-sub sm:text-sm">
          전부 무료예요. 이름 안 밝혀도 되고요.
        </p>
        <div className="mx-auto grid max-w-[366px] grid-cols-3 gap-2 sm:max-w-[430px] sm:gap-2.5">
          {sosLines.map((s) => (
            <PhoneLink
              key={s.number}
              number={s.number}
              className="block rounded-xl border border-sos-line bg-white px-1.5 py-3 text-center transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-12px_rgba(194,112,42,0.6)]"
            >
              <span className="block text-[17px] font-extrabold leading-tight tracking-tight text-sos-num">
                {s.head}
                {s.tail && <span className="text-xs">{s.tail}</span>}
              </span>
              <span className="mt-1 block text-[10.5px] font-bold text-sos-ink">
                {s.name}
              </span>
              <span className="mt-0.5 block text-[9.5px] leading-snug text-sos-meta">
                {s.desc[0]}
                <br />
                {s.desc[1]}
              </span>
            </PhoneLink>
          ))}
        </div>
      </section>

      {/* 신뢰 한 줄 */}
      <section className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {trustPoints.map((t) => (
          <div
            key={t.title}
            className="flex items-start gap-3 rounded-card border border-sage-border bg-white px-4 py-4"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint text-primary-deep">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-[18px] w-[18px]"
                aria-hidden
              >
                {t.icon}
              </svg>
            </span>
            <span>
              <b className="block text-[13px] font-bold text-ink">{t.title}</b>
              <span className="mt-0.5 block text-[11.5px] leading-relaxed text-ink-60 sm:text-xs">
                {t.body}
              </span>
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}

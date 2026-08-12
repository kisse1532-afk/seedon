import Link from "next/link";
import { categories } from "@/lib/data";
import { fetchPlatformStats } from "@/lib/queries";

const situations = [
  { label: "당장 생활비가 급해요", emoji: "💳", href: "/category/living" },
  { label: "지낼 곳이 필요해요", emoji: "🏠", href: "/category/housing" },
  { label: "누군가와 이야기하고 싶어요", emoji: "💬", href: "/category/counseling" },
  { label: "공부·진로가 고민이에요", emoji: "🧭", href: "/category/career" },
];

export default async function HomePage() {
  const stats = await fetchPlatformStats();

  return (
    <div className="space-y-8">
      <section className="text-center py-10 -mx-4 px-4 rounded-b-3xl bg-gradient-to-br from-sky-50 via-white to-emerald-50">
        <h1 className="text-2xl font-bold mb-2">어떤 도움이 필요하신가요?</h1>
        <p className="text-neutral-500 text-sm mb-3">
          이미 있는 지원제도를, 눈치 보지 않고 찾아볼 수 있어요.
        </p>
        <p className="inline-block text-[11px] text-emerald-700 bg-gradient-to-r from-sky-50 to-emerald-50 border border-emerald-100 rounded-full px-3 py-1 mb-6">
          🌱 {categories.length}개 카테고리 · {stats.total}개 프로그램 등록 · 매일 자동 업데이트
        </p>
        <form action="/search" className="max-w-md mx-auto">
          <input
            type="text"
            name="q"
            placeholder="예: 학원비, 심리상담, 문화체험 카드..."
            className="w-full rounded-full border border-neutral-300 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-neutral-500 mb-3">지금 가장 급한 게 뭐예요?</h2>
        <div className="grid grid-cols-2 gap-3">
          {situations.map((s) => (
            <Link key={s.href} href={s.href}
              className="rounded-2xl border border-neutral-200 bg-white p-4 flex items-center gap-3 hover:border-emerald-400 hover:shadow-sm transition">
              <span className="text-xl">{s.emoji}</span>
              <span className="text-sm font-medium leading-tight">{s.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="text-center">
        <Link href="/theme/phone"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 border border-neutral-300 rounded-full px-4 py-2 hover:border-emerald-400 hover:text-emerald-700 transition">
          📞 전화 한 통이면 돼요
        </Link>
      </section>

      <section className="rounded-2xl bg-rose-50 border border-rose-100 p-5">
        <p className="text-sm text-rose-900 font-medium mb-1">지금 많이 힘드신가요?</p>
        <p className="text-xs text-rose-700 mb-3">
          어떤 이야기든 24시간 비밀 보장되는 상담으로 바로 연결할 수 있어요.
        </p>
        <div className="flex flex-wrap gap-2">
          <a href="tel:1388" className="text-xs font-medium bg-rose-600 text-white rounded-full px-4 py-1.5 hover:bg-rose-700">
            📞 1388 바로 전화하기
          </a>
          <Link href="/apply/counsel-01" className="text-xs font-medium border border-rose-300 text-rose-700 rounded-full px-4 py-1.5 hover:bg-rose-100">
            먼저 안내 읽어보기
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-neutral-500 mb-3">카테고리로 둘러보기</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`}
              className="rounded-2xl border border-neutral-200 bg-white p-5 text-center hover:border-emerald-400 hover:shadow-sm transition">
              <div className="text-2xl mb-2">{c.emoji}</div>
              <div className="text-sm font-medium">{c.label}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-gradient-to-br from-sky-50 to-emerald-50 border border-sky-100 p-5 text-center">
        <p className="text-sm text-emerald-800 mb-2">
          내 상황을 말로 설명하면 AI가 맞는 지원을 찾아드려요.
        </p>
        <Link href="/recommend" className="inline-block rounded-full bg-gradient-to-r from-sky-500 to-emerald-600 text-white text-sm px-5 py-2 hover:brightness-105">
          AI 맞춤추천 받기
        </Link>
      </section>

      <section className="rounded-2xl border border-sky-100 bg-sky-50/50 p-5 text-center">
        <p className="text-sm text-sky-900 mb-2">
          다른 청소년들은 어떤 도움을 받았을까요?
        </p>
        <Link href="/community" className="inline-block rounded-full border border-sky-300 text-sky-700 text-sm px-5 py-2 hover:bg-sky-100">
          커뮤니티 둘러보기
        </Link>
      </section>

      <p className="text-[11px] text-neutral-400 text-center pt-2">
        씨드온은 광고 없이, 등록된 프로그램을 있는 그대로 보여드려요.
      </p>
    </div>
  );
}

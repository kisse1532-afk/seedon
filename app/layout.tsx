import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import BottomNav from "@/app/_components/BottomNav";

export const metadata: Metadata = {
  title: "씨드온 | SeedOn",
  description: "이미 존재하지만 닿지 않는 지원을, 눈치 보지 않고 쓸 수 있게.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      {/* overflow-x-hidden: 홈 히어로의 full-bleed(w-screen)가 스크롤바 폭만큼 넘치는 것 방지 */}
      <body className="antialiased min-h-screen overflow-x-hidden bg-sage text-neutral-900">
        <header className="bg-seed-900">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-bold text-base text-white">
              🌱 씨드온
            </Link>
            <Link href="/report" className="text-xs font-semibold text-seed-mint hover:text-white">
              제보하기
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>

        <footer className="bg-seed-900 text-seed-mint mt-8 pb-24">
          <div className="mx-auto max-w-5xl px-4 pt-8 pb-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-white text-sm font-bold mb-1.5">🌱 씨드온</p>
                <p className="text-[11px] leading-relaxed text-seed-mint/70 max-w-[28ch]">
                  이미 존재하지만 닿지 않는 지원을, 눈치 보지 않고 쓸 수 있게.
                </p>
              </div>
              <div>
                <h2 className="text-white text-[11px] font-bold mb-2">둘러보기</h2>
                <ul className="flex flex-col gap-1.5 text-[11px]">
                  <li><Link href="/search" className="hover:text-white">전체 프로그램</Link></li>
                  <li><Link href="/bookmarks" className="hover:text-white">북마크</Link></li>
                  <li><Link href="/community" className="hover:text-white">커뮤니티</Link></li>
                  <li><Link href="/report" className="hover:text-white">제보하기</Link></li>
                </ul>
              </div>
              <div>
                <h2 className="text-white text-[11px] font-bold mb-2">긴급 연락</h2>
                <ul className="flex flex-col gap-1.5 text-[11px]">
                  <li><a href="tel:1388" className="hover:text-white">청소년전화 1388</a></li>
                  <li><a href="tel:1577-0199" className="hover:text-white">위기상담 1577-0199</a></li>
                  <li><a href="tel:117" className="hover:text-white">학교폭력 117</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-7 pt-4 border-t border-white/10 flex justify-between gap-3 flex-wrap text-[10.5px] text-seed-mint/60">
              <span>© 2026 씨드온 · 광고 없이 등록순으로</span>
              <Link href="/admin" className="hover:text-white">관리자</Link>
            </div>
          </div>
        </footer>

        <BottomNav />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import BottomNav from "@/app/_components/BottomNav";
import Logo from "@/app/_components/Logo";
import PhoneLink from "@/app/_components/PhoneLink";

export const metadata: Metadata = {
  title: "씨드온 | SeedOn",
  description: "이미 존재하지만 닿지 않는 지원을, 눈치 보지 않고 쓸 수 있게.",
  // 브랜드 에셋 v1.0 — public/brand/
  icons: {
    icon: [
      { url: "/brand/favicon.png", type: "image/png" },
      { url: "/brand/logo/seedon-symbol.svg", type: "image/svg+xml" },
    ],
    apple: "/brand/app-icon-512.png",
  },
};

// 홈 화면에 추가했을 때 주소창·상태바에 깔리는 색 (브랜드 Dark Surface)
export const viewport = { themeColor: "#37562F" };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard — 지금까지 globals.css에 이름만 적혀 있고 실제로 불러오는 코드가
            없어서, 이 글꼴이 깔려 있지 않은 기기(=대부분의 안드로이드·윈도우)에서는
            맑은 고딕 같은 시스템 기본 글꼴로 떨어지고 있었다. 한글 서비스는 글꼴이
            인상의 절반이라 실제로 불러오도록 고친다.
            dynamic-subset은 화면에 쓰인 글자만 잘라서 받아 가벼운 판본이다. */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      {/* overflow-x-hidden: 홈 히어로의 full-bleed(w-screen)가 스크롤바 폭만큼 넘치는 것 방지 */}
      <body className="antialiased min-h-screen overflow-x-hidden bg-sage text-neutral-900">
        <header className="bg-seed-950">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
            <Link href="/" aria-label="씨드온 홈">
              <Logo tone="dark" height={26} />
            </Link>
            <Link href="/report" className="text-xs font-semibold text-seed-mint hover:text-white">
              제보하기
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>

        <footer className="bg-seed-950 text-seed-mint mt-8 pb-24">
          <div className="mx-auto max-w-5xl px-4 pt-8 pb-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div>
                <Logo tone="dark" height={22} className="mb-2" />
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
                  <li><PhoneLink number="1388" className="hover:text-white">청소년전화 1388</PhoneLink></li>
                  <li><PhoneLink number="1577-0199" className="hover:text-white">위기상담 1577-0199</PhoneLink></li>
                  <li><PhoneLink number="117" className="hover:text-white">학교폭력 117</PhoneLink></li>
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

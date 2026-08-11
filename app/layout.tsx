import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "씨드온 | SeedOn",
  description: "이미 존재하지만 닿지 않는 지원을, 눈치 보지 않고 쓸 수 있게.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
            <a href="/" className="font-bold text-lg bg-gradient-to-r from-sky-500 to-emerald-600 bg-clip-text text-transparent">
              🌱 씨드온
            </a>
            <nav className="flex gap-4 text-sm text-neutral-600">
              <a href="/community" className="hover:text-emerald-600">커뮤니티</a>
              <a href="/recommend" className="hover:text-emerald-600">AI 맞춤추천</a>
              <a href="/report" className="hover:text-emerald-600">제보하기</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-6 text-center">
          <a href="/admin" className="text-[11px] text-neutral-300 hover:text-neutral-400">
            관리자
          </a>
        </footer>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
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
      <body className="antialiased min-h-screen bg-sage text-neutral-900">
        <header className="border-b border-sage-border bg-white">
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
            <a href="/" className="font-bold text-lg text-emerald-800">
              🌱 씨드온
            </a>
            <a href="/report" className="text-sm text-neutral-500 hover:text-emerald-800">
              제보하기
            </a>
          </div>
        </header>
        <div className="pb-24">
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
          <footer className="mx-auto max-w-5xl px-4 py-6 text-center">
            <a href="/admin" className="text-[11px] text-neutral-400 hover:text-neutral-500">
              관리자
            </a>
          </footer>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}

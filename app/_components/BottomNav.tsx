"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  {
    href: "/",
    label: "홈",
    icon: (
      <path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" />
    ),
  },
  {
    href: "/community",
    label: "커뮤니티",
    icon: (
      <>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
      </>
    ),
  },
  {
    href: "/recommend",
    // "AI추천"이라고 적어놨는데 실제로는 AI를 안 부른다(lib/recommend.ts는 단어
    // 겹침 점수 계산이다). 화면이 아직 없는 기능을 있는 것처럼 말하면 안 된다.
    // 실제 화면 제목도 "맞춤 추천"이라 거기 맞춘다.
    // AI API 키를 받아 진짜 AI가 붙는 날 다시 "AI추천"으로 바꿀 것.
    label: "맞춤추천",
    icon: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />,
  },
  {
    href: "/bookmarks",
    label: "북마크",
    icon: <path d="M6 3h12v18l-6-4-6 4V3z" />,
  },
  {
    href: "/mypage",
    label: "마이",
    icon: (
      <>
        <circle cx="12" cy="8" r="3.6" />
        <path d="M4.5 20c0-4.2 3.6-6.6 7.5-6.6s7.5 2.4 7.5 6.6" />
      </>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-sage-border bg-white">
      <div className="mx-auto grid max-w-5xl grid-cols-5 px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-2">
        {ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 text-[10px] font-medium ${
                active ? "text-ink" : "text-meta"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                {item.icon}
              </svg>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

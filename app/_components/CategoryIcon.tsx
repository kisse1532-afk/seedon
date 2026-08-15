import type { Category } from "@/lib/data";

/* 카테고리 아이콘.
   원래는 이모지(📚💬🏠💳🧭🎨)를 그대로 썼는데, 이모지는 기기·OS마다 그림이
   달라서(아이폰/안드로이드/윈도우가 전부 다름) 화면이 우리가 정한 대로 안 보이고,
   색도 브랜드와 따로 논다. 직접 그린 선 아이콘으로 바꿔 6개가 한 세트로 보이게 했다.
   선 굵기·크기를 맞춰 한 손으로 그린 것처럼 통일. */

const PATHS: Record<Category, React.ReactNode> = {
  // 교육 — 펼친 책
  education: (
    <>
      <path d="M12 7.2C10.4 5.9 8.4 5.3 5.5 5.3v11.4c2.9 0 4.9.6 6.5 1.9 1.6-1.3 3.6-1.9 6.5-1.9V5.3c-2.9 0-4.9.6-6.5 1.9Z" />
      <path d="M12 7.2v11.4" />
    </>
  ),
  // 심리상담 — 말풍선 두 개가 겹친 모양(대화)
  counseling: (
    <>
      <path d="M15.5 13.2c0 .9-.75 1.7-1.7 1.7H8.9L5.6 17.4v-2.5h-.4c-.94 0-1.7-.8-1.7-1.7V6.9c0-.94.76-1.7 1.7-1.7h8.6c.95 0 1.7.76 1.7 1.7Z" />
      <path d="M15.5 8.6h3.3c.94 0 1.7.76 1.7 1.7v4.4c0 .94-.76 1.7-1.7 1.7h-.4v2.2l-2.6-2.2" />
    </>
  ),
  // 주거 — 집
  housing: (
    <>
      <path d="M4 10.6 12 4.4l8 6.2" />
      <path d="M5.9 9.9v9.2h12.2V9.9" />
      <path d="M9.9 19.1v-5h4.2v5" />
    </>
  ),
  // 경제·생활비 — 카드
  living: (
    <>
      <rect x="3.2" y="5.9" width="17.6" height="12.2" rx="2.2" />
      <path d="M3.2 9.9h17.6" />
      <path d="M6.9 14.6h3.4" />
    </>
  ),
  // 진로·취업 — 나침반
  career: (
    <>
      <circle cx="12" cy="12" r="8.2" />
      <path d="m14.9 9.1-1.6 4.2-4.2 1.6 1.6-4.2Z" />
    </>
  ),
  // 문화체험 — 티켓
  culture: (
    <>
      <path d="M20.3 9.4V7.2c0-.8-.7-1.5-1.5-1.5H5.2c-.83 0-1.5.67-1.5 1.5v2.2a2.6 2.6 0 0 1 0 5.2v2.2c0 .83.67 1.5 1.5 1.5h13.6c.83 0 1.5-.67 1.5-1.5v-2.2a2.6 2.6 0 0 1 0-5.2Z" />
      <path d="M13.7 5.7v2.1M13.7 11v2M13.7 16.2v2.1" />
    </>
  ),
};

export default function CategoryIcon({
  slug,
  className = "h-6 w-6",
}: {
  slug: Category;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[slug]}
    </svg>
  );
}

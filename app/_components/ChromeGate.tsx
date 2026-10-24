"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * 광고용 랜딩페이지(/start)에서는 사이트 머리·꼬리·아래 메뉴를 숨긴다.
 *
 * 왜 (2026.10.24 로드 결정): /start는 인스타 광고를 눌러 들어온 청소년이
 * 「신청까지 한 번에 해 보기」 버튼 하나만 보게 만든 화면이다. 로드가 다른 링크를
 * 일부러 다 뺐다("이런거는 필요 없지 않을까", "괜찮아요 지금 있는 지원 볼래요도
 * 삭제"). 머리의 「제보하기」, 꼬리의 메뉴, 아래 탭이 남아 있으면 그 결정이
 * 무너지고, 몇 명이 버튼을 눌렀는지 세는 숫자도 흐려진다.
 *
 * 다른 페이지는 지금과 똑같이 보인다.
 */
export const BARE_PATHS = ["/start"];

export function isBarePath(pathname: string | null) {
  if (!pathname) return false;
  return BARE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function ChromeGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (isBarePath(pathname)) return null;
  return <>{children}</>;
}

/** 본문 감싸개 — /start에서는 여백·폭 제한 없이 화면을 꽉 채운다. */
export function MainFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (isBarePath(pathname)) return <main>{children}</main>;
  return <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>;
}

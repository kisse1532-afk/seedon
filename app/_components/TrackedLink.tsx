"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type TrackedEvent = "category_card_click" | "apply_page_view" | "apply_link_click";

type Props = {
  href: string;
  event: TrackedEvent;
  programId?: string;
  category?: string;
  external?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick">;

// 카드 클릭·신청 링크 클릭 등 전환 퍼널 이벤트를 기록하는 래퍼.
// 네비게이션을 막지 않도록 fetch는 fire-and-forget으로 보낸다 (실패해도 사용자 흐름엔 영향 없음).
function fireTrack(event: TrackedEvent, programId?: string, category?: string) {
  try {
    const payload = JSON.stringify({ event_type: event, program_id: programId, category });
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/track", blob);
    } else {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // 트래킹 실패는 절대 사용자 경험에 영향을 주지 않는다
  }
}

export default function TrackedLink({
  href,
  event,
  programId,
  category,
  external,
  className,
  children,
  ...rest
}: Props) {
  const handleClick = () => fireTrack(event, programId, category);

  if (external) {
    return (
      <a
        href={href}
        onClick={handleClick}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}

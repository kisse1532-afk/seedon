"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { trackSource } from "@/lib/track-source";
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
async function fireTrack(event: TrackedEvent, programId?: string, category?: string) {
  try {
    /* 로그인했으면 누가 눌렀는지 같이 남긴다. 이게 없으면 "몇 번 눌렸나"는
       알아도 "몇 명이 갔나"를 알 수 없어서, 전환율이 사람 단위가 되지 않는다.
       (2026-08-16 기준 96건 전부 사람 연결이 비어 있었다)

       서버(/api/track)가 아니라 브라우저에서 바로 넣는다 — 서버는 로그인
       세션을 모르기 때문에 거기서는 user_id를 채울 방법이 없다. */
    const { data } = await supabase.auth.getUser();
    await supabase.from("program_events").insert({
      event_type: event,
      program_id: programId || null,
      category: category || null,
      user_id: data.user?.id ?? null,
      /* 우리가 화면을 찍을 때 생긴 기록은 집계에서 빠져야 한다.
         (2026.08.19 — lib/track-source.ts 설명 참고) */
      source: trackSource(),
    });
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
  /* 기록을 기다리지 않는다. 링크는 바로 열려야 한다 — 기다리게 하면
     눌러도 반응이 없는 것처럼 느껴진다. */
  const handleClick = () => {
    void fireTrack(event, programId, category);
  };

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

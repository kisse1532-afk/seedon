"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { rememberNext } from "@/lib/next-destination";
import { SeedonSymbol } from "@/app/_components/Logo";

/**
 * 로그인해야 볼 수 있는 화면을 감싼다.
 *
 * 로드 결정(2026-08-16): 북마크·맞춤추천·커뮤니티는 로그인한 사람만 쓰게 해서
 * 누가 무엇을 쓰는지 쌓이게 한다.
 *
 * 막을 때 두 가지를 지킨다.
 *  1. 왜 로그인이 필요한지 화면마다 다르게 말한다. "로그인하세요"만 있으면
 *     청소년은 그냥 나간다
 *  2. 막다른 길로 두지 않는다. 프로그램을 보고 신청 방법을 확인하는 것은
 *     로그인 없이도 되므로, 그쪽으로 가는 길을 같이 놓는다
 *
 * 이건 정보를 감추는 장치가 아니다. 여기 나오는 내용은 원래 공개된 것이고,
 * 로그인을 권하는 안내판에 가깝다.
 */
export default function RequireLogin({
  reason,
  children,
}: {
  /** 이 화면에서 로그인이 왜 필요한지. 청소년에게 하는 말로 쓴다. */
  reason: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [state, setState] = useState<"checking" | "in" | "out">("checking");

  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data }) => {
      if (alive) setState(data.user ? "in" : "out");
    });

    // 다른 탭에서 로그인·로그아웃하면 이 화면도 따라 바뀌어야 한다.
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (alive) setState(session?.user ? "in" : "out");
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // 확인하는 동안 잠깐 비워둔다. 여기서 로그인 안내를 먼저 띄우면, 로그인한
  // 사람도 화면이 한 번 깜빡이면서 "로그인하래" 하고 지나간다.
  if (state === "checking") {
    /* 예전에는 아무것도 없는 빈 칸을 그렸다. 네트워크가 느린 폰에서는 이 순간이
       길어지고, 그동안 화면이 통째로 비어 보여 "고장났나" 하고 나가게 된다.
       (2026.08.20 디자인팀 — 화면을 찍었더니 헤더·푸터만 있고 본문이 없었다) */
    return (
      <div className="flex min-h-[40vh] items-center justify-center" aria-hidden>
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-sage-border border-t-primary-deep" />
      </div>
    );
  }

  if (state === "in") return <>{children}</>;

  return (
    <div className="mx-auto max-w-sm space-y-5 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mint">
        <SeedonSymbol height={22} />
      </div>
      <div className="space-y-2">
        <h1 className="text-lg font-extrabold tracking-tight text-ink">로그인하면 쓸 수 있어요</h1>
        <p className="text-sm leading-relaxed text-ink-60">{reason}</p>
      </div>

      <Link
        href="/login"
        onClick={() => rememberNext(pathname)}
        className="block w-full rounded-full bg-primary-deep py-3.5 text-sm font-bold text-white transition hover:brightness-110"
      >
        로그인하고 쓰기
      </Link>

      {/* 막다른 길로 두지 않는다. 프로그램을 찾아보는 건 로그인 없이도 된다. */}
      <Link href="/" className="block text-xs text-meta transition hover:text-body">
        로그인 없이 프로그램 둘러보기
      </Link>
    </div>
  );
}

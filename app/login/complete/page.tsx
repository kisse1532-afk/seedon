"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { mergeLocalBookmarksIntoAccount } from "@/lib/bookmarks";
import { flushPendingConsent } from "@/lib/consent";

export default function LoginCompletePage() {
  const [movedCount, setMovedCount] = useState(0);

  /* 로그인 전에 저장해둔 관심 프로그램을 계정으로 옮긴다.
     이게 없으면 "로그인했더니 저장해둔 게 사라졌다"가 되고, 청소년 입장에서는
     로그인 때문에 잃어버린 것이라 다시 안 쓰게 된다. */
  useEffect(() => {
    const before = (() => {
      try {
        const raw = localStorage.getItem("seedon_bookmarks");
        return raw ? (JSON.parse(raw) as string[]).length : 0;
      } catch {
        return 0;
      }
    })();
    setMovedCount(before);
    mergeLocalBookmarksIntoAccount();
    // 동의를 체크한 시점에는 아직 세션이 없을 수 있어 브라우저에 맡겨둔다.
    // 여기까지 왔으면 로그인이 끝난 것이므로 계정에 올린다.
    flushPendingConsent();
  }, []);

  return (
    <div className="max-w-sm mx-auto text-center py-20 space-y-5">
      <div className="w-16 h-16 rounded-full bg-primary mx-auto flex items-center justify-center text-white text-2xl">✓</div>
      <div>
        <h1 className="text-lg font-semibold">가입이 완료됐어요!</h1>
        <p className="text-sm text-ink-60 mt-1">이제 씨드온을 시작할 준비가 됐어요.</p>
        {movedCount > 0 && (
          <p className="mt-2 text-xs text-primary-deep">
            저장해둔 관심 프로그램 {movedCount}개도 그대로 옮겨놨어요.
          </p>
        )}
      </div>
      <Link
        href="/mypage"
        className="inline-block w-full rounded-full bg-primary-deep text-white text-sm font-medium py-3 hover:brightness-110"
      >
        마이페이지로 가기
      </Link>
      <Link href="/" className="block text-xs text-meta hover:text-body">
        홈으로
      </Link>
    </div>
  );
}

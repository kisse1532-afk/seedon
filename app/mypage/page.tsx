"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { loadBookmarks, onBookmarksChange } from "@/lib/bookmarks";

export default function MyPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      const ids = await loadBookmarks();
      if (!alive) return;
      setEmail(data.user?.email ?? null);
      setBookmarkCount(ids.length);
      setLoaded(true);
    }
    load();

    // 다른 화면에서 북마크를 켜고 끄면 여기 숫자도 같이 바뀌어야 한다.
    const off = onBookmarksChange(() => {
      loadBookmarks().then((ids) => alive && setBookmarkCount(ids.length));
    });
    return () => {
      alive = false;
      off();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const loggedIn = Boolean(email);
  /** 이메일 앞부분만 보여준다. 화면에 주소를 통째로 띄울 이유가 없다. */
  const nickname = email ? email.split("@")[0] : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-cream flex items-center justify-center text-2xl">
          {loggedIn ? "🌱" : "🙂"}
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate">{loggedIn ? `${nickname}님` : "게스트님"}</p>
          <p className="text-xs text-meta">
            {loggedIn ? "저장한 프로그램이 계정에 보관돼요" : "로그인하면 저장한 게 폰을 바꿔도 남아요"}
          </p>
        </div>
      </div>

      {!loggedIn && loaded && (
        <Link
          href="/login"
          className="block rounded-2xl bg-primary-deep px-5 py-4 text-center text-sm font-bold text-white hover:brightness-110"
        >
          로그인하고 시작하기
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 text-center">
        <Link href="/bookmarks" className="rounded-2xl border border-sage-border bg-white p-4 hover:border-primary/40">
          <div className="text-lg font-bold">{loaded ? bookmarkCount : "–"}</div>
          <div className="text-xs text-meta mt-1">저장한 프로그램</div>
        </Link>
        <Link href="/search" className="rounded-2xl border border-sage-border bg-white p-4 hover:border-primary/40">
          <div className="text-lg font-bold">더보기</div>
          <div className="text-xs text-meta mt-1">전체 프로그램</div>
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink-60">계정</h2>
        <div className="rounded-2xl border border-sage-border bg-white divide-y divide-neutral-100 text-sm">
          {loggedIn && (
            <div className="p-4 flex items-center justify-between">
              <span className="text-meta">로그인한 계정</span>
              <span className="text-body truncate max-w-[60%]">{email}</span>
            </div>
          )}
          <Link href="/report" className="p-4 flex items-center justify-between text-body hover:text-primary-deep">
            <span>잘못된 정보 제보하기</span>
            <span className="text-sage-border">›</span>
          </Link>
          {loggedIn ? (
            <button
              onClick={handleLogout}
              className="w-full p-4 flex items-center justify-between text-body hover:text-primary-deep"
            >
              <span>로그아웃</span>
              <span className="text-sage-border">›</span>
            </button>
          ) : (
            <Link href="/login" className="p-4 flex items-center justify-between text-body hover:text-primary-deep">
              <span>로그인</span>
              <span className="text-sage-border">›</span>
            </Link>
          )}
        </div>
      </section>

      <p className="text-[11px] leading-relaxed text-meta text-center pt-2">
        신청 내역과 맞춤 추천은 준비 중이에요.
      </p>
    </div>
  );
}

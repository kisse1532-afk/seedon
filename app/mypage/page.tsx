"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { loadBookmarks, onBookmarksChange, clearLocalBookmarks } from "@/lib/bookmarks";
import MyInfo from "./MyInfo";
import { SeedonSymbol } from "@/app/_components/Logo";
import { loadMyProfile } from "@/lib/consent";

export default function MyPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      const ids = await loadBookmarks();
      const profile = await loadMyProfile();

      if (!alive) return;
      setEmail(data.user?.email ?? null);
      setProfileName(profile?.nickname ?? null);
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
    // 세션이 끊기면 계정 목록을 다시 못 읽으므로 브라우저에 남은 복사본을 먼저 비운다.
    // 안 그러면 로그아웃했는데도 저장해둔 게 계속 보인다.
    clearLocalBookmarks();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const loggedIn = Boolean(email);
  /* 적어준 이름이 있으면 그걸 부른다. 없을 때만 이메일 앞부분으로 대신한다 —
     아이디처럼 보이는 문자열로 부르면 자기 계정 같지가 않다(2026-08-16 로드 지적).
     이메일 주소를 통째로 띄우지는 않는다. */
  const displayName = profileName ?? (email ? email.split("@")[0] : null);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        {/* 🌱 이모지 자리에 우리 심볼을 쓴다. 이모지는 기기마다 그림이 달라서
            같은 화면이 안드로이드·아이폰에서 다르게 보인다(BRAND.md 로고 규칙).
            로그인 화면은 이미 고쳐져 있었는데 여기만 남아 있었다. */}
        <div className="w-14 h-14 rounded-full bg-mint flex items-center justify-center">
          {loggedIn ? (
            <SeedonSymbol height={22} />
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              className="h-6 w-6 text-meta"
              aria-hidden
            >
              <circle cx="12" cy="8.4" r="3.6" />
              <path d="M5.4 19.2a6.6 6.6 0 0 1 13.2 0" />
            </svg>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate">{loggedIn ? `${displayName}님` : "게스트님"}</p>
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


      {loggedIn && <MyInfo />}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink-60">계정</h2>
        <div className="rounded-2xl border border-sage-border bg-white divide-y divide-sage-line text-sm">
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
          <Link href="/terms" className="p-4 flex items-center justify-between text-body hover:text-primary-deep">
            <span>이용약관</span>
            <span className="text-sage-border">›</span>
          </Link>
          <Link href="/privacy" className="p-4 flex items-center justify-between text-body hover:text-primary-deep">
            <span>개인정보 처리방침</span>
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

      {/* "준비 중이에요"라고 적혀 있었는데 /recommend는 이미 만들어져 있고
          하단 탭에도 나와 있다. 안 됐다고 적어두면 되는 기능을 안 써보고 지나간다. */}
      <Link
        href="/recommend"
        className="block pt-2 text-center text-[11px] leading-relaxed text-primary-deep hover:underline"
      >
        지금 어떤 상황인지 적으면 맞춤 추천도 받아볼 수 있어요 →
      </Link>
    </div>
  );
}

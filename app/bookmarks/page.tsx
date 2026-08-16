"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { rememberNext } from "@/lib/next-destination";
import { SeedonSymbol } from "@/app/_components/Logo";
import { loadBookmarks, onBookmarksChange } from "@/lib/bookmarks";
import { fetchProgramsByIds } from "@/lib/queries";
import { getClosedNotice, type Program } from "@/lib/data";
import BookmarkButton from "@/app/_components/BookmarkButton";
import TrackedLink from "@/app/_components/TrackedLink";

export default function BookmarksPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loaded, setLoaded] = useState(false);
  /* 로그인 안 한 사람이 이 기기에 저장해둔 개수. 목록은 안 보여주되 몇 개
     있는지는 알려준다 — "로그인하세요"만 있으면 뭘 얻는지 몰라서 그냥 나간다. */
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    let alive = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      const ids = await loadBookmarks();

      // 로그인 전이면 목록은 그리지 않는다. 개수만 세어 로그인 안내에 쓴다.
      if (!data.user) {
        if (!alive) return;
        setLoggedIn(false);
        setSavedCount(ids.length);
        setLoaded(true);
        return;
      }

      // 한 번에 가져온다. 예전에는 id마다 조회를 한 번씩 보내서, 많이 저장한
      // 사람일수록 목록이 늦게 떴다.
      const found = await fetchProgramsByIds(ids);

      // 저장한 순서를 지킨다. DB는 순서를 보장하지 않으므로 여기서 맞춘다.
      const byId = new Map(found.map((p) => [p.id, p]));
      const ordered = ids.map((id) => byId.get(id)).filter((p): p is Program => Boolean(p));

      if (!alive) return;
      setLoggedIn(Boolean(data.user));
      setPrograms(ordered);
      setLoaded(true);
    }
    load();

    const off = onBookmarksChange(load);
    return () => {
      alive = false;
      off();
    };
  }, []);

  // 로그인 전에는 목록 대신 안내를 보여준다(로드 결정 2026-08-16). 저장 자체는
  // 계속 되게 두는데, 저장하려는 순간 로그인부터 요구하면 거기서 나가버린다.
  // 몇 개 저장돼 있는지는 알려준다 — 무엇을 얻는지 알아야 로그인할 이유가 생긴다.
  if (loaded && !loggedIn) {
    return (
      <div className="mx-auto max-w-sm space-y-5 py-14 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mint">
          <SeedonSymbol height={22} />
        </div>
        <div className="space-y-2">
          <h1 className="text-lg font-extrabold tracking-tight text-ink">저장한 프로그램 보기</h1>
          <p className="text-sm leading-relaxed text-ink-60">
            {savedCount > 0 ? (
              <>
                이 기기에 <b className="font-bold text-primary-deep">{savedCount}개</b>를
                저장해뒀어요. 로그인하면 그대로 옮겨주고, 폰을 바꿔도 남아요.
              </>
            ) : (
              <>
                저장한 프로그램은 로그인해야 볼 수 있어요. 로그인해두면 폰을 바꾸거나
                앱을 지워도 그대로 있어요.
              </>
            )}
          </p>
        </div>

        <Link
          href="/login"
          onClick={() => rememberNext("/bookmarks")}
          className="block w-full rounded-full bg-primary-deep py-3.5 text-sm font-bold text-white transition hover:brightness-110"
        >
          로그인하고 보기
        </Link>
        <Link href="/" className="block text-xs text-meta transition hover:text-body">
          로그인 없이 프로그램 둘러보기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-meta hover:text-body">
          ← 홈으로
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight text-ink mt-2">북마크</h1>
        <p className="text-sm text-ink-60 mt-1">
          계정에 저장돼 있어요. 폰을 바꿔도 그대로 있어요.
        </p>
      </div>


      <div className="grid gap-3">
        {loaded && programs.length === 0 && (
          <p className="text-sm text-meta py-8 text-center">
            아직 북마크한 프로그램이 없어요. 카드 오른쪽 위 책갈피 아이콘을 눌러 저장해보세요.
          </p>
        )}
        {programs.map((p) => {
          // 저장해둔 사이에 마감됐거나 내려간 것. 지우지는 않는다 — 본인이 저장한
          // 건 본인이 지우게 두고, 대신 지금 상태를 사실대로 알려준다.
          const closed = getClosedNotice(p);
          return (
            <div
              key={p.id}
              className={`relative rounded-2xl border bg-white p-5 flex flex-col gap-2 ${
                closed ? "border-sage-border" : "border-sage-border"
              }`}
            >
              <BookmarkButton
                programId={p.id}
                className="absolute top-4 right-4 text-sage-border hover:text-primary-deep"
              />
              <div className="flex items-start justify-between gap-2 pr-8">
                <div>
                  <h3 className={`font-semibold ${closed ? "text-meta" : ""}`}>{p.title}</h3>
                  <p className="text-xs text-meta">{p.org}</p>
                </div>
              </div>
              {closed && (
                <p className="w-fit rounded-md bg-mint px-2 py-1 text-[11px] font-semibold text-meta">
                  {closed}
                </p>
              )}
              <p className={`text-sm ${closed ? "text-meta" : "text-body"}`}>{p.description}</p>
              <div className="flex items-center justify-end mt-2">
                <TrackedLink
                  href={`/apply/${p.id}`}
                  event="category_card_click"
                  programId={p.id}
                  category={p.category}
                  className={`text-sm font-medium rounded-full px-4 py-1.5 ${
                    closed
                      ? "border border-sage-border text-meta hover:text-body"
                      : "bg-primary-deep text-white hover:brightness-110"
                  }`}
                >
                  {closed ? "내용 보기" : "신청 알아보기 →"}
                </TrackedLink>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

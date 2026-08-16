"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { loadBookmarks, onBookmarksChange } from "@/lib/bookmarks";
import { fetchProgramsByIds } from "@/lib/queries";
import { getClosedNotice, type Program } from "@/lib/data";
import BookmarkButton from "@/app/_components/BookmarkButton";
import TrackedLink from "@/app/_components/TrackedLink";

export default function BookmarksPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      const ids = await loadBookmarks();
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

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-meta hover:text-body">
          ← 홈으로
        </Link>
        <h1 className="text-xl font-bold mt-2">북마크</h1>
        {/* 로그인하면 계정에 저장되도록 바뀌었는데 안내문은 "이 기기에만
            보관돼요"로 남아 있었다. 사실과 다른 안내는 없느니만 못하다 —
            계정에 잘 있는데도 폰 바꾸면 사라진다고 믿게 만든다. */}
        <p className="text-sm text-ink-60 mt-1">
          {!loaded
            ? " "
            : loggedIn
              ? "계정에 저장돼 있어요. 폰을 바꿔도 그대로 있어요."
              : "지금은 이 기기에만 저장돼요. 로그인하면 폰을 바꿔도 남아요."}
        </p>
      </div>

      {/* 로그인 안 한 사람에게만, 저장해둔 게 실제로 있을 때만 권한다.
          빈 화면에서 로그인부터 하라고 하면 얻는 게 없어 보인다. */}
      {loaded && !loggedIn && programs.length > 0 && (
        <Link
          href="/login"
          className="flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-mint px-5 py-4 transition hover:brightness-[0.98]"
        >
          <span className="text-sm leading-relaxed text-body">
            <b className="font-bold text-primary-deep">{programs.length}개</b>를 저장해뒀어요.
            로그인해두면 폰을 바꾸거나 앱을 지워도 그대로 있어요.
          </span>
          <span className="shrink-0 text-sm font-bold text-primary-deep">로그인 →</span>
        </Link>
      )}

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
                closed ? "border-neutral-200" : "border-sage-border"
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
                <p className="w-fit rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-semibold text-meta">
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

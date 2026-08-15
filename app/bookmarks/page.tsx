"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadBookmarks, onBookmarksChange } from "@/lib/bookmarks";
import { fetchProgram } from "@/lib/queries";
import type { Program } from "@/lib/data";
import BookmarkButton from "@/app/_components/BookmarkButton";
import TrackedLink from "@/app/_components/TrackedLink";

export default function BookmarksPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const ids = await loadBookmarks();
      const results = await Promise.all(ids.map((id) => fetchProgram(id)));
      setPrograms(results.filter((p): p is Program => Boolean(p)));
      setLoaded(true);
    }
    load();
    return onBookmarksChange(load);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-meta hover:text-body">
          ← 홈으로
        </Link>
        <h1 className="text-xl font-bold mt-2">북마크</h1>
        <p className="text-sm text-ink-60 mt-1">
          저장해둔 프로그램은 이 기기에만 보관돼요. 앱을 지우거나 다른 기기에서 보면 안 보일 수 있어요.
        </p>
      </div>

      <div className="grid gap-3">
        {loaded && programs.length === 0 && (
          <p className="text-sm text-meta py-8 text-center">
            아직 북마크한 프로그램이 없어요. 카드 오른쪽 위 책갈피 아이콘을 눌러 저장해보세요.
          </p>
        )}
        {programs.map((p) => (
          <div key={p.id} className="relative rounded-2xl border border-sage-border bg-white p-5 flex flex-col gap-2">
            <BookmarkButton
              programId={p.id}
              className="absolute top-4 right-4 text-sage-border hover:text-primary-deep"
            />
            <div className="flex items-start justify-between gap-2 pr-8">
              <div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-xs text-meta">{p.org}</p>
              </div>
            </div>
            <p className="text-sm text-body">{p.description}</p>
            <div className="flex items-center justify-end mt-2">
              <TrackedLink
                href={`/apply/${p.id}`}
                event="category_card_click"
                programId={p.id}
                category={p.category}
                className="text-sm font-medium bg-primary-deep text-white rounded-full px-4 py-1.5 hover:brightness-110"
              >
                신청 알아보기 →
              </TrackedLink>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

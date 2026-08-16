"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { rankPrograms, type Ranked } from "@/lib/recommend";
import { fetchProgramsByIds } from "@/lib/queries";
import { loadBookmarks } from "@/lib/bookmarks";
import type { Category, Program } from "@/lib/data";
import TrackedLink from "@/app/_components/TrackedLink";
import BookmarkButton from "@/app/_components/BookmarkButton";
import EnrollmentBadge from "@/app/_components/EnrollmentBadge";

/**
 * 추천 결과 목록.
 *
 * 왜 브라우저에서 순서를 매기는가: 저장해둔 프로그램을 봐야 "비슷한 걸 위로"가
 * 되는데, 저장 목록은 로그인 세션이 있어야 읽을 수 있고 세션은 브라우저에만 있다.
 * 프로그램 목록 자체는 서버에서 미리 받아 넘겨주므로 화면이 비어 보이는 시간은 없다.
 */
export default function ResultsList({ q, programs }: { q: string; programs: Program[] }) {
  const [likedCategories, setLikedCategories] = useState<Category[]>([]);
  const [personalized, setPersonalized] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      const ids = await loadBookmarks();
      if (ids.length === 0) return;
      const saved = await fetchProgramsByIds(ids);
      if (!alive || saved.length === 0) return;
      setLikedCategories([...new Set(saved.map((p) => p.category))]);
      setPersonalized(true);
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  const { items, understood } = rankPrograms(q, programs, { likedCategories });

  return (
    <>
      {/* 못 알아들었어도 빈손으로 돌려보내지 않는다. 자기 사정을 적은 청소년이
          "못 찾았어요"만 보고 나가면, 정보 비대칭을 없앤 게 아니라 하나 더 만든 것이다. */}
      <p
        className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
          understood
            ? "border-mint bg-mint text-primary-deep"
            : "border-sage-border bg-white text-ink-60"
        }`}
      >
        {understood
          ? `${items.length}개를 찾았어요`
          : "딱 맞는 걸 못 찾아서, 지금 신청할 수 있는 것부터 보여드려요"}
      </p>

      {personalized && understood && (
        <p className="text-xs leading-relaxed text-meta">
          저장해둔 것과 비슷한 갈래를 조금 위로 올렸어요.
        </p>
      )}

      <div className="grid gap-3">
        {items.length === 0 && (
          <p className="py-8 text-center text-sm text-meta">
            지금은 보여드릴 프로그램이 없어요.{" "}
            <Link href="/" className="underline hover:text-body">
              홈에서 둘러보기
            </Link>
          </p>
        )}
        {items.map(({ program: p, reason }: Ranked) => (
          <div
            key={p.id}
            className="relative flex flex-col gap-2 rounded-2xl border border-sage-border bg-white p-5"
          >
            <BookmarkButton
              programId={p.id}
              className="absolute right-4 top-4 text-sage-border hover:text-primary-deep"
            />
            <div className="pr-8">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="font-semibold text-ink">{p.title}</h3>
                <EnrollmentBadge program={p} />
              </div>
              <p className="text-xs text-meta">{p.org}</p>
            </div>
            {reason && <p className="text-[11px] font-semibold text-primary-deep">{reason}</p>}
            <p className="text-sm leading-relaxed text-body">{p.description}</p>
            <div className="mt-2 flex items-center justify-end">
              <TrackedLink
                href={`/apply/${p.id}`}
                event="category_card_click"
                programId={p.id}
                category={p.category}
                className="rounded-full bg-primary-deep px-4 py-1.5 text-sm font-medium text-white hover:brightness-110"
              >
                신청 알아보기 →
              </TrackedLink>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

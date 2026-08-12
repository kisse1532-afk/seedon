"use client";

import { useEffect, useState } from "react";
import { isBookmarked, toggleBookmark } from "@/lib/bookmarks";

export default function BookmarkButton({
  programId,
  className,
}: {
  programId: string;
  className?: string;
}) {
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    setBookmarked(isBookmarked(programId));
  }, [programId]);

  return (
    <button
      type="button"
      onClick={() => setBookmarked(toggleBookmark(programId))}
      aria-label={bookmarked ? "북마크 해제" : "북마크에 저장"}
      aria-pressed={bookmarked}
      className={className ?? "text-neutral-300 hover:text-emerald-600"}
    >
      {bookmarked ? (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-emerald-600">
          <path d="M6.32 2.577a49 49 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.5 48.5 0 0111.186 0z"
          />
        </svg>
      )}
    </button>
  );
}

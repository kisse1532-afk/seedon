"use client";

import { useEffect, useState } from "react";
import { loadReviews, submitReview, type Review } from "@/lib/reviews";
import { loadMyProfile } from "@/lib/consent";

/**
 * 이 프로그램을 해본 사람들의 한마디 + 남기는 칸.
 *
 * 남긴 글은 바로 올라가지 않는다. 그 사실을 미리 말해준다 — 썼는데 안 보이면
 * 고장난 줄 알고 다시 쓰거나, 씨드온이 지웠다고 오해한다.
 */
export default function Reviews({ programId }: { programId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 마이페이지에 적어둔 이름을 미리 채운다. 매번 다시 적게 하면 받아둔 의미가 없다.
  const [myName, setMyName] = useState("");

  useEffect(() => {
    let alive = true;
    loadReviews(programId).then((r) => alive && setReviews(r));
    loadMyProfile().then((p) => alive && p?.nickname && setMyName(p.nickname));
    return () => {
      alive = false;
    };
  }, [programId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSaving(true);
    setError(null);

    const result = await submitReview(
      programId,
      String(form.get("body") || ""),
      String(form.get("nickname") || "")
    );

    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setDone(true);
    setOpen(false);
  }

  return (
    <div className="space-y-3 rounded-card border border-sage-border bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-ink">해본 사람들 이야기</h2>
        {!open && !done && (
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-full border border-primary-deep/40 px-3 py-1 text-xs font-semibold text-primary-deep transition hover:bg-mint"
          >
            나도 남기기
          </button>
        )}
      </div>

      {reviews.length === 0 && !open && !done && (
        <p className="text-xs leading-relaxed text-meta">
          아직 이야기가 없어요. 이 프로그램을 해봤다면 뒤에 올 친구를 위해
          한두 줄 남겨줄래요?
        </p>
      )}

      {reviews.length > 0 && (
        <ul className="space-y-2.5">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-xl bg-cream/60 px-3.5 py-3">
              <p className="text-sm leading-relaxed text-body">{r.body}</p>
              <p className="mt-1.5 text-[11px] text-meta">
                {r.nickname || "이름 없이"} · {r.created_at.slice(0, 10)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {done && (
        <p className="rounded-xl bg-mint px-3.5 py-3 text-xs leading-relaxed text-primary-deep">
          남겨줘서 고마워요. 씨드온이 한 번 읽어보고 올릴게요. 그래서 바로 보이지는
          않아요.
        </p>
      )}

      {open && (
        <form onSubmit={handleSubmit} className="space-y-2.5 pt-1">
          <textarea
            name="body"
            rows={4}
            required
            maxLength={500}
            placeholder="어땠는지, 신청할 때 헷갈렸던 게 있었는지 편하게 적어주세요."
            className="w-full rounded-control border border-sage-border p-3.5 text-sm text-body transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-neutral-400"
          />
          <input
            name="nickname"
            type="text"
            maxLength={20}
            defaultValue={myName}
            placeholder="이름 또는 닉네임 (안 적어도 돼요)"
            className="w-full rounded-control border border-sage-border px-3.5 py-2.5 text-sm text-body transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-neutral-400"
          />

          {error && (
            <p className="rounded-control bg-red-50 px-3.5 py-2.5 text-xs leading-relaxed text-red-700">
              {error}
            </p>
          )}

          <p className="text-[11px] leading-relaxed text-meta">
            이름이나 연락처, 다니는 학교처럼 누구인지 알 수 있는 건 적지 말아주세요.
            남긴 글은 씨드온이 읽어본 뒤에 올라가요.
          </p>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-control bg-primary-deep py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {saving ? "보내는 중..." : "남기기"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-control border border-sage-border px-4 text-sm font-medium text-meta transition hover:text-body"
            >
              그만두기
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

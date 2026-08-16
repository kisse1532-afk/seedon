"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { submitInterest } from "@/lib/applications";

/**
 * 관심 등록 폼.
 *
 * 서버 액션이 아니라 브라우저에서 저장한다. 서버 쪽은 로그인 세션을 모르기 때문에
 * "누가 등록했는지"가 비어버리고, 그러면 청소년 본인이 마이페이지에서 자기 내역을
 * 볼 수 없다 (자세한 이유는 lib/applications.ts).
 *
 * 절대규칙 1·2: 이름·연락처 외에는 아무것도 묻지 않는다. 소득·자격 관련 항목은
 * 여기 절대 추가하지 않는다.
 */
export default function InterestForm({ programId }: { programId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data }) => {
      if (alive) setLoggedIn(Boolean(data.user));
    });
    return () => {
      alive = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "").trim();
    const contact = String(form.get("contact") || "").trim();

    if (!name || !contact) {
      setError("이름과 연락처를 적어주세요.");
      return;
    }

    setSaving(true);
    setError(null);
    const result = await submitInterest(programId, name, contact);

    if (!result.ok) {
      setError(result.message);
      setSaving(false);
      return;
    }
    router.push(`/apply/${programId}/complete`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-card border border-sage-border bg-white p-5"
    >
      <div>
        <h2 className="mb-1 text-sm font-bold text-ink">이 프로그램 관심 등록</h2>
        <p className="text-xs leading-relaxed text-ink-60">
          신청을 대신 처리해드리진 않아요. 남겨주시면 이 프로그램 모집이 다시
          열리거나 비슷한 게 생겼을 때 씨드온 운영자가 직접 연락드려요.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="name" className="text-xs font-semibold text-ink-60">
          이름
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full rounded-control border border-sage-border px-4 py-3 text-sm text-body transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-meta"
          placeholder="이름을 입력해주세요"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="contact" className="text-xs font-semibold text-ink-60">
          연락처
        </label>
        <input
          id="contact"
          name="contact"
          type="tel"
          required
          className="w-full rounded-control border border-sage-border px-4 py-3 text-sm text-body transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-meta"
          placeholder="010-0000-0000"
        />
      </div>

      {error && (
        <p className="rounded-control bg-red-50 px-3.5 py-2.5 text-xs leading-relaxed text-red-700">
          {error}
        </p>
      )}

      {/* 이 버튼만 검정(neutral-800)이라 브랜드 밖으로 튀어 있었다.
          신청 자체는 위 CTA에서 하고 여기는 부수 동작이므로, 눈에 덜 띄는
          테두리 버튼으로 두되 색은 브랜드 안에서 쓴다. */}
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-control border border-primary-deep bg-white py-3.5 text-sm font-bold text-primary-deep transition hover:bg-mint disabled:opacity-60"
      >
        {saving ? "저장 중..." : "관심 등록하기"}
      </button>

      {/* 로그인한 사람에게만 "어디서 다시 볼 수 있는지"를 알려준다. 로그인 안 한
          사람에게 이 말을 하면 지금 당장 못 하는 걸 알려주는 셈이라 안 쓴다. */}
      {loggedIn && (
        <p className="text-center text-[11px] leading-relaxed text-primary-deep">
          등록하면 마이페이지에서 다시 볼 수 있어요.
        </p>
      )}

      <p className="text-center text-[11px] leading-relaxed text-meta">
        입력하신 정보는 연락드리는 목적으로만 쓰고, 처리가 끝나면 일정 기간 뒤
        삭제해요. 자동으로 문자나 메일이 가지는 않아요. 실제 신청은 위 &apos;이렇게 신청하세요&apos;
        안내를 따라 직접 진행해주세요.
      </p>
    </form>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { submitInterest } from "@/lib/applications";
import { clearMyInfo, loadMyInfo, saveMyInfo } from "@/lib/my-info";
import SavedInfoNote from "@/app/_components/SavedInfoNote";

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

  /* 자동 채움. 서버 렌더 때는 localStorage를 못 읽으므로 비워둔 채로 그리고,
     화면이 뜬 뒤에 채운다. 처음부터 값을 넣으면 서버가 그린 것과 달라져서
     리액트가 경고를 내고 입력칸이 초기화되는 일이 생긴다. */
  const [prefill, setPrefill] = useState<{ name: string; contact: string } | null>(null);

  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data }) => {
      if (alive) setLoggedIn(Boolean(data.user));
    });
    const saved = loadMyInfo();
    if (saved) setPrefill({ name: saved.name, contact: saved.contact });
    return () => {
      alive = false;
    };
  }, []);

  function handleClearSaved() {
    clearMyInfo();
    setPrefill(null);
    // 이미 채워진 입력칸도 같이 비운다. 안 그러면 "지웠다"고 해놓고 화면에는
    // 그대로 남아 있어서, 지워졌는지 아닌지 알 수 없다.
    const form = document.getElementById("interest-form") as HTMLFormElement | null;
    form?.reset();
  }

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
    // 성공한 뒤에만 저장한다. 저장에 실패해도 신청은 이미 끝났으므로 막지 않는다.
    saveMyInfo(name, contact);
    router.push(`/apply/${programId}/complete`);
  }

  return (
    <form
      id="interest-form"
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

      {prefill && <SavedInfoNote onClear={handleClearSaved} />}

      <div className="space-y-1.5">
        <label htmlFor="name" className="text-xs font-semibold text-ink-60">
          이름
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={prefill?.name ?? ""}
          key={`name-${prefill?.name ?? "empty"}`}
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
          defaultValue={prefill?.contact ?? ""}
          key={`contact-${prefill?.contact ?? "empty"}`}
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
        삭제해요. 자동으로 문자나 메일이 가지는 않아요. 다음에 또 적지 않아도 되게
        이름과 연락처는 이 폰 안에만 남겨둬요 &mdash; 위 &apos;저장된 내 정보 지우기&apos;를
        누르면 바로 없어져요. 실제 신청은 위 &apos;이렇게 신청하세요&apos; 안내를 따라 직접
        진행해주세요.
      </p>
    </form>
  );
}

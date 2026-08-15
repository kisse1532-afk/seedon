"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SeedonSymbol } from "@/app/_components/Logo";
import Link from "next/link";
import { saveConsent } from "@/lib/consent";

export default function LoginTermsPage() {
  const router = useRouter();
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [age14, setAge14] = useState(false);
  const [saving, setSaving] = useState(false);

  // 절대규칙 4: 서비스 대상은 만 14세 이상. 그 아래는 법정대리인 동의가
  // 필요해서 지금 단계에서는 받지 않는다.
  const allRequired = terms && privacy && age14;
  const allChecked = terms && privacy && marketing && age14;

  function toggleAll(checked: boolean) {
    setTerms(checked);
    setPrivacy(checked);
    setMarketing(checked);
    setAge14(checked);
  }

  return (
    <div className="max-w-sm mx-auto py-10 space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-mint">
          <SeedonSymbol height={22} />
        </div>
        <h1 className="text-lg font-extrabold tracking-tight text-ink">약관에 동의해주세요</h1>
        <p className="text-sm text-ink-60 mt-1">씨드온을 시작하려면 아래 약관에 동의해야 해요.</p>
      </div>

      <div className="rounded-2xl border border-sage-border bg-white divide-y divide-neutral-100">
        <label className="flex items-center gap-3 p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={(e) => toggleAll(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm font-medium">약관 전체 동의</span>
        </label>
        <label className="flex items-center gap-3 p-4 cursor-pointer">
          <input type="checkbox" checked={age14} onChange={(e) => setAge14(e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-sm">
            만 14세 이상이에요 <span className="text-emerald-600">(필수)</span>
          </span>
        </label>
        <label className="flex items-center justify-between gap-3 p-4 cursor-pointer">
          <span className="flex items-center gap-3">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-sm">
              이용약관 동의 <span className="text-emerald-600">(필수)</span>
            </span>
          </span>
          <Link href="/terms" target="_blank" className="shrink-0 text-xs text-meta underline hover:text-primary-deep">
            읽어보기
          </Link>
        </label>
        <label className="flex items-center justify-between gap-3 p-4 cursor-pointer">
          <span className="flex items-center gap-3">
            <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-sm">
              개인정보 수집 및 이용동의 <span className="text-emerald-600">(필수)</span>
            </span>
          </span>
          <Link href="/privacy" target="_blank" className="shrink-0 text-xs text-meta underline hover:text-primary-deep">
            읽어보기
          </Link>
        </label>
        <label className="flex items-center gap-3 p-4 cursor-pointer">
          <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-sm">
            맞춤 정보·마케팅 수신동의 <span className="text-meta">(선택)</span>
          </span>
        </label>
      </div>

      {!age14 && (terms || privacy) && (
        <p className="text-xs leading-relaxed text-meta">
          씨드온은 지금 만 14세 이상만 가입할 수 있어요. 14세보다 어리면 보호자 동의가 따로 필요해서,
          준비가 되면 열어드릴게요.
        </p>
      )}

      <button
        disabled={!allRequired || saving}
        onClick={async () => {
          // 체크만 받고 넘어가면 동의를 받은 게 아니다. 무엇에 언제 동의했는지
          // 남긴 다음에 이동한다.
          setSaving(true);
          await saveConsent({ terms, privacy, marketing, age14 });
          router.push("/login/survey");
        }}
        className={`w-full rounded-full text-sm font-medium py-3 transition ${
          allRequired ? "bg-primary-deep text-white hover:brightness-110" : "bg-cream text-meta cursor-not-allowed"
        }`}
      >
        {saving ? "저장 중..." : "동의하고 계속하기"}
      </button>
    </div>
  );
}

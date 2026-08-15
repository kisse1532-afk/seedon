"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SeedonSymbol } from "@/app/_components/Logo";

export default function LoginTermsPage() {
  const router = useRouter();
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const allRequired = terms && privacy;
  const allChecked = terms && privacy && marketing;

  function toggleAll(checked: boolean) {
    setTerms(checked);
    setPrivacy(checked);
    setMarketing(checked);
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
        <label className="flex items-center justify-between gap-3 p-4 cursor-pointer">
          <span className="flex items-center gap-3">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-sm">
              이용약관 동의 <span className="text-emerald-600">(필수)</span>
            </span>
          </span>
          <span className="text-sage-border">›</span>
        </label>
        <label className="flex items-center justify-between gap-3 p-4 cursor-pointer">
          <span className="flex items-center gap-3">
            <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-sm">
              개인정보 수집 및 이용동의 <span className="text-emerald-600">(필수)</span>
            </span>
          </span>
          <span className="text-sage-border">›</span>
        </label>
        <label className="flex items-center gap-3 p-4 cursor-pointer">
          <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-sm">
            맞춤 정보·마케팅 수신동의 <span className="text-meta">(선택)</span>
          </span>
        </label>
      </div>

      <button
        disabled={!allRequired}
        onClick={() => router.push("/login/survey")}
        className={`w-full rounded-full text-sm font-medium py-3 transition ${
          allRequired ? "bg-primary-deep text-white hover:brightness-110" : "bg-cream text-meta cursor-not-allowed"
        }`}
      >
        동의하고 계속하기
      </button>
    </div>
  );
}

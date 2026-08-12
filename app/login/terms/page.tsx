"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
        <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-sky-400 to-emerald-500 flex items-center justify-center text-2xl mb-3">🌱</div>
        <h1 className="text-lg font-bold">약관에 동의해주세요</h1>
        <p className="text-sm text-neutral-500 mt-1">씨드온을 시작하려면 아래 약관에 동의해야 해요.</p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
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
          <span className="text-neutral-300">›</span>
        </label>
        <label className="flex items-center justify-between gap-3 p-4 cursor-pointer">
          <span className="flex items-center gap-3">
            <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-sm">
              개인정보 수집 및 이용동의 <span className="text-emerald-600">(필수)</span>
            </span>
          </span>
          <span className="text-neutral-300">›</span>
        </label>
        <label className="flex items-center gap-3 p-4 cursor-pointer">
          <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-sm">
            맞춤 정보·마케팅 수신동의 <span className="text-neutral-400">(선택)</span>
          </span>
        </label>
      </div>

      <button
        disabled={!allRequired}
        onClick={() => router.push("/login/survey")}
        className={`w-full rounded-full text-sm font-medium py-3 transition ${
          allRequired ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
        }`}
      >
        동의하고 계속하기
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const options = [
  "학교 선생님 소개",
  "사회복지사·상담사 소개",
  "친구 소개",
  "인스타그램 등 SNS",
  "사이트·앱 검색",
  "공익법센터·기관 안내",
  "기타",
];

export default function LoginSurveyPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="max-w-sm mx-auto py-10 space-y-6">
      <div>
        <h1 className="text-lg font-bold leading-snug">
          씨드온을
          <br />
          어떻게 알게 되셨나요?
        </h1>
        <p className="text-xs text-meta mt-1">더 필요한 곳에 씨드온을 알리는 데 도움이 돼요.</p>
      </div>

      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => setSelected(opt)}
            className={`w-full text-left text-sm rounded-xl border px-4 py-3 transition ${
              selected === opt ? "border-primary bg-mint text-primary-deep" : "border-sage-border bg-white hover:border-sage-border"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      <button
        disabled={!selected}
        onClick={() => router.push("/login/complete")}
        className={`w-full rounded-full text-sm font-medium py-3 transition ${
          selected ? "bg-primary-deep text-white hover:brightness-110" : "bg-cream text-meta cursor-not-allowed"
        }`}
      >
        다음
      </button>
    </div>
  );
}

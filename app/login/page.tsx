"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";

// Supabase 프로젝트에 아직 키를 등록하지 않은 provider는 클릭 시 에러 화면으로
// 리다이렉트되므로, 실제 키를 넣기 전까지는 false로 막아둔다.
const OAUTH_ENABLED: Record<"kakao" | "google" | "apple", boolean> = {
  kakao: false,
  google: false,
  apple: false,
};

function loginWith(provider: "kakao" | "google" | "apple") {
  if (!OAUTH_ENABLED[provider]) return;
  supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/login/terms` },
  });
}

export default function LoginPage() {
  return (
    <div className="max-w-sm mx-auto py-12 space-y-8 text-center">
      <div>
        <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-sky-400 to-emerald-500 flex items-center justify-center text-2xl mb-3">
          🌱
        </div>
        <h1 className="text-lg font-bold">씨드온 시작하기</h1>
        <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
          로그인하면 관심 프로그램을 저장하고
          <br />
          맞춤 지원 정보를 받아볼 수 있어요.
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => loginWith("kakao")}
          disabled={!OAUTH_ENABLED.kakao}
          className="w-full rounded-full bg-[#FEE500] text-neutral-900 text-sm font-medium py-3 hover:brightness-95 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
        >
          💬 카카오로 시작하기{!OAUTH_ENABLED.kakao && " (준비중)"}
        </button>
        <button
          onClick={() => loginWith("google")}
          disabled={!OAUTH_ENABLED.google}
          className="w-full rounded-full border border-neutral-300 text-sm font-medium py-3 hover:bg-neutral-50 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          구글로 시작하기{!OAUTH_ENABLED.google && " (준비중)"}
        </button>
        <button
          onClick={() => loginWith("apple")}
          disabled={!OAUTH_ENABLED.apple}
          className="w-full rounded-full bg-black text-white text-sm font-medium py-3 hover:bg-neutral-800 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-black"
        >
           애플로 시작하기{!OAUTH_ENABLED.apple && " (준비중)"}
        </button>
        <Link
          href="/login/email"
          className="block w-full rounded-full border border-sky-200 text-sky-700 text-sm font-medium py-3 hover:bg-sky-50 transition"
        >
          ✉️ 이메일로 시작하기
        </Link>
      </div>

      <p className="text-[11px] text-neutral-400 leading-relaxed">
        로그인 없이도 프로그램은 자유롭게 둘러볼 수 있어요.
        <br />
        <Link href="/" className="underline hover:text-neutral-600">
          그냥 둘러볼게요 →
        </Link>
      </p>
    </div>
  );
}

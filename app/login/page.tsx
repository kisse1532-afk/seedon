"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";

function loginWith(provider: "kakao" | "google" | "apple") {
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
          className="w-full rounded-full bg-[#FEE500] text-neutral-900 text-sm font-medium py-3 hover:brightness-95 transition"
        >
          💬 카카오로 시작하기
        </button>
        <button
          onClick={() => loginWith("google")}
          className="w-full rounded-full border border-neutral-300 text-sm font-medium py-3 hover:bg-neutral-50 transition"
        >
          구글로 시작하기
        </button>
        <button
          onClick={() => loginWith("apple")}
          className="w-full rounded-full bg-black text-white text-sm font-medium py-3 hover:bg-neutral-800 transition"
        >
           애플로 시작하기
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

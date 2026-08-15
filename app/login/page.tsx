"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { SeedonSymbol } from "@/app/_components/Logo";

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
        {/* 🌱 이모지를 쓰고 있었는데, 우리 심볼이 있는 자리에 남의 그림을 둘
            이유가 없다(기기마다 모양도 다르다). 브랜드 심볼로 교체. */}
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-mint">
          <SeedonSymbol height={22} />
        </div>
        <h1 className="text-lg font-extrabold tracking-tight text-ink">씨드온 시작하기</h1>
        <p className="text-sm text-ink-60 mt-2 leading-relaxed">
          로그인하면 관심 프로그램을 저장하고
          <br />
          맞춤 지원 정보를 받아볼 수 있어요.
        </p>
      </div>

      {/* 버튼 아이콘을 이모지(💬 ✉️)와 애플 전용 글자()로 쓰고 있었다.
          이모지는 기기마다 그림이 다르고, 애플 로고 글자는 애플 기기가 아니면
          네모로 깨져 보인다. 넷 다 SVG로 그린다.
          카카오 노랑·애플 검정은 각 서비스가 정한 색이라 그대로 둔다. */}
      <div className="space-y-2.5">
        <button
          onClick={() => loginWith("kakao")}
          disabled={!OAUTH_ENABLED.kakao}
          className="flex w-full items-center justify-center gap-2 rounded-control bg-[#FEE500] py-3.5 text-sm font-bold text-[#191600] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]" aria-hidden>
            <path d="M12 3.5c-4.7 0-8.5 2.95-8.5 6.6 0 2.35 1.58 4.4 3.95 5.56l-.98 3.6a.35.35 0 0 0 .53.39l4.28-2.83c.24.02.48.03.72.03 4.7 0 8.5-2.96 8.5-6.75S16.7 3.5 12 3.5Z" />
          </svg>
          카카오로 시작하기{!OAUTH_ENABLED.kakao && " (준비중)"}
        </button>
        <button
          onClick={() => loginWith("google")}
          disabled={!OAUTH_ENABLED.google}
          className="flex w-full items-center justify-center gap-2 rounded-control border border-sage-border bg-white py-3.5 text-sm font-bold text-body transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-sage-border"
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
            <path fill="#4285F4" d="M21.6 12.2c0-.7-.06-1.36-.18-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.74 3-4.3 3-7.3Z" />
            <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.6-2.43l-3.2-2.5c-.9.6-2.05.95-3.4.95-2.6 0-4.8-1.76-5.6-4.12H3.1v2.58A10 10 0 0 0 12 22Z" />
            <path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.83V7.5H3.1a10 10 0 0 0 0 9l3.3-2.6Z" />
            <path fill="#EA4335" d="M12 5.95c1.47 0 2.78.5 3.82 1.5l2.84-2.84C16.97 2.99 14.7 2 12 2A10 10 0 0 0 3.1 7.5l3.3 2.57C7.2 7.7 9.4 5.95 12 5.95Z" />
          </svg>
          구글로 시작하기{!OAUTH_ENABLED.google && " (준비중)"}
        </button>
        <button
          onClick={() => loginWith("apple")}
          disabled={!OAUTH_ENABLED.apple}
          className="flex w-full items-center justify-center gap-2 rounded-control bg-black py-3.5 text-sm font-bold text-white transition hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]" aria-hidden>
            <path d="M16.3 12.6c.02-2.05 1.68-3.03 1.75-3.08-.95-1.4-2.43-1.59-2.96-1.61-1.26-.13-2.46.74-3.1.74-.64 0-1.63-.72-2.68-.7-1.38.02-2.65.8-3.36 2.03-1.43 2.49-.37 6.18 1.03 8.2.68.99 1.5 2.1 2.57 2.06 1.03-.04 1.42-.67 2.67-.67 1.25 0 1.6.67 2.69.65 1.11-.02 1.81-1.01 2.49-2 .78-1.15 1.1-2.26 1.12-2.32-.02-.01-2.15-.83-2.17-3.3Z" />
            <path d="M14.4 6.6c.56-.68.94-1.63.84-2.58-.81.03-1.79.54-2.37 1.22-.52.6-.97 1.56-.85 2.48.9.07 1.82-.46 2.38-1.12Z" />
          </svg>
          애플로 시작하기{!OAUTH_ENABLED.apple && " (준비중)"}
        </button>
        <Link
          href="/login/email"
          className="flex w-full items-center justify-center gap-2 rounded-control border border-primary-deep bg-white py-3.5 text-sm font-bold text-primary-deep transition hover:bg-mint"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-[18px] w-[18px]"
            aria-hidden
          >
            <rect x="3.2" y="5.5" width="17.6" height="13" rx="2.2" />
            <path d="m3.8 7 8.2 6 8.2-6" />
          </svg>
          이메일로 시작하기
        </Link>
      </div>

      <p className="text-[11px] text-meta leading-relaxed">
        로그인 없이도 프로그램은 자유롭게 둘러볼 수 있어요.
        <br />
        <Link href="/" className="underline hover:text-body">
          그냥 둘러볼게요 →
        </Link>
      </p>
    </div>
  );
}

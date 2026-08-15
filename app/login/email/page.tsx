"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EmailLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      if (data.session) {
        router.push("/login/terms");
      } else {
        setMessage("가입 확인 이메일을 보냈어요. 메일함을 확인해주세요.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/mypage");
    }
  }

  return (
    <div className="max-w-sm mx-auto py-10 space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-mint text-primary-deep">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden
          >
            <rect x="3.2" y="5.5" width="17.6" height="13" rx="2.2" />
            <path d="m3.8 7 8.2 6 8.2-6" />
          </svg>
        </div>
        <h1 className="text-lg font-extrabold tracking-tight text-ink">
          {mode === "signup" ? "이메일로 가입하기" : "이메일로 로그인"}
        </h1>
      </div>

      <div className="flex rounded-full border border-sage-border p-1 bg-neutral-50">
        <button
          onClick={() => setMode("signup")}
          className={`flex-1 text-sm py-2 rounded-full transition ${mode === "signup" ? "bg-white shadow-sm font-medium" : "text-meta"}`}
        >
          회원가입
        </button>
        <button
          onClick={() => setMode("signin")}
          className={`flex-1 text-sm py-2 rounded-full transition ${mode === "signin" ? "bg-white shadow-sm font-medium" : "text-meta"}`}
        >
          로그인
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          className="w-full rounded-xl border border-sage-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호 (6자 이상)"
          className="w-full rounded-xl border border-sage-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {message && <p className="text-xs text-emerald-600">{message}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-primary-deep text-white text-sm font-medium py-3 hover:brightness-110 transition disabled:opacity-60"
        >
          {loading ? "처리 중..." : mode === "signup" ? "가입하기" : "로그인"}
        </button>
      </form>

      <p className="text-center">
        <Link href="/login" className="text-xs text-meta hover:text-body">
          ← 다른 방법으로 시작하기
        </Link>
      </p>
    </div>
  );
}

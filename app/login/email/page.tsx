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
        <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-sky-400 to-emerald-500 flex items-center justify-center text-2xl mb-3">
          ✉️
        </div>
        <h1 className="text-lg font-bold">{mode === "signup" ? "이메일로 가입하기" : "이메일로 로그인"}</h1>
      </div>

      <div className="flex rounded-full border border-neutral-200 p-1 bg-neutral-50">
        <button
          onClick={() => setMode("signup")}
          className={`flex-1 text-sm py-2 rounded-full transition ${mode === "signup" ? "bg-white shadow-sm font-medium" : "text-neutral-400"}`}
        >
          회원가입
        </button>
        <button
          onClick={() => setMode("signin")}
          className={`flex-1 text-sm py-2 rounded-full transition ${mode === "signin" ? "bg-white shadow-sm font-medium" : "text-neutral-400"}`}
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
          className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호 (6자 이상)"
          className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {message && <p className="text-xs text-emerald-600">{message}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-600 text-white text-sm font-medium py-3 hover:brightness-105 transition disabled:opacity-60"
        >
          {loading ? "처리 중..." : mode === "signup" ? "가입하기" : "로그인"}
        </button>
      </form>

      <p className="text-center">
        <Link href="/login" className="text-xs text-neutral-400 hover:text-neutral-600">
          ← 다른 방법으로 시작하기
        </Link>
      </p>
    </div>
  );
}

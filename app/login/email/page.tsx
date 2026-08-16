"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { takeNext } from "@/lib/next-destination";

export default function EmailLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  /**
   * Supabase가 주는 오류는 영어다. "Email not confirmed"를 그대로 띄우면
   * 청소년은 무슨 뜻인지도, 뭘 해야 하는지도 알 수 없다(절대규칙 3).
   * 무엇이 잘못됐는지와 다음에 할 행동을 같이 적는다.
   */
  function toKorean(raw: string): string {
    const m = raw.toLowerCase();
    if (m.includes("email not confirmed"))
      return "아직 메일 확인이 안 됐어요. 메일함에서 씨드온이 보낸 링크를 눌러주세요. 스팸함도 꼭 봐주세요.";
    if (m.includes("invalid login credentials"))
      return "이메일이나 비밀번호가 맞지 않아요. 다시 확인해주세요.";
    if (m.includes("already registered") || m.includes("already been registered"))
      return "이미 가입한 이메일이에요. 위에서 \"로그인\"을 눌러 들어가세요.";
    if (m.includes("password") && m.includes("6"))
      return "비밀번호는 6자 이상으로 만들어주세요.";
    if (m.includes("rate limit") || m.includes("too many"))
      return "잠깐만요, 너무 여러 번 시도했어요. 1분쯤 뒤에 다시 해주세요.";
    if (m.includes("invalid") && m.includes("email"))
      return "이메일 주소를 다시 확인해주세요.";
    return `문제가 생겼어요: ${raw}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    setNeedsConfirm(false);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setError(toKorean(error.message));
        return;
      }
      if (data.session) {
        router.push("/login/terms");
      } else {
        // 확인 메일을 받아야 하는 설정이면 여기로 온다. 메일이 스팸함으로 가거나
        // 발송 제한에 걸려 안 오는 일이 잦아서, 다시 보내는 길을 같이 준다.
        setNeedsConfirm(true);
        setMessage(
          "가입은 됐어요! 메일함에서 씨드온이 보낸 링크를 눌러야 로그인할 수 있어요. 스팸함도 꼭 확인해주세요."
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) setNeedsConfirm(true);
        setError(toKorean(error.message));
        return;
      }
      // 북마크를 보려다 로그인한 사람은 북마크로 돌려보낸다.
      router.push(takeNext("/mypage"));
    }
  }

  /** 확인 메일이 안 왔을 때 다시 보내기. */
  async function resendConfirm() {
    if (!email) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setLoading(false);
    setMessage(
      error
        ? toKorean(error.message)
        : "확인 메일을 다시 보냈어요. 몇 분 걸릴 수 있고, 스팸함도 봐주세요."
    );
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
        {error && <p className="text-xs leading-relaxed text-red-500">{error}</p>}
        {message && <p className="text-xs leading-relaxed text-emerald-600">{message}</p>}
        {needsConfirm && (
          <button
            type="button"
            onClick={resendConfirm}
            disabled={loading}
            className="w-full rounded-full border border-primary-deep/40 py-2.5 text-xs font-semibold text-primary-deep transition hover:bg-mint disabled:opacity-60"
          >
            확인 메일 다시 보내기
          </button>
        )}
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

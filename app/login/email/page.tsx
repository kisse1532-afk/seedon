"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { takeNext } from "@/lib/next-destination";
import { loadMyProfile } from "@/lib/consent";
import { needsOnboarding } from "@/lib/role";
import { checkUsername, usernameToEmail, USERNAME_HINT } from "@/lib/username";

export default function IdLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Supabase가 주는 오류는 영어다. "Email not confirmed"를 그대로 띄우면
   * 청소년은 무슨 뜻인지도, 뭘 해야 하는지도 알 수 없다(절대규칙 3).
   * 무엇이 잘못됐는지와 다음에 할 행동을 같이 적는다.
   */
  function toKorean(raw: string): string {
    const m = raw.toLowerCase();
    if (m.includes("email not confirmed"))
      // 아이디 가입은 진짜 메일함이 없으므로 청소년이 스스로 풀 수 없다.
      // 설정 문제라는 걸 알려주고 다른 길을 준다.
      return "지금은 가입을 마칠 수 없어요. 잠시 뒤 다시 해보고, 계속 안 되면 씨드온에 알려주세요.";
    if (m.includes("invalid login credentials"))
      return "아이디나 비밀번호가 맞지 않아요. 다시 확인해주세요.";
    if (m.includes("already registered") || m.includes("already been registered"))
      return "이미 쓰고 있는 아이디예요. 다른 아이디로 만들거나, 위에서 \"로그인\"을 눌러 들어가세요.";
    if (m.includes("password") && m.includes("6"))
      return "비밀번호는 6자 이상으로 만들어주세요.";
    if (m.includes("rate limit") || m.includes("too many"))
      return "잠깐만요, 너무 여러 번 시도했어요. 1분쯤 뒤에 다시 해주세요.";
    if (m.includes("invalid") && m.includes("email"))
      return "아이디를 다시 확인해주세요. " + USERNAME_HINT + "이에요.";
    return `문제가 생겼어요: ${raw}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    // 아이디 규칙은 서버에 보내기 전에 여기서 먼저 잡는다. Supabase가 주는
    // 영어 오류보다 "무엇이 잘못됐는지"를 정확히 말해줄 수 있다.
    const bad = checkUsername(username);
    if (bad) {
      setError(bad);
      return;
    }
    const email = usernameToEmail(username);
    setLoading(true);

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
        // 아이디 가입에는 진짜 메일함이 없으므로 여기 오면 청소년이 할 수 있는
        // 게 없다. 확인 메일 설정이 켜져 있다는 뜻이라 운영자가 꺼야 한다.
        setMessage(
          "가입 신청은 됐는데 마무리가 안 됐어요. 씨드온에 알려주시면 바로 열어드릴게요."
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError(toKorean(error.message));
        return;
      }
      // 처음엔 회원 정보를 가입 흐름 안에만 넣었더니, 이미 계정이 있는 사람은
      // 로그인해도 그 화면을 영영 못 만났다(2026-08-16 로드 확인). 로그인할 때마다
      // 확인해서 안 채웠으면 채우게 한다.
      const profile = await loadMyProfile();
      if (needsOnboarding(profile)) {
        router.push("/login/role");
        return;
      }
      // 북마크를 보려다 로그인한 사람은 북마크로 돌려보낸다.
      router.push(takeNext("/mypage"));
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
            <circle cx="12" cy="8.6" r="3.6" />
            <path d="M4.8 19.4a7.2 7.2 0 0 1 14.4 0" />
          </svg>
        </div>
        <h1 className="text-lg font-extrabold tracking-tight text-ink">
          {mode === "signup" ? "아이디로 가입하기" : "아이디로 로그인"}
        </h1>
        {mode === "signup" && (
          <p className="mt-1.5 text-xs leading-relaxed text-meta">
            이메일은 안 물어봐요. 아이디만 정하면 돼요.
          </p>
        )}
      </div>

      <div className="flex rounded-full border border-sage-border p-1 bg-cream">
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
          type="text"
          required
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="아이디"
          className="w-full rounded-xl border border-sage-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {mode === "signup" && (
          <p className="-mt-1 text-[11px] leading-relaxed text-meta">{USERNAME_HINT}</p>
        )}
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호 (6자 이상)"
          className="w-full rounded-xl border border-sage-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {error && <p className="text-xs leading-relaxed text-red-500">{error}</p>}
        {message && <p className="text-xs leading-relaxed text-primary-deep">{message}</p>}
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

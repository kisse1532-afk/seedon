"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SeedonSymbol } from "@/app/_components/Logo";
import { saveRole } from "@/lib/consent";
import { ADULT_KINDS, type Role } from "@/lib/role";

/**
 * 청소년 본인인지, 곁에 있는 어른인지 고른다.
 *
 * 어른에게도 반말이나 낮춰 부르는 말을 쓰지 않고, 청소년에게 쓰는 말도
 * 그대로 유지한다. 무엇보다 어느 쪽을 골라도 "당신은 지원 대상"이라는
 * 판정형 문장을 쓰지 않는다(절대규칙 1).
 */
export default function LoginRolePage() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [adultKind, setAdultKind] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGo = role === "youth" || (role === "adult" && adultKind !== "");

  async function handleNext() {
    if (!role || !canGo) return;
    setSaving(true);
    setError(null);

    const ok = await saveRole(role, role === "adult" ? adultKind : "");
    if (!ok) {
      setError("지금 저장이 안 됐어요. 잠깐 뒤에 다시 눌러봐 주세요.");
      setSaving(false);
      return;
    }
    // 청소년은 만 14세 확인이 필요해서 정보 화면으로, 어른은 바로 다음으로.
    router.push(role === "youth" ? "/login/profile" : "/login/survey");
  }

  return (
    <div className="mx-auto max-w-sm space-y-6 py-10">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-mint">
          <SeedonSymbol height={22} />
        </div>
        <h1 className="text-lg font-extrabold tracking-tight text-ink">어떻게 오셨어요?</h1>
        <p className="mt-1 text-sm leading-relaxed text-ink-60">
          고른 것에 따라 보여드리는 게 조금 달라져요.
        </p>
      </div>

      <div className="space-y-2.5">
        <button
          onClick={() => {
            setRole("youth");
            setAdultKind("");
          }}
          className={`w-full rounded-2xl border p-5 text-left transition ${
            role === "youth"
              ? "border-primary bg-mint"
              : "border-sage-border bg-white hover:border-primary/40"
          }`}
        >
          <p className={`text-sm font-bold ${role === "youth" ? "text-primary-deep" : "text-ink"}`}>
            제가 쓰려고요
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-60">
            내가 받을 수 있는 걸 찾아보고 신청할래요
          </p>
        </button>

        <button
          onClick={() => setRole("adult")}
          className={`w-full rounded-2xl border p-5 text-left transition ${
            role === "adult"
              ? "border-primary bg-mint"
              : "border-sage-border bg-white hover:border-primary/40"
          }`}
        >
          <p className={`text-sm font-bold ${role === "adult" ? "text-primary-deep" : "text-ink"}`}>
            아이에게 알려주려고요
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-60">
            선생님·보호자·상담사처럼 청소년 곁에 있는 분
          </p>
        </button>
      </div>

      {role === "adult" && (
        <div className="space-y-2 rounded-2xl border border-sage-border bg-white p-5">
          <p className="text-sm font-bold text-ink">어떤 사이인가요?</p>
          <p className="text-xs leading-relaxed text-meta">
            프로그램마다 어른이 할 수 있는 게 달라서 물어봐요.
          </p>
          <div className="space-y-2 pt-1">
            {ADULT_KINDS.map((k) => (
              <button
                key={k}
                onClick={() => setAdultKind(k)}
                className={`w-full rounded-control border px-4 py-3 text-left text-sm transition ${
                  adultKind === k
                    ? "border-primary bg-mint font-semibold text-primary-deep"
                    : "border-sage-border bg-white text-body hover:border-primary/40"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      )}

      {role === "adult" && (
        <p className="rounded-control bg-cream px-4 py-3 text-xs leading-relaxed text-body">
          씨드온은 어른이 아이 대신 신청해주는 곳은 아니에요. 무엇이 있는지 찾아서
          아이에게 알려주는 데까지 도와드려요. 신청은 아이 본인이나, 그 프로그램이
          정한 방법대로 하게 돼요.
        </p>
      )}

      {error && (
        <p className="rounded-control bg-red-50 px-3.5 py-2.5 text-xs leading-relaxed text-red-700">
          {error}
        </p>
      )}

      <button
        onClick={handleNext}
        disabled={!canGo || saving}
        className={`w-full rounded-full py-3.5 text-sm font-bold transition ${
          canGo && !saving
            ? "bg-primary-deep text-white hover:brightness-110"
            : "cursor-not-allowed bg-cream text-meta"
        }`}
      >
        {saving ? "저장 중..." : "다음"}
      </button>
    </div>
  );
}

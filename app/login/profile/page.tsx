"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SeedonSymbol } from "@/app/_components/Logo";
import { saveMemberProfile } from "@/lib/consent";
import { checkAge, needsBirthdayQuestion, selectableBirthYears, MIN_AGE } from "@/lib/age";
import { REGIONS } from "@/lib/regions";

/**
 * 가입할 때 받는 회원 정보.
 *
 * 개인정보보호법 최소수집 원칙에 맞춰 목적이 분명한 것만 묻는다. 무엇이 필수고
 * 무엇이 선택인지 화면에 적고, 선택을 안 적어도 다음으로 넘어갈 수 있다
 * (선택 항목 거부를 이유로 서비스를 막을 수 없다).
 *
 * 절대규칙 2·3: 소득·급식카드 같은 건 묻지 않고, 묻는 말은 중학생이 바로
 * 알아들을 수 있게 쓴다. "생년월일"이 아니라 "몇 년생이에요?"다.
 */
export default function LoginProfilePage() {
  const router = useRouter();
  const years = selectableBirthYears();

  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [birthdayPassed, setBirthdayPassed] = useState<boolean | null>(null);
  const [nickname, setNickname] = useState("");
  const [region, setRegion] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askBirthday = birthYear !== null && needsBirthdayQuestion(birthYear);
  const age = birthYear === null ? null : checkAge(birthYear, birthdayPassed);
  const tooYoung = age !== null && !age.ok && age.reason === "too_young";
  const canGo = age?.ok === true;

  async function handleNext() {
    if (!canGo || birthYear === null) return;
    setSaving(true);
    setError(null);

    const ok = await saveMemberProfile({ birthYear, birthdayPassed, nickname, region });
    if (!ok) {
      setError("지금 저장이 안 됐어요. 잠깐 뒤에 다시 눌러봐 주세요.");
      setSaving(false);
      return;
    }
    router.push("/login/survey");
  }

  return (
    <div className="mx-auto max-w-sm space-y-6 py-10">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-mint">
          <SeedonSymbol height={22} />
        </div>
        <h1 className="text-lg font-extrabold tracking-tight text-ink">거의 다 됐어요</h1>
        <p className="mt-1 text-sm leading-relaxed text-ink-60">
          딱 맞는 지원을 찾아드리려고 물어보는 거예요. 꼭 필요한 것만 물어봐요.
        </p>
      </div>

      {/* 몇 년생 — 필수 */}
      <div className="space-y-2 rounded-2xl border border-sage-border bg-white p-5">
        <label htmlFor="birthYear" className="block text-sm font-bold text-ink">
          몇 년생이에요? <span className="text-primary-deep">(필수)</span>
        </label>
        <p className="text-xs leading-relaxed text-meta">
          씨드온은 만 {MIN_AGE}세부터 쓸 수 있어서 확인이 필요해요. 태어난 날짜까지는 안 물어봐요.
        </p>
        <select
          id="birthYear"
          value={birthYear ?? ""}
          onChange={(e) => {
            setBirthYear(e.target.value ? Number(e.target.value) : null);
            setBirthdayPassed(null);
          }}
          className="w-full rounded-control border border-sage-border px-4 py-3 text-sm text-body transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
        >
          <option value="">고르기</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}년생
            </option>
          ))}
        </select>

        {/* 딱 걸치는 해에만 되묻는다. 생년월일을 다 받는 것보다 덜 가져간다. */}
        {askBirthday && (
          <div className="space-y-2 pt-1">
            <p className="text-sm font-medium text-ink">올해 생일이 지났어요?</p>
            <div className="flex gap-2">
              {[
                { label: "네, 지났어요", value: true },
                { label: "아직이에요", value: false },
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => setBirthdayPassed(o.value)}
                  className={`flex-1 rounded-control border px-3 py-2.5 text-sm transition ${
                    birthdayPassed === o.value
                      ? "border-primary bg-mint font-semibold text-primary-deep"
                      : "border-sage-border bg-white text-body hover:border-primary/40"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {tooYoung && (
          <p className="rounded-control bg-cream px-3.5 py-3 text-xs leading-relaxed text-body">
            씨드온은 지금 만 {MIN_AGE}세부터 쓸 수 있어요. {MIN_AGE}세보다 어리면 보호자 동의가
            따로 필요해서, 준비가 되면 열어드릴게요. 그때까지는 로그인 없이도 프로그램을
            둘러볼 수 있어요.
          </p>
        )}
      </div>

      {/* 선택 항목 */}
      <div className="space-y-4 rounded-2xl border border-sage-border bg-white p-5">
        <div className="space-y-2">
          <label htmlFor="region" className="block text-sm font-bold text-ink">
            어디 살아요? <span className="text-meta">(선택)</span>
          </label>
          <p className="text-xs leading-relaxed text-meta">
            지역마다 받을 수 있는 게 달라서요. 시·군·구까지는 안 물어봐요.
          </p>
          <select
            id="region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full rounded-control border border-sage-border px-4 py-3 text-sm text-body transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          >
            <option value="">안 고를래요</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="nickname" className="block text-sm font-bold text-ink">
            이름 또는 닉네임 <span className="text-meta">(선택)</span>
          </label>
          <p className="text-xs leading-relaxed text-meta">
            화면에서 부를 때랑 후기 남길 때 이 이름으로 보여요. 진짜 이름이 아니어도 돼요.
          </p>
          <input
            id="nickname"
            type="text"
            maxLength={20}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="안 적어도 돼요"
            className="w-full rounded-control border border-sage-border px-4 py-3 text-sm text-body transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-meta"
          />
        </div>
      </div>

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

      <p className="text-center text-[11px] leading-relaxed text-meta">
        여기서 받은 건 딱 맞는 지원을 찾아주는 데만 써요. 나중에 마이페이지에서 고치거나
        지울 수 있어요.{" "}
        <Link href="/privacy" target="_blank" className="underline hover:text-body">
          무엇을 받는지 자세히
        </Link>
      </p>
    </div>
  );
}

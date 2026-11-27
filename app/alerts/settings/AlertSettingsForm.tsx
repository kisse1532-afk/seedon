"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { categories } from "@/lib/data";
import { REGIONS } from "@/lib/regions";
import { GRADES } from "@/lib/alerts/options";
import { loadSettings, saveSettings, setEduBenefit, type AlertSettings } from "@/lib/alerts/settings";
import StudentGate from "../StudentGate";

export default function AlertSettingsForm() {
  return <StudentGate>{(student) => <Form userId={student.userId} region={student.region} />}</StudentGate>;
}

const card = "space-y-4 rounded-card border border-sage-border bg-white p-5";
const field = "w-full rounded-xl border border-sage-border bg-white px-4 py-2.5 text-sm";
const chip = (on: boolean) =>
  `rounded-full border px-3.5 py-2 text-xs font-semibold ${
    on ? "border-primary-deep bg-primary-deep text-white" : "border-sage-border bg-white text-body"
  }`;

function Form({ userId, region }: { userId: string; region: string | null }) {
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [eduMessage, setEduMessage] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadSettings(userId)
      .then((s) => {
        // 처음이면 가입할 때 적은 시·도를 미리 골라둔다. 저장을 눌러야 저장된다.
        if (alive) setSettings(s ?? { grade: null, sido: region, sigungu: null, interests: [], eduBenefit: false });
      })
      .catch(() => alive && setLoadFailed(true));
    return () => {
      alive = false;
    };
  }, [userId, region]);

  if (loadFailed) {
    return <p className="py-16 text-center text-sm text-ink-60">지금은 설정을 불러올 수 없어요. 잠시 뒤 다시 해주세요.</p>;
  }
  if (!settings) return <p className="py-16 text-center text-sm text-ink-60">불러오고 있어요…</p>;

  const change = (patch: Partial<AlertSettings>) => {
    setSettings({ ...settings, ...patch });
    setMessage(null);
  };

  async function save() {
    if (!settings) return;
    if (!settings.grade) return setMessage("학년을 골라주세요.");
    setBusy(true);
    const ok = await saveSettings(userId, settings);
    setBusy(false);
    setMessage(ok ? "저장했어요." : "저장하지 못했어요. 잠시 뒤 다시 눌러주세요.");
  }

  async function toggleEdu() {
    if (!settings) return;
    const next = !settings.eduBenefit;
    setBusy(true);
    const ok = await setEduBenefit(userId, next);
    setBusy(false);
    if (ok) setSettings({ ...settings, eduBenefit: next });
    setEduMessage(
      ok ? (next ? "켰어요." : "끄고 지웠어요.") : "바꾸지 못했어요. 잠시 뒤 다시 눌러주세요."
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="space-y-1">
        <Link href="/alerts" className="text-[13px] font-medium text-meta hover:text-ink">
          ← 나에게 맞는 기회
        </Link>
        <h1 className="text-lg font-extrabold tracking-tight text-ink">맞춤 설정</h1>
        <p className="text-sm text-ink-60">고른 것에 맞는 기회를 골라 보여드려요. 나만 볼 수 있어요.</p>
      </div>

      <div className={card}>
        <fieldset className="space-y-2">
          <legend className="text-sm font-bold text-ink">학년</legend>
          <div className="flex flex-wrap gap-2">
            {GRADES.map((g) => (
              <button
                type="button"
                key={g.value}
                aria-pressed={settings.grade === g.value}
                onClick={() => change({ grade: g.value })}
                className={chip(settings.grade === g.value)}
              >
                {g.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block space-y-1">
          <span className="text-sm font-bold text-ink">사는 곳</span>
          <select value={settings.sido ?? ""} onChange={(e) => change({ sido: e.target.value || null })} className={field}>
            <option value="">안 고를래요 (전국 것만 보여요)</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        {settings.sido && (
          <label className="block space-y-1">
            <span className="text-xs text-ink-60">시·군·구 (안 적어도 돼요. 적으면 우리 동네에서만 하는 것도 보여요)</span>
            <input
              value={settings.sigungu ?? ""}
              maxLength={20}
              placeholder="예: 수원시, 강남구"
              onChange={(e) => change({ sigungu: e.target.value })}
              className={field}
            />
          </label>
        )}

        <fieldset className="space-y-2">
          <legend className="text-sm font-bold text-ink">관심 분야 (여러 개)</legend>
          <p className="text-xs text-ink-60">하나도 안 고르면 모든 분야를 보여드려요.</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const on = settings.interests.includes(c.slug);
              return (
                <button
                  type="button"
                  key={c.slug}
                  aria-pressed={on}
                  onClick={() =>
                    change({
                      interests: on ? settings.interests.filter((i) => i !== c.slug) : [...settings.interests, c.slug],
                    })
                  }
                  className={chip(on)}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <button
          onClick={save}
          disabled={busy}
          className="w-full rounded-full bg-primary-deep py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          저장
        </button>
        {message && <p role="status" className="text-center text-sm text-primary-deep">{message}</p>}
      </div>

      {/* 별도 선택 동의. 위 「저장」과 묶지 않고, 누르는 즉시 저장되거나 지워진다. */}
      <div className={card}>
        <h2 className="text-sm font-bold text-ink">교육급여 알림 (선택)</h2>
        <p className="text-sm leading-relaxed text-body">
          이건 내가 고른 알림 설정이에요. 서류나 증명은 받지 않아요. 알림에만 쓰고, 다른 사람에게는 보이지 않아요. 언제든
          끌 수 있고, 끄면 바로 지워요. 안 골라도 씨드온을 다 쓸 수 있어요.
        </p>
        <p className="text-xs leading-relaxed text-ink-60">
          켜면 &ldquo;교육급여 받고 있어요&rdquo;라는 선택과 켠 시각을 저장하고, 교육급여를 받는 학생을 먼저 뽑는 기회를 위에
          보여드려요.
        </p>
        <button
          type="button"
          role="switch"
          aria-checked={settings.eduBenefit}
          onClick={toggleEdu}
          disabled={busy}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-sage-border px-4 py-3 text-left disabled:opacity-50"
        >
          <span className="text-sm font-semibold text-ink">교육급여 받고 있어요</span>
          <span
            aria-hidden
            className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition ${
              settings.eduBenefit ? "justify-end bg-primary-deep" : "justify-start bg-sage-border"
            }`}
          >
            <span className="h-5 w-5 rounded-full bg-white" />
          </span>
        </button>
        {eduMessage && <p role="status" className="text-center text-sm text-primary-deep">{eduMessage}</p>}
        <Link href="/privacy" className="block text-center text-xs text-meta hover:text-body">
          개인정보 처리방침 보기
        </Link>
      </div>
    </div>
  );
}

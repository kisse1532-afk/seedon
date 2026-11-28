"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { categories, ENROLLMENT_STATUSES } from "@/lib/data";
import { GRADES, kstToday } from "@/lib/alerts/options";
import { emailToUsername } from "@/lib/username";
import { rememberNext } from "@/lib/next-destination";
import {
  checkDraft,
  hardWords,
  EMPTY_DRAFT,
  MAX_PDF_BYTES,
  MAX_SOURCE_CHARS,
  type NoticeDraft,
} from "@/lib/alerts/notice";

type Access =
  | { state: "checking" }
  | { state: "allowed"; role: "operator" | "teacher" }
  | { state: "denied"; loginId: string | null };

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}

const field = "w-full rounded-xl border border-sage-border bg-white px-4 py-2.5 text-sm";
const card = "space-y-4 rounded-card border border-sage-border bg-white p-5";
const primary =
  "w-full rounded-full bg-primary-deep py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50";

export default function NoticeTool() {
  const [access, setAccess] = useState<Access>({ state: "checking" });
  const [sourceText, setSourceText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [noticeId, setNoticeId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NoticeDraft | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState<"draft" | "publish" | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/notices/me", { headers: await authHeaders() });
        const { role } = await res.json();
        if (!alive) return;
        if (role) return setAccess({ state: "allowed", role });
      } catch {
        /* 아래의 "못 들어와요" 안내로 간다 */
      }
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email;
      if (alive) setAccess({ state: "denied", loginId: emailToUsername(email) ?? email ?? null });
    })();
    return () => {
      alive = false;
    };
  }, []);

  const set = <K extends keyof NoticeDraft>(key: K, value: NoticeDraft[K]) => {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
    setConfirmed(false);
  };
  const toggle = <T extends string>(list: T[], value: T) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  async function makeDraft() {
    setErrors([]);
    if (file && file.size > MAX_PDF_BYTES) return setErrors(["PDF는 4MB까지 올릴 수 있어요."]);
    if (!file && !sourceText.trim()) return setErrors(["글을 붙여넣거나 PDF를 골라주세요."]);
    setBusy("draft");
    try {
      const form = new FormData();
      form.set("text", sourceText);
      if (file) form.set("file", file);
      const res = await fetch("/api/notices/draft", { method: "POST", headers: await authHeaders(), body: form });
      const data = await res.json();
      if (!res.ok) return setErrors([data.error]);
      setNoticeId(data.noticeId);
      setNotes(data.notes);
      setDraft(data.draft ?? { ...EMPTY_DRAFT });
      if (!data.draft) setNotes(["AI 초안을 만들지 못했어요. 아래 칸을 직접 채우면 똑같이 게시할 수 있어요.", ...data.notes]);
      setConfirmed(false);
    } catch {
      setErrors(["AI 초안을 만들지 못했어요. 「직접 쓰기」로 계속할 수 있어요."]);
    } finally {
      setBusy(null);
    }
  }

  async function publish() {
    if (!draft) return;
    const problems = checkDraft(draft, kstToday());
    setErrors(problems);
    if (problems.length) return;
    setBusy("publish");
    try {
      const res = await fetch("/api/notices/publish", {
        method: "POST",
        headers: { ...(await authHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ noticeId, draft, sourceText, confirmed }),
      });
      const data = await res.json();
      if (!res.ok) return setErrors(data.errors?.length ? data.errors : [data.error]);
      setPublishedId(data.programId);
    } catch {
      setErrors(["게시하지 못했어요. 인터넷을 확인하고 다시 눌러주세요."]);
    } finally {
      setBusy(null);
    }
  }

  function startOver() {
    setSourceText("");
    setFile(null);
    setNoticeId(null);
    setDraft(null);
    setNotes([]);
    setErrors([]);
    setConfirmed(false);
    setPublishedId(null);
  }

  if (access.state === "checking") {
    return <p className="py-16 text-center text-sm text-ink-60">확인하고 있어요…</p>;
  }

  if (access.state === "denied") {
    return (
      <div className="mx-auto max-w-sm space-y-4 py-12 text-center">
        <h1 className="text-lg font-extrabold text-ink">초대받은 선생님만 쓸 수 있어요</h1>
        {access.loginId ? (
          <p className="text-sm leading-relaxed text-body">
            씨드온에 아이디 <b>{access.loginId}</b>를 알려주면 초대해드려요. 초대받은 뒤 이 화면을 다시 열어주세요.
          </p>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-body">
              선생님은 먼저 로그인해주세요. 계정을 만든 뒤 아이디를 씨드온에 알려주면 초대해드려요.
            </p>
            <Link href="/login" onClick={() => rememberNext("/notices")} className={`block ${primary}`}>
              로그인하기
            </Link>
          </>
        )}
        <Link href="/admin/login" className="block text-xs text-meta hover:text-body">
          운영자 로그인
        </Link>
      </div>
    );
  }

  if (publishedId) {
    return (
      <div className="mx-auto max-w-sm space-y-4 py-12 text-center">
        <h1 className="text-lg font-extrabold text-ink">게시했어요</h1>
        <Link href={`/apply/${publishedId}`} className={`block ${primary}`}>
          학생에게 보이는 화면 확인하기
        </Link>
        <button onClick={startOver} className="text-sm text-primary-deep hover:underline">
          다른 공문 올리기
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="space-y-1">
        <h1 className="text-lg font-extrabold text-ink">공문 올리기</h1>
        <p className="text-sm leading-relaxed text-body">
          진로·지원 공문이나 공개 공고를 넣으면 학생이 읽을 쉬운 안내 초안을 만들어요. 「게시」를 누르기 전에는 아무것도
          보이지 않아요.
        </p>
      </div>

      <div className={card}>
        <p className="rounded-xl bg-sos-tile px-3.5 py-2.5 text-xs leading-relaxed text-sos-ink">
          학생 이름·연락처·명단이 든 문서는 올리지 마세요. 넣은 글과 PDF는 초안을 만들 때 AI
          회사(Anthropic) 서버로 보내요. 씨드온은 게시하고 30일(게시하지 않으면 올리고 30일) 뒤에 지워요.
        </p>
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-ink-60">공문 글 붙여넣기</span>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            maxLength={MAX_SOURCE_CHARS}
            rows={6}
            className={field}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-ink-60">또는 PDF (4MB까지)</span>
          <input
            key={file ? "picked" : "empty"}
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
        </label>
        <button onClick={makeDraft} disabled={busy !== null} className={primary}>
          {busy === "draft" ? "초안을 만들고 있어요… (1분쯤)" : "쉬운 안내 초안 만들기"}
        </button>
        {!draft && (
          <button
            onClick={() => setDraft({ ...EMPTY_DRAFT })}
            className="block w-full text-xs text-primary-deep hover:underline"
          >
            AI 없이 직접 쓰기
          </button>
        )}
      </div>

      {!draft && errors.length > 0 && <Errors items={errors} />}

      {draft && (
        <>
          {notes.length > 0 && (
            <div className="rounded-card border border-sos-line bg-sos-tile p-4">
              <p className="text-xs font-bold text-sos-ink">게시 전에 확인해주세요</p>
              <ul className="mt-1.5 list-inside list-disc space-y-1 text-xs leading-relaxed text-sos-ink">
                {notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
          )}

          <div className={card}>
            <h2 className="text-sm font-bold text-ink">학생에게 보이는 안내</h2>
            <Text label="이름" value={draft.title} onChange={(v) => set("title", v)} />
            <Text label="운영하는 곳" value={draft.org} onChange={(v) => set("org", v)} />
            <Area label="무엇을 해주나요" value={draft.description} onChange={(v) => set("description", v)} />
            <Area label="누가 신청할 수 있나요" value={draft.who} onChange={(v) => set("who", v)} />
            <Area label="어떻게 신청하나요 (오늘 할 수 있는 첫 행동)" value={draft.applyMethod} onChange={(v) => set("applyMethod", v)} />
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-ink-60">신청 마감일</span>
              <input type="date" value={draft.deadline} onChange={(e) => set("deadline", e.target.value)} className={field} />
            </label>
            {!draft.deadline && (
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-ink-60">마감일이 없으면 접수 방식</span>
                <select value={draft.enrollment} onChange={(e) => set("enrollment", e.target.value)} className={field}>
                  <option value="">골라주세요</option>
                  {ENROLLMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
            )}
            <Text label="공식 신청·안내 링크 (https://)" value={draft.link} onChange={(v) => set("link", v)} />
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-ink-60">그 링크는 어떤 페이지인가요</span>
              <select value={draft.linkKind} onChange={(e) => set("linkKind", e.target.value === "apply" ? "apply" : "info")} className={field}>
                <option value="apply">이 사업의 신청·안내 페이지</option>
                <option value="info">기관 홈페이지 (들어가서 더 찾아야 해요)</option>
              </select>
            </label>
            <Text label="문의 전화 (없으면 비움)" value={draft.phone} onChange={(v) => set("phone", v)} />
          </div>

          <div className={card}>
            <h2 className="text-sm font-bold text-ink">누구에게 알릴까요</h2>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-ink-60">분류</span>
              <select value={draft.category} onChange={(e) => set("category", e.target.value as NoticeDraft["category"])} className={field}>
                <option value="">골라주세요</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.label}</option>
                ))}
              </select>
            </label>
            <Chips
              label="대상 학년"
              options={GRADES.map((g) => ({ value: g.value, label: g.label }))}
              selected={draft.grades}
              onToggle={(v) => set("grades", toggle(draft.grades, v))}
            />
            <Text label="지역 (비우면 전국 · 예: 경기, 서울 강남구)" value={draft.regions} onChange={(v) => set("regions", v)} />
            <Chips
              label="관심 분야 (안 고르면 위 분류로 알려요)"
              options={categories.map((c) => ({ value: c.slug, label: c.label }))}
              selected={draft.interests}
              onToggle={(v) => set("interests", toggle(draft.interests, v))}
            />
            <Check
              label="교육급여를 받는 학생을 먼저 뽑는 기회예요"
              hint="학생의 알림 목록 순서에만 쓰고, 화면에 표시하지 않아요."
              checked={draft.eduBenefitPriority}
              onChange={(v) => set("eduBenefitPriority", v)}
            />
            <Check
              label="어른의 추천이 있어야 신청할 수 있어요"
              hint="씨드온이 추천서를 대신 쓰지는 않아요."
              checked={draft.needsRecommendation}
              onChange={(v) => set("needsRecommendation", v)}
            />
          </div>

          {hardWords(draft).length > 0 && (
            <p className="rounded-xl bg-sos-tile px-3.5 py-2.5 text-xs text-sos-ink">
              학생에게 어려울 수 있는 말이 있어요: {hardWords(draft).join(", ")}. 쉬운 말로 바꿀 수 있는지 봐주세요.
            </p>
          )}

          <Check
            label="원문과 맞춰 봤어요 (날짜·금액·링크·전화번호)"
            checked={confirmed}
            onChange={setConfirmed}
          />
          {errors.length > 0 && <Errors items={errors} />}
          <button onClick={publish} disabled={!confirmed || busy !== null} className={primary}>
            {busy === "publish" ? "게시하고 있어요…" : "게시"}
          </button>
        </>
      )}
    </div>
  );
}

function Errors({ items }: { items: string[] }) {
  return (
    <ul role="alert" className="space-y-1 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
      {items.map((e) => (
        <li key={e}>{e}</li>
      ))}
    </ul>
  );
}

function Text({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-ink-60">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={field} />
    </label>
  );
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-ink-60">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={field} />
    </label>
  );
}

function Chips<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T[];
  onToggle: (v: T) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold text-ink-60">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o.value);
          return (
            <button
              type="button"
              key={o.value}
              aria-pressed={on}
              onClick={() => onToggle(o.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                on ? "border-primary-deep bg-primary-deep text-white" : "border-sage-border bg-white text-body"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function Check({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2.5">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4" />
      <span className="text-sm text-body">
        {label}
        {hint && <span className="block text-xs text-ink-60">{hint}</span>}
      </span>
    </label>
  );
}

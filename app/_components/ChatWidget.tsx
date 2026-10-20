"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PhoneLink from "@/app/_components/PhoneLink";
import { askChat, type ChatCard, type ChatTurn } from "@/app/_components/chat-actions";

/**
 * 오른쪽 아래 둥근 버튼 → 씨드온 도우미 (로드 2026.10.20).
 * 은행 앱의 상담 버튼처럼 어느 화면에서나 누를 수 있다. 서버 쪽 규칙은
 * chat-actions.ts에 있다 (카드에 있는 것만 답함, 판정 안 함, 민감한 것 안 물음).
 *
 * 대화는 이 화면에만 있다. 새로고침하면 사라지고, 씨드온 DB에 저장하지 않는다.
 * 한 번 열었을 때 질문은 20개까지 — 돈이 새지 않게.
 */

type Msg = { role: "user" | "assistant"; text: string; cards?: ChatCard[]; crisis?: boolean };

const MAX_QUESTIONS = 20;
const GREETING: Msg = {
  role: "assistant",
  text: "안녕하세요, 씨드온 도우미예요. 어떤 도움이 필요한지 편하게 적어 주세요. 예: \"학원비가 부담돼요\", \"상담 받을 곳이 있어요?\"",
};

export default function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [msgs, pending, open]);

  // 관리자 화면에는 띄우지 않는다
  if (pathname?.startsWith("/admin")) return null;

  const asked = msgs.filter((m) => m.role === "user").length;

  function send() {
    const q = input.trim();
    if (!q) {
      setError("궁금한 걸 한 줄 적어 주세요");
      return;
    }
    if (asked >= MAX_QUESTIONS) {
      setError("이번에는 여기까지 물어볼 수 있어요. 새로고침하면 다시 시작해요");
      return;
    }
    setError("");
    const history: ChatTurn[] = msgs.slice(1).map((m) => ({ role: m.role, text: m.text }));
    setMsgs((prev) => [...prev, { role: "user", text: q }]);
    setInput("");
    startTransition(async () => {
      const reply = await askChat(history, q);
      setMsgs((prev) => [...prev, { role: "assistant", text: reply.text, cards: reply.cards, crisis: reply.crisis }]);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="씨드온 도우미 열기"
        className="fixed right-4 bottom-[88px] z-50 flex h-14 w-14 items-center justify-center rounded-full bg-seed-950 text-white shadow-lg hover:opacity-90"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
          <path d="M4 5h16v11H9l-5 4z" />
          <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" />
        </svg>
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="씨드온 도우미"
      className="fixed inset-x-2 bottom-[84px] z-50 flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-sage-border bg-white shadow-xl sm:inset-x-auto sm:right-4 sm:w-[380px]"
    >
      <div className="flex items-center justify-between bg-seed-950 px-4 py-3">
        <span className="text-sm font-bold text-white">씨드온 도우미</span>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-white/80 hover:text-white">
          닫기 ✕
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3 text-sm">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 leading-relaxed ${
                m.role === "user" ? "bg-seed-950 text-white" : "bg-sage text-body"
              }`}
            >
              {m.text}
              {m.crisis && (
                <div className="mt-2">
                  <PhoneLink number="1388" className="font-bold underline">
                    1388 전화하기
                  </PhoneLink>
                </div>
              )}
              {m.cards && m.cards.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {m.cards.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/apply/${c.id}`}
                        onClick={() => setOpen(false)}
                        className="block rounded-xl border border-sage-border bg-white px-3 py-2 hover:border-seed-950"
                      >
                        <span className="block text-[13px] font-bold">{c.title}</span>
                        <span className="block text-[11px] text-meta">{c.org}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
        {pending && <p className="text-xs text-meta">답을 찾고 있어요…</p>}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-sage-border p-3">
        <p className="mb-2 text-[11px] text-meta">이름·연락처·학교는 적지 마세요. 적은 글은 씨드온에 저장하지 않아요.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (error) setError("");
            }}
            maxLength={300}
            placeholder="궁금한 걸 적어 주세요"
            aria-label="도우미에게 물어볼 말"
            className="min-w-0 flex-1 rounded-xl border border-sage-border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-seed-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            보내기
          </button>
        </form>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import type { CardReportState } from "./report-actions";

/**
 * 「정보가 틀렸어요」 — 카드마다 하나.
 *
 * 왜: 청소년이 마감이 지난 걸 보고 헛걸음하거나, 안 열리는 링크를 누르는 일은
 * 우리 점검이 놓칠 수 있다. 직접 본 사람이 한 번 누르면 콘텐츠팀이 다음 점검 때
 * 공식 페이지와 대조해 고친다 (업무판 「들어온 신고 처리」).
 *
 * 누가 눌렀는지는 남기지 않는다. 메모에도 이름·연락처를 적지 말라고 안내한다.
 */
const REASONS: { value: string; label: string }[] = [
  { value: "deadline", label: "마감 날짜가 달라요" },
  { value: "link", label: "링크가 안 열려요" },
  { value: "content", label: "금액이나 내용이 달라요" },
  { value: "phone", label: "전화번호가 안 돼요" },
  { value: "other", label: "다른 게 틀렸어요" },
];

export default function CardReportButton({
  action,
}: {
  action: (prev: CardReportState, formData: FormData) => Promise<CardReportState>;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, null);

  if (state?.ok) {
    return (
      <p className="rounded-xl border border-sage-border bg-white px-4 py-3 text-center text-xs text-ink-60">
        알려줘서 고마워요. 공식 페이지랑 맞춰보고 고칠게요.
      </p>
    );
  }

  if (!open) {
    return (
      <div className="text-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-meta underline underline-offset-2 hover:text-ink"
        >
          정보가 틀렸어요
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-card border border-sage-border bg-white p-4">
      <p className="text-sm font-semibold text-ink">어떤 게 틀렸어요?</p>
      <div className="flex flex-wrap gap-2">
        {REASONS.map((r) => (
          <label
            key={r.value}
            className="cursor-pointer rounded-full border border-sage-border px-3 py-1.5 text-xs text-body has-[:checked]:border-primary has-[:checked]:bg-mint has-[:checked]:text-primary-deep"
          >
            <input type="radio" name="reason" value={r.value} required className="sr-only" />
            {r.label}
          </label>
        ))}
      </div>
      <textarea
        name="note"
        rows={2}
        maxLength={300}
        placeholder="어디가 다른지 적어주면 더 빨리 고칠 수 있어요 (안 적어도 돼요). 이름이나 연락처는 적지 말아주세요."
        className="w-full rounded-xl border border-sage-border bg-white px-3 py-2 text-xs text-body focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
      />
      {state?.error && <p className="text-xs text-sos-num">{state.error}</p>}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-meta hover:text-ink"
        >
          닫기
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          {pending ? "보내는 중…" : "알려주기"}
        </button>
      </div>
    </form>
  );
}

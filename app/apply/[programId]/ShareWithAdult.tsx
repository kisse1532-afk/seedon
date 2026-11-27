"use client";

import { useState } from "react";

/**
 * 「선생님께 이 안내 보내기」 — 누구에게 보낼지는 학생이 자기 메신저에서 고른다.
 * 씨드온은 받는 사람을 묻지도 저장하지도 않고, 보냈다는 기록도 남기지 않는다.
 * 링크에는 카드 번호만 들어가서 누가 보냈는지, 학생 설정이 어떤지 알 수 없다.
 */
export default function ShareWithAdult({ programId, message }: { programId: string; message: string }) {
  const [result, setResult] = useState<{ copied: boolean; text: string } | null>(null);

  async function send() {
    const text = `${message}\n${window.location.origin}/share/${programId}`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch (e) {
        // 학생이 공유 창을 닫은 것. 다른 실패면 복사로 넘어간다.
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setResult({ copied: true, text });
    } catch {
      setResult({ copied: false, text });
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={send}
        className="w-full rounded-xl border border-primary-deep/40 px-4 py-2.5 text-sm font-bold text-primary-deep transition hover:bg-mint"
      >
        선생님께 이 안내 보내기
      </button>
      <p className="text-xs leading-relaxed text-meta">
        내 메신저로 직접 보내요. 씨드온은 누구에게 보냈는지 저장하지 않고, 추천서를 대신 쓰지 않아요.
      </p>
      {result && (
        <div role="status" className="space-y-1.5">
          <p className="text-xs font-semibold text-primary-deep">
            {result.copied ? "복사했어요. 메신저에 붙여넣어 보내세요." : "아래 글을 길게 눌러 복사해서 보내세요."}
          </p>
          <textarea
            readOnly
            value={result.text}
            rows={4}
            onFocus={(e) => e.target.select()}
            className="w-full rounded-xl border border-sage-border bg-white p-3 text-xs text-body"
          />
        </div>
      )}
    </div>
  );
}

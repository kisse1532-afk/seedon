"use client";

import { useState } from "react";
import type { ApplyStep } from "@/lib/data";

type Props = {
  programTitle: string;
  description: string;
  applyMethod: string | null;
  applySteps: ApplyStep[] | null;
  submitHelp: (formData: FormData) => void;
};

type ViewState = "menu" | "eligibility" | "docs" | "howto" | "escalate" | "reserve";

export default function HelpChatbot({
  programTitle,
  description,
  applyMethod,
  applySteps,
  submitHelp,
}: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ViewState>("menu");

  const BotBubble = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-2xl rounded-tl-sm bg-neutral-100 px-4 py-2.5 text-sm text-neutral-700 max-w-[90%]">
      {children}
    </div>
  );

  const MenuButton = ({
    label,
    onClick,
  }: {
    label: string;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className="w-full text-left text-sm rounded-xl border border-neutral-200 bg-white px-4 py-2.5 hover:bg-neutral-50"
    >
      {label}
    </button>
  );

  const BackRow = () => (
    <button
      onClick={() => setView("menu")}
      className="text-xs text-neutral-400 hover:text-neutral-600"
    >
      ← 다른 게 궁금해요
    </button>
  );

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <span>
            <span className="block font-medium text-sm text-amber-900">
              🙋 혼자 신청하기 어려우신가요?
            </span>
            <span className="block text-xs text-amber-700 mt-0.5">
              눌러서 씨드온 챗봇에게 바로 물어보세요
            </span>
          </span>
          <span className="text-amber-400 text-lg">›</span>
        </button>
      ) : (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-900">씨드온 챗봇</span>
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-neutral-400 hover:text-neutral-600"
            >
              닫기 ✕
            </button>
          </div>

          {view === "menu" && (
            <>
              <BotBubble>안녕! &quot;{programTitle}&quot;에 대해 뭐가 궁금해?</BotBubble>
              <div className="space-y-1.5">
                <MenuButton label="이 프로그램, 나도 받을 수 있어?" onClick={() => setView("eligibility")} />
                <MenuButton label="뭘 준비해야 해?" onClick={() => setView("docs")} />
                <MenuButton label="신청은 어떻게 해?" onClick={() => setView("howto")} />
                <MenuButton label="그래도 잘 모르겠어, 사람이 도와줬으면 좋겠어" onClick={() => setView("escalate")} />
              </div>
            </>
          )}

          {view === "eligibility" && (
            <>
              <BotBubble>{description}</BotBubble>
              <BackRow />
            </>
          )}

          {view === "docs" && (
            <>
              <BotBubble>
                {applyMethod || "이 프로그램은 아직 준비서류 안내가 등록되지 않았어요. 아래에서 사람 도움을 요청해줘!"}
              </BotBubble>
              <BackRow />
            </>
          )}

          {view === "howto" && (
            <>
              <BotBubble>
                {applySteps && applySteps.length > 0 ? (
                  <ol className="list-decimal list-inside space-y-0.5">
                    {applySteps.map((step, i) => (
                      <li key={i}>
                        {step.title}
                        {step.subtitle ? ` — ${step.subtitle}` : ""}
                      </li>
                    ))}
                  </ol>
                ) : (
                  "신청 절차가 아직 등록되지 않았어요. 아래에서 사람 도움을 요청해줘!"
                )}
              </BotBubble>
              <BackRow />
            </>
          )}

          {view === "escalate" && (
            <>
              <BotBubble>
                괜찮아, 그럴 수 있어. 둘 중 편한 방법을 골라줘.
              </BotBubble>
              <div className="space-y-2">
                <div className="rounded-xl border border-amber-200 bg-white p-3 space-y-1.5">
                  <p className="text-sm font-medium text-amber-900">📞 지금 바로 전화로 물어보기</p>
                  <p className="text-xs text-neutral-500">
                    청소년 상담 1388(국번없이, 24시간·무료)로 전화하면 지금 바로 대화할 수 있어요.
                  </p>
                  <a
                    href="tel:1388"
                    className="inline-block text-xs bg-amber-500 text-white rounded-full px-4 py-1.5 hover:bg-amber-600"
                  >
                    1388 전화하기
                  </a>
                </div>
                <div className="rounded-xl border border-amber-200 bg-white p-3 space-y-1.5">
                  <p className="text-sm font-medium text-amber-900">📝 씨드온 직원이 연락드릴게요</p>
                  <p className="text-xs text-neutral-500">
                    이름과 연락처를 남기면, 편한 시간에 맞춰 직접 연락드리고 신청을 도와드려요.
                  </p>
                  <button
                    onClick={() => setView("reserve")}
                    className="text-xs border border-amber-400 text-amber-700 rounded-full px-4 py-1.5 hover:bg-amber-50"
                  >
                    연락받을 시간 남기기
                  </button>
                </div>
              </div>
              <BackRow />
            </>
          )}

          {view === "reserve" && (
            <>
              <BotBubble>언제 연락받는 게 편해? 이름이랑 연락처만 남겨줘.</BotBubble>
              <form action={submitHelp} className="space-y-2">
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="이름"
                  className="w-full rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <input
                  name="contact"
                  type="tel"
                  required
                  placeholder="연락받을 번호 (010-0000-0000)"
                  className="w-full rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <textarea
                  name="message"
                  rows={2}
                  placeholder="언제가 편한지, 어떤 부분이 어려운지 알려주면 더 빨리 도와줄 수 있어 (선택)"
                  className="w-full rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="submit"
                  className="w-full rounded-full bg-amber-500 text-white text-sm font-medium py-2.5 hover:bg-amber-600"
                >
                  연락 요청 보내기
                </button>
                <p className="text-[10px] text-amber-700/70 text-center">
                  남겨주신 정보는 연락 목적으로만 쓰고, 처리가 끝나면 일정 기간 뒤 삭제해요.
                </p>
              </form>
              <BackRow />
            </>
          )}
        </div>
      )}
    </div>
  );
}

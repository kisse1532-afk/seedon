"use client";

import { useEffect, useState } from "react";
import type { ApplyStep } from "@/lib/data";
import PhoneLink from "@/app/_components/PhoneLink";
import { clearMyInfo, loadMyInfo, saveMyInfo } from "@/lib/my-info";
import SavedInfoNote from "@/app/_components/SavedInfoNote";

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

  /* 자동 채움. 도움 요청은 "혼자 하기 어렵다"고 말한 사람이 쓰는 창구라,
     여기서 또 처음부터 적게 하면 안 된다. 화면이 뜬 뒤에 채운다(서버 렌더 때는
     localStorage를 못 읽는다). */
  const [prefill, setPrefill] = useState<{ name: string; contact: string } | null>(null);

  useEffect(() => {
    const saved = loadMyInfo();
    if (saved) setPrefill({ name: saved.name, contact: saved.contact });
  }, []);

  function handleClearSaved() {
    clearMyInfo();
    setPrefill(null);
    const form = document.getElementById("help-reserve-form") as HTMLFormElement | null;
    form?.reset();
  }

  /* 서버 액션이라 결과를 여기서 못 본다. 보내기 직전에 저장한다 —
     이름·연락처는 형식이 틀려서 실패하는 값이 아니라 그대로 둬도 해가 없다. */
  function rememberOnSubmit(e: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(e.currentTarget);
    saveMyInfo(String(data.get("name") || ""), String(data.get("contact") || ""));
  }

  const BotBubble = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-2xl rounded-tl-sm bg-cream px-4 py-2.5 text-sm text-body max-w-[90%]">
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
      className="w-full text-left text-sm rounded-xl border border-sage-border bg-white px-4 py-2.5 hover:bg-cream"
    >
      {label}
    </button>
  );

  const BackRow = () => (
    <button
      onClick={() => setView("menu")}
      className="text-xs text-meta hover:text-ink"
    >
      ← 다른 게 궁금해요
    </button>
  );

  return (
    // 바탕색(sos-tile)이 페이지 배경인 Cream과 너무 가까워 블록이 안 보였다.
    // 말을 거는 자리라 눈에 띄어야 하므로 테두리를 진한 쪽(sos-num)으로 올리고
    // 아이콘 원을 붙였다.
    <div className="overflow-hidden rounded-card border border-sos-num/30 bg-sos-tile">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:brightness-[0.98]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sos-num">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-[18px] w-[18px]"
              aria-hidden
            >
              <path d="M9.4 9.2a2.7 2.7 0 1 1 3.6 2.5c-.7.3-1 .9-1 1.6v.4" />
              <path d="M12 17.4h.01" />
              <circle cx="12" cy="12" r="8.4" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-sos-ink">
              혼자 신청하기 어려우신가요?
            </span>
            <span className="mt-0.5 block text-xs text-sos-sub">
              눌러서 씨드온 챗봇에게 바로 물어보세요
            </span>
          </span>
          <span className="text-lg text-sos-num/60">›</span>
        </button>
      ) : (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-sos-ink">씨드온 챗봇</span>
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-meta hover:text-ink"
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
                <div className="rounded-xl border border-sos-line bg-white p-3 space-y-1.5">
                  <p className="text-sm font-medium text-sos-ink">지금 바로 전화로 물어보기</p>
                  <p className="text-xs text-ink-60">
                    청소년 상담 1388(국번없이, 24시간·무료)로 전화하면 지금 바로 대화할 수 있어요.
                  </p>
                  <PhoneLink
                    number="1388"
                    /* bg-sos-tile0 이라는 색은 없다(sos-tile 오타). Tailwind는 없는 색 이름을
                       조용히 무시하므로 배경이 안 칠해지고 흰 글씨만 남아, 흰 카드 위에서
                       버튼이 사실상 안 보였다. 도움이 제일 급한 순간에 눌 버튼이 안 보인 것. */
                    className="inline-block text-xs bg-sos-num text-white rounded-full px-4 py-1.5 hover:brightness-110"
                  >
                    1388 전화하기
                  </PhoneLink>
                </div>
                <div className="rounded-xl border border-sos-line bg-white p-3 space-y-1.5">
                  <p className="text-sm font-medium text-sos-ink">씨드온 직원이 연락드릴게요</p>
                  <p className="text-xs text-ink-60">
                    이름과 연락처를 남기면, 편한 시간에 맞춰 직접 연락드리고 신청을 도와드려요.
                  </p>
                  <button
                    onClick={() => setView("reserve")}
                    className="text-xs border border-sos-num/50 text-sos-sub rounded-full px-4 py-1.5 hover:bg-sos-tile"
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
              <form
                id="help-reserve-form"
                action={submitHelp}
                onSubmit={rememberOnSubmit}
                className="space-y-2"
              >
                {prefill && <SavedInfoNote onClear={handleClearSaved} />}
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={prefill?.name ?? ""}
                  key={`help-name-${prefill?.name ?? "empty"}`}
                  placeholder="이름"
                  className="w-full rounded-xl border border-sos-line bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sos-num/40"
                />
                <input
                  name="contact"
                  type="tel"
                  required
                  defaultValue={prefill?.contact ?? ""}
                  key={`help-contact-${prefill?.contact ?? "empty"}`}
                  placeholder="연락받을 번호 (010-0000-0000)"
                  className="w-full rounded-xl border border-sos-line bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sos-num/40"
                />
                <textarea
                  name="message"
                  rows={2}
                  placeholder="언제가 편한지, 어떤 부분이 어려운지 알려주면 더 빨리 도와줄 수 있어 (선택)"
                  className="w-full rounded-xl border border-sos-line bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sos-num/40"
                />
                <button
                  type="submit"
                  className="w-full rounded-full bg-sos-num text-white text-sm font-medium py-2.5 hover:brightness-110"
                >
                  연락 요청 보내기
                </button>
                <p className="text-[10px] text-sos-meta text-center">
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

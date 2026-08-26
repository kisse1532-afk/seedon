"use client";

import { useEffect, useState } from "react";
import type { ApplyStep } from "@/lib/data";
import PhoneLink from "@/app/_components/PhoneLink";
import { clearMyInfo, loadMyInfo, onMyInfoChange, saveMyInfo } from "@/lib/my-info";
import SavedInfoNote from "@/app/_components/SavedInfoNote";
import { POLICY_CONTACT } from "@/lib/policy";

type Props = {
  programTitle: string;
  description: string;
  applyMethod: string | null;
  applySteps: ApplyStep[] | null;
  submitHelp: (formData: FormData) => void;
};

type ViewState = "menu" | "eligibility" | "docs" | "howto" | "escalate" | "reserve";

/* 말투는 ~해요체다. 처음엔 도우미 안쪽만 반말이었는데("안녕! 뭐가 궁금해?")
   바깥 화면은 전부 존댓말이라 한 서비스에서 말투가 갈렸다.
   로드 결정(2026.08.25): "반말은 안돼" — 서비스 전체 ~해요체로 통일. */
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
  const [prefill, setPrefill] = useState<
    { name: string; contact: string; savedAt: string } | null
  >(null);

  useEffect(() => {
    const sync = () => {
      const saved = loadMyInfo();
      setPrefill(saved && { name: saved.name, contact: saved.contact, savedAt: saved.savedAt });
    };
    sync();
    // 다른 화면·다른 탭에서 지웠을 때도 여기 칸이 같이 비워져야 한다.
    return onMyInfoChange(sync);
  }, []);

  function handleClearSaved() {
    clearMyInfo();
    setPrefill(null);
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
            {/* "어려우신가요?"는 어른 손님에게 쓰는 높임이라 아랫줄("골라보세요")과
                말투가 갈렸다. 한 버튼 안에서는 한 말투여야 한다 (검토 관점, 2026.08.25) */}
            <span className="block text-sm font-bold text-sos-ink">
              혼자 신청하기 어려워요?
            </span>
            {/* "챗봇에게 물어보세요"는 아무거나 타이핑해 물어봐도 답해준다는
                기대를 만든다. 실제로는 정해진 네 갈래 중 고르는 방식이다.
                요즘 청소년이 "챗봇"에서 기대하는 것과 어긋난다 (운영 관점, 2026.08.25).
                거짓말은 아니었지만, 기대를 부풀리지 않는 말로 바꾼다. */}
            <span className="mt-0.5 block text-xs text-sos-sub">
              눌러서 궁금한 것부터 골라보세요
            </span>
          </span>
          <span className="text-lg text-sos-num/60">›</span>
        </button>
      ) : (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-sos-ink">씨드온 도우미</span>
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-meta hover:text-ink"
            >
              닫기 ✕
            </button>
          </div>

          {view === "menu" && (
            <>
              <BotBubble>안녕하세요! &quot;{programTitle}&quot;에 대해 뭐가 궁금해요?</BotBubble>
              <div className="space-y-1.5">
                <MenuButton label="이 프로그램, 나도 받을 수 있어요?" onClick={() => setView("eligibility")} />
                <MenuButton label="뭘 준비해야 해요?" onClick={() => setView("docs")} />
                <MenuButton label="신청은 어떻게 해요?" onClick={() => setView("howto")} />
                <MenuButton label="그래도 잘 모르겠어요, 사람이 도와줬으면 좋겠어요" onClick={() => setView("escalate")} />
              </div>
            </>
          )}

          {/* "나도 받을 수 있어요?"에 소개문만 돌려주면 제일 궁금한 걸 답하지 않은 것이다.
              우리는 자격을 판정하지 않으므로(절대규칙 2), 대신 물어볼 곳을 준다 (검토 지적 2026.08.26) */}
          {view === "eligibility" && (
            <>
              <BotBubble>{description}</BotBubble>
              <BotBubble>
                내가 되는지 헷갈리면 아래 &quot;사람이 도와줬으면 좋겠어요&quot;를 눌러주세요. 청소년전화 1388에 물어봐도 돼요.
              </BotBubble>
              <MenuButton label="사람이 도와줬으면 좋겠어요" onClick={() => setView("escalate")} />
              <BackRow />
            </>
          )}

          {view === "docs" && (
            <>
              <BotBubble>
                {applyMethod || "이 프로그램은 뭘 준비해야 하는지 아직 안 적혀 있어요. 사람한테 직접 물어볼 수 있어요."}
              </BotBubble>
              {/* 안내가 없을 때 "아래에서 요청해주세요"라고만 하고 아래에 아무것도 없었다.
                  막다른 길이 되지 않게 그 자리에 버튼을 같이 놓는다 */}
              {!applyMethod && (
                <MenuButton label="사람이 도와줬으면 좋겠어요" onClick={() => setView("escalate")} />
              )}
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
                  "신청을 어떤 순서로 하는지 아직 안 적혀 있어요. 사람한테 직접 물어볼 수 있어요."
                )}
              </BotBubble>
              {!(applySteps && applySteps.length > 0) && (
                <MenuButton label="사람이 도와줬으면 좋겠어요" onClick={() => setView("escalate")} />
              )}
              <BackRow />
            </>
          )}

          {view === "escalate" && (
            <>
              <BotBubble>
                괜찮아요, 그럴 수 있어요. 둘 중 편한 방법을 골라주세요.
              </BotBubble>
              <div className="space-y-2">
                <div className="rounded-xl border border-sos-line bg-white p-3 space-y-1.5">
                  <p className="text-sm font-medium text-sos-ink">지금 바로 전화로 물어보기</p>
                  <p className="text-xs text-ink-60">
                    {/* "국번없이"는 유선전화 시대 말이라 지금 중학생은 모른다 (검토 지적 2026.08.26) */}
                    1388은 앞에 아무것도 안 붙이고 1388만 누르면 돼요. 밤이든 새벽이든 걸 수 있고 돈은 안 들어요.
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
                  {/* "직원"은 없는 조직을 있는 것처럼 말한 것이고(로드 1인),
                      언제 연락 오는지가 없으면 기다리다 놓친다 (검토 지적 2026.08.26) */}
                  <p className="text-sm font-medium text-sos-ink">씨드온에서 연락드릴게요</p>
                  <p className="text-xs text-ink-60">
                    이름과 연락처를 남기면, 편한 시간에 맞춰 직접 연락드리고 신청을 도와드려요. 보통 하루 이틀 안에 연락드려요.
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
              <BotBubble>언제 연락받는 게 편해요? 이름이랑 연락처만 남겨주세요.</BotBubble>
              <form
                id="help-reserve-form"
                action={submitHelp}
                onSubmit={rememberOnSubmit}
                className="space-y-2"
              >
                {prefill && (
                  <SavedInfoNote
                    onClear={handleClearSaved}
                    savedAt={prefill.savedAt}
                    tone="warm"
                  />
                )}
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
                  placeholder="언제가 편한지, 어떤 부분이 어려운지 알려주면 더 빨리 도와드릴 수 있어요 (선택)"
                  className="w-full rounded-xl border border-sos-line bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sos-num/40"
                />
                <button
                  type="submit"
                  className="w-full rounded-full bg-sos-num text-white text-sm font-medium py-2.5 hover:brightness-110"
                >
                  연락 요청 보내기
                </button>
                <p className="text-[10px] text-sos-meta text-center leading-relaxed">
                  남겨주신 정보는 연락하는 데만 써요. 다 도와드리고 나서 1년이 지나면 지워요.
                  <br />
                  더 빨리 지우고 싶으면 {POLICY_CONTACT}로 알려주세요.
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

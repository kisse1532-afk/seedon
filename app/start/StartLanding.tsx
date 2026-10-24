"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Logo, { SeedonSymbol } from "@/app/_components/Logo";
import { supabase } from "@/lib/supabase";

export type SceneProgram = {
  id: string;
  title: string;
  org: string;
  badge: string;
  urgent: boolean;
};

type StartEvent = "start_view" | "start_fakedoor_click" | "start_notify_click" | "start_sheet_close";

/* 연락처는 씨드온이 아니라 Tally 폼에서 받는다(동의·처리 안내가 거기 있다).
   from·v를 그대로 붙여 넘겨서 Tally 쪽에서도 어디서 왔는지 구분한다. */
const NOTIFY_FORM = "https://tally.so/r/J19vdX";

/* 주소에 붙은 값은 아무나 바꿀 수 있다. 짧은 영문·숫자만 받는다. */
function clean(v: string | null) {
  if (!v) return null;
  const t = v.trim().slice(0, 32);
  return /^[A-Za-z0-9_-]+$/.test(t) ? t : null;
}

function readCampaign() {
  if (typeof window === "undefined") return { ref: null, variant: null };
  const q = new URLSearchParams(window.location.search);
  return { ref: clean(q.get("from")), variant: clean(q.get("v")) };
}

/* 진짜 주소에서 온 것만 web. 로컬·PR 미리보기에서 누른 것은 internal로 남겨
   숫자에서 뺀다 — 미리보기를 여는 사람은 청소년이 아니라 우리다. */
function landingSource(): "web" | "internal" {
  if (typeof window === "undefined") return "internal";
  return window.location.hostname === "seedon.vercel.app" ? "web" : "internal";
}

/* 랜딩 기록은 서비스 본체 숫자(program_events)와 따로 landing_events 표에 쌓는다
   (2026.10.24 로드 "씨드온이긴해도 따로 관리를 해야지"). 누가 눌렀는지는 남기지 않는다.
   기록이 실패해도 화면은 아무 영향이 없어야 한다. 기다리는 쪽(알림 버튼)도
   0.7초가 넘으면 기다리지 않고 넘어간다. */
async function record(event: StartEvent) {
  try {
    const { ref, variant } = readCampaign();
    await supabase.from("landing_events").insert({
      page: "start",
      event_type: event,
      ref,
      variant,
      source: landingSource(),
    });
  } catch {
    /* 무시 */
  }
}

const SCENES = 3;

export default function StartLanding({ programs }: { programs: SceneProgram[] }) {
  const [scene, setScene] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  /* 방문은 탭을 닫을 때까지 한 번만 센다(새로고침으로 숫자가 불지 않게). */
  useEffect(() => {
    const key = "seedon_start_viewed";
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* 저장소를 못 쓰면 중복 방지만 포기한다 */
    }
    void record("start_view");
  }, []);

  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    if (!card) return;
    const step = card.offsetWidth + 10;
    setScene(Math.max(0, Math.min(SCENES - 1, Math.round(el.scrollLeft / step))));
  }, []);

  const goScene = (i: number) => {
    const el = trackRef.current;
    const card = el?.children[i] as HTMLElement | undefined;
    if (!el || !card) return;
    el.scrollTo({ left: card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2, behavior: "smooth" });
  };

  const openSheet = () => {
    setSheetOpen(true);
    void record("start_fakedoor_click");
  };

  const closeSheet = () => {
    if (!sheetOpen || leaving) return;
    setSheetOpen(false);
    void record("start_sheet_close");
  };

  const goNotify = async () => {
    if (leaving) return;
    setLeaving(true);
    await Promise.race([record("start_notify_click"), new Promise((r) => setTimeout(r, 700))]);
    const { ref, variant } = readCampaign();
    const q = new URLSearchParams();
    if (ref) q.set("from", ref);
    if (variant) q.set("v", variant);
    const qs = q.toString();
    window.location.href = qs ? `${NOTIFY_FORM}?${qs}` : NOTIFY_FORM;
  };

  /* 창이 열려 있을 때 뒤 화면이 같이 스크롤되지 않게 */
  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeSheet();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  });

  return (
    <div className="relative mx-auto min-h-screen max-w-md overflow-hidden bg-cream text-warm-brown">
      <style>{`
        @keyframes sd-up { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
        @keyframes sd-sheet { from { transform: translateY(100%) } to { transform: none } }
        @keyframes sd-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sd-sway { 0%,100% { transform: rotate(-4deg) } 50% { transform: rotate(4deg) } }
        @keyframes sd-dot { 0%,80%,100% { opacity: .25 } 40% { opacity: 1 } }
        .sd-up { animation: sd-up .6s cubic-bezier(.2,.7,.2,1) both }
        .sd-sheet { animation: sd-sheet .32s cubic-bezier(.2,.8,.2,1) both }
        .sd-fade { animation: sd-fade .25s ease both }
        .sd-sway { transform-origin: 50% 100%; animation: sd-sway 4s ease-in-out infinite }
        .sd-dot { animation: sd-dot 1.2s infinite }
        @media (prefers-reduced-motion: reduce) {
          .sd-up, .sd-sheet, .sd-fade, .sd-sway, .sd-dot { animation: none }
        }
      `}</style>

      {/* ── 맨 위 ─────────────────────────────── */}
      <section className="relative overflow-hidden bg-seed-900 px-5 pb-9 pt-5 text-white">
        {/* 배경 장식: 은은한 빛 두 덩이 (오른쪽 큰 잎 그림은 10/24 로드가 뺌) */}
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-dark-primary/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-[#8fdc6a]/15 blur-3xl" />

        {/* 손으로 그린 알약 모양 대신 진짜 로고(토글 + 새싹 잎)를 쓴다.
            어두운 배경용 색이라 잎이 묻히지 않는다(2026.10.24 로드 "나뭇잎 표시가 안 보여"). */}
        <div className="relative mb-7">
          <Logo tone="dark" height={24} />
        </div>
        <h1 className="sd-up relative text-[31px] font-extrabold leading-[1.25] tracking-[-0.02em]">
          이미 있는 지원,
          <br />
          <span className="bg-gradient-to-r from-dark-primary to-[#b6f0a0] bg-clip-text text-transparent">
            신청까지 한 번에
          </span>
        </h1>
        <p className="sd-up relative mt-3 text-[14.5px] leading-[1.6] text-seed-mint [animation-delay:.08s]">
          흩어진 지원을 모아 쉬운 말로 알려 줄게요.
        </p>
        <div className="sd-up relative mt-4 flex flex-wrap gap-1.5 [animation-delay:.16s]">
          {["🎓 장학금", "⛺ 캠프", "📚 교육비", "💬 상담"].map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[12.5px] font-semibold text-white/90 backdrop-blur-sm"
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ── 장면 카드 3장 (옆으로 넘김) ─────────── */}
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="sd-up relative -mt-5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-5 pb-3 pt-0 [animation-delay:.22s] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="씨드온이 하는 일 세 가지"
      >
        <SceneCard n={1} title="한눈에 보기" sub="흩어진 지원을 한곳에 모았어요. 문장으로 적어도 찾아 줘요.">
          <div className="mb-2.5 flex items-center gap-2 rounded-full border border-brand-border bg-[#fbfaf7] py-1 pl-3 pr-1" aria-hidden>
            <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-ink-60" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="9" r="6" />
              <path d="M14 14l4 4" strokeLinecap="round" />
            </svg>
            <span className="flex-1 truncate text-[13px] text-[#555]">진로가 고민이에요</span>
            <span className="rounded-full bg-primary-deep px-3 py-1.5 text-[12.5px] font-bold text-white">찾기</span>
          </div>
          {/* 배치: 검색창은 위, 지원 목록은 카드 아래쪽에 붙인다(카드마다 모양이 달라 보이게) */}
          <div className="min-h-2 flex-1" />
          <div className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-bold text-ink-60">
            <span className="h-[6px] w-[6px] rounded-full bg-[#c0392b]" />
            마감이 가까운 지원
          </div>
          <div className="flex flex-col gap-1.5">
            {programs.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2.5 rounded-[13px] border border-brand-border bg-white px-2.5 py-2 shadow-[0_1px_0_rgba(67,64,58,0.04)]"
              >
                <span
                  className={`inline-flex h-[34px] min-w-[44px] items-center justify-center rounded-[10px] px-1.5 text-[11.5px] font-extrabold ${
                    p.urgent ? "bg-[#fdecea] text-[#c0392b]" : "bg-mint text-primary-deep"
                  }`}
                >
                  {p.badge}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold">{p.title}</div>
                  <div className="truncate text-[11.5px] text-ink-60">{p.org}</div>
                </div>
                <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-[#c9c3b6]" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ))}
          </div>
        </SceneCard>

        <SceneCard n={2} title="쉬운 말로 풀어 줘요" sub="어려운 공고, 중학생도 읽을 수 있게 바꿔요.">
          {/* 공고 말 → 쉬운 말: 한 장 안에서 위→아래로 바뀌는 모습 */}
          <div className="relative overflow-hidden rounded-[14px] border border-brand-border">
            <div className="bg-[#f5f4f0] px-3 pb-2.5 pt-1.5 text-[11.5px] leading-[1.45] text-[#9a968d]">
              <span className="mb-0.5 block text-[10px] font-bold tracking-wide text-[#aaa59a]">공고 원문</span>
              <span className="line-through decoration-[#cfcac0]">만 24세 이하 내국인에 한함. 연령 확인 가능한 신분증 등 증빙 지참 요망.</span>
            </div>
            <span
              aria-hidden
              className="absolute left-1/2 top-1/2 z-10 inline-flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary-deep text-[12px] text-white shadow-[0_2px_6px_rgba(23,145,106,0.35)]"
            >
              ↓
            </span>
            <div className="bg-mint px-3 pb-1.5 pt-2.5 text-[12.5px] font-semibold leading-[1.45] text-warm-brown">
              <span className="mb-0.5 block text-[10px] font-bold tracking-wide text-primary-deep">✨ 씨드온 쉬운 말</span>
              만 24세 이하면 무료예요. 나이 보이는 신분증만 챙겨 가요.
            </div>
          </div>

          {/* AI 챗봇 — 작은 대화 창 모양 */}
          <div className="min-h-2 flex-1" />
          <div className="overflow-hidden rounded-[14px] border border-brand-border bg-[#fbfaf7]">
            <div className="flex items-center gap-1.5 border-b border-brand-border bg-white px-2.5 py-1.5">
              <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-mint">
                <SeedonSymbol height={10} />
              </span>
              <span className="text-[12px] font-extrabold text-warm-brown">씨드온 AI 챗봇</span>
              <span className="ml-auto flex items-center gap-1 text-[10.5px] text-ink-60">
                <span className="h-[6px] w-[6px] rounded-full bg-[#2bbe8c]" />
                궁금한 걸 적어 봐요
              </span>
            </div>
            <div className="flex flex-col gap-1 px-2.5 py-1.5">
              <div className="self-end rounded-[13px_13px_4px_13px] bg-primary-deep px-[11px] py-1.5 text-[12.5px] text-white">
                저 고2인데 신청할 수 있어요?
              </div>
              <div className="flex max-w-[96%] items-end gap-1.5 self-start">
                <span className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-mint">
                  <SeedonSymbol height={10} />
                </span>
                <div className="rounded-[13px_13px_13px_4px] bg-white px-[11px] py-1.5 text-[12.5px] leading-[1.45] shadow-[0_1px_3px_rgba(0,0,0,0.07)]">
                  2008~2010년생이 들어가는 캠프가 있어요. 마감은 11월 11일이에요.
                </div>
              </div>
            </div>
          </div>
        </SceneCard>

        <SceneCard n={3} title="신청까지 한 번에" sub="사이트 여러 곳 돌지 않고, 씨드온 안에서 끝내요.">
          <ol className="relative mt-0.5 flex flex-1 flex-col justify-between pb-1">
            {/* 세로 연결선 */}
            <span aria-hidden className="absolute bottom-5 left-[17px] top-5 w-[2px] rounded bg-gradient-to-b from-primary-deep/60 to-[#8fdc6a]/60" />
            <TimelineStep icon="📝" title="씨드온에서 「신청하기」" />
            <TimelineStep icon="🔔" title="어른 허락이 필요하면" desc="도와줄 어른에게 알림이 가요" />
            <TimelineStep icon="✅" title="신청 완료 알림" />
            <TimelineStep icon="🎉" title="뽑혔는지까지 알려 줘요" />
          </ol>
        </SceneCard>
      </div>

      <div className="flex items-center justify-center gap-1.5 pb-1.5 pt-0.5" role="tablist" aria-label="장면 고르기">
        {Array.from({ length: SCENES }).map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={scene === i}
            aria-label={`${i + 1}번째 장면`}
            onClick={() => goScene(i)}
            className={`h-[7px] rounded-full transition-all duration-300 ${scene === i ? "w-[20px] bg-primary-deep" : "w-[7px] bg-[#d6d9d1]"}`}
          />
        ))}
      </div>
      <p className="text-center text-[11.5px] text-ink-60">
        {scene < SCENES - 1 ? "옆으로 넘겨 보세요 →" : "이게 씨드온이 하려는 일이에요"}
      </p>

      {/* ── 버튼 하나 ───────────────────────────── */}
      {/* 카드 바로 아래에 붙여 둔다. 화면이 작아 아래로 밀리면 바닥에 붙어 따라온다(sticky). */}
      <div className="sticky bottom-0 z-40">
        <div className="mx-auto max-w-md bg-gradient-to-t from-cream via-cream to-cream/0 px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3.5">
          <button
            type="button"
            onClick={openSheet}
            className="group relative block w-full overflow-hidden rounded-[16px] bg-gradient-to-r from-primary-deep to-[#1fa97b] px-4 py-[15px] text-center text-white shadow-[0_8px_20px_-6px_rgba(23,145,106,0.55)] transition active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-1.5 text-[17px] font-extrabold">
              신청까지 한 번에 해 보기
              <svg aria-hidden viewBox="0 0 20 20" className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M4 10h11M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="mt-0.5 block text-[12px] font-medium opacity-85">내 상황에 맞는 지원 찾고 바로 신청</span>
          </button>
        </div>
      </div>

      {/* ── 가짜 문: "아직 만들고 있어요" 창 ─────── */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="start-sheet-title">
          <button
            type="button"
            aria-label="닫기"
            onClick={closeSheet}
            className="sd-fade absolute inset-0 h-full w-full cursor-default bg-[#1d2a1a]/55 backdrop-blur-[2px]"
          />
          <div className="sd-sheet absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-[26px] bg-white px-6 pb-[max(26px,env(safe-area-inset-bottom))] pt-[22px] text-center shadow-[0_-10px_30px_rgba(0,0,0,0.12)]">
            <button
              type="button"
              onClick={closeSheet}
              aria-label="창 닫기"
              className="mx-auto -mt-2 mb-5 block h-1 w-10 rounded-sm bg-[#ddd]"
            />
            {/* 새싹이 자라는 중 — 아직 만드는 중이라는 뜻 */}
            <div aria-hidden className="relative mx-auto mb-3 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-mint">
              <span className="absolute inset-0 rounded-full ring-8 ring-mint/50" />
              <span className="sd-sway inline-block">
                <SeedonSymbol height={30} />
              </span>
            </div>
            <div className="mb-1 flex items-center justify-center gap-1 text-[12px] font-bold text-primary-deep">
              만드는 중
              <span className="sd-dot">.</span>
              <span className="sd-dot [animation-delay:.2s]">.</span>
              <span className="sd-dot [animation-delay:.4s]">.</span>
            </div>
            <h2 id="start-sheet-title" className="mb-2 text-[22px] font-extrabold tracking-[-0.01em] text-warm-brown">
              앗, 아직 만들고 있어요
            </h2>
            <p className="mb-5 text-[14.5px] leading-[1.65] text-[#555]">
              「신청까지 한 번에」는 지금 만드는 중이에요.
              <br />
              눌러 줘서 고마워요! 이게 진짜 필요한지
              <br />
              알고 싶어서 버튼부터 달아 뒀어요.
            </p>
            <button
              type="button"
              onClick={goNotify}
              disabled={leaving}
              className="block w-full rounded-[16px] bg-gradient-to-r from-primary-deep to-[#1fa97b] px-4 py-[15px] text-center text-white shadow-[0_8px_20px_-6px_rgba(23,145,106,0.55)] transition active:scale-[0.98] disabled:opacity-70"
            >
              <span className="block text-[17px] font-extrabold">{leaving ? "여는 중…" : "🔔 열리면 제일 먼저 알림 받기"}</span>
              <span className="mt-0.5 block text-[12px] font-medium opacity-85">연락처 하나만 · 30초</span>
            </button>
            <p className="mt-3 text-[11.5px] leading-normal text-ink-60">
              다음 화면에서 「알림만」 또는 「설문도 같이」를 고를 수 있어요
              <br />
              알림 말고는 연락하지 않아요
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* 카드 오른쪽 위 「지금 돼요」·「만들고 있어요」 표시는 뺐다(2026.10.24 로드). */
function SceneCard({
  n,
  title,
  sub,
  children,
}: {
  n: number;
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[368px] flex-[0_0_86%] snap-center flex-col rounded-[22px] border border-[#ece5d6] bg-white px-4 pb-4 pt-4 shadow-[0_12px_28px_-14px_rgba(55,86,47,0.35)]">
      <div className="flex items-center gap-2 text-[17px] font-extrabold tracking-[-0.01em]">
        <span className="inline-flex h-[24px] w-[24px] items-center justify-center rounded-full bg-primary-deep text-[12.5px] text-white">
          {n}
        </span>
        {title}
      </div>
      <p className="mb-3 mt-1 text-[13px] leading-normal text-ink-60">{sub}</p>
      {children}
    </div>
  );
}

function TimelineStep({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc?: string;
}) {
  return (
    <li className="relative flex items-center gap-3">
      <span
        aria-hidden
        className="relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e3efe6] bg-mint text-[16px]"
      >
        {icon}
      </span>
      <div className="flex-1 rounded-[13px] border border-brand-border bg-[#fbfaf7] px-3 py-2">
        <div className="text-[13px] font-semibold leading-[1.35]">{title}</div>
        {desc && <div className="text-[11.5px] leading-[1.4] text-ink-60">{desc}</div>}
      </div>
    </li>
  );
}

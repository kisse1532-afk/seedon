"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Logo from "@/app/_components/Logo";
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
    <div className="mx-auto min-h-screen max-w-md bg-cream text-warm-brown">
      {/* ── 맨 위 ─────────────────────────────── */}
      <section className="bg-seed-900 px-5 pb-6 pt-4 text-white">
        {/* 손으로 그린 알약 모양 대신 진짜 로고(토글 + 새싹 잎)를 쓴다.
            어두운 배경용 색이라 잎이 묻히지 않는다(2026.10.24 로드 "나뭇잎 표시가 안 보여"). */}
        <div className="mb-[18px]">
          <Logo tone="dark" height={24} />
        </div>
        <h1 className="text-[28px] font-extrabold leading-[1.28]">
          이미 있는 지원,
          <br />
          <span className="text-dark-primary">신청까지 한 번에</span>
        </h1>
        <p className="mt-2.5 text-[14.5px] leading-[1.55] text-seed-mint">
          장학금·캠프·교육비·상담.
          <br />
          흩어진 지원을 모아 쉬운 말로 알려 줄게요.
        </p>
      </section>

      {/* ── 장면 카드 3장 (옆으로 넘김) ─────────── */}
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-5 pb-1.5 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="씨드온이 하는 일 세 가지"
      >
        <SceneCard n={1} title="한눈에 보기">
          <p className="mb-2.5 mt-1.5 text-[13.5px] leading-normal text-ink-60">
            흩어진 지원을 한곳에 모았어요. 문장으로 적어도 찾아 줘요.
          </p>
          <div className="mb-2 flex gap-1.5" aria-hidden>
            <div className="flex-1 rounded-[10px] border border-brand-border px-3 py-2 text-[13px] text-[#555]">
              진로가 고민이에요
            </div>
            <div className="rounded-[10px] bg-primary-deep px-3 py-2 text-[13px] font-bold text-white">찾기</div>
          </div>
          {programs.map((p) => (
            <div
              key={p.id}
              className="mb-1.5 flex items-center gap-2.5 rounded-[11px] border border-brand-border px-2.5 py-2 text-[13px]"
            >
              <span
                className={`whitespace-nowrap rounded-[7px] px-1.5 py-[3px] text-[11px] font-extrabold ${
                  p.urgent ? "bg-[#fdecea] text-[#c0392b]" : "bg-mint text-primary-deep"
                }`}
              >
                {p.badge}
              </span>
              <div className="min-w-0">
                <div className="truncate">{p.title}</div>
                <div className="truncate text-[11.5px] text-ink-60">{p.org}</div>
              </div>
            </div>
          ))}
        </SceneCard>

        <SceneCard n={2} title="쉬운 말로 풀어 줘요">
          <p className="mb-2.5 mt-1.5 text-[13.5px] leading-normal text-ink-60">
            어려운 공고, 중학생도 읽을 수 있게 바꿔요.
          </p>
          <div className="rounded-[10px] bg-[#f3f3f1] px-2.5 py-2 text-[12px] leading-[1.45] text-[#888]">
            <div className="mb-0.5 text-[10.5px] font-bold">공고에 흔히 쓰는 말 (예시)</div>
            만 24세 이하 내국인에 한함. 관람 시 연령 확인이 가능한 신분증 등 증빙 지참 요망.
          </div>
          <div className="mt-1.5 rounded-[10px] bg-mint px-2.5 py-2 text-[13px] leading-normal">
            <div className="mb-0.5 text-[10.5px] font-bold text-primary-deep">씨드온 쉬운 말</div>
            만 24세 이하면 돈 내지 않고 볼 수 있어요. 나이 확인할 수 있는 신분증만 챙겨 가요.
          </div>
          <div className="mt-auto flex flex-col gap-[5px] border-t border-dashed border-brand-border pt-2">
            <span className="text-[10.5px] font-bold text-[#8a5d00]">챗봇 · 만들고 있어요</span>
            <div className="self-end rounded-[13px_13px_4px_13px] bg-primary-deep px-[11px] py-1.5 text-[12.5px] text-white">
              저 고2인데 신청할 수 있어요?
            </div>
            <div className="max-w-[88%] self-start rounded-[13px_13px_13px_4px] bg-[#f1f1ee] px-[11px] py-1.5 text-[12.5px] leading-[1.45]">
              2008~2010년생이 들어가는 캠프가 있어요. 마감은 11월 11일이에요.
            </div>
          </div>
        </SceneCard>

        <SceneCard n={3} title="신청까지 한 번에">
          <p className="mb-2.5 mt-1.5 text-[13.5px] leading-normal text-ink-60">
            사이트 여러 곳 돌지 않고, 씨드온 안에서 끝내요.
          </p>
          <Step icon="📝">씨드온에서 「신청하기」</Step>
          <Arrow />
          <Step icon="🔔">
            어른 허락이 필요하면
            <br />
            부모님·선생님께 알림이 가요
          </Step>
          <Arrow />
          <Step icon="✅">신청 완료 알림</Step>
          <Arrow />
          <Step icon="🎉">뽑혔는지까지 알려 줘요</Step>
        </SceneCard>
      </div>

      <div className="flex justify-center gap-1.5 pb-3 pt-1" role="tablist" aria-label="장면 고르기">
        {Array.from({ length: SCENES }).map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={scene === i}
            aria-label={`${i + 1}번째 장면`}
            onClick={() => goScene(i)}
            className={`h-[7px] rounded-full transition-all ${scene === i ? "w-[18px] bg-primary-deep" : "w-[7px] bg-[#cfd3cc]"}`}
          />
        ))}
      </div>

      {/* ── 버튼 하나 ───────────────────────────── */}
      <div className="px-5 pb-10">
        <button
          type="button"
          onClick={openSheet}
          className="block w-full rounded-[14px] bg-primary-deep px-4 py-[15px] text-center text-[17px] font-extrabold text-white active:opacity-90"
        >
          신청까지 한 번에 해 보기
          <span className="mt-0.5 block text-[12px] font-medium opacity-85">내 상황에 맞는 지원 찾고 바로 신청</span>
        </button>
      </div>

      {/* ── 가짜 문: "아직 만들고 있어요" 창 ─────── */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="start-sheet-title">
          <button
            type="button"
            aria-label="닫기"
            onClick={closeSheet}
            className="absolute inset-0 h-full w-full cursor-default bg-black/45"
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-[22px] bg-white px-5 pb-[max(26px,env(safe-area-inset-bottom))] pt-[22px] text-center">
            <button
              type="button"
              onClick={closeSheet}
              aria-label="창 닫기"
              className="mx-auto -mt-2 mb-4 block h-1 w-10 rounded-sm bg-[#ddd]"
            />
            <div aria-hidden className="text-[38px]">
              🛠️
            </div>
            <h2 id="start-sheet-title" className="mb-2 mt-1.5 text-[21px] font-extrabold text-warm-brown">
              앗, 아직 만들고 있어요
            </h2>
            <p className="mb-4 text-[14.5px] leading-[1.6] text-[#444]">
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
              className="block w-full rounded-[14px] bg-primary-deep px-4 py-[15px] text-center text-[17px] font-extrabold text-white disabled:opacity-70"
            >
              {leaving ? "여는 중…" : "열리면 제일 먼저 알림 받기"}
              <span className="mt-0.5 block text-[12px] font-medium opacity-85">연락처 하나만 · 30초</span>
            </button>
            <p className="mt-2.5 text-[11.5px] leading-normal text-ink-60">
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
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[338px] flex-[0_0_86%] snap-center flex-col rounded-[18px] border border-brand-border bg-white px-[15px] pb-3.5 pt-[15px]">
      <div className="flex items-center gap-[7px] text-[16.5px] font-extrabold">
        <span className="inline-flex h-[23px] w-[23px] items-center justify-center rounded-full bg-mint text-[13px] text-primary-deep">
          {n}
        </span>
        {title}
      </div>
      {children}
    </div>
  );
}

function Step({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-[9px] rounded-[11px] border border-dashed border-[#cfd8cf] px-2.5 py-2 text-[13px] leading-[1.35]">
      <span aria-hidden className="text-[16px]">
        {icon}
      </span>
      <span>{children}</span>
    </div>
  );
}

function Arrow() {
  return (
    <div aria-hidden className="text-center text-[12px] leading-[1.1] text-[#aab]">
      ↓
    </div>
  );
}

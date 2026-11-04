import type { OfficeEvent, TeamId } from "@/lib/office";

/* 도트 캐릭터 — 씨드온만의 캐릭터(새싹 머리띠). 8×11 칸 그림.
   글자 하나가 한 칸: . 빈칸, h 머리, s 피부, e 눈, t 옷, p 바지, g 새싹 */
const SPRITE = [
  "...gg...",
  "..g.....",
  "..hhhh..",
  ".hhhhhh.",
  ".hseseh.",
  ".hssssh.",
  "..tttt..",
  ".tttttt.",
  ".tttttt.",
  "..pppp..",
  "..p..p..",
];

function Sprite({ hair, shirt, size = 4 }: { hair: string; shirt: string; size?: number }) {
  const color: Record<string, string> = {
    h: hair, s: "#f6d2b0", e: "#2a2a2a", t: shirt, p: "#4a4a5a", g: "#72cf5e",
  };
  return (
    <svg
      width={8 * size}
      height={SPRITE.length * size}
      viewBox={`0 0 8 ${SPRITE.length}`}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {SPRITE.flatMap((row, y) =>
        row.split("").map((c, x) =>
          color[c] ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color[c]} /> : null
        )
      )}
    </svg>
  );
}

export const TEAMS: {
  id: TeamId; name: string; room: string; job: string; hair: string; shirt: string; floor: string;
}[] = [
  { id: "content", name: "콘텐츠팀", room: "자료실", job: "기관·공고 찾기, 카드 점검", hair: "#6b3f22", shirt: "#2bbe8c", floor: "#e9dcc3" },
  { id: "product", name: "제품팀", room: "개발실", job: "화면·기능 만들기, PR", hair: "#2a2a3a", shirt: "#5b8def", floor: "#d8dfe9" },
  { id: "ops", name: "운영팀", room: "관제실", job: "숫자 세기, 제보·알림 확인", hair: "#9a5a2a", shirt: "#ffae6b", floor: "#efe1d3" },
  { id: "biz", name: "사업팀", room: "회의실", job: "지원사업·사업계획", hair: "#3a2a1a", shirt: "#a37ad8", floor: "#e6ddef" },
];

function Desk() {
  return (
    <div className="relative h-5 w-12">
      <div className="absolute inset-x-0 top-0 h-3 rounded-[2px] bg-[#a8784a] shadow-[0_2px_0_#7d5533]" />
      <div className="absolute left-3 -top-3 h-3 w-6 rounded-[1px] bg-[#2f3a46] ring-1 ring-[#1d242c]">
        <div className="office-screen m-[2px] h-[6px] rounded-[1px] bg-[#5fdda8]" />
      </div>
    </div>
  );
}

function Plant() {
  return (
    <div className="flex flex-col items-center">
      <div className="h-3 w-4 rounded-t-full bg-[#4caf50]" />
      <div className="h-2 w-3 bg-[#b5653a]" />
    </div>
  );
}

export default function PixelOffice({
  counts, lastByTeam,
}: {
  counts: Record<TeamId, number>;
  lastByTeam: Partial<Record<TeamId, OfficeEvent>>;
}) {
  const working = TEAMS.filter((t) => counts[t.id] > 0);
  const resting = TEAMS.filter((t) => counts[t.id] === 0);

  return (
    <div className="overflow-hidden rounded-2xl border-4 border-[#5a4632] bg-[#5a4632] shadow-lg">
      <style>{`
        @keyframes office-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
        @keyframes office-blink { 0%,100% { opacity: 1 } 50% { opacity: .45 } }
        @keyframes office-walk { 0% { transform: translateX(-6px) } 50% { transform: translateX(6px) } 100% { transform: translateX(-6px) } }
        .office-bob { animation: office-bob 1.1s steps(2) infinite }
        .office-walk { animation: office-walk 4s steps(8) infinite }
        .office-screen { animation: office-blink 1.6s steps(2) infinite }
        @media (prefers-reduced-motion: reduce) { .office-bob,.office-walk,.office-screen { animation: none } }
      `}</style>

      <div className="grid grid-cols-2 gap-1">
        {TEAMS.map((t) => {
          const on = counts[t.id] > 0;
          return (
            <div
              key={t.id}
              className="relative flex min-h-[150px] flex-col justify-between p-3"
              style={{
                backgroundColor: t.floor,
                backgroundImage:
                  "linear-gradient(rgba(0,0,0,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.05) 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            >
              <div className="flex items-start justify-between">
                <span className="rounded bg-[#2f3a46] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {t.room} · {t.name}
                </span>
                <Plant />
              </div>
              <div className="flex items-end justify-center gap-2">
                {on ? (
                  <div className="flex flex-col items-center">
                    <div className="office-bob">
                      <Sprite hair={t.hair} shirt={t.shirt} />
                    </div>
                    <Desk />
                  </div>
                ) : (
                  <div className="flex flex-col items-center opacity-40">
                    <div className="h-[44px]" />
                    <Desk />
                  </div>
                )}
              </div>
              <div className="mt-1 min-h-[2.2em] text-[11px] leading-snug text-[#3a3a3a]">
                {on ? (
                  <>
                    <b className="text-[#17916a]">일한 것 {counts[t.id]}건</b> · {lastByTeam[t.id]?.text}
                  </>
                ) : (
                  <span className="text-[#7b7b7b]">오늘은 이 방에서 한 일이 없어요</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="mt-1 flex items-end gap-4 p-3"
        style={{ backgroundColor: "#f3e7cf", backgroundImage: "repeating-linear-gradient(90deg,#efe0c2 0 16px,#f3e7cf 16px 32px)" }}
      >
        <span className="self-start rounded bg-[#8a5a2b] px-1.5 py-0.5 text-[10px] font-bold text-white">휴게실 ☕</span>
        <div className="flex flex-1 items-end justify-center gap-6">
          {resting.length === 0 ? (
            <span className="text-[11px] text-[#8a7a5a]">오늘은 모두 일했어요</span>
          ) : (
            resting.map((t) => (
              <div key={t.id} className="flex flex-col items-center">
                <div className="office-walk">
                  <Sprite hair={t.hair} shirt={t.shirt} size={3} />
                </div>
                <span className="mt-0.5 text-[10px] text-[#6a5a3a]">{t.name}</span>
              </div>
            ))
          )}
        </div>
        <span className="self-end text-[10px] text-[#8a7a5a]">{working.length}/4팀 일함</span>
      </div>
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { fetchOffice, kstDay, type OfficeEvent, type TeamId } from "@/lib/office";
import PixelOffice, { TEAMS } from "./PixelOffice";

/**
 * /admin/office — AI 팀 사무실 (가벼운 판, 2026.11.04)
 * 관리자 로그인 뒤에만 열린다(middleware.ts가 /admin 전체를 막음).
 * 실시간이 아니라, 고른 날(한국 시간)에 남은 기록을 모아 보여 준다.
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "AI 팀 사무실", robots: { index: false, follow: false } };

/* 예약 작업 시간표 — 병준이 언제 어느 방에 가는지. 실제 예약 목록과 맞춰 손으로 적어 둔 것이다.
   바뀌면 여기도 고친다. */
const SCHEDULE: { time: string; team: TeamId; what: string; days?: string }[] = [
  { time: "06:52", team: "content", what: "매일 점검 (마감·링크·문구)" },
  { time: "08:44", team: "biz", what: "총괄 아침 보고" },
  { time: "20:43", team: "content", what: "기관 채우기", days: "평일" },
  { time: "19:50", team: "content", what: "공고 채우기 · 주간 리서치", days: "일요일" },
  { time: "21:47", team: "ops", what: "개발 알림 확인" },
  { time: "23:37", team: "product", what: "전략 → 개발" },
];

function shiftDay(day: string, n: number) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function timeKst(e: OfficeEvent) {
  if (e.dateOnly) return "하루 중";
  return new Date(new Date(e.at).getTime() + 9 * 3600 * 1000).toISOString().slice(11, 16);
}

export default async function OfficePage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { d } = await searchParams;
  const today = kstDay();
  const day = d && /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= today ? d : today;
  const data = await fetchOffice(day);

  const lastByTeam: Partial<Record<TeamId, OfficeEvent>> = {};
  for (const e of data.events) if (!lastByTeam[e.team]) lastByTeam[e.team] = e;
  const teamName = Object.fromEntries(TEAMS.map((t) => [t.id, t.name])) as Record<TeamId, string>;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">AI 팀 사무실</h1>
        <Link href="/admin" className="text-xs text-neutral-400 hover:text-neutral-600">← 관리자 대시보드</Link>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-neutral-200">
        <Link href={`/admin/office?d=${shiftDay(day, -1)}`} className="text-neutral-500 hover:text-neutral-800">← 전날</Link>
        <b>{day}{day === today ? " (오늘)" : ""}</b>
        {day < today ? (
          <Link href={`/admin/office?d=${shiftDay(day, 1)}`} className="text-neutral-500 hover:text-neutral-800">다음날 →</Link>
        ) : (
          <span className="text-neutral-300">다음날 →</span>
        )}
      </div>

      <PixelOffice counts={data.counts} lastByTeam={lastByTeam} />
      <p className="text-[11px] text-neutral-400">
        그날 기록이 남은 팀은 자기 방 책상에, 기록이 없는 팀은 휴게실에 있어요. 실시간이 아니라 남은 기록으로 그린 그림이에요.
      </p>

      <section className="rounded-2xl bg-[#1f2730] p-4 text-[12px] text-[#cfe3d6]">
        <h2 className="mb-2 font-bold text-white">최근 이벤트</h2>
        {data.events.length === 0 ? (
          <p className="text-[#8aa39a]">이날은 남은 기록이 없어요.</p>
        ) : (
          <ul className="space-y-1.5 font-mono">
            {data.events.map((e, i) => (
              <li key={i} className="flex gap-2">
                <span className="w-12 shrink-0 text-[#5fdda8]">{timeKst(e)}</span>
                <span className="w-14 shrink-0 text-[#ffae6b]">{teamName[e.team]}</span>
                <span className="font-sans">{e.text}</span>
              </li>
            ))}
          </ul>
        )}
        {data.sourcesMissing.length > 0 && (
          <p className="mt-3 text-[11px] text-[#ff9c8a]">못 읽은 기록: {data.sourcesMissing.join(", ")}</p>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200">
        <h2 className="mb-2 text-sm font-bold">하루 시간표</h2>
        <ul className="space-y-1 text-[12px] text-neutral-600">
          {[...SCHEDULE].sort((a, b) => (a.time < b.time ? -1 : 1)).map((s) => (
            <li key={s.time + s.what} className="flex gap-2">
              <span className="w-12 font-mono text-neutral-400">{s.time}</span>
              <span className="w-14">{teamName[s.team]}</span>
              <span>{s.what}{s.days ? ` (${s.days})` : ""}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-neutral-400">
          사업팀 일(아침 보고·지원사업)은 DB에 기록이 남지 않아서 사무실에는 늘 휴게실로 보여요.
        </p>
      </section>
    </div>
  );
}

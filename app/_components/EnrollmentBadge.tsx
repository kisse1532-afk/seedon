import { getEnrollmentBadgeLabel, type Program } from "@/lib/data";

type BadgeSource = Pick<Program, "apply_deadline" | "enrollment_status" | "reopen_note">;

export default function EnrollmentBadge({ program }: { program: BadgeSource }) {
  const label = getEnrollmentBadgeLabel(program);
  if (!label) return null;

  // 이번 회차가 끝난 건(다음 모집 안내) 지금 신청 가능한 것과 구분되게 눌러서 표시.
  // 색은 Tailwind 기본 amber/neutral을 쓰고 있었는데 브랜드 밖 색이라 카드마다
  // 다른 서비스에서 가져온 것처럼 보였다. 따뜻한 계열 브랜드 토큰으로 교체.
  const closed = Boolean(program.reopen_note);
  const tone = closed
    ? "bg-cream text-meta border-sage-border"
    : "bg-sos-tile text-sos-num border-sos-line";

  return (
    <span
      className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap ${tone}`}
    >
      {label}
    </span>
  );
}

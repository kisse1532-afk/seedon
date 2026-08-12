import { getEnrollmentBadgeLabel, type Program } from "@/lib/data";

type BadgeSource = Pick<Program, "apply_deadline" | "enrollment_status" | "reopen_note">;

export default function EnrollmentBadge({ program }: { program: BadgeSource }) {
  const label = getEnrollmentBadgeLabel(program);
  if (!label) return null;

  // 이번 회차가 끝난 건(다음 모집 안내) 지금 신청 가능한 것과 구분되게 회색으로.
  const closed = Boolean(program.reopen_note);
  const tone = closed
    ? "bg-neutral-100 text-neutral-500 border-neutral-200"
    : "bg-amber-50 text-amber-700 border-amber-100";

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-lg border whitespace-nowrap ${tone}`}>
      {label}
    </span>
  );
}

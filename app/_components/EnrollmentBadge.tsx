import { getEnrollmentBadgeLabel, type Program } from "@/lib/data";

type BadgeSource = Pick<Program, "apply_deadline" | "enrollment_status" | "reopen_note">;

export default function EnrollmentBadge({ program }: { program: BadgeSource }) {
  const label = getEnrollmentBadgeLabel(program);
  if (!label) return null;

  // 이번 회차가 끝난 건(다음 모집 안내) 지금 신청 가능한 것과 구분되게 눌러서 표시.
  // 색은 Tailwind 기본 amber/neutral을 쓰고 있었는데 브랜드 밖 색이라 카드마다
  // 다른 서비스에서 가져온 것처럼 보였다. 따뜻한 계열 브랜드 토큰으로 교체.
  // 닫힘 쪽 바탕이 cream(#faf6ee)이었는데 열림 쪽 sos-tile(#fff4e9)과 거의 같은
  // 크림톤이라, 배지 배경만 봐서는 둘이 안 갈렸다. 작은 글자색까지 읽어야 구별이
  // 됐고 카드가 9~11개인 칸에서는 훑어보기가 안 됐다. 닫힘을 무채색으로 빼서
  // 주황은 "지금 움직여야 하는" 카드에만 남긴다.
  const closed = Boolean(program.reopen_note);
  const tone = closed
    ? "bg-sage-border/40 text-meta border-sage-border"
    : "bg-sos-tile text-sos-num border-sos-line";

  return (
    <span
      className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap ${tone}`}
    >
      {label}
    </span>
  );
}

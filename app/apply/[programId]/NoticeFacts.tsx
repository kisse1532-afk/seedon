import type { Program } from "@/lib/data";

/**
 * 「맞춤 알림」 카드에만 붙는 칸 — 마감, 누가, 추천, 확인한 날짜.
 *
 * 누가 신청할 수 있는지는 기본으로 접어 둔다(절대규칙 1: 대상 조건은 "신청 전
 * 안내"에서만 펼쳐 보이게).
 */
const day = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${y}년 ${m}월 ${d}일`;
};

export default function NoticeFacts({ program }: { program: Program }) {
  if (!program.target_grades?.length) return null;

  return (
    <div className="space-y-3 rounded-card border border-sage-border bg-white p-5">
      <p className="text-sm text-body">
        <b className="text-ink">마감</b>{" "}
        {program.apply_deadline ? `${day(program.apply_deadline)}까지` : program.enrollment_status}
      </p>
      {program.who_text && (
        <details>
          <summary className="cursor-pointer text-sm font-bold text-ink">신청 전 안내 — 누가 신청할 수 있나요?</summary>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-body">{program.who_text}</p>
        </details>
      )}
      {program.needs_recommendation && (
        <p className="rounded-xl bg-mint px-3.5 py-2.5 text-xs leading-relaxed text-body">
          어른의 추천이 필요해요. 나를 아는 선생님께 &ldquo;이거 신청하고 싶은데 추천해주실 수 있어요?&rdquo;라고
          말해보세요.
        </p>
      )}
      {program.last_verified_at && <p className="text-xs text-meta">확인한 날짜 {day(program.last_verified_at)}</p>}
    </div>
  );
}

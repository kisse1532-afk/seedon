import { getDeadlineStamp, type Program } from "@/lib/data";
import TrackedLink from "@/app/_components/TrackedLink";

/* 홈 목록의 한 줄.
   "신청 기간이 있어요"와 "아무 때나 돼요" 두 목록이 같은 생김새를 써야 해서
   부품으로 뺐다. 예전엔 홈 파일 안에 인라인으로 있었고 목록이 하나뿐이었다. */

// 왼쪽 도장의 색. 마감이 가까운 것만 따뜻한 색으로 튀게 하고,
// 상시는 눈에 덜 띄게 눌러 목록에 리듬을 준다.
const stampTone = {
  soon: "bg-sos-tile border-sos-line text-sos-num",
  normal: "bg-mint border-mint text-primary-deep",
  always: "bg-transparent border-sage-line text-meta",
} as const;

/**
 * 상시 목록에서 도장에 찍을 문구.
 * "아무 때나 돼요" 섹션 안에서 도장까지 "상시"라고 하면 같은 말이 두 번이라
 * 자리만 먹는다. 대신 "그래서 내가 뭘 하면 되는지"를 넣는다.
 */
const ALWAYS_ACTION: Record<string, string> = {
  "상시 신청": "바로\n신청",
  "언제든 이용": "바로\n이용",
  "기관 통해 신청": "기관\n통해",
};

export default function ProgramRow({
  program,
  variant = "deadline",
}: {
  program: Program;
  /** "always"면 D-day 대신 "무엇을 하면 되는지"를 도장에 찍는다. */
  variant?: "deadline" | "always";
}) {
  const stamp = getDeadlineStamp(program);
  const action = variant === "always" ? ALWAYS_ACTION[program.enrollment_status ?? ""] : undefined;

  return (
    <TrackedLink
      href={`/apply/${program.id}`}
      event="category_card_click"
      programId={program.id}
      category={program.category}
      className="group grid grid-cols-[58px_1fr] items-center gap-3.5 border-b border-sage-line px-3.5 py-3.5 transition last:border-b-0 hover:bg-mint/40 sm:grid-cols-[74px_1fr_auto] sm:gap-4 sm:px-5 sm:py-4"
    >
      {/* 왼쪽 도장 — 마감이 가까울수록 눈에 띄게 */}
      {action ? (
        <span className="flex items-center justify-center rounded-xl border border-sage-line py-2.5 text-center text-[11px] font-bold leading-tight whitespace-pre-line text-ink-60 sm:text-[12px]">
          {action}
        </span>
      ) : (
        <span
          className={`flex flex-col items-center justify-center rounded-xl border py-1.5 ${stampTone[stamp.tone]}`}
        >
          <span className="text-[13px] font-extrabold tabular-nums leading-tight sm:text-[14px]">
            {stamp.label}
          </span>
          <span className="mt-0.5 text-[9px] leading-none opacity-75 sm:text-[10px]">
            {stamp.caption}
          </span>
        </span>
      )}

      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-1.5 text-[14px] font-bold leading-snug text-ink sm:text-[15.5px]">
          {program.title}
          {program.org_type && (
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                program.org_type === "public"
                  ? "bg-mint text-primary-deep"
                  : "bg-brand-border/60 text-ink-60"
              }`}
            >
              {program.org_type === "public" ? "공공" : "비영리"}
            </span>
          )}
        </span>
        <span className="mt-1 block truncate text-[11.5px] text-meta sm:text-xs">
          {program.org}
        </span>
        {/* 넓은 화면에서는 한 줄 요약까지 — 오른쪽 버튼을 걷어낸 자리가
            비어 보이지 않게 하고, 제목만으로는 뭔지 모를 때 판단을 돕는다. */}
        <span className="mt-1.5 hidden truncate text-xs leading-relaxed text-ink-60 sm:block">
          {program.description}
        </span>
      </span>

      {/* 행 전체가 링크라 여기에 버튼을 또 두면 같은 버튼이 여러 줄 내내
          반복돼 목록이 무거워진다. 화살표만 두고, 마우스를 올렸을 때만
          브랜드색으로 살아나게 한다. */}
      <span className="hidden shrink-0 items-center justify-center text-sage-border transition group-hover:translate-x-0.5 group-hover:text-primary-deep sm:flex">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-[18px] w-[18px]"
          aria-hidden
        >
          <path d="m9 5 7 7-7 7" />
        </svg>
      </span>
    </TrackedLink>
  );
}

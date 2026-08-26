import type { ApplyStep } from "@/lib/data";

/* 신청 순서.
   원래는 네 단계를 가로로 늘어놓고 넘치면 옆으로 밀어 보게 했는데, 폰 화면에서는
   3·4단계가 아예 화면 밖으로 잘려 나가 "무엇부터 하면 되는지"가 안 보였다.
   순서는 끝까지 다 보여야 의미가 있으므로 세로 타임라인으로 바꾼다.

   단계 아이콘은 DB(apply_steps.icon)에 이모지로 들어 있는데, 기기마다 그림이
   달라 통일이 안 되고 무엇보다 "몇 번째 단계인지"를 알려주지 못한다.
   순서를 보여주는 자리이므로 번호로 대체했다. */

export default function ApplySteps({ steps }: { steps: ApplyStep[] }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="rounded-card border border-sage-border bg-white p-5">
      <h2 className="mb-4 text-sm font-bold text-ink">이런 순서로 진행돼요</h2>
      <ol className="space-y-0">
        {steps.map((step, i) => (
          <li key={i} className="relative flex gap-3.5 pb-5 last:pb-0">
            {/* 번호끼리 잇는 세로선. 마지막 단계에는 긋지 않는다. */}
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className="absolute top-8 bottom-1 left-[13.5px] w-px bg-sage-line"
              />
            )}
            {/* 첫 단계만 채운 원 — "지금 할 것"과 "나중 참고용"을 눈으로 가른다.
                단계가 4개 이상으로 늘어도 전부 같은 세기로 소리치지 않게 (토스 벤치마킹, 2026.08.26) */}
            <span
              className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12.5px] font-extrabold ${
                i === 0 ? "bg-mint text-primary-deep" : "border border-mint bg-white text-ink-60"
              }`}
            >
              {i + 1}
            </span>
            <span className="min-w-0 pt-0.5">
              <span className="block text-[13.5px] font-bold leading-snug text-ink">
                {step.title}
              </span>
              {step.subtitle && (
                <span className="mt-0.5 block text-xs leading-relaxed text-ink-60">
                  {step.subtitle}
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

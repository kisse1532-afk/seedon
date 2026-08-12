import type { ApplyStep } from "@/lib/data";

export default function ApplySteps({ steps }: { steps: ApplyStep[] }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <h2 className="font-medium text-sm mb-4">📋 이런 순서로 진행돼요</h2>
      <div className="flex items-stretch gap-1 overflow-x-auto pb-1">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center shrink-0">
            <div className="w-[104px] flex flex-col items-center text-center gap-1.5">
              <div className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center text-lg">
                {step.icon}
              </div>
              <div className="text-xs font-medium leading-tight">{step.title}</div>
              <div className="text-[10px] text-neutral-400 leading-tight">{step.subtitle}</div>
            </div>
            {i < steps.length - 1 && (
              <div className="text-neutral-300 px-1 -mt-6">→</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

/**
 * "전에 쓴 걸로 채워놨어요 — 지우기" 한 줄.
 *
 * 자동으로 채워주는 건 편하지만, **말없이** 채워두면 청소년 입장에서는
 * "얘가 내 정보를 갖고 있네"가 된다. 그래서 채웠다는 사실과 지우는 방법을
 * 항상 같이 보여준다. 미성년자 정보라 지우는 길이 화면에 있어야 한다.
 *
 * `savedAt`을 같이 보여주는 이유 (2026.08.17 CS팀 지적):
 * 저장 시각을 갖고 있으면서 화면에 안 보여줬다. 그러면 청소년이
 * "이 번호 언제 적은 거지, 아직 맞나"를 판단할 근거가 없다. 번호가 바뀐 걸
 * 깜빡한 채로 제출하면 우리가 연락했을 때 엉뚱한 사람에게 간다.
 *
 * `tone` (2026.08.17 디자인팀 지적):
 * 도움 챗봇은 화면이 온통 초록인 것과 구분하려고 일부러 따뜻한 색(sos-*)으로
 * 만든 블록이다. 거기에 초록 상자(mint)를 그대로 끼워 넣으면 그 의도가 깨진다.
 */
type Props = {
  onClear: () => void;
  /** 저장 시각(ISO). 없으면 날짜를 안 보여준다. */
  savedAt?: string;
  /** "mint" = 흰 카드 위, "warm" = 도움 챗봇 블록 안 */
  tone?: "mint" | "warm";
};

function formatDay(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function SavedInfoNote({ onClear, savedAt, tone = "mint" }: Props) {
  const day = formatDay(savedAt);
  const warm = tone === "warm";

  const box = warm
    ? "rounded-control border border-sos-line bg-white px-3.5 py-2.5"
    : "rounded-control bg-mint px-3.5 py-2.5";
  const text = warm ? "text-sos-ink" : "text-primary-deep";
  const link = warm ? "text-sos-num" : "text-primary-deep";

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-1 ${box}`}
    >
      <p className={`text-[11px] leading-relaxed ${text}`}>
        {day ? `${day}에 쓴 걸로 채워놨어요.` : "전에 쓴 걸로 채워놨어요."} 다르면 고쳐도 돼요.
      </p>
      <button
        type="button"
        onClick={onClear}
        className={`text-[11px] font-bold underline underline-offset-2 hover:brightness-110 ${link}`}
      >
        저장된 내 정보 지우기
      </button>
    </div>
  );
}

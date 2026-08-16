"use client";

/**
 * "전에 쓴 걸로 채워놨어요 — 지우기" 한 줄.
 *
 * 자동으로 채워주는 건 편하지만, **말없이** 채워두면 청소년 입장에서는
 * "얘가 내 정보를 갖고 있네"가 된다. 그래서 채웠다는 사실과 지우는 방법을
 * 항상 같이 보여준다. 미성년자 정보라 지우는 길이 화면에 있어야 한다.
 */
export default function SavedInfoNote({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-control bg-mint px-3.5 py-2.5">
      <p className="text-[11px] leading-relaxed text-primary-deep">
        전에 쓴 걸로 채워놨어요. 다르면 고쳐도 돼요.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="text-[11px] font-bold text-primary-deep underline underline-offset-2 hover:brightness-110"
      >
        저장된 내 정보 지우기
      </button>
    </div>
  );
}

import { findRecommendations } from "./actions";

export default function RecommendPage() {
  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-lg font-bold">AI 맞춤추천</h1>
      <p className="text-sm text-neutral-500">
        지금 어떤 상황인지 편하게 적어주세요. 맞는 지원을 찾아드릴게요.
      </p>
      <form action={findRecommendations} className="space-y-3">
        <textarea
          name="situation"
          rows={5}
          required
          placeholder="예: 학원비가 부담돼서 성적이 자꾸 떨어져요..."
          className="w-full rounded-2xl border border-neutral-300 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="submit"
          className="w-full rounded-full bg-emerald-600 text-white text-sm font-medium py-3 hover:bg-emerald-700"
        >
          찾아보기
        </button>
      </form>
      <p className="text-[11px] text-neutral-400 text-center">
        키워드를 보고 관련 카테고리를 찾아드려요. 딱 맞지 않을 수 있으니, 카테고리 목록도 함께 둘러보세요.
      </p>
    </div>
  );
}

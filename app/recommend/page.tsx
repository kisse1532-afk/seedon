import { findRecommendations } from "./actions";
import RequireLogin from "@/app/_components/RequireLogin";

export default function RecommendPage() {
  return (
    <RequireLogin reason="적어준 상황에 맞는 걸 찾아드리려면 로그인이 필요해요. 저장해둔 것까지 같이 봐서 더 잘 골라줄 수 있어요.">
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-xl font-extrabold tracking-tight text-ink">맞춤 추천</h1>
      <p className="text-sm leading-relaxed text-ink-60">
        지금 어떤 상황인지 편하게 적어주세요. 맞춤법도 안 맞아도 되고, 짧게 적어도 돼요.
      </p>
      <form action={findRecommendations} className="space-y-3">
        <textarea
          name="situation"
          rows={5}
          required
          placeholder="예: 학원비가 부담돼서 성적이 자꾸 떨어져요"
          className="w-full rounded-control border border-sage-border p-4 text-sm text-body transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-meta"
        />
        <button
          type="submit"
          className="w-full rounded-full bg-primary-deep py-3 text-sm font-bold text-white transition hover:brightness-110"
        >
          찾아보기
        </button>
      </form>
      <p className="text-center text-[11px] leading-relaxed text-meta">
        적어주신 말에 걸리는 프로그램을 찾아 순서대로 보여드려요. 못 알아들어도
        빈손으로 돌려보내지 않고, 지금 신청할 수 있는 것부터 보여드릴게요.
      </p>
    </div>
    </RequireLogin>
  );
}

import Link from "next/link";
import { fetchCommunityPosts, fetchProgramsByIds } from "@/lib/queries";
import { loadRecentReviews } from "@/lib/reviews";

/* 후기가 승인되면 바로 보여야 한다. 이 화면은 원래 빌드 시점에 한 번 만들어져
   고정됐는데, 그러면 승인해도 다음 배포 전까지 안 올라온다. 승인해놓고 안 보이면
   운영자는 고장난 줄 알고, 글을 남긴 청소년은 자기 글이 잘린 줄 안다. */
export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return iso.slice(0, 10);
}

export default async function CommunityPage() {
  const [posts, reviews] = await Promise.all([fetchCommunityPosts(), loadRecentReviews(8)]);

  // 후기가 어느 프로그램 것인지 이름으로 보여준다. id만 보여주면 아무 의미가 없다.
  const programs = await fetchProgramsByIds([...new Set(reviews.map((r) => r.program_id))]);
  const titleById = Object.fromEntries(programs.map((p) => [p.id, p.title]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">커뮤니티</h1>
        {/* 예전 소개문은 "다른 청소년들이 도움받은 이야기"라고 했는데 청소년이
            글을 쓸 방법이 아예 없었다. 지키지 못할 약속이라 실제로 있는 것만 적는다. */}
        <p className="text-sm text-ink-60 mt-1">
          씨드온이 정리한 정보와, 먼저 해본 친구들이 남긴 이야기예요.
        </p>
      </div>

      {reviews.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-ink-60">먼저 해본 친구들 이야기</h2>
          <div className="grid gap-3">
            {reviews.map((r) => (
              <Link
                key={r.id}
                href={`/apply/${r.program_id}`}
                className="rounded-2xl border border-sage-border bg-white p-5 transition hover:border-primary hover:shadow-sm"
              >
                <p className="text-sm leading-relaxed text-body">{r.body}</p>
                <p className="mt-2 text-[11px] text-meta">
                  {r.nickname || "이름 없이"} · {titleById[r.program_id] ?? "프로그램"} ·{" "}
                  {formatDate(r.created_at)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <h2 className="text-sm font-semibold text-ink-60">씨드온이 정리한 정보</h2>
      <div className="grid gap-3">
        {posts.length === 0 && (
          <p className="text-sm text-meta py-12 text-center">아직 등록된 글이 없어요. 곧 채워질 예정이에요.</p>
        )}
        {posts.map((p) => (
          <Link
            key={p.id}
            href={`/community/${p.id}`}
            className="rounded-2xl border border-sage-border bg-white p-5 flex flex-col gap-2 hover:border-primary hover:shadow-sm transition"
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-mint text-primary-deep border border-mint">
                {p.category}
              </span>
              <span className="text-[11px] text-meta">{formatDate(p.created_at)}</span>
            </div>
            <h2 className="font-semibold text-sm">{p.title}</h2>
            <p className="text-xs text-ink-60 line-clamp-2">{p.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

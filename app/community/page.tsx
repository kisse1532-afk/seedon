import Link from "next/link";
import { fetchCommunityPosts } from "@/lib/queries";

function formatDate(iso: string) {
  return iso.slice(0, 10);
}

export default async function CommunityPage() {
  const posts = await fetchCommunityPosts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">커뮤니티</h1>
        <p className="text-sm text-ink-60 mt-1">
          씨드온 운영팀이 정리한 정보와, 다른 청소년들이 도움받은 이야기예요.
        </p>
      </div>

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

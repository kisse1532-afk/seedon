import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchCommunityPost } from "@/lib/queries";
import RequireLogin from "@/app/_components/RequireLogin";

export default async function CommunityPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await fetchCommunityPost(id);
  if (!post || !post.published) return notFound();

  /* 목록(/community)만 로그인으로 막고 이 상세 화면은 안 막혀 있었다.
     주소를 알면 로그인 없이 그대로 읽혔다 — 로드 결정("커뮤니티는 로그인한
     사람만 쓰게 해서 누가 무엇을 쓰는지 쌓이게 한다")이 여기서만 새고 있었다. */
  return (
    <RequireLogin reason="이 글을 보려면 로그인이 필요해요. 다른 친구들이 어떻게 했는지 같이 볼 수 있어요.">
    <div className="max-w-lg mx-auto space-y-5">
      <Link href="/community" className="text-sm text-meta hover:text-body">
        ← 커뮤니티로
      </Link>

      <div className="space-y-2">
        <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-mint text-primary-deep border border-mint">
          {post.category}
        </span>
        <h1 className="text-lg font-bold leading-snug">{post.title}</h1>
        <p className="text-[11px] text-meta">{post.created_at.slice(0, 10)} · 씨드온 운영팀</p>
      </div>

      <div className="rounded-2xl border border-sage-border bg-white p-5 text-sm text-body leading-relaxed whitespace-pre-wrap">
        {post.body}
      </div>
    </div>
    </RequireLogin>
  );
}

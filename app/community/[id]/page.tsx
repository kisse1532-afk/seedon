import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchCommunityPost } from "@/lib/queries";

export default async function CommunityPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await fetchCommunityPost(id);
  if (!post || !post.published) return notFound();

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <Link href="/community" className="text-sm text-neutral-400 hover:text-neutral-600">
        ← 커뮤니티로
      </Link>

      <div className="space-y-2">
        <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-gradient-to-r from-sky-50 to-emerald-50 text-emerald-700 border border-emerald-100">
          {post.category}
        </span>
        <h1 className="text-lg font-bold leading-snug">{post.title}</h1>
        <p className="text-[11px] text-neutral-400">{post.created_at.slice(0, 10)} · 씨드온 운영팀</p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
        {post.body}
      </div>
    </div>
  );
}

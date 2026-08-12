import Link from "next/link";
import { notFound } from "next/navigation";
import { communityCategories } from "@/lib/data";
import { fetchCommunityPost } from "@/lib/queries";
import { updateCommunityPost } from "../../actions";

export default async function EditCommunityPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await fetchCommunityPost(id);
  if (!post) return notFound();

  const update = updateCommunityPost.bind(null, id);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link href="/admin/community" className="text-sm text-neutral-400 hover:text-neutral-600">
        ← 커뮤니티 관리
      </Link>
      <h1 className="text-lg font-bold">글 수정</h1>

      <form action={update} className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">제목</label>
          <input name="title" defaultValue={post.title} required className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">카테고리</label>
          <select name="category" defaultValue={post.category} className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm">
            {communityCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">내용</label>
          <textarea name="body" defaultValue={post.body} required rows={8} className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm" />
        </div>
        <label className="flex items-center gap-2 text-xs text-neutral-500">
          <input type="checkbox" name="published" defaultChecked={post.published} className="rounded" />
          게시 중
        </label>
        <button type="submit" className="w-full rounded-full bg-emerald-600 text-white text-sm font-medium py-3 hover:bg-emerald-700">
          저장하기
        </button>
      </form>
    </div>
  );
}

import Link from "next/link";
import { fetchAllCommunityPosts } from "@/lib/queries";
import { deleteCommunityPost, togglePublishCommunityPost } from "./actions";

export default async function AdminCommunityPage() {
  const posts = await fetchAllCommunityPosts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-sm text-neutral-400 hover:text-neutral-600">
            ← 관리자 대시보드
          </Link>
          <h1 className="text-lg font-bold mt-1">커뮤니티 관리</h1>
          <p className="text-xs text-neutral-400 mt-1">
            운영팀이 직접 작성·검수한 글만 노출돼요. 유저 게시/댓글/DM은 없습니다.
          </p>
        </div>
        <Link href="/admin/community/new" className="text-sm bg-emerald-600 text-white rounded-full px-4 py-1.5 hover:bg-emerald-700">
          + 새 글
        </Link>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
        {posts.length === 0 && <p className="text-sm text-neutral-400 p-5 text-center">등록된 글이 없어요.</p>}
        {posts.map((p) => (
          <div key={p.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm truncate">{p.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.published ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>
                  {p.published ? "게시중" : "비공개"}
                </span>
                <span className="text-[10px] text-neutral-400">{p.category}</span>
              </div>
              <p className="text-xs text-neutral-400 truncate">{p.created_at.slice(0, 10)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <form action={togglePublishCommunityPost}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="nextPublished" value={(!p.published).toString()} />
                <button className="text-xs text-sky-600 hover:underline">{p.published ? "비공개로" : "게시하기"}</button>
              </form>
              <Link href={`/admin/community/${p.id}/edit`} className="text-xs text-neutral-500 hover:text-emerald-600">
                수정
              </Link>
              <form action={deleteCommunityPost}>
                <input type="hidden" name="id" value={p.id} />
                <button className="text-xs text-neutral-400 hover:text-red-500">삭제</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

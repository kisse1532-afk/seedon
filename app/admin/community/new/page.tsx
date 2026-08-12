import Link from "next/link";
import { communityCategories } from "@/lib/data";
import { createCommunityPost } from "../actions";

export default function NewCommunityPostPage() {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link href="/admin/community" className="text-sm text-neutral-400 hover:text-neutral-600">
        ← 커뮤니티 관리
      </Link>
      <h1 className="text-lg font-bold">새 글 작성</h1>

      <form action={createCommunityPost} className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">제목</label>
          <input name="title" required className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">카테고리</label>
          <select name="category" defaultValue={communityCategories[0]} className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm">
            {communityCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">내용</label>
          <textarea name="body" required rows={8} className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm" />
        </div>
        <label className="flex items-center gap-2 text-xs text-neutral-500">
          <input type="checkbox" name="published" defaultChecked className="rounded" />
          바로 게시하기
        </label>
        <button type="submit" className="w-full rounded-full bg-emerald-600 text-white text-sm font-medium py-3 hover:bg-emerald-700">
          등록하기
        </button>
      </form>
    </div>
  );
}

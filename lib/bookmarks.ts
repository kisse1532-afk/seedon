import { supabase } from "@/lib/supabase";

/**
 * 관심 프로그램(북마크).
 *
 * 로그인 안 한 사람은 브라우저에만 저장한다. 청소년이 처음 들어와서 마음에 드는
 * 걸 저장하려는데 로그인부터 요구하면 거기서 나가버린다 — 일단 저장되게 두고,
 * 나중에 로그인하면 그때 계정으로 옮긴다.
 *
 * 로그인한 사람은 계정에 저장한다. 브라우저에만 두면 폰을 바꾸거나 브라우저를
 * 지웠을 때 사라지고, 다른 기기에서는 보이지도 않는다.
 */

const STORAGE_KEY = "seedon_bookmarks";
const CHANGE_EVENT = "seedon-bookmarks-change";

function readLocal(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** 화면이 즉시 그릴 수 있도록 남겨둔 동기 버전. 로그인 여부와 무관하게 브라우저 값만 본다. */
export function getBookmarks(): string[] {
  return readLocal();
}

export function isBookmarked(id: string): boolean {
  return readLocal().includes(id);
}

export function onBookmarksChange(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  return () => window.removeEventListener(CHANGE_EVENT, callback);
}

/** 로그인했으면 계정에서, 아니면 브라우저에서 읽는다. */
export async function loadBookmarks(): Promise<string[]> {
  const userId = await currentUserId();
  if (!userId) return readLocal();

  const { data, error } = await supabase
    .from("bookmarks")
    .select("program_id")
    .order("created_at", { ascending: false });

  // 조회가 실패하면 화면을 비우기보다 브라우저에 있던 걸 보여준다.
  if (error || !data) return readLocal();

  const ids = data.map((r) => (r as { program_id: string }).program_id);
  writeLocal(ids); // 다음 화면이 동기 함수로도 바로 그릴 수 있게 맞춰둔다
  return ids;
}

/** 켜고 끄기. 켜졌으면 true. */
export async function toggleBookmark(id: string): Promise<boolean> {
  const userId = await currentUserId();
  const local = readLocal();
  const willAdd = !local.includes(id);

  // 로그인 여부와 상관없이 브라우저 값을 먼저 바꿔 화면이 바로 반응하게 한다.
  writeLocal(willAdd ? [...local, id] : local.filter((x) => x !== id));
  notify();

  if (userId) {
    if (willAdd) {
      await supabase.from("bookmarks").insert({ user_id: userId, program_id: id });
    } else {
      await supabase.from("bookmarks").delete().eq("user_id", userId).eq("program_id", id);
    }
  }
  return willAdd;
}

/**
 * 로그인 직후, 로그인 전에 저장해둔 것을 계정으로 옮긴다.
 *
 * 이게 없으면 "로그인했더니 저장해둔 게 사라졌다"가 된다. 청소년 입장에서는
 * 로그인 때문에 잃어버린 것이라 다시 안 쓰게 된다.
 */
export async function mergeLocalBookmarksIntoAccount(): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;

  const local = readLocal();
  if (local.length > 0) {
    await supabase
      .from("bookmarks")
      .upsert(
        local.map((program_id) => ({ user_id: userId, program_id })),
        { onConflict: "user_id,program_id", ignoreDuplicates: true }
      );
  }
  await loadBookmarks();
  notify();
}

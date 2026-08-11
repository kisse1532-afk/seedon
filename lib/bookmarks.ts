const STORAGE_KEY = "seedon_bookmarks";
const CHANGE_EVENT = "seedon-bookmarks-change";

export function getBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function isBookmarked(id: string): boolean {
  return getBookmarks().includes(id);
}

export function toggleBookmark(id: string): boolean {
  const current = getBookmarks();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return next.includes(id);
}

export function onBookmarksChange(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  return () => window.removeEventListener(CHANGE_EVENT, callback);
}

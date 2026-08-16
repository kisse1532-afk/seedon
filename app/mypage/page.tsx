"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { loadBookmarks, onBookmarksChange, clearLocalBookmarks } from "@/lib/bookmarks";
import { loadMyApplications, type MyApplication } from "@/lib/applications";
import { fetchProgramsByIds } from "@/lib/queries";
import type { Program } from "@/lib/data";
import MyInfo from "./MyInfo";

/** 관심 등록 처리 상태를 청소년이 읽을 수 있는 말로. 행정용어를 그대로 쓰지 않는다. */
const STATUS_LABEL: Record<string, string> = {
  pending: "확인 중이에요",
  contacted: "씨드온이 연락했어요",
  completed: "마무리됐어요",
};

export default function MyPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [applications, setApplications] = useState<MyApplication[]>([]);
  const [programs, setPrograms] = useState<Record<string, Program>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      const ids = await loadBookmarks();
      const apps = await loadMyApplications();

      // 등록한 프로그램의 이름을 보여주려면 카드 정보가 필요하다. id만 보여주면
      // 자기가 뭘 등록했는지 알 수 없다.
      const found = apps.length > 0 ? await fetchProgramsByIds(apps.map((a) => a.program_id)) : [];

      if (!alive) return;
      setEmail(data.user?.email ?? null);
      setBookmarkCount(ids.length);
      setApplications(apps);
      setPrograms(Object.fromEntries(found.map((p) => [p.id, p])));
      setLoaded(true);
    }
    load();

    // 다른 화면에서 북마크를 켜고 끄면 여기 숫자도 같이 바뀌어야 한다.
    const off = onBookmarksChange(() => {
      loadBookmarks().then((ids) => alive && setBookmarkCount(ids.length));
    });
    return () => {
      alive = false;
      off();
    };
  }, []);

  async function handleLogout() {
    // 세션이 끊기면 계정 목록을 다시 못 읽으므로 브라우저에 남은 복사본을 먼저 비운다.
    // 안 그러면 로그아웃했는데도 저장해둔 게 계속 보인다.
    clearLocalBookmarks();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const loggedIn = Boolean(email);
  /** 이메일 앞부분만 보여준다. 화면에 주소를 통째로 띄울 이유가 없다. */
  const nickname = email ? email.split("@")[0] : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-cream flex items-center justify-center text-2xl">
          {loggedIn ? "🌱" : "🙂"}
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate">{loggedIn ? `${nickname}님` : "게스트님"}</p>
          <p className="text-xs text-meta">
            {loggedIn ? "저장한 프로그램이 계정에 보관돼요" : "로그인하면 저장한 게 폰을 바꿔도 남아요"}
          </p>
        </div>
      </div>

      {!loggedIn && loaded && (
        <Link
          href="/login"
          className="block rounded-2xl bg-primary-deep px-5 py-4 text-center text-sm font-bold text-white hover:brightness-110"
        >
          로그인하고 시작하기
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 text-center">
        <Link href="/bookmarks" className="rounded-2xl border border-sage-border bg-white p-4 hover:border-primary/40">
          <div className="text-lg font-bold">{loaded ? bookmarkCount : "–"}</div>
          <div className="text-xs text-meta mt-1">저장한 프로그램</div>
        </Link>
        <Link href="/search" className="rounded-2xl border border-sage-border bg-white p-4 hover:border-primary/40">
          <div className="text-lg font-bold">더보기</div>
          <div className="text-xs text-meta mt-1">전체 프로그램</div>
        </Link>
      </div>

      {/* 관심 등록 내역. 로그인한 사람에게만 보인다 — 로그인 전 등록분은 계정에
          붙어 있지 않아서 여기 나올 수가 없다. 없는 걸 있는 것처럼 보이게 하지 않는다. */}
      {loggedIn && loaded && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-ink-60">관심 등록한 프로그램</h2>
          {applications.length === 0 ? (
            <p className="rounded-2xl border border-sage-border bg-white p-5 text-sm leading-relaxed text-meta">
              아직 없어요. 마음에 드는 프로그램에서 &apos;관심 등록하기&apos;를 누르면
              여기에 모여요.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100 rounded-2xl border border-sage-border bg-white">
              {applications.map((a) => {
                const program = programs[a.program_id];
                return (
                  <li key={a.id} className="p-4">
                    <Link href={`/apply/${a.program_id}`} className="block group">
                      <p className="text-sm font-semibold text-ink group-hover:text-primary-deep">
                        {/* 카드가 내려갔거나 지워졌을 수도 있다. 그때 화면이 비어
                            보이지 않게 최소한 뭔가는 보여준다. */}
                        {program?.title ?? "지금은 볼 수 없는 프로그램이에요"}
                      </p>
                      {program?.org && <p className="mt-0.5 text-xs text-meta">{program.org}</p>}
                      <p className="mt-1.5 text-xs text-primary-deep">
                        {STATUS_LABEL[a.status] ?? "확인 중이에요"}
                        <span className="text-meta"> · {a.created_at.slice(0, 10)}</span>
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {loggedIn && <MyInfo />}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink-60">계정</h2>
        <div className="rounded-2xl border border-sage-border bg-white divide-y divide-neutral-100 text-sm">
          {loggedIn && (
            <div className="p-4 flex items-center justify-between">
              <span className="text-meta">로그인한 계정</span>
              <span className="text-body truncate max-w-[60%]">{email}</span>
            </div>
          )}
          <Link href="/report" className="p-4 flex items-center justify-between text-body hover:text-primary-deep">
            <span>잘못된 정보 제보하기</span>
            <span className="text-sage-border">›</span>
          </Link>
          <Link href="/terms" className="p-4 flex items-center justify-between text-body hover:text-primary-deep">
            <span>이용약관</span>
            <span className="text-sage-border">›</span>
          </Link>
          <Link href="/privacy" className="p-4 flex items-center justify-between text-body hover:text-primary-deep">
            <span>개인정보 처리방침</span>
            <span className="text-sage-border">›</span>
          </Link>
          {loggedIn ? (
            <button
              onClick={handleLogout}
              className="w-full p-4 flex items-center justify-between text-body hover:text-primary-deep"
            >
              <span>로그아웃</span>
              <span className="text-sage-border">›</span>
            </button>
          ) : (
            <Link href="/login" className="p-4 flex items-center justify-between text-body hover:text-primary-deep">
              <span>로그인</span>
              <span className="text-sage-border">›</span>
            </Link>
          )}
        </div>
      </section>

      <p className="text-[11px] leading-relaxed text-meta text-center pt-2">
        맞춤 추천은 준비 중이에요.
      </p>
    </div>
  );
}

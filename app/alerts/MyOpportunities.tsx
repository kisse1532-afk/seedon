"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Program } from "@/lib/data";
import { kstToday } from "@/lib/alerts/options";
import { dDay, forStudent } from "@/lib/alerts/match";
import { loadSettings } from "@/lib/alerts/settings";
import StudentGate from "./StudentGate";

export default function MyOpportunities() {
  return <StudentGate>{(student) => <List userId={student.userId} />}</StudentGate>;
}

type View = { state: "loading" | "setup" | "error" } | { state: "list"; cards: Program[] };

function List({ userId }: { userId: string }) {
  const [view, setView] = useState<View>({ state: "loading" });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const settings = await loadSettings(userId);
        if (!settings?.grade) return alive && setView({ state: "setup" });
        const { data, error } = await supabase
          .from("programs")
          .select("*")
          .eq("status", "published")
          .contains("target_grades", [settings.grade]);
        if (error) throw new Error(error.message);
        if (alive) setView({ state: "list", cards: forStudent(data as Program[], settings, kstToday()) });
      } catch {
        if (alive) setView({ state: "error" });
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  const today = kstToday();

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold tracking-tight text-ink">나에게 맞는 기회</h1>
        <Link href="/alerts/settings" className="text-xs font-semibold text-primary-deep hover:underline">
          맞춤 설정
        </Link>
      </div>

      {view.state === "loading" && <p className="py-10 text-center text-sm text-ink-60">찾고 있어요…</p>}

      {view.state === "error" && (
        <Empty text="지금은 불러올 수 없어요. 아직 준비 중이거나 인터넷이 끊겼을 수 있어요." href="/search" action="전체 프로그램 보기" />
      )}

      {view.state === "setup" && (
        <Empty text="학년을 알려주면 맞는 기회를 골라 보여드릴게요." href="/alerts/settings" action="맞춤 설정하기" />
      )}

      {view.state === "list" && view.cards.length === 0 && (
        <Empty
          text="지금은 설정에 딱 맞는 기회가 없어요. 관심 분야를 늘리면 더 보일 수 있어요."
          href="/search"
          action="전체 프로그램 보기"
        />
      )}

      {view.state === "list" &&
        view.cards.map((p) => {
          const left = dDay(p.apply_deadline, today);
          return (
            <Link
              key={p.id}
              href={`/apply/${p.id}`}
              className="block rounded-card border border-sage-border bg-white p-4 transition hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-[15px] font-bold text-ink">{p.title}</h2>
                <span className="shrink-0 rounded-md bg-mint px-2 py-0.5 text-xs font-bold text-primary-deep">
                  {left ?? p.enrollment_status ?? "안내"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-meta">{p.org}</p>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-body">{p.description}</p>
            </Link>
          );
        })}
    </div>
  );
}

function Empty({ text, href, action }: { text: string; href: string; action: string }) {
  return (
    <div className="space-y-4 rounded-card border border-sage-border bg-white p-6 text-center">
      <p className="text-sm leading-relaxed text-body">{text}</p>
      <Link href={href} className="inline-block rounded-full bg-primary-deep px-5 py-2.5 text-xs font-bold text-white">
        {action}
      </Link>
    </div>
  );
}

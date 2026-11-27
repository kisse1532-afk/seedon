"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { dDay } from "@/lib/alerts/match";
import { kstToday } from "@/lib/alerts/options";
import { loadInbox, markRead, type InboxItem } from "@/lib/alerts/inbox";
import { NOTIFICATION_TITLE, notificationBody } from "@/lib/alerts/notify-text";
import StudentGate from "../StudentGate";

export default function Inbox() {
  return <StudentGate>{() => <List />}</StudentGate>;
}

function List() {
  const [items, setItems] = useState<InboxItem[] | "error" | null>(null);

  useEffect(() => {
    let alive = true;
    loadInbox()
      .then((list) => alive && setItems(list))
      .catch(() => alive && setItems("error"));
    return () => {
      alive = false;
    };
  }, []);

  const today = kstToday();
  const list = Array.isArray(items) ? items : [];
  const unread = list.filter((item) => !item.read).length;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold tracking-tight text-ink">
          알림함
          {unread > 0 && <span className="ml-2 text-xs font-bold text-primary-deep">안 읽음 {unread}개</span>}
        </h1>
        <Link href="/alerts" className="text-xs font-semibold text-primary-deep hover:underline">
          나에게 맞는 기회
        </Link>
      </div>

      {items === null && <p className="py-10 text-center text-sm text-ink-60">불러오고 있어요…</p>}

      {(items === "error" || (Array.isArray(items) && items.length === 0)) && (
        <p className="rounded-card border border-sage-border bg-white p-6 text-center text-sm leading-relaxed text-body">
          {items === "error"
            ? "지금은 불러올 수 없어요. 아직 준비 중이거나 인터넷이 끊겼을 수 있어요."
            : "아직 알림이 없어요. 맞춤 설정을 해두면 새 기회가 올라올 때 여기에 알려드려요."}
        </p>
      )}

      {list.map((item) => (
        <Link
          key={item.id}
          href={`/apply/${item.programId}`}
          onClick={() => {
            if (!item.read) void markRead(item.id);
          }}
          className={`block rounded-card border p-4 transition hover:border-primary/40 ${
            item.read ? "border-sage-border bg-white" : "border-primary/40 bg-mint"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-bold text-primary-deep">
              {NOTIFICATION_TITLE}
              {!item.read && <span className="ml-1.5 text-[10px]">● 안 읽음</span>}
            </p>
            <span className="shrink-0 text-xs text-meta">
              {item.deadline && item.deadline < today ? "마감됨" : dDay(item.deadline, today)}
            </span>
          </div>
          <p className="mt-1 text-[15px] font-bold text-ink">{notificationBody(item.title)}</p>
        </Link>
      ))}
    </div>
  );
}

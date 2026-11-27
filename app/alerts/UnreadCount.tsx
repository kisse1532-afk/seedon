"use client";

import { useEffect, useState } from "react";
import { loadInbox } from "@/lib/alerts/inbox";

/** 「알림함」 옆 안 읽은 개수. 못 읽거나 0개면 아무것도 안 보인다. */
export default function UnreadCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;
    loadInbox()
      .then((items) => alive && setCount(items.filter((i) => !i.read).length))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!count) return null;
  return (
    <span
      aria-label={`안 읽은 알림 ${count}개`}
      className="ml-1.5 inline-block min-w-5 rounded-full bg-primary-deep px-1.5 text-center text-[11px] font-bold leading-5 text-white"
    >
      {count}
    </span>
  );
}

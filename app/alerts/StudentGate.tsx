"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import RequireLogin from "@/app/_components/RequireLogin";
import { rememberNext } from "@/lib/next-destination";
import { loadStudent, type Student } from "@/lib/alerts/settings";

type Ok = Extract<Student, { state: "ok" }>;

const BLOCKED = {
  onboarding: "몇 년생인지 먼저 알려주면 쓸 수 있어요. 1분이면 돼요.",
  adult: "맞춤 알림은 청소년 본인 계정에서 설정해요.",
  young: "씨드온 계정 기능은 만 14세부터 쓸 수 있어요. 프로그램은 로그인 없이도 볼 수 있어요.",
};

/** 로그인한 청소년에게만 안쪽 화면을 보여준다. */
export default function StudentGate({ children }: { children: (student: Ok) => ReactNode }) {
  return (
    <RequireLogin reason="내 학년과 지역에 맞는 기회를 골라 보여주려면 설정을 계정에 저장해야 해요.">
      <Inner>{children}</Inner>
    </RequireLogin>
  );
}

function Inner({ children }: { children: (student: Ok) => ReactNode }) {
  const pathname = usePathname();
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => {
    let alive = true;
    loadStudent().then((s) => alive && setStudent(s));
    return () => {
      alive = false;
    };
  }, []);

  if (!student) return <p className="py-16 text-center text-sm text-ink-60">불러오고 있어요…</p>;
  if (student.state === "ok") return <>{children(student)}</>;

  return (
    <div className="mx-auto max-w-sm space-y-4 py-14 text-center">
      <p className="text-sm leading-relaxed text-body">{BLOCKED[student.state]}</p>
      {student.state === "onboarding" && (
        <Link
          href="/login/role"
          onClick={() => rememberNext(pathname)}
          className="inline-block rounded-full bg-primary-deep px-6 py-2.5 text-sm font-bold text-white"
        >
          알려주기
        </Link>
      )}
      <Link href="/" className="block text-xs text-meta hover:text-body">
        홈으로
      </Link>
    </div>
  );
}

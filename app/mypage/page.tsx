"use client";

import { useState } from "react";
import Link from "next/link";

export default function MyPage() {
  const [pushOn, setPushOn] = useState(true);
  const [marketingOn, setMarketingOn] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center text-2xl">🙂</div>
        <div>
          <p className="font-semibold">게스트님</p>
          <p className="text-xs text-neutral-400">로그인하면 이름이 표시돼요</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="text-lg font-bold">0</div>
          <div className="text-xs text-neutral-400 mt-1">관심 프로그램</div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="text-lg font-bold">0</div>
          <div className="text-xs text-neutral-400 mt-1">신청 내역</div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="text-lg font-bold">0</div>
          <div className="text-xs text-neutral-400 mt-1">1:1 문의</div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-500">알림</h2>
        <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
          <div className="flex items-center justify-between p-4">
            <span className="text-sm">푸시 알림</span>
            <button
              onClick={() => setPushOn((v) => !v)}
              className={`w-11 h-6 rounded-full transition relative ${pushOn ? "bg-emerald-500" : "bg-neutral-200"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition ${pushOn ? "left-5" : "left-0.5"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-4">
            <span className="text-sm">맞춤 정보·마케팅 수신 동의</span>
            <button
              onClick={() => setMarketingOn((v) => !v)}
              className={`w-11 h-6 rounded-full transition relative ${marketingOn ? "bg-emerald-500" : "bg-neutral-200"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition ${marketingOn ? "left-5" : "left-0.5"}`} />
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-500">계정</h2>
        <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100 text-sm">
          <div className="p-4 flex items-center justify-between text-neutral-600">
            <span>서비스 이용약관</span>
            <span className="text-neutral-300">›</span>
          </div>
          <div className="p-4 flex items-center justify-between text-neutral-600">
            <span>개인정보 처리방침</span>
            <span className="text-neutral-300">›</span>
          </div>
          <Link href="/login" className="p-4 flex items-center justify-between text-neutral-600 hover:text-emerald-600">
            <span>로그아웃</span>
            <span className="text-neutral-300">›</span>
          </Link>
          <div className="p-4 flex items-center justify-between text-neutral-400">
            <span>서비스 탈퇴</span>
            <span className="text-neutral-300">›</span>
          </div>
        </div>
      </section>

      <p className="text-[11px] text-neutral-400 text-center pt-2">
        마이페이지는 현재 화면 구성만 준비된 상태예요. 실제 로그인 연동은 다음 단계에서 진행돼요.
      </p>
    </div>
  );
}

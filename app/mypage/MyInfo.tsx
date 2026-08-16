"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  loadMyProfile,
  saveMemberProfile,
  setMarketingConsent,
  clearOptionalProfile,
  type StoredProfile,
} from "@/lib/consent";
import { REGIONS } from "@/lib/regions";
import { needsOnboarding } from "@/lib/role";
import { POLICY_CONTACT } from "@/lib/policy";

/**
 * 내 정보 — 보기·고치기·지우기.
 *
 * 개인정보보호법은 본인에게 열람권·정정권·삭제권을 준다. 받아만 두고 본인이
 * 확인할 방법이 없으면 그 권리가 없는 것과 같다. 그래서 무엇이 저장돼 있는지
 * 그대로 보여주고, 선택 항목은 여기서 바로 고치거나 지울 수 있게 한다.
 *
 * 몇 년생인지는 지우는 버튼을 두지 않는다. 만 14세 확인의 근거라서 지우면
 * 가입 자격을 확인할 수 없게 된다. 대신 고칠 수는 있다.
 */
export default function MyInfo() {
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState("");
  const [region, setRegion] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadMyProfile().then((p) => {
      if (!alive) return;
      setProfile(p);
      setNickname(p?.nickname ?? "");
      setRegion(p?.region ?? "");
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  async function refresh() {
    const p = await loadMyProfile();
    setProfile(p);
    setNickname(p?.nickname ?? "");
    setRegion(p?.region ?? "");
  }

  async function handleSave() {
    if (!profile) return;
    setBusy(true);
    await saveMemberProfile({
      // 어른은 몇 년생인지를 받지 않았다. 그대로 두고 선택 항목만 고친다.
      birthYear: profile.birth_year,
      birthdayPassed: profile.birthday_passed,
      nickname,
      region,
    });
    await refresh();
    setEditing(false);
    setBusy(false);
    setMessage("고쳤어요.");
  }

  async function handleClear() {
    setBusy(true);
    await clearOptionalProfile();
    await refresh();
    setEditing(false);
    setBusy(false);
    setMessage("이름과 지역을 지웠어요.");
  }

  async function toggleMarketing() {
    if (!profile) return;
    setBusy(true);
    await setMarketingConsent(!profile.agreed_marketing);
    await refresh();
    setBusy(false);
  }

  if (!loaded) return null;

  // 이 화면이 생기기 전에 가입한 사람은 정보가 없다. 없는 걸 없다고 말하고
  // 채울 길을 준다 — 빈 칸만 보여주면 고장난 줄 안다.
  if (needsOnboarding(profile)) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink-60">내 정보</h2>
        <div className="rounded-2xl border border-sage-border bg-white p-5 space-y-3">
          <p className="text-sm leading-relaxed text-body">
            아직 받은 정보가 없어요. 청소년 본인인지 곁에 있는 어른인지만 알려주면
            그에 맞게 보여드릴 수 있어요. 1분이면 돼요.
          </p>
          <Link
            href="/login/role"
            className="inline-block rounded-full bg-primary-deep px-4 py-2 text-xs font-bold text-white transition hover:brightness-110"
          >
            알려주기
          </Link>
        </div>
      </section>
    );
  }

  // needsOnboarding이 위에서 걸러줬지만 타입 검사기는 그걸 모른다.
  if (!profile) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-60">내 정보</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-primary-deep hover:underline"
          >
            고치기
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-sage-border bg-white divide-y divide-sage-line text-sm">
        <div className="p-4 flex items-center justify-between">
          <span className="text-meta">어떻게 쓰고 있나</span>
          <span className="text-body">
            {profile.role === "adult" ? (profile.adult_kind ?? "곁에 있는 어른") : "청소년 본인"}
          </span>
        </div>

        {/* 몇 년생인지는 청소년에게만 받는다. 어른에게는 나이가 필요 없어서
            아예 안 물어봤으므로 보여줄 것도 없다. */}
        {profile.role === "youth" && profile.birth_year && (
          <div className="p-4 flex items-center justify-between">
            <span className="text-meta">몇 년생</span>
            <span className="text-body">{profile.birth_year}년생</span>
          </div>
        )}

        {editing ? (
          <>
            <div className="p-4 space-y-2">
              <span className="text-meta">사는 지역</span>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full rounded-control border border-sage-border px-3 py-2.5 text-sm text-body focus:border-primary focus:outline-none"
              >
                <option value="">안 고를래요</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="p-4 space-y-2">
              <span className="text-meta">이름 또는 닉네임</span>
              <input
                type="text"
                maxLength={20}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="안 적어도 돼요"
                className="w-full rounded-control border border-sage-border px-3 py-2.5 text-sm text-body focus:border-primary focus:outline-none placeholder:text-meta"
              />
            </div>
            <div className="p-4 flex flex-wrap gap-2">
              <button
                onClick={handleSave}
                disabled={busy}
                className="rounded-full bg-primary-deep px-4 py-2 text-xs font-bold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                저장
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setNickname(profile.nickname ?? "");
                  setRegion(profile.region ?? "");
                }}
                className="rounded-full border border-sage-border px-4 py-2 text-xs font-medium text-meta transition hover:text-body"
              >
                그만두기
              </button>
              <button
                onClick={handleClear}
                disabled={busy}
                className="ml-auto rounded-full px-3 py-2 text-xs text-meta transition hover:text-red-600 disabled:opacity-60"
              >
                이름·지역 지우기
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 flex items-center justify-between">
              <span className="text-meta">사는 지역</span>
              <span className={profile.region ? "text-body" : "text-meta"}>
                {profile.region ?? "안 적었어요"}
              </span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-meta">이름 또는 닉네임</span>
              <span className={profile.nickname ? "text-body" : "text-meta"}>
                {profile.nickname ?? "안 적었어요"}
              </span>
            </div>
          </>
        )}

        <button
          onClick={toggleMarketing}
          disabled={busy}
          className="w-full p-4 flex items-center justify-between text-left disabled:opacity-60"
        >
          <span className="min-w-0">
            <span className="block text-meta">새 프로그램 소식 받기</span>
            <span className="mt-0.5 block text-[11px] leading-relaxed text-meta">
              아직 보내는 기능은 준비 중이에요. 안 받아도 아무 지장 없어요
            </span>
          </span>
          {/* 스위치 모양. 지금 켜졌는지 꺼졌는지가 한눈에 보여야 한다. */}
          <span
            className={`relative ml-3 h-6 w-11 shrink-0 rounded-full transition ${
              profile.agreed_marketing ? "bg-primary-deep" : "bg-sage-border"
            }`}
            aria-hidden
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                profile.agreed_marketing ? "left-[22px]" : "left-0.5"
              }`}
            />
          </span>
        </button>
      </div>

      {message && <p className="text-xs text-primary-deep">{message}</p>}

      <p className="text-[11px] leading-relaxed text-meta">
        {profile.agreed_at && <>{profile.agreed_at.slice(0, 10)}에 약관에 동의했어요. </>}
        계정을 통째로 지우고 싶으면 <b className="font-semibold">{POLICY_CONTACT}</b>로 알려주세요.
        저장된 것도 같이 지워드려요.
      </p>
    </section>
  );
}

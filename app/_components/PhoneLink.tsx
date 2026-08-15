"use client";

import { useState } from "react";

/**
 * 전화번호 링크.
 *
 * tel: 링크는 폰에서는 전화 앱이 열리지만 PC 브라우저에서는 전화를 걸
 * 프로그램이 없어 눌러도 아무 반응이 없다. 긴급 연락처(1388 등)가
 * 무반응인 건 위험해서, 누르면 번호를 복사하고 "복사했어요"를 띄운다
 * (2026.08.13 로드 지적).
 *
 * 폰에서는 tel: 이동이 그대로 일어나 전화 앱이 열리고, 복사는 조용히
 * 같이 되므로 방해되지 않는다.
 */
export default function PhoneLink({
  number,
  className,
  wrapperClassName = "relative inline-flex items-center",
  children,
}: {
  /** 실제로 걸 번호. 하이픈이 있어도 되고, tel:에는 숫자만 넣는다. */
  number: string;
  className?: string;
  /**
   * 바깥 감싸개의 클래스. 기본값은 글자 길이만큼만 차지하는 inline-flex라
   * 푸터처럼 글줄 안에 섞일 때 맞다. 반대로 그리드 칸을 꽉 채워야 하는
   * 곳(홈 긴급 연락 타일)에서는 "relative block w-full"을 넘긴다 —
   * 기본값 그대로 두면 칸 안에서 글자 길이만큼만 차지해 타일 폭이 번호마다
   * 달라진다(2026.08.15 확인).
   */
  wrapperClassName?: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 복사가 막힌 환경(구형 브라우저·권한 거부)에서는 조용히 넘어간다.
      // tel: 이동은 그대로 시도되므로 폰에서는 영향이 없다.
    }
  }

  return (
    <span className={wrapperClassName}>
      <a
        href={`tel:${number.replace(/[^0-9]/g, "")}`}
        onClick={handleClick}
        className={className}
      >
        {children}
      </a>
      {copied && (
        <span
          role="status"
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-7 whitespace-nowrap rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-dark-surface shadow-sm"
        >
          번호를 복사했어요
        </span>
      )}
    </span>
  );
}

import type { Metadata } from "next";
import { fetchAlwaysOpenPrograms, fetchDeadlinePrograms } from "@/lib/queries";
import StartLanding, { type SceneProgram } from "./StartLanding";

/**
 * /start — 인스타 광고용 랜딩페이지 (2026.10.24 로드 결정, 프리토타입 실험 2회차)
 *
 * 무엇을 확인하나: 「신청까지 한 번에」는 아직 없다. 버튼부터 달아 두고
 * 몇 명이 누르는지, 그중 몇 명이 "열리면 알려 달라"고 연락처를 남기는지 센다
 * (『아이디어 불패의 법칙』의 가짜 문). 누르면 바로 "아직 만들고 있어요"라고
 * 솔직하게 알려 준다.
 *
 * 화면은 로드가 고친 목업 그대로다(프로젝트 문서
 * 「2026.10.24 [씨드온] 랜딩페이지 start 목업.html」). 버튼은 하나만 둔다 —
 * 다른 링크는 로드가 일부러 뺐다.
 *
 * 주소 예: /start?from=insta_ad&v=A
 *   from = 어디서 왔는지(insta_ad, insta_post, test …) → landing_events.ref
 *   v    = 광고 문구 A·B → landing_events.variant
 *   기록은 서비스 본체 숫자(program_events)와 섞지 않고 landing_events 표에 따로 쌓는다.
 */

// 장면 1 카드는 지금 열려 있는 실제 지원을 매번 새로 읽는다
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "이미 있는 지원, 신청까지 한 번에",
  description: "장학금·캠프·교육비·상담. 흩어진 지원을 모아 쉬운 말로 알려 줄게요.",
  alternates: { canonical: "/start" },
  /* 광고로 온 사람만 세야 한다. 검색으로 들어온 방문이 섞이지 않게 막는다. */
  robots: { index: false, follow: false },
};

/* 랜딩 카드는 한 줄 이름만 보여 준다. 공식 이름에 붙은 연도·부제(<문문문> 같은 것)는
   처음 보는 사람에게 뜻이 안 읽혀서 뺀다(2026.10.24 로드 "문문문은 이상해").
   카드를 여는 상세 화면의 공식 이름은 그대로다. */
function shortTitle(title: string) {
  return (
    title
      .replace(/\s*[<〈《「][^>〉》」]*[>〉》」]\s*/g, " ")
      .replace(/^20\d{2}년?\s+/, "")
      .replace(/\s+/g, " ")
      .trim() || title
  );
}

function dday(deadline: string) {
  const today = new Date(new Date().toISOString().slice(0, 10)).getTime();
  const end = new Date(deadline).getTime();
  const days = Math.round((end - today) / 86_400_000);
  return days <= 0 ? "D-day" : `D-${days}`;
}

export default async function StartPage() {
  const [deadline, always] = await Promise.all([
    fetchDeadlinePrograms(2),
    fetchAlwaysOpenPrograms(1),
  ]);

  const programs: SceneProgram[] = [
    ...deadline.map((p) => ({
      id: p.id,
      title: shortTitle(p.title),
      org: p.org,
      badge: p.apply_deadline ? dday(p.apply_deadline) : "연중",
      urgent: true,
    })),
    ...always.map((p) => ({ id: p.id, title: shortTitle(p.title), org: p.org, badge: "연중", urgent: false })),
  ];

  return <StartLanding programs={programs} />;
}

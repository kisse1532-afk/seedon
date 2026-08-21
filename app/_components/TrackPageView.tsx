"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { trackSource } from "@/lib/track-source";

/**
 * 프로그램 상세를 "사람이 실제로 봤다"고 기록한다.
 *
 * 왜 옮겼나: 전에는 서버에서 화면을 그릴 때마다 기록했다. 그래서
 * 검색봇이 지나간 것, 카톡에 링크를 붙였을 때 뜨는 미리보기, 우리가 점검하려고
 * curl로 연 것까지 전부 "청소년이 봤다"로 세어졌다. 실제로 카드 클릭 22건에
 * 상세 조회 64건이라는 말이 안 되는 숫자가 쌓여 있었다(2026-08-16 확인).
 *
 * 파일럿 지표가 바로 이 숫자라, 틀린 채로 쌓이면 쌓을수록 못 쓰게 된다.
 *
 * 브라우저에서 찍으면 자바스크립트를 실행하는 진짜 방문만 남는다. 여기에
 * 두 가지를 더한다.
 *  - 같은 사람이 같은 프로그램을 여러 번 열어도 한 번만 센다(탭을 닫을 때까지)
 *  - 로그인했으면 누구인지 같이 남긴다 — 그래야 "몇 명이 갔나"를 셀 수 있다
 *  - 어디서 열렸는지 같이 남긴다 — 우리가 화면 찍을 때 생긴 기록을 빼기 위해
 */
export default function TrackPageView({
  programId,
  category,
}: {
  programId: string;
  category: string;
}) {
  useEffect(() => {
    const key = `seedon_viewed_${programId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* 저장소를 못 쓰는 환경이면 중복 방지만 포기하고 기록은 남긴다 */
    }

    let alive = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      // 기록이 실패해도 화면에는 아무 영향이 없어야 한다.
      supabase
        .from("program_events")
        .insert({
          event_type: "apply_page_view",
          program_id: programId,
          category,
          user_id: data.user?.id ?? null,
          source: trackSource(),
        })
        .then(() => {});
    });

    return () => {
      alive = false;
    };
  }, [programId, category]);

  return null;
}

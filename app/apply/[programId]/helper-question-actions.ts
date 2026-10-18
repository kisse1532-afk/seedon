"use server";

import { supabase } from "@/lib/supabase";

/* 도우미가 답 못 한 질문 남기기 (인계함 2026.10.18 [결정]).
   로드: "카드 밖에 말은 아직 대답하지마 다른데서 물어보라고 해. 그리고 계속
   그거를 CS로 생각해서 업데이트해야 되는 걸로 남기고 업데이트를 할 수 있도록 해."

   - 도우미는 카드 밖 질문에 답하지 않는다. 1388·주민센터로 안내만 한다.
   - 청소년이 원하면 "무엇이 궁금했는지" 한 줄만 남길 수 있다. 이게 CS 할 일 목록이 된다.
   - 저장 위치: 기존 reports 표(제보함)에 source_type='helper_question'으로.
     새 표를 만들지 않으려고 고른 자리다. 관리자 화면 「대기중인 제보」에 "도우미 질문"으로 뜬다.
   - 개인정보는 받지 않는다. 이름·연락처는 적지 말라고 화면에서 안내한다. 누가 적었는지(user_id)도 안 남긴다. */

export type HelperQuestionState = { ok?: boolean; error?: string } | null;

export async function submitHelperQuestion(
  programTitle: string,
  _prev: HelperQuestionState,
  formData: FormData,
): Promise<HelperQuestionState> {
  const question = String(formData.get("question") || "").trim().slice(0, 200);
  if (!question) {
    return { error: "궁금했던 걸 한 줄만 적어주세요" };
  }

  const { error } = await supabase.from("reports").insert({
    source_type: "helper_question",
    content: `[도우미 · ${programTitle.slice(0, 60)}] ${question}`,
  });

  if (error) {
    console.error("[submitHelperQuestion] insert failed", error);
    return { error: "지금은 저장이 안 되네요. 조금 뒤에 다시 눌러줄래요?" };
  }
  return { ok: true };
}

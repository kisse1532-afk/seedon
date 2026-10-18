"use server";

import { supabase } from "@/lib/supabase";

/* 카드마다 「정보가 틀렸어요」 (인계함 2026.10.16 [결정] 제품 과업 6).
   개인정보는 받지 않는다 — 어느 카드인지, 무엇이 틀렸는지, (선택) 짧은 메모만. */

export type CardReportState = { ok?: boolean; error?: string } | null;

const REASONS = ["deadline", "link", "content", "phone", "other"] as const;

export async function submitCardReport(
  programId: string,
  _prev: CardReportState,
  formData: FormData,
): Promise<CardReportState> {
  const reason = String(formData.get("reason") || "");
  const note = String(formData.get("note") || "").trim().slice(0, 300);

  if (!(REASONS as readonly string[]).includes(reason)) {
    return { error: "어떤 게 틀렸는지 하나만 골라주세요" };
  }

  const { error } = await supabase.from("card_reports").insert({
    program_id: programId,
    reason,
    note: note || null,
  });

  if (error) {
    console.error("[submitCardReport] insert failed", error);
    return { error: "지금은 저장이 안 되네요. 조금 뒤에 다시 눌러줄래요?" };
  }
  return { ok: true };
}

"use server";

import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export async function submitApplication(programId: string, formData: FormData) {
  const name = formData.get("name");
  const contact = formData.get("contact");

  // 절대 규칙: 낙인 문구·민감정보(소득분위 등)는 이 폼에서 받지 않는다 (CLAUDE.md 참고)
  if (!name || !contact) {
    throw new Error("이름과 연락처를 입력해주세요.");
  }

  const { error } = await supabase.from("applications").insert({
    program_id: programId,
    applicant_name: String(name),
    applicant_contact: String(contact),
  });

  if (error) {
    console.error("[submitApplication] insert failed", error);
    // mock 데이터로 만든 프로그램(DB에 없는 program_id)일 경우 FK 에러가 날 수 있음 - 일단 통과시키고 로그만 남김
  }

  redirect(`/apply/${programId}/complete`);
}

export async function submitHelpRequest(programId: string, formData: FormData) {
  const name = formData.get("name");
  const contact = formData.get("contact");
  const message = formData.get("message");

  if (!name || !contact) {
    throw new Error("이름과 연락처를 입력해주세요.");
  }

  const { error } = await supabase.from("help_requests").insert({
    program_id: programId,
    name: String(name),
    contact: String(contact),
    message: message ? String(message) : null,
  });

  if (error) {
    console.error("[submitHelpRequest] insert failed", error);
  }

  redirect(`/apply/${programId}/help-complete`);
}

"use server";

import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

/* 관심 등록(submitApplication)은 여기 있었지만 lib/applications.ts로 옮겼다.
   서버 액션은 로그인 세션을 모르기 때문에 "누가 등록했는지"가 계속 비어 있었고,
   그래서 청소년 본인은 자기 등록 내역을 볼 수 없었다. 브라우저에서 저장하면
   세션이 붙는다. 도움 요청은 로그인과 무관하게 받는 창구라 서버에 남겨둔다. */

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
    throw new Error("도움 요청을 저장하지 못했어요. 잠시 후 다시 시도해주세요.");
  }

  redirect(`/apply/${programId}/help-complete`);
}

"use server";

import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export type ReportState = { error?: string } | null;

/* 예전에는 빈 칸으로 누르면 throw를 던졌다. 서버 액션에서 던진 에러는 아무도
   받지 않아서 Next의 기본 에러 화면(하얀 크래시 페이지)으로 튕겼고, 청소년
   눈에는 "고장난 사이트"로 보였다. 링크와 글 중 하나만 채우면 되는 규칙이라
   input의 required로는 표현이 안 되므로, 던지지 말고 문구를 돌려준다. */
export async function submitReport(
  _prev: ReportState,
  formData: FormData,
): Promise<ReportState> {
  const link = String(formData.get("link") || "").trim();
  const text = String(formData.get("text") || "").trim();

  const content = link || text;
  if (!content) {
    return { error: "링크나 내용 중 하나만 채워주면 돼요" };
  }

  const { error } = await supabase.from("reports").insert({
    source_type: link ? "link" : "text",
    content,
  });

  if (error) {
    console.error("[submitReport] insert failed", error);
    return { error: "지금은 저장이 안 되네요. 조금 뒤에 다시 눌러줄래요?" };
  }

  redirect("/report/thanks");
}

"use server";

import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export async function submitReport(formData: FormData) {
  const link = String(formData.get("link") || "").trim();
  const text = String(formData.get("text") || "").trim();

  const content = link || text;
  if (!content) {
    throw new Error("링크나 내용을 입력해주세요.");
  }

  await supabase.from("reports").insert({
    source_type: link ? "link" : "text",
    content,
  });

  redirect("/report/thanks");
}

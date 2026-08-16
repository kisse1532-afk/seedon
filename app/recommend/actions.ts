"use server";

import { redirect } from "next/navigation";

export async function findRecommendations(formData: FormData) {
  const text = String(formData.get("situation") || "").trim();
  if (!text) {
    redirect("/recommend");
  }

  // 예전에는 여기서 카테고리를 하나 정해 넘겼는데, 이제 결과 화면이 프로그램
  // 하나하나에 점수를 매겨 순서를 만든다(lib/recommend.ts). 적어준 말을 그대로
  // 넘기면 된다.
  redirect(`/recommend/results?${new URLSearchParams({ q: text }).toString()}`);
}

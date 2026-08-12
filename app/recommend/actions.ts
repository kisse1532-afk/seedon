"use server";

import { redirect } from "next/navigation";
import { matchCategory } from "@/lib/recommend";

export async function findRecommendations(formData: FormData) {
  const text = String(formData.get("situation") || "").trim();
  if (!text) {
    redirect("/recommend");
  }

  const category = matchCategory(text);
  const params = new URLSearchParams({ q: text });
  if (category) params.set("category", category);

  redirect(`/recommend/results?${params.toString()}`);
}

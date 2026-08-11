"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export async function createCommunityPost(formData: FormData) {
  const title = String(formData.get("title"));
  const body = String(formData.get("body"));
  const category = String(formData.get("category") || "복지정보");
  const published = formData.get("published") === "on";

  const { error } = await supabase.from("community_posts").insert({ title, body, category, published });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/community");
  revalidatePath("/community");
  redirect("/admin/community");
}

export async function updateCommunityPost(id: string, formData: FormData) {
  const title = String(formData.get("title"));
  const body = String(formData.get("body"));
  const category = String(formData.get("category") || "복지정보");
  const published = formData.get("published") === "on";

  const { error } = await supabase.from("community_posts").update({ title, body, category, published }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/community");
  revalidatePath("/community");
  redirect("/admin/community");
}

export async function deleteCommunityPost(formData: FormData) {
  const id = String(formData.get("id"));
  await supabase.from("community_posts").delete().eq("id", id);
  revalidatePath("/admin/community");
  revalidatePath("/community");
}

export async function togglePublishCommunityPost(formData: FormData) {
  const id = String(formData.get("id"));
  const nextPublished = formData.get("nextPublished") === "true";
  await supabase.from("community_posts").update({ published: nextPublished }).eq("id", id);
  revalidatePath("/admin/community");
  revalidatePath("/community");
}

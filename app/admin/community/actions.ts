"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/admin-db";
import { requireAdmin } from "@/lib/admin-auth";

export async function createCommunityPost(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title"));
  const body = String(formData.get("body"));
  const category = String(formData.get("category") || "복지정보");
  const published = formData.get("published") === "on";

  const db = await adminDb();
  const { error } = await db.from("community_posts").insert({ title, body, category, published });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/community");
  revalidatePath("/community");
  redirect("/admin/community");
}

export async function updateCommunityPost(id: string, formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title"));
  const body = String(formData.get("body"));
  const category = String(formData.get("category") || "복지정보");
  const published = formData.get("published") === "on";

  const db = await adminDb();
  const { error } = await db.from("community_posts").update({ title, body, category, published }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/community");
  revalidatePath("/community");
  redirect("/admin/community");
}

export async function deleteCommunityPost(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const db = await adminDb();
  const { error } = await db.from("community_posts").delete().eq("id", id);
  if (error) console.error("[deleteCommunityPost] failed", error.message);
  revalidatePath("/admin/community");
  revalidatePath("/community");
}

export async function togglePublishCommunityPost(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const nextPublished = formData.get("nextPublished") === "true";
  const db = await adminDb();
  const { error } = await db.from("community_posts").update({ published: nextPublished }).eq("id", id);
  if (error) console.error("[togglePublishCommunityPost] failed", error.message);
  revalidatePath("/admin/community");
  revalidatePath("/community");
}

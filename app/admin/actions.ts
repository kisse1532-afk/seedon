"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

function parseTags(raw: FormDataEntryValue | null) {
  return String(raw || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function createProgram(formData: FormData) {
  const id = String(formData.get("id")).trim();
  const title = String(formData.get("title"));
  const org = String(formData.get("org"));
  const description = String(formData.get("description"));
  const category = String(formData.get("category"));
  const link = String(formData.get("link") || "");
  const org_type = String(formData.get("org_type") || "public");
  const apply_method = String(formData.get("apply_method") || "");
  const phone = String(formData.get("phone") || "");
  const apply_deadline = String(formData.get("apply_deadline") || "");
  const enrollment_status = String(formData.get("enrollment_status") || "");
  const reopen_note = String(formData.get("reopen_note") || "");
  const review_note = String(formData.get("review_note") || "");
  const tags = parseTags(formData.get("tags"));

  const { error } = await supabase.from("programs").insert({
    id,
    title,
    org,
    description,
    category,
    tags,
    link,
    org_type,
    apply_method,
    phone: phone || null,
    apply_deadline: apply_deadline || null,
    enrollment_status: enrollment_status || null,
    reopen_note: reopen_note || null,
    review_note: review_note || null,
    status: "published",
    last_verified_at: new Date().toISOString().slice(0, 10),
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateProgram(id: string, formData: FormData) {
  const title = String(formData.get("title"));
  const org = String(formData.get("org"));
  const description = String(formData.get("description"));
  const category = String(formData.get("category"));
  const link = String(formData.get("link") || "");
  const status = String(formData.get("status"));
  const org_type = String(formData.get("org_type") || "public");
  const apply_method = String(formData.get("apply_method") || "");
  const phone = String(formData.get("phone") || "");
  const apply_deadline = String(formData.get("apply_deadline") || "");
  const enrollment_status = String(formData.get("enrollment_status") || "");
  const reopen_note = String(formData.get("reopen_note") || "");
  const review_note = String(formData.get("review_note") || "");
  const tags = parseTags(formData.get("tags"));
  const reverify = formData.get("reverify") === "on";

  const update: Record<string, unknown> = {
    title, org, description, category, tags, link, status, org_type, apply_method,
    phone: phone || null,
    apply_deadline: apply_deadline || null,
    enrollment_status: enrollment_status || null,
    reopen_note: reopen_note || null,
    review_note: review_note || null,
  };
  if (reverify) {
    update.last_verified_at = new Date().toISOString().slice(0, 10);
  }

  const { error } = await supabase.from("programs").update(update).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteProgram(formData: FormData) {
  const id = String(formData.get("id"));
  await supabase.from("programs").delete().eq("id", id);
  revalidatePath("/admin");
}

export async function dismissReport(formData: FormData) {
  const id = String(formData.get("id"));
  await supabase.from("reports").delete().eq("id", id);
  revalidatePath("/admin");
}

export async function logout() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.delete("seedon_admin");
  redirect("/admin/login");
}

export async function markHelpRequestContacted(formData: FormData) {
  const id = String(formData.get("id"));
  await supabase.from("help_requests").update({ status: "contacted" }).eq("id", id);
  revalidatePath("/admin");
}

export async function markHelpRequestCompleted(formData: FormData) {
  const id = String(formData.get("id"));
  await supabase.from("help_requests").update({ status: "completed" }).eq("id", id);
  revalidatePath("/admin");
}

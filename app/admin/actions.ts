"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

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

/* 이름·연락처가 든 표는 서버 전용 키로만 다룬다. 공개 키로 쓰기가 열려 있으면
   읽기도 같이 열어야 해서, 결국 누구나 명단을 볼 수 있게 된다. */
async function setStatus(table: "help_requests" | "applications", id: string, status: string) {
  if (!supabaseAdmin) return;
  await supabaseAdmin.from(table).update({ status }).eq("id", id);
  revalidatePath("/admin");
}

export async function markHelpRequestContacted(formData: FormData) {
  await setStatus("help_requests", String(formData.get("id")), "contacted");
}

export async function markHelpRequestCompleted(formData: FormData) {
  await setStatus("help_requests", String(formData.get("id")), "completed");
}

/* 후기 승인/반려.
   status를 바꿀 수 있는 건 서버 전용 키뿐이다 — program_reviews에 UPDATE 정책을
   아예 만들지 않아서, 공개 키로는 자기 글도 승인 상태로 못 바꾼다. */
export async function publishReview(formData: FormData) {
  if (!supabaseAdmin) return;
  await supabaseAdmin
    .from("program_reviews")
    .update({ status: "published" })
    .eq("id", String(formData.get("id")));
  revalidatePath("/admin");
  revalidatePath("/community");
}

export async function rejectReview(formData: FormData) {
  if (!supabaseAdmin) return;
  // 지우지 않고 상태만 바꾼다. 왜 안 올렸는지 나중에 확인할 수 있어야 한다.
  await supabaseAdmin
    .from("program_reviews")
    .update({ status: "rejected" })
    .eq("id", String(formData.get("id")));
  revalidatePath("/admin");
}

export async function markApplicationContacted(formData: FormData) {
  await setStatus("applications", String(formData.get("id")), "contacted");
}

export async function markApplicationCompleted(formData: FormData) {
  await setStatus("applications", String(formData.get("id")), "completed");
}

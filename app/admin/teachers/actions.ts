"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isOperator } from "@/lib/alerts/operator-session";
import { normalizeUsername, usernameToEmail } from "@/lib/username";

async function requireOperator() {
  if (!(await isOperator())) redirect("/admin/teachers?msg=auth");
}

/** 이미 가입한 계정 하나를 선생님으로 초대한다. 아이디 또는 이메일로 찾는다. */
export async function inviteTeacher(formData: FormData) {
  await requireOperator();
  const loginId = normalizeUsername(String(formData.get("login_id") ?? ""));
  if (!supabaseAdmin || !loginId) redirect("/admin/teachers?msg=fail");

  const email = loginId.includes("@") ? loginId : usernameToEmail(loginId);
  let userId: string | null = null;
  for (let page = 1; page <= 20 && !userId; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) redirect("/admin/teachers?msg=fail");
    userId = data.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
    if (data.users.length < 1000) break;
  }
  if (!userId) redirect("/admin/teachers?msg=none");

  const { error } = await supabaseAdmin
    .from("teachers")
    .upsert({ user_id: userId, login_id: loginId, revoked_at: null }, { onConflict: "user_id" });
  if (error) redirect("/admin/teachers?msg=fail");

  revalidatePath("/admin/teachers");
  redirect("/admin/teachers?msg=ok");
}

/** 지우지 않고 거둔 시각만 남긴다. */
export async function revokeTeacher(formData: FormData) {
  await requireOperator();
  await supabaseAdmin
    ?.from("teachers")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", String(formData.get("user_id")));
  revalidatePath("/admin/teachers");
}

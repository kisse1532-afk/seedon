"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_SECONDS,
  createAdminToken,
  isAdminConfigured,
  isAdminPassword,
} from "@/lib/admin-session";

export async function login(formData: FormData) {
  if (!isAdminConfigured()) {
    redirect("/admin/login?error=setup");
  }

  const token = (await isAdminPassword(formData.get("password"))) ? await createAdminToken() : null;
  if (!token) {
    redirect("/admin/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: ADMIN_SESSION_SECONDS,
    path: "/",
  });

  redirect("/admin");
}

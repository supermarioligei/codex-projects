"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { roleLabels, SESSION_NAME_COOKIE, SESSION_ROLE_COOKIE, type UserRole } from "@/lib/auth";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function loginAction(formData: FormData) {
  const name = readText(formData, "name");
  const role = readText(formData, "role") as UserRole;

  if (!name || !(role in roleLabels)) {
    redirect("/login?error=missing");
  }

  const store = await cookies();
  store.set(SESSION_NAME_COOKIE, name, { httpOnly: true, sameSite: "lax", path: "/" });
  store.set(SESSION_ROLE_COOKIE, role, { httpOnly: true, sameSite: "lax", path: "/" });

  redirect("/");
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(SESSION_NAME_COOKIE);
  store.delete(SESSION_ROLE_COOKIE);
  redirect("/login");
}

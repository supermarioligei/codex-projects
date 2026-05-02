"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_NAME_COOKIE,
  SESSION_ROLE_COOKIE,
  SESSION_USER_ID_COOKIE,
  SESSION_USERNAME_COOKIE,
} from "@/lib/auth";
import { authenticateStaffAccount } from "@/lib/staff";
import { getDefaultRouteForRole } from "@/lib/ui";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function loginAction(formData: FormData) {
  const username = readText(formData, "username");
  const password = readText(formData, "password");

  if (!username || !password) {
    redirect("/login?error=missing");
  }

  const account = await authenticateStaffAccount(username, password);

  if (!account) {
    redirect("/login?error=invalid");
  }

  const store = await cookies();
  store.set(SESSION_USER_ID_COOKIE, account.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  store.set(SESSION_NAME_COOKIE, account.name, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  store.set(SESSION_USERNAME_COOKIE, account.username, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  store.set(SESSION_ROLE_COOKIE, account.role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect(getDefaultRouteForRole(account.role));
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(SESSION_USER_ID_COOKIE);
  store.delete(SESSION_NAME_COOKIE);
  store.delete(SESSION_USERNAME_COOKIE);
  store.delete(SESSION_ROLE_COOKIE);
  redirect("/login");
}

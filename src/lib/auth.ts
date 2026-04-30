import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type UserRole = "owner" | "sales" | "photographer";

export type SessionUser = {
  name: string;
  role: UserRole;
};

export const SESSION_ROLE_COOKIE = "ty_role";
export const SESSION_NAME_COOKIE = "ty_name";

export const roleLabels: Record<UserRole, string> = {
  owner: "老板",
  sales: "客服",
  photographer: "摄影师",
};

export function canEditOrders(role: UserRole) {
  return role === "owner" || role === "sales";
}

export function canViewFinance(role: UserRole) {
  return role === "owner" || role === "sales";
}

export function canEditFinance(role: UserRole) {
  return role === "owner";
}

export function canViewDelivery(role: UserRole) {
  return role === "owner" || role === "sales";
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const role = store.get(SESSION_ROLE_COOKIE)?.value as UserRole | undefined;
  const name = store.get(SESSION_NAME_COOKIE)?.value;

  if (!role || !name) {
    return null;
  }

  if (!(role in roleLabels)) {
    return null;
  }

  return { role, name };
}

export async function requireSession(allowedRoles?: UserRole[]) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect("/");
  }

  return user;
}

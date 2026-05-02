import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { OrderWithFinanceSummary } from "@/lib/order-store";

export type UserRole =
  | "owner"
  | "sales"
  | "production_manager"
  | "finance_director"
  | "delivery_manager"
  | "photographer";

export type SessionUser = {
  id: string;
  name: string;
  username: string;
  role: UserRole;
};

export const SESSION_USER_ID_COOKIE = "ty_user_id";
export const SESSION_ROLE_COOKIE = "ty_role";
export const SESSION_NAME_COOKIE = "ty_name";
export const SESSION_USERNAME_COOKIE = "ty_username";

export const roleLabels: Record<UserRole, string> = {
  owner: "老板",
  sales: "销售",
  production_manager: "拍摄主管",
  finance_director: "财务总监",
  delivery_manager: "交付主管",
  photographer: "拍摄执行",
};

export function canEditOrders(role: UserRole) {
  return (
    role === "owner" ||
    role === "sales" ||
    role === "production_manager" ||
    role === "delivery_manager"
  );
}

export function canCreateOrders(role: UserRole) {
  return role === "owner" || role === "sales";
}

export function canViewFinance(role: UserRole) {
  return role === "owner" || role === "finance_director";
}

export function canEditFinance(role: UserRole) {
  return role === "owner" || role === "finance_director";
}

export function canViewDelivery(role: UserRole) {
  return role === "owner" || role === "production_manager" || role === "delivery_manager";
}

export function canManageClothing(role: UserRole) {
  return role === "owner" || role === "production_manager";
}

function normalizeName(value: string) {
  return value.replace(/\s+/g, "").trim();
}

export function isOrderAssignedToPhotographer(
  order: Pick<
    OrderWithFinanceSummary,
    | "photographer"
    | "assistantPhotographer"
    | "leadVideographer"
    | "assistantVideographer"
    | "director"
  >,
  crewName: string,
) {
  const current = normalizeName(crewName);

  if (!current) {
    return false;
  }

  const candidates = [
    order.photographer,
    order.assistantPhotographer,
    order.leadVideographer,
    order.assistantVideographer,
    order.director,
  ]
    .flatMap((value) => String(value ?? "").split(/[\/,，、|]/))
    .map((item) => normalizeName(item))
    .filter(Boolean);

  return candidates.some(
    (item) => item === current || item.includes(current) || current.includes(item),
  );
}

export function filterOrdersForUser(
  orders: OrderWithFinanceSummary[],
  user: SessionUser,
) {
  if (user.role !== "photographer") {
    return orders;
  }

  return orders.filter((order) => isOrderAssignedToPhotographer(order, user.name));
}

export function canAccessOrder(order: OrderWithFinanceSummary, user: SessionUser) {
  if (user.role !== "photographer") {
    return true;
  }

  return isOrderAssignedToPhotographer(order, user.name);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const id = store.get(SESSION_USER_ID_COOKIE)?.value;
  const role = store.get(SESSION_ROLE_COOKIE)?.value as UserRole | undefined;
  const name = store.get(SESSION_NAME_COOKIE)?.value;
  const username = store.get(SESSION_USERNAME_COOKIE)?.value;

  if (!id || !role || !name || !username) {
    return null;
  }

  if (!(role in roleLabels)) {
    return null;
  }

  return { id, role, name, username };
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

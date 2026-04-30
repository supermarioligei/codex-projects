"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createActivityLog } from "@/lib/activity-log";
import { requireSession } from "@/lib/auth";
import { createStaffMember, updateStaffMember } from "@/lib/staff";
import type { UserRole } from "@/lib/auth";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readRole(formData: FormData, key: string) {
  return readText(formData, key) as UserRole;
}

function readActive(formData: FormData, key: string) {
  return readText(formData, key) === "active";
}

function isSupportedRole(role: string): role is UserRole {
  return [
    "owner",
    "sales",
    "production_manager",
    "finance_director",
    "delivery_manager",
    "photographer",
  ].includes(role);
}

export async function createStaffAction(formData: FormData) {
  const user = await requireSession(["owner"]);
  const name = readText(formData, "name");
  const username = readText(formData, "username");
  const role = readRole(formData, "role");
  const title = readText(formData, "title");
  const active = readActive(formData, "active");
  const password = readText(formData, "password");

  if (
    !name ||
    !username ||
    !title ||
    !password ||
    !isSupportedRole(role)
  ) {
    redirect("/staff?error=create-missing");
  }

  const created = await createStaffMember({ name, username, role, title, active, password });

  if ("error" in created) {
    redirect("/staff?error=username-exists");
  }

  await createActivityLog({
    action: "create",
    entityType: "staff",
    entityId: created.member.id,
    entityLabel: created.member.name,
    summary: `新建账号 ${created.member.name}（${created.member.username}）`,
    actor: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    },
  });

  revalidatePath("/staff");
  revalidatePath("/login");
  revalidatePath("/orders/new");
  redirect("/staff?created=1");
}

export async function updateStaffAction(formData: FormData) {
  const user = await requireSession(["owner"]);
  const id = readText(formData, "id");
  const name = readText(formData, "name");
  const username = readText(formData, "username");
  const role = readRole(formData, "role");
  const title = readText(formData, "title");
  const active = readActive(formData, "active");
  const password = readText(formData, "password");

  if (!id || !name || !username || !title || !isSupportedRole(role)) {
    redirect("/staff?error=update-missing");
  }

  const updated = await updateStaffMember(id, {
    name,
    username,
    role,
    title,
    active,
    password,
  });

  if ("error" in updated && updated.error === "not-found") {
    redirect("/staff?error=not-found");
  }

  if ("error" in updated && updated.error === "username-exists") {
    redirect("/staff?error=username-exists");
  }

  if ("member" in updated && updated.member) {
    await createActivityLog({
      action: "update",
      entityType: "staff",
      entityId: updated.member.id,
      entityLabel: updated.member.name,
      summary: `更新账号 ${updated.member.name}（${updated.member.username}）`,
      actor: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  }

  revalidatePath("/staff");
  revalidatePath("/login");
  revalidatePath("/orders/new");
  revalidatePath("/orders");
  revalidatePath("/schedule");
  redirect("/staff?updated=1");
}

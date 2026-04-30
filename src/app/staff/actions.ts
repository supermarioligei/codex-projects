"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

export async function createStaffAction(formData: FormData) {
  const name = readText(formData, "name");
  const role = readRole(formData, "role");
  const title = readText(formData, "title");
  const active = readActive(formData, "active");

  if (!name || !title || !["owner", "sales", "photographer"].includes(role)) {
    redirect("/staff?error=create-missing");
  }

  await createStaffMember({ name, role, title, active });

  revalidatePath("/staff");
  revalidatePath("/login");
  revalidatePath("/orders/new");
  redirect("/staff?created=1");
}

export async function updateStaffAction(formData: FormData) {
  const id = readText(formData, "id");
  const name = readText(formData, "name");
  const role = readRole(formData, "role");
  const title = readText(formData, "title");
  const active = readActive(formData, "active");

  if (!id || !name || !title || !["owner", "sales", "photographer"].includes(role)) {
    redirect("/staff?error=update-missing");
  }

  const updated = await updateStaffMember(id, { name, role, title, active });

  if (!updated) {
    redirect("/staff?error=not-found");
  }

  revalidatePath("/staff");
  revalidatePath("/login");
  revalidatePath("/orders/new");
  revalidatePath("/orders");
  revalidatePath("/schedule");
  redirect("/staff?updated=1");
}

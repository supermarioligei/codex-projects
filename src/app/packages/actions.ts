"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createActivityLog } from "@/lib/activity-log";
import { requireSession } from "@/lib/auth";
import { createPackageOption, updatePackageOption } from "@/lib/package-store";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createPackageAction(formData: FormData) {
  const user = await requireSession(["owner"]);
  const name = readText(formData, "name");
  const active = readText(formData, "active") === "active";

  const created = await createPackageOption({ name, active });

  if ("error" in created) {
    redirect(`/packages?error=${created.error}`);
  }

  await createActivityLog({
    action: "create",
    entityType: "package",
    entityId: created.option.id,
    entityLabel: created.option.name,
    summary: `新增套餐类型 ${created.option.name}`,
    actor: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    },
  });

  revalidatePath("/packages");
  revalidatePath("/orders");
  revalidatePath("/orders/new");
  redirect("/packages?created=1");
}

export async function updatePackageAction(formData: FormData) {
  const user = await requireSession(["owner"]);
  const id = readText(formData, "id");
  const name = readText(formData, "name");
  const active = readText(formData, "active") === "active";

  const updated = await updatePackageOption(id, { name, active });

  if ("error" in updated) {
    redirect(`/packages?error=${updated.error}`);
  }

  if (updated.option) {
    await createActivityLog({
      action: "update",
      entityType: "package",
      entityId: updated.option.id,
      entityLabel: updated.option.name,
      summary: `更新套餐类型 ${updated.option.name}`,
      actor: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  }

  revalidatePath("/packages");
  revalidatePath("/orders");
  revalidatePath("/orders/new");
  redirect("/packages?updated=1");
}

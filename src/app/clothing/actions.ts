"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createActivityLog } from "@/lib/activity-log";
import { requireSession } from "@/lib/auth";
import { createClothingOption, updateClothingOption } from "@/lib/clothing-store";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createClothingAction(formData: FormData) {
  const user = await requireSession(["owner", "production_manager"]);
  const name = readText(formData, "name");
  const active = readText(formData, "active") === "active";

  const created = await createClothingOption({ name, active });

  if ("error" in created) {
    redirect(`/clothing?error=${created.error}`);
  }

  await createActivityLog({
    action: "create",
    entityType: "clothing",
    entityId: created.option.id,
    entityLabel: created.option.name,
    summary: `新增服装种类 ${created.option.name}`,
    actor: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    },
  });

  revalidatePath("/clothing");
  revalidatePath("/orders/new");
  revalidatePath("/orders");
  redirect("/clothing?created=1");
}

export async function updateClothingAction(formData: FormData) {
  const user = await requireSession(["owner", "production_manager"]);
  const id = readText(formData, "id");
  const name = readText(formData, "name");
  const active = readText(formData, "active") === "active";

  const updated = await updateClothingOption(id, { name, active });

  if ("error" in updated) {
    redirect(`/clothing?error=${updated.error}`);
  }

  if (updated.option) {
    await createActivityLog({
      action: "update",
      entityType: "clothing",
      entityId: updated.option.id,
      entityLabel: updated.option.name,
      summary: `更新服装种类 ${updated.option.name}`,
      actor: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  }

  revalidatePath("/clothing");
  revalidatePath("/orders/new");
  revalidatePath("/orders");
  redirect("/clothing?updated=1");
}

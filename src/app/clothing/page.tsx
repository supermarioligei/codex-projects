import { AdminShell } from "@/components/admin-shell";
import { createClothingAction, updateClothingAction } from "@/app/clothing/actions";
import { getClothingOptions } from "@/lib/clothing-store";

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#93a09d] focus:border-[color:var(--accent)]";

export default async function ClothingPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string; error?: string }>;
}) {
  const params = await searchParams;
  const options = await getClothingOptions({ includeInactive: true });
  const activeCount = options.filter((item) => item.active).length;

  return (
    <AdminShell
      activeHref="/clothing"
      allowedRoles={["owner", "production_manager"]}
      title="服装管理"
      description="维护订单里的服装下拉选项，并限制同一天每种服装最多被 3 张订单选择。"
      aside={
        <>
          <p className="text-sm font-semibold">管理建议</p>
          <p className="mt-2 text-sm leading-6 muted">
            常用款保留启用状态，临时下架的款式建议停用，不要直接删除，避免历史订单丢失记录。
          </p>
        </>
      }
    >
      {params.created === "1" ? (
        <section className="rounded-[1.5rem] border border-[#cfe7db] bg-[#f2fbf6] px-5 py-4 text-sm text-[#25644d]">
          服装种类已新增，订单下拉里已经同步可选。
        </section>
      ) : null}
      {params.updated === "1" ? (
        <section className="rounded-[1.5rem] border border-[#cfe7db] bg-[#f2fbf6] px-5 py-4 text-sm text-[#25644d]">
          服装种类已更新，新的启用状态已经生效。
        </section>
      ) : null}
      {params.error ? (
        <section className="rounded-[1.5rem] border border-[#f0c8b2] bg-[#fff4ee] px-5 py-4 text-sm text-[#a3512d]">
          {params.error === "duplicate-name"
            ? "这个服装种类已经存在了，请换一个名称。"
            : "请先补全服装名称后再保存。"}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article className="soft-card rounded-[1.5rem] p-5">
          <p className="text-sm muted">总种类数</p>
          <h3 className="mt-4 text-3xl font-semibold">{options.length} 种</h3>
          <p className="mt-3 text-sm leading-6 muted">包含启用和停用的服装种类</p>
        </article>
        <article className="soft-card rounded-[1.5rem] p-5">
          <p className="text-sm muted">启用中</p>
          <h3 className="mt-4 text-3xl font-semibold">{activeCount} 种</h3>
          <p className="mt-3 text-sm leading-6 muted">订单下拉里当前可被选择的服装</p>
        </article>
        <article className="soft-card rounded-[1.5rem] p-5">
          <p className="text-sm muted">单日上限</p>
          <h3 className="mt-4 text-3xl font-semibold">3 单</h3>
          <p className="mt-3 text-sm leading-6 muted">同一天同一种服装最多只能被 3 张订单占用</p>
        </article>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_380px]">
        <section className="soft-card rounded-[1.75rem] p-5">
          <div>
            <p className="text-sm font-semibold">现有服装种类</p>
            <p className="mt-1 text-sm muted">可直接改名、停用或重新启用</p>
          </div>

          <div className="mt-5 space-y-3">
            {options.map((option) => (
              <article
                key={option.id}
                className="rounded-[1.4rem] border border-[color:var(--line)] bg-white/85 p-4"
              >
                <form action={updateClothingAction}>
                  <input type="hidden" name="id" value={option.id} />
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px]">
                    <label className="text-sm font-medium">
                      服装名称
                      <input name="name" defaultValue={option.name} className={fieldClassName} />
                    </label>
                    <label className="text-sm font-medium">
                      启用状态
                      <select
                        name="active"
                        defaultValue={option.active ? "active" : "inactive"}
                        className={fieldClassName}
                      >
                        <option value="active">启用</option>
                        <option value="inactive">停用</option>
                      </select>
                    </label>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 border-t border-[color:var(--line)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm muted">
                      当前状态：
                      <span className="ml-2 font-semibold text-[#4d4f47]">
                        {option.active ? "启用中" : "已停用"}
                      </span>
                    </div>
                    <button className="self-start rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200/70 transition hover:brightness-105 sm:self-auto">
                      保存
                    </button>
                  </div>
                </form>
              </article>
            ))}
          </div>
        </section>

        <section className="soft-card rounded-[1.75rem] p-5">
          <div>
            <p className="text-sm font-semibold">新增服装种类</p>
            <p className="mt-1 text-sm muted">新增后会立即出现在订单下拉中</p>
          </div>

          <form action={createClothingAction} className="mt-5">
            <label className="block text-sm font-medium">
              服装名称
              <input name="name" className={fieldClassName} placeholder="例如：英伦学院风" />
            </label>
            <label className="mt-4 block text-sm font-medium">
              启用状态
              <select name="active" defaultValue="active" className={fieldClassName}>
                <option value="active">启用</option>
                <option value="inactive">停用</option>
              </select>
            </label>
            <button className="mt-6 rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200/70 transition hover:brightness-105">
              新增服装种类
            </button>
          </form>
        </section>
      </div>
    </AdminShell>
  );
}

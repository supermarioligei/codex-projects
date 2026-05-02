import { AdminShell } from "@/components/admin-shell";
import { createPackageAction, updatePackageAction } from "@/app/packages/actions";
import { getPackageOptions } from "@/lib/package-store";

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#93a09d] focus:border-[color:var(--accent)]";

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string; error?: string }>;
}) {
  const params = await searchParams;
  const options = await getPackageOptions({ includeInactive: true });
  const activeCount = options.filter((item) => item.active).length;

  return (
    <AdminShell
      activeHref="/packages"
      allowedRoles={["owner"]}
      title="套餐管理"
      description="由老板维护订单里的套餐下拉选项，销售和其他角色只负责选择，不直接改套餐库。"
      aside={
        <>
          <p className="text-sm font-semibold">管理建议</p>
          <p className="mt-2 text-sm leading-6 muted">
            新套餐建议先新增再启用，历史不用的套餐可以停用保留，避免旧订单里的套餐记录消失。
          </p>
        </>
      }
    >
      {params.created === "1" ? (
        <section className="rounded-[1.5rem] border border-[#cfe7db] bg-[#f2fbf6] px-5 py-4 text-sm text-[#25644d]">
          套餐类型已新增，订单页下拉已经同步可选。
        </section>
      ) : null}
      {params.updated === "1" ? (
        <section className="rounded-[1.5rem] border border-[#cfe7db] bg-[#f2fbf6] px-5 py-4 text-sm text-[#25644d]">
          套餐类型已更新，新的启用状态已经生效。
        </section>
      ) : null}
      {params.error ? (
        <section className="rounded-[1.5rem] border border-[#f0c8b2] bg-[#fff4ee] px-5 py-4 text-sm text-[#a3512d]">
          {params.error === "duplicate-name"
            ? "这个套餐类型已经存在了，请换一个名称。"
            : "请先补全套餐名称后再保存。"}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article className="soft-card rounded-[1.5rem] p-5">
          <p className="text-sm muted">总套餐数</p>
          <h3 className="mt-4 text-3xl font-semibold">{options.length} 个</h3>
          <p className="mt-3 text-sm leading-6 muted">包含启用和停用的套餐类型</p>
        </article>
        <article className="soft-card rounded-[1.5rem] p-5">
          <p className="text-sm muted">启用中</p>
          <h3 className="mt-4 text-3xl font-semibold">{activeCount} 个</h3>
          <p className="mt-3 text-sm leading-6 muted">订单下拉里当前可被选择的套餐</p>
        </article>
        <article className="soft-card rounded-[1.5rem] p-5">
          <p className="text-sm muted">使用方式</p>
          <h3 className="mt-4 text-3xl font-semibold">下拉选择</h3>
          <p className="mt-3 text-sm leading-6 muted">销售建单时只从这里维护好的套餐里选择</p>
        </article>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_380px]">
        <section className="soft-card rounded-[1.75rem] p-5">
          <div>
            <p className="text-sm font-semibold">现有套餐类型</p>
            <p className="mt-1 text-sm muted">可直接改名、停用或重新启用</p>
          </div>

          <div className="mt-5 space-y-3">
            {options.map((option) => (
              <article
                key={option.id}
                className="rounded-[1.4rem] border border-[color:var(--line)] bg-white/85 p-4"
              >
                <form action={updatePackageAction}>
                  <input type="hidden" name="id" value={option.id} />
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px]">
                    <label className="text-sm font-medium">
                      套餐名称
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
            <p className="text-sm font-semibold">新增套餐类型</p>
            <p className="mt-1 text-sm muted">新增后会立即出现在订单下拉中</p>
          </div>

          <form action={createPackageAction} className="mt-5">
            <label className="block text-sm font-medium">
              套餐名称
              <input name="name" className={fieldClassName} placeholder="例如：毕业典礼全程跟拍" />
            </label>
            <label className="mt-4 block text-sm font-medium">
              启用状态
              <select name="active" defaultValue="active" className={fieldClassName}>
                <option value="active">启用</option>
                <option value="inactive">停用</option>
              </select>
            </label>
            <button className="mt-6 rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200/70 transition hover:brightness-105">
              新增套餐类型
            </button>
          </form>
        </section>
      </div>
    </AdminShell>
  );
}

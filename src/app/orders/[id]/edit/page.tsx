import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { updateOrderAction } from "@/app/orders/[id]/edit/actions";
import { getOrderById } from "@/lib/order-store";
import { getActiveStaffByRole } from "@/lib/staff";

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#93a09d] focus:border-[color:var(--accent)]";

function toDatetimeLocalValue(value: string) {
  return value ? value.replace(" ", "T") : "";
}

function buildPhotographerOptions(currentValue: string, options: string[]) {

  if (currentValue && !options.includes(currentValue)) {
    return [currentValue, ...options];
  }

  return options;
}

function toDateInputValue(value: string | undefined) {
  return value ? value.slice(0, 10) : "";
}

export default async function EditOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; photographer?: string; conflictOrderId?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const order = await getOrderById(id);
  const [salesStaff, productionManagers, photographerStaff] = await Promise.all([
    getActiveStaffByRole("sales"),
    getActiveStaffByRole("production_manager"),
    getActiveStaffByRole("photographer"),
  ]);

  if (!order) {
    notFound();
  }

  const photographerOptions = buildPhotographerOptions(
    order.photographer ?? "",
    photographerStaff.map((member) => member.name),
  );
  const assistantPhotographerOptions = buildPhotographerOptions(
    order.assistantPhotographer ?? "",
    photographerStaff.map((member) => member.name),
  );
  const leadVideographerOptions = buildPhotographerOptions(
    order.leadVideographer ?? "",
    photographerStaff.map((member) => member.name),
  );
  const assistantVideographerOptions = buildPhotographerOptions(
    order.assistantVideographer ?? "",
    photographerStaff.map((member) => member.name),
  );
  const conflictOrder = query.conflictOrderId ? await getOrderById(query.conflictOrderId) : null;

  return (
    <AdminShell
      activeHref="/orders"
      title="编辑订单"
      description="修改订单基础资料、拍摄安排与状态，已收金额仍由关联流水自动汇总。"
      aside={
        <>
          <p className="text-sm font-semibold">编辑说明</p>
          <p className="mt-2 text-sm leading-6 muted">
            如果要调整实收金额，请去登记或修改关联流水；这里主要维护订单本身的信息。
          </p>
        </>
      }
    >
      <div className="rounded-[2rem] bg-[linear-gradient(135deg,#244944_0%,#4b786e_42%,#ef8f68_100%)] px-6 py-7 text-white shadow-2xl shadow-orange-100/70">
        <p className="text-sm uppercase tracking-[0.24em] text-white/74">Edit Order</p>
        <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">{order.customer}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/82">
          修改学校、班级、拍摄日期、订单金额、状态、摄影师和备注等信息。
        </p>
      </div>

      <section className="soft-card rounded-[1.75rem] p-5">
        {query.error === "missing" ? (
          <div className="mb-5 rounded-2xl border border-[#f0c8b2] bg-[#fff4ee] px-4 py-3 text-sm text-[#a3512d]">
            请先补全客户名称、联系人、学校、班级、拍摄日期和套餐类型这些必填项。
          </div>
        ) : null}
        {query.error === "conflict" ? (
          <div className="mb-5 rounded-2xl border border-[#f0d3a8] bg-[#fff7e8] px-4 py-3 text-sm text-[#8a5a14]">
            {query.photographer || "该摄影师"} 在这个拍摄时间已经有安排了。
            {conflictOrder ? (
              <>
                {" "}
                冲突订单是
                <Link href={`/orders/${conflictOrder.id}`} className="font-semibold underline underline-offset-2">
                  {conflictOrder.customer}
                </Link>
                ，时间为 {conflictOrder.shootDate}。
              </>
            ) : (
              " 请调整摄影师或拍摄时间后再保存。"
            )}
          </div>
        ) : null}

        <form action={updateOrderAction}>
          <input type="hidden" name="orderId" value={order.id} />

          <div className="grid gap-5 lg:grid-cols-2">
            <label className="text-sm font-medium">
              客户名称 / 订单标题
              <input
                name="customer"
                required
                defaultValue={order.customer}
                className={fieldClassName}
              />
            </label>
            <label className="text-sm font-medium">
              联系人
              <input
                name="contact"
                required
                defaultValue={order.contact}
                className={fieldClassName}
              />
            </label>
            <label className="text-sm font-medium">
              学校 / 机构
              <input
                name="school"
                required
                defaultValue={order.school}
                className={fieldClassName}
              />
            </label>
            <label className="text-sm font-medium">
              园区 / 校区
              <input name="campus" defaultValue={order.campus} className={fieldClassName} />
            </label>
            <label className="text-sm font-medium">
              班级
              <input
                name="className"
                required
                defaultValue={order.className}
                className={fieldClassName}
              />
            </label>
            <label className="text-sm font-medium">
              拍摄地点
              <input
                name="location"
                defaultValue={order.location}
                className={fieldClassName}
              />
            </label>
            <label className="text-sm font-medium">
              拍摄日期
              <input
                name="shootDate"
                required
                type="datetime-local"
                defaultValue={toDatetimeLocalValue(order.shootDate)}
                className={fieldClassName}
              />
            </label>
            <label className="text-sm font-medium">
              套餐类型
              <select
                name="packageName"
                required
                defaultValue={order.packageName}
                className={fieldClassName}
              >
                <option>毕业纪念全套</option>
                <option>班级合影 + 外景</option>
                <option>毕业典礼跟拍</option>
                <option>证件照 + 集体照</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              订单金额
              <input
                name="amount"
                defaultValue={String(
                  Number(order.amount.replace(/[^\d.-]/g, "")) || 0,
                )}
                className={fieldClassName}
              />
            </label>
            <label className="text-sm font-medium">
              已收金额
              <input
                disabled
                value={order.paid}
                className={`${fieldClassName} cursor-not-allowed bg-[#f8f2ea] text-[#7d7a74]`}
              />
            </label>
            <label className="text-sm font-medium">
              订单状态
              <select name="status" defaultValue={order.status} className={fieldClassName}>
                <option>待确认</option>
                <option>待拍摄</option>
                <option>待选片</option>
                <option>待交付</option>
                <option>已完成</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              归属销售
              <select
                name="salesOwner"
                defaultValue={order.salesOwner ?? ""}
                className={fieldClassName}
              >
                <option value="">暂未指定</option>
                {salesStaff.map((member) => (
                  <option key={member.id} value={member.name}>
                    {member.name} · {member.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              导演 / 执行统筹
              <select
                name="director"
                defaultValue={order.director ?? ""}
                className={fieldClassName}
              >
                <option value="">暂未安排</option>
                {productionManagers.map((member) => (
                  <option key={member.id} value={member.name}>
                    {member.name} · {member.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              主拍摄影师
              <select
                name="photographer"
                defaultValue={order.photographer ?? ""}
                className={fieldClassName}
              >
                <option value="">暂未安排</option>
                {photographerOptions.map((name) => {
                  const member = photographerStaff.find((item) => item.name === name);

                  return (
                    <option key={name} value={name}>
                      {member ? `${member.name} · ${member.title}` : `${name} · 历史录入`}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="text-sm font-medium">
              辅拍摄影师
              <select
                name="assistantPhotographer"
                defaultValue={order.assistantPhotographer ?? ""}
                className={fieldClassName}
              >
                <option value="">暂未安排</option>
                {assistantPhotographerOptions.map((name) => {
                  const member = photographerStaff.find((item) => item.name === name);

                  return (
                    <option key={name} value={name}>
                      {member ? `${member.name} · ${member.title}` : `${name} · 历史录入`}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="text-sm font-medium">
              主拍摄像师
              <select
                name="leadVideographer"
                defaultValue={order.leadVideographer ?? ""}
                className={fieldClassName}
              >
                <option value="">暂未安排</option>
                {leadVideographerOptions.map((name) => {
                  const member = photographerStaff.find((item) => item.name === name);

                  return (
                    <option key={name} value={name}>
                      {member ? `${member.name} · ${member.title}` : `${name} · 历史录入`}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="text-sm font-medium">
              辅拍摄像师
              <select
                name="assistantVideographer"
                defaultValue={order.assistantVideographer ?? ""}
                className={fieldClassName}
              >
                <option value="">暂未安排</option>
                {assistantVideographerOptions.map((name) => {
                  const member = photographerStaff.find((item) => item.name === name);

                  return (
                    <option key={name} value={name}>
                      {member ? `${member.name} · ${member.title}` : `${name} · 历史录入`}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="text-sm font-medium">
              合同交付日期
              <input
                name="deliveryDueDate"
                type="date"
                defaultValue={toDateInputValue(order.deliveryDueDate)}
                className={fieldClassName}
              />
            </label>
          </div>

          <label className="mt-5 block text-sm font-medium">
            备注
            <textarea
              name="notes"
              defaultValue={order.notes ?? ""}
              className={`${fieldClassName} min-h-32 resize-y`}
            />
          </label>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200/70 transition hover:brightness-105">
              保存修改
            </button>
            <Link
              href={`/orders/${order.id}`}
              className="rounded-full border border-[color:var(--line)] px-5 py-3 text-center text-sm font-semibold hover:bg-white"
            >
              返回订单详情
            </Link>
          </div>
        </form>
      </section>
    </AdminShell>
  );
}

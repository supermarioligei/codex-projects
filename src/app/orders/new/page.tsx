import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { createOrderAction } from "@/app/orders/new/actions";
import { getOrderById } from "@/lib/order-store";
import { getActiveStaffByRole } from "@/lib/staff";

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#93a09d] focus:border-[color:var(--accent)]";

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; photographer?: string; conflictOrderId?: string }>;
}) {
  const params = await searchParams;
  const [salesStaff, productionManagers, crewStaff] = await Promise.all([
    getActiveStaffByRole("sales"),
    getActiveStaffByRole("production_manager"),
    getActiveStaffByRole("photographer"),
  ]);
  const conflictOrder = params.conflictOrderId
    ? await getOrderById(params.conflictOrderId)
    : null;

  return (
    <AdminShell
      activeHref="/orders/new"
      title="新建订单"
      description="录入学校、班级、拍摄安排和收款信息，形成一条完整的业务订单。"
      aside={
        <>
          <p className="text-sm font-semibold">录入建议</p>
          <p className="mt-2 text-sm leading-6 muted">
            先录学校、班级和拍摄日期，再填套餐金额和定金，后续才更方便做提醒和流水关联。
          </p>
        </>
      }
    >
      <div className="rounded-[2rem] bg-[linear-gradient(135deg,#244944_0%,#4b786e_42%,#ef8f68_100%)] px-6 py-7 text-white shadow-2xl shadow-orange-100/70">
        <p className="text-sm uppercase tracking-[0.24em] text-white/74">New Order</p>
        <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">订单录入表单</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/82">
          现在可以直接保存到本地订单库；如果填写了已收定金，系统会自动生成一条关联收款流水。
        </p>
      </div>

      <section className="soft-card rounded-[1.75rem] p-5">
        {params.error === "missing" ? (
          <div className="mb-5 rounded-2xl border border-[#f0c8b2] bg-[#fff4ee] px-4 py-3 text-sm text-[#a3512d]">
            请先补全客户名称、联系人、学校、班级、拍摄日期和套餐类型这些必填项。
          </div>
        ) : null}
        {params.error === "conflict" ? (
          <div className="mb-5 rounded-2xl border border-[#f0d3a8] bg-[#fff7e8] px-4 py-3 text-sm text-[#8a5a14]">
            {params.photographer || "该摄影师"} 在这个拍摄时间已经有安排了。
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

        <form action={createOrderAction}>
          <div className="grid gap-5 lg:grid-cols-2">
          <label className="text-sm font-medium">
            客户名称 / 订单标题
            <input
              name="customer"
              required
              className={fieldClassName}
              placeholder="例如：星辰幼儿园大一班毕业照"
            />
          </label>
          <label className="text-sm font-medium">
            联系人
            <input
              name="contact"
              required
              className={fieldClassName}
              placeholder="例如：刘老师 13800000000"
            />
          </label>
          <label className="text-sm font-medium">
            学校 / 机构
            <input
              name="school"
              required
              className={fieldClassName}
              placeholder="例如：星辰幼儿园"
            />
          </label>
          <label className="text-sm font-medium">
            园区 / 校区
            <input name="campus" className={fieldClassName} placeholder="例如：滨江园区" />
          </label>
          <label className="text-sm font-medium">
            班级
            <input
              name="className"
              required
              className={fieldClassName}
              placeholder="例如：大一班"
            />
          </label>
          <label className="text-sm font-medium">
            拍摄地点
            <input
              name="location"
              className={fieldClassName}
              placeholder="例如：幼儿园操场 + 教室"
            />
          </label>
          <label className="text-sm font-medium">
            拍摄日期
            <input
              name="shootDate"
              required
              className={fieldClassName}
              type="datetime-local"
            />
          </label>
          <label className="text-sm font-medium">
            套餐类型
            <select name="packageName" required className={fieldClassName} defaultValue="">
              <option value="" disabled>
                请选择套餐
              </option>
              <option>毕业纪念全套</option>
              <option>班级合影 + 外景</option>
              <option>毕业典礼跟拍</option>
              <option>证件照 + 集体照</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            订单金额
            <input name="amount" className={fieldClassName} placeholder="例如：8600" />
          </label>
          <label className="text-sm font-medium">
            已收定金
            <input name="paid" className={fieldClassName} placeholder="例如：4000" />
          </label>
          <label className="text-sm font-medium">
            订单状态
            <select name="status" className={fieldClassName} defaultValue="待确认">
              <option>待确认</option>
              <option>待拍摄</option>
              <option>待选片</option>
              <option>待交付</option>
              <option>已完成</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            归属销售
            <select name="salesOwner" defaultValue="" className={fieldClassName}>
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
            <select name="director" defaultValue="" className={fieldClassName}>
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
            <select name="photographer" defaultValue="" className={fieldClassName}>
              <option value="">暂未安排</option>
              {crewStaff.map((member) => (
                <option key={member.id} value={member.name}>
                  {member.name} · {member.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            辅拍摄影师
            <select name="assistantPhotographer" defaultValue="" className={fieldClassName}>
              <option value="">暂未安排</option>
              {crewStaff.map((member) => (
                <option key={member.id} value={member.name}>
                  {member.name} · {member.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            主拍摄像师
            <select name="leadVideographer" defaultValue="" className={fieldClassName}>
              <option value="">暂未安排</option>
              {crewStaff.map((member) => (
                <option key={member.id} value={member.name}>
                  {member.name} · {member.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            辅拍摄像师
            <select name="assistantVideographer" defaultValue="" className={fieldClassName}>
              <option value="">暂未安排</option>
              {crewStaff.map((member) => (
                <option key={member.id} value={member.name}>
                  {member.name} · {member.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            合同交付日期
            <input name="deliveryDueDate" type="date" className={fieldClassName} />
          </label>
          </div>

          <label className="mt-5 block text-sm font-medium">
            备注
            <textarea
              name="notes"
              className={`${fieldClassName} min-h-32 resize-y`}
              placeholder="记录家长要求、道具需求、交付时限、尾款说明等"
            />
          </label>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200/70 transition hover:brightness-105">
              保存订单
            </button>
            <Link
              href="/orders"
              className="rounded-full border border-[color:var(--line)] px-5 py-3 text-center text-sm font-semibold hover:bg-white"
            >
              返回订单列表
            </Link>
          </div>
        </form>
      </section>
    </AdminShell>
  );
}

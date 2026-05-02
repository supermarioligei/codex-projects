import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { ClothingSelect } from "@/components/clothing-select";
import { PaymentAmountFields } from "@/components/payment-amount-fields";
import { createOrderAction } from "@/app/orders/new/actions";
import { requireSession } from "@/lib/auth";
import { getClothingOptions } from "@/lib/clothing-store";
import { getOrderById, getOrders } from "@/lib/order-store";
import { getPackageOptions } from "@/lib/package-store";
import { getActiveStaffByRole } from "@/lib/staff";

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#93a09d] focus:border-[color:var(--accent)]";

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    photographer?: string;
    conflictOrderId?: string;
    clothingType?: string;
  }>;
}) {
  const user = await requireSession(["owner", "sales"]);
  const params = await searchParams;
  const [salesStaff, productionManagers, crewStaff, clothingOptions, packageOptions, existingOrders] = await Promise.all([
    getActiveStaffByRole("sales"),
    getActiveStaffByRole("production_manager"),
    getActiveStaffByRole("photographer"),
    getClothingOptions(),
    getPackageOptions(),
    getOrders(),
  ]);
  const isSales = user.role === "sales";
  const conflictOrder = params.conflictOrderId
    ? await getOrderById(params.conflictOrderId)
    : null;

  return (
    <AdminShell
      activeHref="/orders/new"
      title="新建订单"
      description={
        isSales
          ? "销售先录入学校/班级、联系方式、城市、合同金额和交付日期，后续导演和拍摄团队由拍摄主管安排。"
          : "录入学校/班级、联系方式、拍摄安排和收款信息，形成一条完整的业务订单。"
      }
      aside={
        <>
          <p className="text-sm font-semibold">录入建议</p>
          <p className="mt-2 text-sm leading-6 muted">
            {isSales
              ? "先把学校/班级、联系方式、城市、拍摄日期、合同金额和交付日期录完整，后续拍摄主管会补导演和主辅拍安排。"
              : "先录学校/班级、联系方式和拍摄日期，再填套餐金额和定金，后续才更方便做提醒和流水关联。"}
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
            请先补全学校/班级、联系人、联系方式、拍摄日期、套餐类型，以及每笔已收对应的金额和日期。
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
        {params.error === "clothing-limit" ? (
          <div className="mb-5 rounded-2xl border border-[#f0d3a8] bg-[#fff7e8] px-4 py-3 text-sm text-[#8a5a14]">
            {params.clothingType || "所选服装"} 在这一天已经被 3 张订单占满了，请改选其他服装或调整拍摄日期。
          </div>
        ) : null}

        <form action={createOrderAction}>
          <div className="grid gap-5 lg:grid-cols-2">
          <label className="text-sm font-medium">
            学校 / 班级
            <input
              name="customer"
              required
              className={fieldClassName}
              placeholder="例如：星辰幼儿园大一班"
            />
          </label>
          <label className="text-sm font-medium">
            联系人
            <input
              name="contact"
              required
              className={fieldClassName}
              placeholder="例如：刘老师"
            />
          </label>
          <label className="text-sm font-medium">
            联系方式
            <input
              name="school"
              required
              className={fieldClassName}
              placeholder="例如：13800000000 / 微信 tongying001"
            />
          </label>
          <label className="text-sm font-medium">
            城市
            <input name="campus" className={fieldClassName} placeholder="例如：杭州" />
          </label>
          <label className="text-sm font-medium">
            人数
            <input name="peopleCount" className={fieldClassName} placeholder="例如：42 人" />
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
              id="shoot-date"
              name="shootDate"
              required
              className={fieldClassName}
              type="date"
            />
          </label>
          <label className="text-sm font-medium">
            时段
            <select name="shootPeriod" required className={fieldClassName} defaultValue="上午">
              <option value="上午">上午</option>
              <option value="下午">下午</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            套餐类型
            <select name="packageName" required className={fieldClassName} defaultValue="">
              <option value="" disabled>
                请选择套餐
              </option>
              {packageOptions.map((option) => (
                <option key={option.id} value={option.name}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            服装选择
            <ClothingSelect
              options={clothingOptions}
              bookings={existingOrders
                .filter((order) => order.clothingType)
                .reduce<Array<{ clothingType: string; shootDate: string; count: number }>>(
                  (list, order) => {
                    const existing = list.find(
                      (item) =>
                        item.clothingType === order.clothingType &&
                        item.shootDate.slice(0, 10) === order.shootDate.slice(0, 10),
                    );

                    if (existing) {
                      existing.count += 1;
                    } else {
                      list.push({
                        clothingType: order.clothingType ?? "",
                        shootDate: order.shootDate,
                        count: 1,
                      });
                    }

                    return list;
                  },
                  [],
                )}
              shootDateInputId="shoot-date"
            />
          </label>
          <label className="text-sm font-medium">
            订单金额
            <input name="amount" className={fieldClassName} placeholder="例如：8600" />
          </label>
          <div className="lg:col-span-2">
            <PaymentAmountFields />
          </div>
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
            {isSales ? (
              <>
                <input
                  disabled
                  value={`${user.name} · ${user.username}`}
                  className={`${fieldClassName} cursor-not-allowed bg-[#f8f2ea] text-[#7d7a74]`}
                />
                <input type="hidden" name="salesOwner" value={user.name} />
              </>
            ) : (
              <select name="salesOwner" defaultValue="" className={fieldClassName}>
                <option value="">暂未指定</option>
                {salesStaff.map((member) => (
                  <option key={member.id} value={member.name}>
                    {member.name} · {member.title}
                  </option>
                ))}
              </select>
            )}
          </label>
          <label className="text-sm font-medium">
            签单客服
            <input
              name="signingClerk"
              className={fieldClassName}
              placeholder="例如：小陈"
            />
          </label>
          {isSales ? null : (
            <>
              <label className="text-sm font-medium">
                导演
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
            </>
          )}
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

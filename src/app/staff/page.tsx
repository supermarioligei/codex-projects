import { AdminShell } from "@/components/admin-shell";
import { createStaffAction, updateStaffAction } from "@/app/staff/actions";
import { roleLabels, type UserRole } from "@/lib/auth";
import { getOrders } from "@/lib/order-store";
import { getStaffByRole, getStaffMembers, type StaffMember } from "@/lib/staff";

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#93a09d] focus:border-[color:var(--accent)]";

function toDate(value: string) {
  return new Date(value.replace(" ", "T"));
}

function summarizeRole(role: UserRole) {
  const descriptions: Record<UserRole, string> = {
    owner: "负责经营决策、价格策略和关键财务把控",
    sales: "负责接单推进、客户沟通、尾款回收和交付协同",
    photographer: "负责拍摄执行、器材准备、现场交付素材和班级对接",
  };

  return descriptions[role];
}

function getAssignedOrdersCount(member: StaffMember, orders: Awaited<ReturnType<typeof getOrders>>) {
  if (member.role !== "photographer") {
    return 0;
  }

  return orders.filter((order) => order.photographer?.trim() === member.name).length;
}

function getNextShoot(member: StaffMember, orders: Awaited<ReturnType<typeof getOrders>>, now: Date) {
  if (member.role !== "photographer") {
    return null;
  }

  return (
    orders
      .filter(
        (order) => order.photographer?.trim() === member.name && toDate(order.shootDate) >= now,
      )
      .sort((a, b) => a.shootDate.localeCompare(b.shootDate))[0] ?? null
  );
}

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string; error?: string }>;
}) {
  const params = await searchParams;
  const [orders, staffMembers, ownerMembers, salesMembers, photographerMembers] =
    await Promise.all([
      getOrders(),
      getStaffMembers({ includeInactive: true }),
      getStaffByRole("owner", { includeInactive: true }),
      getStaffByRole("sales", { includeInactive: true }),
      getStaffByRole("photographer", { includeInactive: true }),
    ]);

  const now = new Date();
  const roleGroups: Array<{ role: UserRole; members: StaffMember[] }> = [
    { role: "owner", members: ownerMembers },
    { role: "sales", members: salesMembers },
    { role: "photographer", members: photographerMembers },
  ];
  const activeMembers = staffMembers.filter((member) => member.active);
  const activePhotographers = photographerMembers.filter((member) => member.active);
  const upcomingShoots = orders.filter((order) => toDate(order.shootDate) >= now);
  const assignedPhotographers = new Set(
    orders.map((order) => order.photographer?.trim()).filter(Boolean),
  );

  return (
    <AdminShell
      activeHref="/staff"
      allowedRoles={["owner"]}
      title="人员管理"
      description="只有老板可以查看和维护人员名单。新增、调岗、停用后，登录页和摄影师分配会自动同步。"
      aside={
        <>
          <p className="text-sm font-semibold">管理建议</p>
          <p className="mt-2 text-sm leading-6 muted">
            人员变动时优先做“停用”而不是直接删掉，这样历史订单里的摄影师归属还能保留下来，不会影响复盘。
          </p>
        </>
      }
    >
      <div className="rounded-[2rem] bg-[linear-gradient(135deg,#20423d_0%,#4e766d_42%,#e69a72_100%)] px-6 py-7 text-white shadow-2xl shadow-orange-100/70">
        <p className="text-sm uppercase tracking-[0.24em] text-white/74">Staff</p>
        <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">人员与账号管理</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/82">
          这里已经不是静态展示了。你可以直接新增人员、修改岗位和职务，或者停用离职同事。
        </p>
      </div>

      {params.created === "1" ? (
        <section className="rounded-[1.5rem] border border-[#cfe7db] bg-[#f2fbf6] px-5 py-4 text-sm text-[#25644d]">
          人员已新增，登录页和订单摄影师选择已经同步更新。
        </section>
      ) : null}
      {params.updated === "1" ? (
        <section className="rounded-[1.5rem] border border-[#cfe7db] bg-[#f2fbf6] px-5 py-4 text-sm text-[#25644d]">
          人员信息已更新，新的启用状态和岗位已经生效。
        </section>
      ) : null}
      {params.error ? (
        <section className="rounded-[1.5rem] border border-[#f0c8b2] bg-[#fff4ee] px-5 py-4 text-sm text-[#a3512d]">
          {params.error === "create-missing" || params.error === "update-missing"
            ? "请先补全姓名、岗位和职务后再保存。"
            : "这条人员记录没有找到，可能已经被调整过了。"}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="soft-card rounded-[1.5rem] p-5">
          <p className="text-sm muted">总人数</p>
          <h3 className="mt-4 text-3xl font-semibold">{staffMembers.length} 人</h3>
          <p className="mt-3 text-sm leading-6 muted">包含启用和停用人员，方便保留历史记录</p>
        </article>
        <article className="soft-card rounded-[1.5rem] p-5">
          <p className="text-sm muted">启用中</p>
          <h3 className="mt-4 text-3xl font-semibold">{activeMembers.length} 人</h3>
          <p className="mt-3 text-sm leading-6 muted">当前可登录、可分配到订单和排期里的人员</p>
        </article>
        <article className="soft-card rounded-[1.5rem] p-5">
          <p className="text-sm muted">启用摄影师</p>
          <h3 className="mt-4 text-3xl font-semibold">{activePhotographers.length} 人</h3>
          <p className="mt-3 text-sm leading-6 muted">新建订单和编辑订单时的摄影师下拉来源</p>
        </article>
        <article className="soft-card rounded-[1.5rem] p-5">
          <p className="text-sm muted">未来待拍场次</p>
          <h3 className="mt-4 text-3xl font-semibold">{upcomingShoots.length} 场</h3>
          <p className="mt-3 text-sm leading-6 muted">
            其中 {assignedPhotographers.size} 位摄影师已经挂单，可继续做排班优化
          </p>
        </article>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <div className="space-y-4">
          {roleGroups.map(({ role, members }) => (
            <section key={role} className="soft-card rounded-[1.75rem] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{roleLabels[role]}团队</p>
                  <p className="mt-1 text-sm muted">{summarizeRole(role)}</p>
                </div>
                <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold metric-accent">
                  {members.length} 人
                </span>
              </div>

              <div className="mt-5 grid gap-3">
                {members.map((member) => {
                  const assignedOrdersCount = getAssignedOrdersCount(member, orders);
                  const nextShoot = getNextShoot(member, orders, now);

                  return (
                    <article
                      key={member.id}
                      className="rounded-[1.4rem] border border-[color:var(--line)] bg-white/85 p-4"
                    >
                      <form action={updateStaffAction}>
                        <input type="hidden" name="id" value={member.id} />

                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold">{member.name}</p>
                            <p className="mt-1 text-sm muted">{member.title}</p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              member.active
                                ? "bg-[#eef8f1] text-[#25644d]"
                                : "bg-[#f5ece7] text-[#9b5b3f]"
                            }`}
                          >
                            {member.active ? "启用中" : "已停用"}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <label className="text-sm font-medium">
                            姓名
                            <input
                              name="name"
                              defaultValue={member.name}
                              className={fieldClassName}
                            />
                          </label>
                          <label className="text-sm font-medium">
                            职务
                            <input
                              name="title"
                              defaultValue={member.title}
                              className={fieldClassName}
                            />
                          </label>
                          <label className="text-sm font-medium">
                            岗位
                            <select
                              name="role"
                              defaultValue={member.role}
                              className={fieldClassName}
                            >
                              <option value="owner">{roleLabels.owner}</option>
                              <option value="sales">{roleLabels.sales}</option>
                              <option value="photographer">{roleLabels.photographer}</option>
                            </select>
                          </label>
                          <label className="text-sm font-medium">
                            启用状态
                            <select
                              name="active"
                              defaultValue={member.active ? "active" : "inactive"}
                              className={fieldClassName}
                            >
                              <option value="active">启用</option>
                              <option value="inactive">停用</option>
                            </select>
                          </label>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-[#f8f5ef] px-4 py-3 text-sm">
                            <p className="muted">已分配订单</p>
                            <p className="mt-1 text-lg font-semibold">{assignedOrdersCount} 单</p>
                          </div>
                          <div className="rounded-2xl bg-[#f8f5ef] px-4 py-3 text-sm">
                            <p className="muted">下一场拍摄</p>
                            <p className="mt-1 text-sm font-semibold">
                              {nextShoot ? nextShoot.shootDate : "暂未安排"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <button className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200/70 transition hover:brightness-105">
                            保存人员信息
                          </button>
                        </div>
                      </form>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <section className="soft-card rounded-[1.75rem] p-5">
          <div>
            <p className="text-sm font-semibold">新增人员</p>
            <p className="mt-1 text-sm muted">适合录入新入职摄影师、客服或管理者</p>
          </div>

          <form action={createStaffAction} className="mt-5">
            <label className="block text-sm font-medium">
              姓名
              <input
                name="name"
                className={fieldClassName}
                placeholder="例如：小宇"
              />
            </label>

            <label className="mt-4 block text-sm font-medium">
              岗位
              <select name="role" defaultValue="photographer" className={fieldClassName}>
                <option value="owner">{roleLabels.owner}</option>
                <option value="sales">{roleLabels.sales}</option>
                <option value="photographer">{roleLabels.photographer}</option>
              </select>
            </label>

            <label className="mt-4 block text-sm font-medium">
              职务
              <input
                name="title"
                className={fieldClassName}
                placeholder="例如：跟拍摄影师"
              />
            </label>

            <label className="mt-4 block text-sm font-medium">
              启用状态
              <select name="active" defaultValue="active" className={fieldClassName}>
                <option value="active">启用</option>
                <option value="inactive">停用</option>
              </select>
            </label>

            <button className="mt-6 rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200/70 transition hover:brightness-105">
              新增人员
            </button>
          </form>

          <div className="mt-6 rounded-[1.4rem] border border-dashed border-[color:var(--line)] bg-[#fffaf3] px-4 py-4 text-sm leading-6 muted">
            停用后，这个人会从登录建议和摄影师分配下拉里消失，但历史订单里的名字会继续保留。
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

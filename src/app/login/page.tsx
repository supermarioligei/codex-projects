import { redirect } from "next/navigation";
import { getSessionUser, roleLabels } from "@/lib/auth";
import { loginAction } from "@/app/login/actions";
import { getActiveStaffByRole, getActiveStaffMembers } from "@/lib/staff";

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#93a09d] focus:border-[color:var(--accent)]";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();

  if (user) {
    redirect("/");
  }

  const params = await searchParams;
  const [staffMembers, photographerMembers, salesMembers, ownerMembers] = await Promise.all([
    getActiveStaffMembers(),
    getActiveStaffByRole("photographer"),
    getActiveStaffByRole("sales"),
    getActiveStaffByRole("owner"),
  ]);
  const photographerNames = photographerMembers.map((member) => member.name);
  const salesNames = salesMembers.map((member) => member.name);
  const ownerNames = ownerMembers.map((member) => member.name);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <section className="glass-panel grid w-full overflow-hidden rounded-[2rem] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="bg-[linear-gradient(135deg,#21443f_0%,#4b786d_40%,#ef936b_100%)] px-6 py-8 text-white sm:px-8 lg:px-10">
          <p className="text-sm uppercase tracking-[0.28em] text-white/72">TongYing Studio</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            儿童毕业摄影业务后台
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/82 sm:text-base">
            先登录身份，再进入各自的工作台。老板更关注经营数据，客服更关注订单和回款，摄影师更关注拍摄排期和执行任务。
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {(
              [
                {
                  role: "owner",
                  title: "老板视角",
                  detail: "经营看板、财务、交付、全部提醒",
                },
                {
                  role: "sales",
                  title: "客服视角",
                  detail: "订单推进、尾款跟进、交付协同",
                },
                {
                  role: "photographer",
                  title: "摄影师视角",
                  detail: "今日拍摄、本周排期、执行提醒",
                },
              ] as const
            ).map((item) => (
              <article key={item.role} className="rounded-[1.5rem] border border-white/16 bg-white/10 p-4 backdrop-blur">
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/78">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="px-6 py-8 sm:px-8 lg:px-10">
          <div className="max-w-md">
            <p className="text-sm uppercase tracking-[0.22em] muted">Login</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">登录工作台</h2>
            <p className="mt-3 text-sm leading-7 muted">
              当前先用演示登录，输入姓名并选择身份即可进入。后面我们再接正式账号体系。
            </p>
          </div>

          {params.error === "missing" ? (
            <div className="mt-6 rounded-2xl border border-[#f0c8b2] bg-[#fff4ee] px-4 py-3 text-sm text-[#a3512d]">
              请先填写姓名并选择身份。
            </div>
          ) : null}
          {params.error === "invalid" ? (
            <div className="mt-6 rounded-2xl border border-[#f0d3a8] bg-[#fff7e8] px-4 py-3 text-sm text-[#8a5a14]">
              这个姓名和身份当前不在启用人员名单里，请联系老板检查人员管理。
            </div>
          ) : null}

          <form action={loginAction} className="mt-8 max-w-md">
            <label className="block text-sm font-medium">
              你的姓名
              <input
                name="name"
                required
                list="staff-names"
                className={fieldClassName}
                placeholder="例如：张总 / 小林 / 阿峰"
              />
            </label>

            <datalist id="staff-names">
              {staffMembers.map((member) => (
                <option key={member.id} value={member.name} />
              ))}
            </datalist>

            <label className="mt-5 block text-sm font-medium">
              登录身份
              <select name="role" required defaultValue="owner" className={fieldClassName}>
                <option value="owner">{roleLabels.owner}</option>
                <option value="sales">{roleLabels.sales}</option>
                <option value="photographer">{roleLabels.photographer}</option>
              </select>
            </label>

            <div className="mt-6 rounded-[1.5rem] border border-[color:var(--line)] bg-[#fffaf4] p-4 text-sm leading-6 muted">
              <p className="font-medium text-[#4e4a44]">演示账号建议</p>
              <p className="mt-2">老板：{ownerNames.join(" / ")}</p>
              <p className="mt-1">客服：{salesNames.join(" / ")}</p>
              <p className="mt-1">摄影师：{photographerNames.join(" / ")}</p>
            </div>

            <button className="mt-6 rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200/70 transition hover:brightness-105">
              进入系统
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

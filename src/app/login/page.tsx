import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { loginAction } from "@/app/login/actions";
import {
  DEFAULT_TEMP_PASSWORD,
  getActiveStaffByRole,
} from "@/lib/staff";

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
  const [
    photographerMembers,
    salesMembers,
    ownerMembers,
    productionMembers,
    financeMembers,
    deliveryMembers,
  ] = await Promise.all([
    getActiveStaffByRole("photographer"),
    getActiveStaffByRole("sales"),
    getActiveStaffByRole("owner"),
    getActiveStaffByRole("production_manager"),
    getActiveStaffByRole("finance_director"),
    getActiveStaffByRole("delivery_manager"),
  ]);

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
                  title: "销售视角",
                  detail: "建单推进、客户跟进、重点提醒",
                },
                {
                  role: "production_manager",
                  title: "拍摄主管视角",
                  detail: "排期统筹、导演与主辅拍安排、执行跟踪",
                },
                {
                  role: "finance_director",
                  title: "财务总监视角",
                  detail: "全部流水、订单归属与整体财务概览",
                },
                {
                  role: "delivery_manager",
                  title: "交付主管视角",
                  detail: "交付推进、产出跟踪、超期风险控制",
                },
                {
                  role: "photographer",
                  title: "拍摄执行视角",
                  detail: "自己参与的拍摄任务、排期和提醒",
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
              现在已经切到正式账号登录。使用老板创建的用户名和密码进入系统，不再通过姓名和角色直接登录。
            </p>
          </div>

          {params.error === "missing" ? (
            <div className="mt-6 rounded-2xl border border-[#f0c8b2] bg-[#fff4ee] px-4 py-3 text-sm text-[#a3512d]">
              请先填写用户名和密码。
            </div>
          ) : null}
          {params.error === "invalid" ? (
            <div className="mt-6 rounded-2xl border border-[#f0d3a8] bg-[#fff7e8] px-4 py-3 text-sm text-[#8a5a14]">
              用户名或密码不正确，或者该账号已经被停用，请联系老板检查人员管理。
            </div>
          ) : null}

          <form action={loginAction} className="mt-8 max-w-md">
            <label className="block text-sm font-medium">
              用户名
              <input
                name="username"
                required
                className={fieldClassName}
                placeholder="例如：zhang / xiaolin / afeng"
              />
            </label>

            <label className="mt-5 block text-sm font-medium">
              密码
              <input
                name="password"
                type="password"
                required
                className={fieldClassName}
                placeholder="输入你的登录密码"
              />
            </label>

            <div className="mt-6 rounded-[1.5rem] border border-[color:var(--line)] bg-[#fffaf4] p-4 text-sm leading-6 muted">
              <p className="font-medium text-[#4e4a44]">试用期初始账号</p>
              <p className="mt-2">老板：{ownerMembers.map((member) => member.username).join(" / ")}</p>
              <p className="mt-1">客服：{salesMembers.map((member) => member.username).join(" / ")}</p>
              <p className="mt-1">
                拍摄主管：{productionMembers.map((member) => member.username).join(" / ")}
              </p>
              <p className="mt-1">
                财务总监：{financeMembers.map((member) => member.username).join(" / ")}
              </p>
              <p className="mt-1">
                交付主管：{deliveryMembers.map((member) => member.username).join(" / ")}
              </p>
              <p className="mt-1">
                拍摄执行：{photographerMembers.map((member) => member.username).join(" / ")}
              </p>
              <p className="mt-3">默认初始密码：{DEFAULT_TEMP_PASSWORD}</p>
              <p className="mt-1">建议老板登录后，尽快在人员管理里为每个人重置独立密码。</p>
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

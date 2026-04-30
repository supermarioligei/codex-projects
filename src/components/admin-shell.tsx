import Link from "next/link";
import { logoutAction } from "@/app/login/actions";
import { requireSession, roleLabels, type UserRole } from "@/lib/auth";
import { getNavigationForRole, getRoleSummary } from "@/lib/ui";

type AdminShellProps = {
  activeHref: string;
  title: string;
  description: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
  allowedRoles?: UserRole[];
};

export async function AdminShell({
  activeHref,
  title,
  description,
  children,
  aside,
  allowedRoles,
}: AdminShellProps) {
  const user = await requireSession(allowedRoles);
  const navigationItems = getNavigationForRole(user.role);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
      <section className="glass-panel overflow-hidden rounded-[2rem]">
        <div className="grid gap-8 border-b border-[color:var(--line)] px-6 py-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
          <aside className="flex flex-col justify-between gap-8">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.22em] muted">
                  TongYing Studio
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {title}
                </h1>
                <p className="mt-3 text-sm leading-6 muted">{description}</p>
                <div className="mt-4 rounded-2xl border border-[color:var(--line)] bg-white/70 px-4 py-3">
                  <p className="text-sm font-semibold">
                    {user.name} · {roleLabels[user.role]}
                  </p>
                  <p className="mt-1 text-sm muted">{getRoleSummary(user.role)}</p>
                </div>
              </div>
              <nav className="grid gap-2 text-sm">
                {navigationItems.map((item) => {
                  const isActive = item.href === activeHref;

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`rounded-2xl px-4 py-3 transition ${
                        isActive
                          ? "bg-[color:var(--accent)] text-white shadow-lg shadow-orange-200/60"
                          : "soft-card hover:bg-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="soft-card rounded-3xl p-4">
              <form action={logoutAction} className="mb-4">
                <button className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-medium hover:bg-white">
                  退出登录
                </button>
              </form>
              {aside ?? (
                <>
                  <p className="text-sm font-semibold">今日重点</p>
                  <p className="mt-2 text-sm leading-6 muted">
                    明天有 2 场毕业照拍摄，1 个班级待确认摄影师，3 单尾款需要跟进。
                  </p>
                </>
              )}
            </div>
          </aside>

          <div className="space-y-6">{children}</div>
        </div>
      </section>
    </main>
  );
}

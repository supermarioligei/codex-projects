import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { requireSession } from "@/lib/auth";
import { buildReceiptCalendar } from "@/lib/dashboard";
import { getFinanceEntries } from "@/lib/finance-store";

const weekLabels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

function formatCurrency(value: number) {
  return `¥${value.toLocaleString("zh-CN")}`;
}

function parseMonthParam(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return new Date();
  }

  const [yearText, monthText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return new Date();
  }

  return new Date(year, month - 1, 1);
}

function parseFinanceDate(value: string) {
  const normalized = value.replace("T", " ").trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return new Date(`${normalized}T00:00:00`);
  }

  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(normalized)) {
    return new Date(normalized.replace(" ", "T"));
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCellSurface(receivedAmount: number, maxDailyReceived: number, isCurrentMonth: boolean) {
  if (!isCurrentMonth) {
    return {
      backgroundColor: "#fbf7f1",
      borderColor: "#eee4d8",
    };
  }

  if (receivedAmount <= 0 || maxDailyReceived <= 0) {
    return {
      backgroundColor: "#ffffff",
      borderColor: "var(--line)",
    };
  }

  const ratio = Math.max(0, Math.min(receivedAmount / maxDailyReceived, 1));
  const alpha = 0.16 + ratio * 0.34;

  return {
    backgroundColor: `rgba(239, 148, 108, ${alpha.toFixed(3)})`,
    borderColor: `rgba(223, 111, 79, ${(0.2 + ratio * 0.45).toFixed(3)})`,
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; date?: string }>;
}) {
  const user = await requireSession();
  const params = await searchParams;
  const baseDate = parseMonthParam(params.month);
  const financeEntries = await getFinanceEntries();
  const calendar = buildReceiptCalendar(financeEntries, baseDate);
  const selectedDate =
    params.date && calendar.cells.some((cell) => cell.date === params.date) ? params.date : "";
  const receiptEntries = financeEntries
    .filter((entry) => entry.type === "收款")
    .filter((entry) => {
      const parsed = parseFinanceDate(entry.time);
      return parsed ? toDateKey(parsed) === selectedDate : false;
    })
    .sort((a, b) => a.time.localeCompare(b.time));
  const selectedTotal = receiptEntries.reduce((sum, entry) => {
    return sum + (Number(entry.amount.replace(/[^\d.-]/g, "")) || 0);
  }, 0);

  return (
    <AdminShell
      activeHref="/"
      allowedRoles={["owner"]}
      title="入账日历"
      description="按日期查看每天的真实入账金额，并支持展开当天流水明细。"
      aside={
        <>
          <p className="text-sm font-semibold">看板说明</p>
          <p className="mt-2 text-sm leading-6 muted">
            颜色越深代表当天入账越高。点击某一天后，下方会展开当日入账笔数和流水明细。
          </p>
        </>
      }
    >
      <section className="rounded-[2rem] bg-[linear-gradient(135deg,#244944_0%,#4b786e_42%,#ef8f68_100%)] px-6 py-7 text-white shadow-2xl shadow-orange-100/70">
        <p className="text-sm uppercase tracking-[0.24em] text-white/74">Dashboard</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">{calendar.title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/82">
              当前登录身份：{user.name}。这个月累计入账 {formatCurrency(calendar.monthReceivedTotal)}。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/?month=${calendar.previousMonthKey}`}
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              上个月
            </Link>
            <Link
              href={`/?month=${calendar.monthKey}`}
              className="rounded-full bg-white/14 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/18 transition hover:bg-white/18"
            >
              本月
            </Link>
            <Link
              href={`/?month=${calendar.nextMonthKey}`}
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              下个月
            </Link>
          </div>
        </div>
      </section>

      <section className="soft-card rounded-[1.75rem] p-5">
        <div className="grid grid-cols-7 gap-3">
          {weekLabels.map((label) => (
            <div
              key={label}
              className="rounded-2xl bg-[#f7f1e8] px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#7f786e]"
            >
              {label}
            </div>
          ))}

          {calendar.cells.map((cell) => {
            const surface = getCellSurface(
              cell.receivedAmount,
              calendar.maxDailyReceived,
              cell.isCurrentMonth,
            );
            const isSelected = selectedDate === cell.date;

            return (
              <Link
                key={cell.date}
                href={`/?month=${calendar.monthKey}&date=${cell.date}`}
                className={`min-h-[126px] rounded-[1.4rem] border px-3 py-3 transition hover:-translate-y-[1px] ${
                  isSelected ? "ring-2 ring-[color:var(--accent)]" : ""
                }`}
                style={surface}
              >
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-sm font-semibold ${
                      cell.isCurrentMonth ? "text-[#2d312d]" : "text-[#b2aa9f]"
                    }`}
                  >
                    {cell.day}
                  </p>
                  {cell.receivedAmount > 0 ? (
                    <span className="rounded-full bg-white/70 px-2 py-1 text-[11px] font-semibold text-[#8f4b30]">
                      {receiptEntries.length > 0 && isSelected ? `${receiptEntries.length} 笔` : "有入账"}
                    </span>
                  ) : null}
                </div>
                <div className="mt-6">
                  <p className="text-xs muted">当日入账</p>
                  <p
                    className={`mt-2 text-sm font-semibold ${
                      cell.receivedAmount > 0 ? "text-[#7f3419]" : "text-[#a29b90]"
                    }`}
                  >
                    {cell.receivedAmount > 0 ? formatCurrency(cell.receivedAmount) : "—"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="soft-card rounded-[1.75rem] p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold">当日流水明细</p>
            <p className="mt-1 text-sm muted">
              {selectedDate
                ? `${selectedDate} 共 ${receiptEntries.length} 笔入账`
                : "点击上面的某一天，这里会展开当天入账笔数和流水明细。"}
            </p>
          </div>
          {selectedDate ? (
            <div className="text-sm font-semibold text-[color:var(--success)]">
              合计 {formatCurrency(selectedTotal)}
            </div>
          ) : null}
        </div>

        <div className="mt-5 space-y-3">
          {!selectedDate ? (
            <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line)] bg-white/70 px-4 py-6 text-sm muted">
              先从上面的月历里点一个日期。
            </div>
          ) : receiptEntries.length === 0 ? (
            <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line)] bg-white/70 px-4 py-6 text-sm muted">
              这一天没有入账流水。
            </div>
          ) : (
            receiptEntries.map((entry) => (
              <article
                key={entry.id}
                className="rounded-[1.4rem] border border-[color:var(--line)] bg-white/85 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{entry.title}</p>
                    <p className="mt-1 text-sm muted">
                      {entry.time}
                      {entry.orderLabel ? ` · ${entry.orderLabel}` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[color:var(--success)]">
                    {entry.amount}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 muted">
                  {entry.counterparty || "未填写往来方"}
                  {entry.category ? ` · ${entry.category}` : ""}
                  {entry.notes ? ` · ${entry.notes}` : ""}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </AdminShell>
  );
}

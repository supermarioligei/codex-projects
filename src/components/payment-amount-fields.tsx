"use client";

import { useState } from "react";

const inputClassName =
  "mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#93a09d] focus:border-[color:var(--accent)]";

type PaymentAmountFieldsProps = {
  defaultValues?: Array<{
    amount: string;
    date: string;
  }>;
};

export function PaymentAmountFields({
  defaultValues = [{ amount: "", date: "" }],
}: PaymentAmountFieldsProps) {
  const [values, setValues] = useState(
    defaultValues.length > 0 ? defaultValues : [{ amount: "", date: "" }],
  );

  return (
    <div className="space-y-3">
      {values.map((value, index) => (
        <div
          key={`${index}-${value.amount}-${value.date}`}
          className="grid gap-3 rounded-[1.25rem] border border-[color:var(--line)] bg-white/70 p-4 sm:grid-cols-[minmax(0,1fr)_220px_auto] sm:items-end"
        >
          <label className="text-sm font-medium">
            {index === 0 ? "已收款项" : `第 ${index + 1} 笔已收`}
            <input
              name="initialPayments"
              defaultValue={value.amount}
              className={inputClassName}
              placeholder="例如：4000"
            />
          </label>
          <label className="text-sm font-medium">
            收款日期
            <input
              name="initialPaymentDates"
              type="date"
              defaultValue={value.date}
              className={inputClassName}
            />
          </label>
          {values.length > 1 ? (
            <button
              type="button"
              onClick={() => setValues(values.filter((_, currentIndex) => currentIndex !== index))}
              className="rounded-full border border-[color:var(--line)] px-4 py-3 text-sm font-semibold hover:bg-white"
            >
              删除
            </button>
          ) : null}
        </div>
      ))}
      <button
        type="button"
        onClick={() => setValues([...values, { amount: "", date: "" }])}
        className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold hover:bg-white"
      >
        + 增加一笔已收
      </button>
    </div>
  );
}

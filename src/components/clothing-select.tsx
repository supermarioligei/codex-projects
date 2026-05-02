"use client";

import { useEffect, useMemo, useState } from "react";

type ClothingOption = {
  id: string;
  name: string;
  active: boolean;
};

type ClothingBooking = {
  clothingType: string;
  shootDate: string;
  count: number;
};

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]";

type ClothingSelectProps = {
  options: ClothingOption[];
  bookings: ClothingBooking[];
  initialShootDate?: string;
  shootDateInputId: string;
  defaultValue?: string;
  disabled?: boolean;
};

export function ClothingSelect({
  options,
  bookings,
  initialShootDate = "",
  shootDateInputId,
  defaultValue = "",
  disabled = false,
}: ClothingSelectProps) {
  const [shootDate, setShootDate] = useState(initialShootDate);

  useEffect(() => {
    const input = document.getElementById(shootDateInputId) as HTMLInputElement | null;

    if (!input) {
      return;
    }

    const handleChange = () => setShootDate(input.value);
    input.addEventListener("input", handleChange);
    input.addEventListener("change", handleChange);

    return () => {
      input.removeEventListener("input", handleChange);
      input.removeEventListener("change", handleChange);
    };
  }, [shootDateInputId]);

  const usageByName = useMemo(() => {
    const dateKey = shootDate.slice(0, 10);

    return Object.fromEntries(
      bookings
        .filter((item) => item.shootDate.slice(0, 10) === dateKey)
        .map((item) => [item.clothingType, item.count]),
    ) as Record<string, number>;
  }, [bookings, shootDate]);

  return (
    <>
      <select
        name="clothingType"
        defaultValue={defaultValue}
        disabled={disabled}
        className={`${fieldClassName} ${disabled ? "cursor-not-allowed bg-[#f8f2ea] text-[#7d7a74]" : ""}`}
      >
        <option value="">暂未选择</option>
        {options.map((option) => {
          const count = usageByName[option.name] ?? 0;
          const isFull = count >= 3 && option.name !== defaultValue;

          return (
            <option key={option.id} value={option.name} disabled={isFull}>
              {option.name}
              {shootDate ? ` · 当天已选 ${count}/3` : ""}
              {isFull ? " · 已满" : ""}
            </option>
          );
        })}
      </select>
      <p className="mt-2 text-xs muted">
        同一天同一种服装最多可被 3 张订单选择。超过后会自动禁用，保存时也会再次校验。
      </p>
    </>
  );
}

"use client";

import { cn } from "@de-tin-marin/shared/cn";
import { useState } from "react";
import type { DashboardPeriod } from "./dashboard-page.types";

type DashboardPeriodFilterProps = {
  dailyLabel: string;
  weeklyLabel: string;
  monthlyLabel: string;
};

const periods: {
  id: DashboardPeriod;
  labelKey: keyof DashboardPeriodFilterProps;
}[] = [
  { id: "daily", labelKey: "dailyLabel" },
  { id: "weekly", labelKey: "weeklyLabel" },
  { id: "monthly", labelKey: "monthlyLabel" },
];

export function DashboardPeriodFilter({
  dailyLabel,
  weeklyLabel,
  monthlyLabel,
}: DashboardPeriodFilterProps) {
  const [active, setActive] = useState<DashboardPeriod>("daily");
  const labels = { dailyLabel, weeklyLabel, monthlyLabel };

  return (
    <div
      className="bg-surface-container-low inline-flex rounded-full p-1"
      role="tablist"
      aria-label="Periodo"
    >
      {periods.map((period) => (
        <button
          key={period.id}
          type="button"
          role="tab"
          aria-selected={active === period.id}
          onClick={() => setActive(period.id)}
          className={cn(
            "font-label text-label-bold rounded-full px-4 py-2 transition-all",
            active === period.id
              ? "bg-surface-container-lowest text-primary soft-glow-pink"
              : "text-on-surface-variant hover:text-on-surface",
          )}
        >
          {labels[period.labelKey]}
        </button>
      ))}
    </div>
  );
}

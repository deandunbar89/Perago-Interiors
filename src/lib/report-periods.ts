import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
  format,
} from "date-fns";

export const REPORT_PERIODS = ["this_week", "last_week", "this_month", "last_month"] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number];

export const REPORT_PERIOD_LABELS: Record<ReportPeriod, string> = {
  this_week: "This week",
  last_week: "Last week",
  this_month: "This month",
  last_month: "Last month",
};

export type PeriodRange = { start: Date; end: Date; label: string };

/** Resolves the period picker's selection into a concrete date range. A custom
 * `from`/`to` pair (both required) always wins over the named period. */
export function resolvePeriodRange(period: string | null, from?: string, to?: string): PeriodRange {
  if (from && to) {
    const start = new Date(from);
    const end = new Date(to);
    return { start, end, label: `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}` };
  }

  const now = new Date();
  const weekOpts = { weekStartsOn: 1 as const };

  switch (period) {
    case "last_week": {
      const start = startOfWeek(subWeeks(now, 1), weekOpts);
      const end = endOfWeek(subWeeks(now, 1), weekOpts);
      return { start, end, label: `Week of ${format(start, "MMM d, yyyy")}` };
    }
    case "this_month": {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      return { start, end, label: format(start, "MMMM yyyy") };
    }
    case "last_month": {
      const start = startOfMonth(subMonths(now, 1));
      const end = endOfMonth(subMonths(now, 1));
      return { start, end, label: format(start, "MMMM yyyy") };
    }
    case "this_week":
    default: {
      const start = startOfWeek(now, weekOpts);
      const end = endOfWeek(now, weekOpts);
      return { start, end, label: `Week of ${format(start, "MMM d, yyyy")}` };
    }
  }
}

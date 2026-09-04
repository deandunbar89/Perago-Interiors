import { resolvePeriodRange } from "@/lib/report-periods";
import PeriodPicker from "./period-picker";
import TendersReport from "./tenders-report";
import ProjectsReport from "./projects-report";
import SnagsReport from "./snags-report";
import FinanceReport from "./finance-report";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; period?: string; from?: string; to?: string }>;
}) {
  const { category = "TENDERS", period = "this_week", from, to } = await searchParams;
  const range = resolvePeriodRange(period, from, to);

  return (
    <div className="p-8">
      <div className="mb-6 print:mb-4">
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-slate-500 print:hidden">
          Weekly and monthly summaries for tenders, projects and snags
        </p>
        <p className="hidden text-sm text-slate-500 print:block">
          {category === "TENDERS"
            ? "Tenders"
            : category === "PROJECTS"
              ? "Projects"
              : category === "SNAGS"
                ? "Snags"
                : "Finance"}{" "}
          report — {range.label}
        </p>
      </div>

      <PeriodPicker category={category} period={period} from={from} to={to} />

      {category === "TENDERS" && <TendersReport range={range} />}
      {category === "PROJECTS" && <ProjectsReport range={range} />}
      {category === "SNAGS" && <SnagsReport range={range} />}
      {category === "FINANCE" && <FinanceReport range={range} />}
    </div>
  );
}

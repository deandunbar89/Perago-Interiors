export const STAGES = [
  "LEAD",
  "REVIEWING",
  "TENDER_SUBMITTED",
  "WON",
  "LOST",
  "DECLINED",
  "ON_HOLD",
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  LEAD: "Lead",
  REVIEWING: "Reviewing",
  TENDER_SUBMITTED: "Submitted",
  WON: "Won",
  LOST: "Lost",
  DECLINED: "Declined",
  ON_HOLD: "On Hold",
};

export const STAGE_COLORS: Record<Stage, { bg: string; text: string; dot: string }> = {
  LEAD: { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-400" },
  REVIEWING: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  TENDER_SUBMITTED: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  WON: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  LOST: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  DECLINED: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  ON_HOLD: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
};

export const DOC_CATEGORIES = [
  "DRAWING",
  "TENDER_DOC",
  "CONTRACT",
  "CORRESPONDENCE",
  "OTHER",
] as const;

export type DocCategory = (typeof DOC_CATEGORIES)[number];

export const DOC_CATEGORY_LABELS: Record<DocCategory, string> = {
  DRAWING: "Drawing",
  TENDER_DOC: "Tender Document",
  CONTRACT: "Contract",
  CORRESPONDENCE: "Correspondence",
  OTHER: "Other",
};

export const PROJECT_TYPES = [
  "DESIGN_BUILD",
  "BUILD",
  "PROJECT_MANAGEMENT",
  "CONSULTANCY",
  "LABOUR_SUPPLY",
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  DESIGN_BUILD: "Design & Build",
  BUILD: "Build",
  PROJECT_MANAGEMENT: "Project Management",
  CONSULTANCY: "Consultancy",
  LABOUR_SUPPLY: "Labour Supply",
};

export const TEMPERATURES = ["HOT", "WARM", "COLD"] as const;

export type Temperature = (typeof TEMPERATURES)[number];

export const TEMPERATURE_LABELS: Record<Temperature, string> = {
  HOT: "Hot",
  WARM: "Warm",
  COLD: "Cold",
};

export const TEMPERATURE_COLORS: Record<Temperature, { bg: string; text: string; dot: string }> = {
  HOT: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  WARM: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  COLD: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500" },
};

export const PM_STATUSES = ["ACTIVE", "ON_HOLD", "COMPLETE"] as const;

export type PmStatus = (typeof PM_STATUSES)[number];

export const PM_STATUS_LABELS: Record<PmStatus, string> = {
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETE: "Complete",
};

export const PM_STATUS_COLORS: Record<PmStatus, { bg: string; text: string; dot: string }> = {
  ACTIVE: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  ON_HOLD: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  COMPLETE: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
};

export const PM_DOC_CATEGORIES = [
  "PROCUREMENT",
  "DESIGN",
  "COMMERCIAL",
  "SITE_WORKS",
] as const;

export type PmDocCategory = (typeof PM_DOC_CATEGORIES)[number];

export const PM_DOC_CATEGORY_LABELS: Record<PmDocCategory, string> = {
  PROCUREMENT: "Procurement",
  DESIGN: "Design",
  COMMERCIAL: "Commercial",
  SITE_WORKS: "Site Works",
};

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

export function formatCurrency(value: number | null | undefined, currency = "AED") {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

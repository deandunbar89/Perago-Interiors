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
  "OPERATIONS",
] as const;

export type PmDocCategory = (typeof PM_DOC_CATEGORIES)[number];

export const PM_DOC_CATEGORY_LABELS: Record<PmDocCategory, string> = {
  PROCUREMENT: "Procurement",
  DESIGN: "Design",
  COMMERCIAL: "Commercial",
  SITE_WORKS: "Site Works",
  OPERATIONS: "Operations",
};

export const UPLOAD_MODES = ["SINGLE", "MULTIPLE"] as const;
export type UploadMode = (typeof UPLOAD_MODES)[number];

export const DEFAULT_PM_SUBSECTIONS: {
  category: PmDocCategory;
  alsoInCategory?: PmDocCategory;
  name: string;
  mode: UploadMode;
}[] = [
  { category: "PROCUREMENT", alsoInCategory: "DESIGN", name: "Material Register", mode: "SINGLE" },
  { category: "PROCUREMENT", name: "Procurement Schedule", mode: "SINGLE" },
  { category: "PROCUREMENT", name: "Purchase Orders", mode: "MULTIPLE" },
  { category: "PROCUREMENT", name: "Supplier Quotations", mode: "MULTIPLE" },
  { category: "PROCUREMENT", name: "Delivery Register", mode: "SINGLE" },
  { category: "PROCUREMENT", name: "Approved Submittals", mode: "MULTIPLE" },

  { category: "DESIGN", name: "Drawing Register", mode: "SINGLE" },
  { category: "DESIGN", name: "Drawings", mode: "MULTIPLE" },
  { category: "DESIGN", name: "TDS Sheets", mode: "MULTIPLE" },
  { category: "DESIGN", name: "Design Approvals", mode: "MULTIPLE" },

  { category: "COMMERCIAL", name: "Contracts", mode: "MULTIPLE" },
  { category: "COMMERCIAL", name: "Variations / Change Orders", mode: "MULTIPLE" },
  { category: "COMMERCIAL", name: "Invoices", mode: "MULTIPLE" },
  { category: "COMMERCIAL", name: "Payment Certificates", mode: "MULTIPLE" },
  { category: "COMMERCIAL", name: "Cost Reports", mode: "SINGLE" },

  { category: "SITE_WORKS", name: "Daily Site Diary", mode: "MULTIPLE" },
  { category: "SITE_WORKS", name: "Site Photos", mode: "MULTIPLE" },
  { category: "SITE_WORKS", name: "Inspection Requests", mode: "MULTIPLE" },
  { category: "SITE_WORKS", name: "Method Statements / RAMS", mode: "MULTIPLE" },
  { category: "SITE_WORKS", name: "Site Instructions", mode: "MULTIPLE" },

  { category: "OPERATIONS", name: "Program / Master Schedule", mode: "SINGLE" },
  { category: "OPERATIONS", name: "7-Day Look Ahead", mode: "SINGLE" },
  { category: "OPERATIONS", name: "Weekly Report", mode: "MULTIPLE" },
  { category: "OPERATIONS", name: "Monthly Report", mode: "MULTIPLE" },
  { category: "OPERATIONS", name: "Meeting Minutes", mode: "MULTIPLE" },
];

export const TRADES = [
  "ELECTRICAL",
  "PLUMBING",
  "HVAC_MEP",
  "CARPENTRY",
  "PAINTING",
  "FLOORING",
  "CEILING",
  "GLAZING",
  "CIVIL_STRUCTURAL",
  "FURNITURE_JOINERY",
  "TILING",
  "OTHER",
] as const;

export type Trade = (typeof TRADES)[number];

export const TRADE_LABELS: Record<Trade, string> = {
  ELECTRICAL: "Electrical",
  PLUMBING: "Plumbing",
  HVAC_MEP: "HVAC / MEP",
  CARPENTRY: "Carpentry",
  PAINTING: "Painting",
  FLOORING: "Flooring",
  CEILING: "Ceiling",
  GLAZING: "Glazing",
  CIVIL_STRUCTURAL: "Civil / Structural",
  FURNITURE_JOINERY: "Furniture & Joinery",
  TILING: "Tiling",
  OTHER: "Other",
};

export const VENDOR_TYPES = ["SUPPLIER", "CONTRACTOR"] as const;
export type VendorType = (typeof VENDOR_TYPES)[number];

export const VENDOR_TYPE_LABELS: Record<VendorType, string> = {
  SUPPLIER: "Supplier",
  CONTRACTOR: "Contractor",
};

export const VENDOR_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type VendorStatus = (typeof VENDOR_STATUSES)[number];

export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

export const VENDOR_DOC_TYPES = ["INVOICE", "PURCHASE_ORDER", "LPO", "QUOTE"] as const;
export type VendorDocType = (typeof VENDOR_DOC_TYPES)[number];

export const VENDOR_DOC_TYPE_LABELS: Record<VendorDocType, string> = {
  INVOICE: "Invoices",
  PURCHASE_ORDER: "Purchase Orders",
  LPO: "LPOs",
  QUOTE: "Quotes",
};

export const SNAG_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export type SnagPriority = (typeof SNAG_PRIORITIES)[number];

export const SNAG_PRIORITY_LABELS: Record<SnagPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const SNAG_PRIORITY_COLORS: Record<SnagPriority, { bg: string; text: string }> = {
  LOW: { bg: "bg-slate-100", text: "text-slate-600" },
  MEDIUM: { bg: "bg-amber-50", text: "text-amber-700" },
  HIGH: { bg: "bg-red-50", text: "text-red-700" },
};

export const SNAG_CATEGORIES = ["SNAG", "DEFECT", "PUNCH_ITEM"] as const;
export type SnagCategory = (typeof SNAG_CATEGORIES)[number];

export const SNAG_CATEGORY_LABELS: Record<SnagCategory, string> = {
  SNAG: "Snag",
  DEFECT: "Defect",
  PUNCH_ITEM: "Punch Item",
};

export const APP_SECTIONS = ["CRM", "PM", "TASKS", "SNAGS", "VENDORS", "AI", "REPORTS"] as const;
export type AppSection = (typeof APP_SECTIONS)[number];

export const APP_SECTION_LABELS: Record<AppSection, string> = {
  CRM: "CRM",
  PM: "Project Management",
  TASKS: "Tasks",
  SNAGS: "Snags",
  VENDORS: "Vendors",
  AI: "AI",
  REPORTS: "Reports",
};

export const NOTIFICATION_TYPES = [...APP_SECTIONS, "MENTION"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  ...APP_SECTION_LABELS,
  MENTION: "Mentions (@you)",
};

export const REPORT_SECTIONS = ["SITE_PROGRESS", "COMMERCIAL", "PROCUREMENT", "HSE", "DESIGN", "RISKS"] as const;
export type ReportSection = (typeof REPORT_SECTIONS)[number];

export const REPORT_SECTION_LABELS: Record<ReportSection, string> = {
  SITE_PROGRESS: "Site Progress",
  COMMERCIAL: "Commercial",
  PROCUREMENT: "Procurement",
  HSE: "HSE",
  DESIGN: "Design",
  RISKS: "Risks",
};

export const REPORT_PERIOD_TYPES = ["WEEKLY", "MONTHLY"] as const;
export type ReportPeriodType = (typeof REPORT_PERIOD_TYPES)[number];

export const REPORT_PERIOD_TYPE_LABELS: Record<ReportPeriodType, string> = {
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
};

export const ORDER_TYPES = ["PO", "LPO", "CONTRACT", "QUOTE"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  PO: "Purchase Order",
  LPO: "LPO",
  CONTRACT: "Subcontract",
  QUOTE: "Quote",
};

export const PAYMENT_DIRECTIONS = ["RECEIVED", "PAID"] as const;
export type PaymentDirection = (typeof PAYMENT_DIRECTIONS)[number];

export const PAYMENT_DIRECTION_LABELS: Record<PaymentDirection, string> = {
  RECEIVED: "Received from client",
  PAID: "Paid to supplier",
};

export const AI_SUBSCRIPTION_STATUSES = ["ACTIVE", "CANCELLED"] as const;
export type AiSubscriptionStatus = (typeof AI_SUBSCRIPTION_STATUSES)[number];

export const AI_SUBSCRIPTION_STATUS_LABELS: Record<AiSubscriptionStatus, string> = {
  ACTIVE: "Active",
  CANCELLED: "Cancelled",
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

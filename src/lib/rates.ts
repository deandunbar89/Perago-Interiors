
export const RATE_TYPES = ["SUPPLY_INSTALL", "SUPPLY_ONLY", "INSTALL_ONLY"] as const;
export const RATE_TYPE_LABELS: Record<string, string> = {
  SUPPLY_INSTALL: "Supply & install",
  SUPPLY_ONLY: "Supply only",
  INSTALL_ONLY: "Install only",
};
export const SOURCE_TYPES = ["CONTRACTOR_QUOTE", "SUPPLIER_QUOTE", "ONLINE_PRICE", "PERAGO_ESTIMATE"] as const;
export const SOURCE_TYPE_LABELS: Record<string, string> = {
  CONTRACTOR_QUOTE: "Contractor quote",
  SUPPLIER_QUOTE: "Supplier quote",
  ONLINE_PRICE: "Online price",
  PERAGO_ESTIMATE: "Perago estimate",
};
export const TRADES = [
  "Preliminaries",
  "Demolition & strip-out",
  "Civil & alterations",
  "Ceilings & partitions",
  "Flooring",
  "Wall finishes & painting",
  "Joinery",
  "Doors & ironmongery",
  "Windows & glazing",
  "Sanitaryware & brassware",
  "Waterproofing",
  "Plumbing",
  "HVAC",
  "Electrical & lighting",
  "Smart home & AV",
  "Furniture & FF&E",
  "Other",
] as const;

export type RateInput = {
  trade: string;
  description: string;
  unit: string;
  rate: number;
  rateType?: string;
  source: string;
  sourceType?: string;
  sourceRef?: string | null;
  projectName?: string | null;
  quotedAt?: string | Date | null;
  notes?: string | null;
};

/** Checks and normalises one rate; returns an error message or the data to save. */
export type RateData = {
  trade: string;
  description: string;
  unit: string;
  rate: number;
  rateType: string;
  source: string;
  sourceType: string;
  sourceRef: string | null;
  projectName: string | null;
  quotedAt: Date;
  notes: string | null;
  createdBy: string | null;
};

export function cleanRate(input: RateInput, createdBy: string | null): { error: string } | { data: RateData } {
  const description = String(input.description ?? "").trim();
  const unit = String(input.unit ?? "").trim();
  const source = String(input.source ?? "").trim();
  const trade = String(input.trade ?? "").trim() || "Other";
  const rate = Number(input.rate);
  if (!description) return { error: "description is required" };
  if (!unit) return { error: "unit is required" };
  if (!source) return { error: "source is required" };
  if (!Number.isFinite(rate) || rate < 0) return { error: `rate must be a number (${description})` };
  const quotedAt = input.quotedAt ? new Date(input.quotedAt) : new Date();
  if (Number.isNaN(quotedAt.getTime())) return { error: `quotedAt is not a date (${description})` };
  return {
    data: {
      trade,
      description,
      unit,
      rate,
      rateType: (RATE_TYPES as readonly string[]).includes(String(input.rateType)) ? String(input.rateType) : "SUPPLY_INSTALL",
      source,
      sourceType: (SOURCE_TYPES as readonly string[]).includes(String(input.sourceType)) ? String(input.sourceType) : "CONTRACTOR_QUOTE",
      sourceRef: input.sourceRef?.toString().trim() || null,
      projectName: input.projectName?.toString().trim() || null,
      quotedAt,
      notes: input.notes?.toString().trim() || null,
      createdBy,
    },
  };
}

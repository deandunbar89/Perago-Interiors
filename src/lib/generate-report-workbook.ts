import ExcelJS from "exceljs";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import {
  REPORT_SECTIONS,
  REPORT_SECTION_LABELS,
  PM_STATUS_LABELS,
  formatNumber,
  type ReportPeriodType,
} from "@/lib/constants";

const CHARCOAL = "FF15130F";
const GOLD = "FFD9C69C";
const CREAM = "FFF4EFE3";

const A4_LANDSCAPE: Partial<ExcelJS.PageSetup> = {
  orientation: "landscape",
  paperSize: 9,
  fitToPage: true,
  fitToWidth: 1,
  fitToHeight: 0,
  margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
};

function styleHeaderRow(ws: ExcelJS.Worksheet, row: number, lastCol: number, text: string) {
  ws.mergeCells(row, 1, row, lastCol);
  const cell = ws.getCell(row, 1);
  cell.value = text;
  cell.font = { bold: true, size: 12, color: { argb: GOLD } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CHARCOAL } };
  cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(row).height = 22;
}

function styleTableHeader(ws: ExcelJS.Worksheet, row: number, headers: string[]) {
  headers.forEach((h, i) => {
    const cell = ws.getCell(row, i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 10, color: { argb: CHARCOAL } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CREAM } };
    cell.border = { bottom: { style: "thin", color: { argb: CHARCOAL } } };
  });
}

function writeWrappedText(ws: ExcelJS.Worksheet, row: number, lastCol: number, text: string, minHeight = 60) {
  ws.mergeCells(row, 1, row, lastCol);
  const cell = ws.getCell(row, 1);
  cell.value = text || "No update logged for this period.";
  cell.alignment = { wrapText: true, vertical: "top", horizontal: "left" };
  cell.font = { size: 10 };
  ws.getRow(row).height = Math.max(minHeight, Math.ceil((text?.length ?? 0) / 100) * 14);
}

export async function buildProjectReportWorkbook(
  pmProjectId: string,
  periodType: ReportPeriodType,
  periodStart: Date
) {
  const project = await prisma.pmProject.findUnique({
    where: { id: pmProjectId },
    include: {
      client: true,
      scheduleItems: { orderBy: { startDate: "asc" } },
      reportEntries: {
        where: { periodType, periodStart },
        include: { createdBy: true },
        orderBy: { createdAt: "desc" },
      },
      vendors: { include: { vendor: true, documents: true } },
    },
  });
  if (!project) throw new Error("Project not found");

  const entriesBySection = Object.fromEntries(
    REPORT_SECTIONS.map((s) => [s, project.reportEntries.filter((e) => e.section === s)])
  ) as Record<string, typeof project.reportEntries>;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Perago Interiors";
  workbook.created = new Date();

  let logoBase64: string | null = null;
  try {
    const buf = await fs.readFile(path.join(process.cwd(), "public", "brand", "logo-inline-champagne.png"));
    logoBase64 = buf.toString("base64");
  } catch {
    // Logo is a nice-to-have — proceed without it if the file isn't found.
  }
  const logoId = logoBase64 ? workbook.addImage({ base64: logoBase64, extension: "png" }) : null;

  const periodLabel =
    periodType === "MONTHLY"
      ? periodStart.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
      : `Week of ${periodStart.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

  // ============ DASHBOARD ============
  const dash = workbook.addWorksheet("Dashboard", { pageSetup: A4_LANDSCAPE });
  dash.columns = Array.from({ length: 8 }, () => ({ width: 15 }));

  if (logoId !== null) {
    dash.addImage(logoId, { tl: { col: 0, row: 0.2 }, ext: { width: 160, height: 40 } });
  }
  dash.getCell(1, 5).value = "WEEKLY / MONTHLY REPORT";
  dash.mergeCells(1, 5, 1, 8);
  dash.getCell(1, 5).font = { bold: true, size: 14, color: { argb: CHARCOAL } };
  dash.getCell(1, 5).alignment = { horizontal: "right" };
  dash.getCell(2, 5).value = `${project.title} — ${periodLabel}`;
  dash.mergeCells(2, 5, 2, 8);
  dash.getCell(2, 5).font = { size: 11, color: { argb: "FF64748B" } };
  dash.getCell(2, 5).alignment = { horizontal: "right" };
  dash.getRow(1).height = 26;

  let r = 4;

  // Project details
  styleHeaderRow(dash, r, 8, "PROJECT DETAILS");
  r++;
  const details: [string, string][] = [
    ["Client", project.client?.name ?? "—"],
    ["Location", project.location ?? "—"],
    ["Status", PM_STATUS_LABELS[project.status as keyof typeof PM_STATUS_LABELS] ?? project.status],
    ["Value", project.value ? `${formatNumber(project.value)} ${project.currency}` : "—"],
    ["Start Date", project.startDate ? project.startDate.toLocaleDateString("en-GB") : "—"],
    ["Target End Date", project.targetEndDate ? project.targetEndDate.toLocaleDateString("en-GB") : "—"],
  ];
  for (const [label, value] of details) {
    dash.getCell(r, 1).value = label;
    dash.getCell(r, 1).font = { bold: true, size: 10 };
    dash.mergeCells(r, 2, r, 8);
    dash.getCell(r, 2).value = value;
    dash.getCell(r, 2).font = { size: 10 };
    r++;
  }
  r++;

  // % Update — planned vs actual
  styleHeaderRow(dash, r, 8, "% UPDATE — PLANNED VS ACTUAL");
  r++;
  styleTableHeader(dash, r, ["Schedule Item", "", "", "Start", "End", "Planned %", "Actual %", "Status"]);
  r++;
  const now = new Date();
  let plannedTotal = 0;
  let actualTotal = 0;
  for (const item of project.scheduleItems) {
    const totalMs = item.endDate.getTime() - item.startDate.getTime();
    const elapsedMs = now.getTime() - item.startDate.getTime();
    const plannedPct = totalMs > 0 ? Math.max(0, Math.min(100, Math.round((elapsedMs / totalMs) * 100))) : 0;
    plannedTotal += plannedPct;
    actualTotal += item.percentComplete;

    dash.mergeCells(r, 1, r, 3);
    dash.getCell(r, 1).value = item.title;
    dash.getCell(r, 1).font = { size: 10 };
    dash.getCell(r, 4).value = item.startDate.toLocaleDateString("en-GB");
    dash.getCell(r, 5).value = item.endDate.toLocaleDateString("en-GB");
    dash.getCell(r, 6).value = `${plannedPct}%`;
    dash.getCell(r, 7).value = `${item.percentComplete}%`;
    dash.getCell(r, 8).value = item.status.replace("_", " ");
    for (let c = 4; c <= 8; c++) dash.getCell(r, c).font = { size: 10 };
    r++;
  }
  if (project.scheduleItems.length === 0) {
    dash.mergeCells(r, 1, r, 8);
    dash.getCell(r, 1).value = "No program items yet.";
    dash.getCell(r, 1).font = { italic: true, size: 10, color: { argb: "FF94A3B8" } };
    r++;
  } else {
    const avgPlanned = Math.round(plannedTotal / project.scheduleItems.length);
    const avgActual = Math.round(actualTotal / project.scheduleItems.length);
    dash.mergeCells(r, 1, r, 3);
    dash.getCell(r, 1).value = "Overall Average";
    dash.getCell(r, 1).font = { bold: true, size: 10 };
    dash.getCell(r, 6).value = `${avgPlanned}%`;
    dash.getCell(r, 7).value = `${avgActual}%`;
    dash.getCell(r, 6).font = { bold: true, size: 10 };
    dash.getCell(r, 7).font = { bold: true, size: 10 };
    r++;
  }
  r++;

  // Procurement update
  styleHeaderRow(dash, r, 8, "PROCUREMENT UPDATE — LONG LEAD ITEMS");
  r++;
  writeWrappedText(dash, r, 8, entriesBySection.PROCUREMENT?.[0]?.content ?? "");
  r += 2;

  // Commercial update
  styleHeaderRow(dash, r, 8, "COMMERCIAL UPDATE — PAYMENTS / INVOICES");
  r++;
  writeWrappedText(dash, r, 8, entriesBySection.COMMERCIAL?.[0]?.content ?? "", 40);
  r += 2;
  const invoiceRows = project.vendors.flatMap((pv) =>
    pv.documents.filter((d) => d.vendorDocType === "INVOICE").map((d) => ({ vendor: pv.vendor.name, doc: d }))
  );
  if (invoiceRows.length > 0) {
    styleTableHeader(dash, r, ["Vendor", "", "Invoice", "", "Uploaded", "", "Payment Status", ""]);
    r++;
    for (const { vendor, doc } of invoiceRows) {
      dash.getCell(r, 1).value = vendor;
      dash.mergeCells(r, 1, r, 2);
      dash.mergeCells(r, 3, r, 4);
      dash.getCell(r, 3).value = doc.originalName;
      dash.mergeCells(r, 5, r, 6);
      dash.getCell(r, 5).value = doc.createdAt.toLocaleDateString("en-GB");
      dash.mergeCells(r, 7, r, 8);
      dash.getCell(r, 7).value = "Pending";
      for (let c = 1; c <= 8; c++) dash.getCell(r, c).font = { size: 10 };
      r++;
    }
    dash.mergeCells(r, 1, r, 8);
    dash.getCell(r, 1).value = "Payment Status is editable — update each row once confirmed.";
    dash.getCell(r, 1).font = { italic: true, size: 9, color: { argb: "FF94A3B8" } };
    r++;
  }
  r++;

  // Areas of risk
  styleHeaderRow(dash, r, 8, "AREAS OF RISK");
  r++;
  writeWrappedText(dash, r, 8, entriesBySection.RISKS?.[0]?.content ?? "");
  r += 2;

  // 7 day look ahead
  styleHeaderRow(dash, r, 8, "7 DAY LOOK AHEAD");
  r++;
  styleTableHeader(dash, r, ["Item", "", "", "Start", "End", "% Complete", "Status", ""]);
  r++;
  const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const lookAhead = project.scheduleItems.filter((s) => s.startDate <= sevenDaysOut && s.endDate >= now);
  for (const item of lookAhead) {
    dash.mergeCells(r, 1, r, 3);
    dash.getCell(r, 1).value = item.title;
    dash.getCell(r, 4).value = item.startDate.toLocaleDateString("en-GB");
    dash.getCell(r, 5).value = item.endDate.toLocaleDateString("en-GB");
    dash.getCell(r, 6).value = `${item.percentComplete}%`;
    dash.mergeCells(r, 7, r, 8);
    dash.getCell(r, 7).value = item.status.replace("_", " ");
    for (let c = 1; c <= 8; c++) dash.getCell(r, c).font = { size: 10 };
    r++;
  }
  if (lookAhead.length === 0) {
    dash.mergeCells(r, 1, r, 8);
    dash.getCell(r, 1).value = "Nothing scheduled in the next 7 days.";
    dash.getCell(r, 1).font = { italic: true, size: 10, color: { argb: "FF94A3B8" } };
  }

  // ============ PER-DEPARTMENT SHEETS ============
  for (const section of REPORT_SECTIONS) {
    const ws = workbook.addWorksheet(REPORT_SECTION_LABELS[section].slice(0, 31), { pageSetup: A4_LANDSCAPE });
    ws.columns = Array.from({ length: 8 }, () => ({ width: 15 }));
    styleHeaderRow(ws, 1, 8, `${REPORT_SECTION_LABELS[section].toUpperCase()} — ${periodLabel}`);

    const entries = entriesBySection[section] ?? [];
    let row = 3;
    if (entries.length === 0) {
      ws.mergeCells(row, 1, row, 8);
      ws.getCell(row, 1).value = "No entry logged for this period.";
      ws.getCell(row, 1).font = { italic: true, size: 10, color: { argb: "FF94A3B8" } };
    } else {
      for (const entry of entries) {
        ws.mergeCells(row, 1, row, 8);
        ws.getCell(row, 1).value = `${entry.createdBy?.name ?? "Unknown"} — ${entry.createdAt.toLocaleDateString("en-GB")}`;
        ws.getCell(row, 1).font = { bold: true, size: 9, color: { argb: "FF64748B" } };
        row++;
        writeWrappedText(ws, row, 8, entry.content);
        row += 2;
      }
    }
  }

  return { workbook, periodLabel };
}

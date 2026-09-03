import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildProjectReportWorkbook } from "@/lib/generate-report-workbook";
import type { ReportPeriodType } from "@/lib/constants";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const periodType = searchParams.get("periodType") as ReportPeriodType | null;
  const periodStartParam = searchParams.get("periodStart");

  if (!periodType || !periodStartParam) {
    return new NextResponse("Missing periodType or periodStart", { status: 400 });
  }

  try {
    const { workbook, periodLabel } = await buildProjectReportWorkbook(
      id,
      periodType,
      new Date(periodStartParam)
    );
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `Perago Report - ${periodLabel}.xlsx`.replace(/[\\/:*?"<>|]/g, "-");

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (err) {
    return new NextResponse(err instanceof Error ? err.message : "Failed to generate report", { status: 500 });
  }
}

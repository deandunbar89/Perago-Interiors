import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { badRequest, isResponse, requireAgent } from "@/lib/agent-auth";
import { cleanRate, type RateInput } from "@/lib/rates";

export const dynamic = "force-dynamic";

/**
 * Rate library for coworkers.
 * GET  /api/agent/rates?q=<words>&trade=<trade>&limit=200  → newest first
 * POST /api/agent/rates  JSON { items: [ { trade, description, unit, rate, rateType?, source, sourceType?, sourceRef?, projectName?, quotedAt?, notes? } ] }
 *      (or a single item object). Rates are AED excl. VAT, cost to Perago.
 */
export async function GET(req: Request) {
  const actor = await requireAgent(req);
  if (isResponse(actor)) return actor;
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const trade = (url.searchParams.get("trade") ?? "").trim();
  const limit = Math.min(1000, Math.max(1, Number(url.searchParams.get("limit") ?? 200) || 200));
  const words = q.split(/\s+/).filter(Boolean);
  const items = await prisma.rateItem.findMany({
    where: {
      ...(trade ? { trade } : {}),
      AND: words.map((w) => ({
        OR: [
          { description: { contains: w, mode: "insensitive" as const } },
          { source: { contains: w, mode: "insensitive" as const } },
          { notes: { contains: w, mode: "insensitive" as const } },
          { projectName: { contains: w, mode: "insensitive" as const } },
        ],
      })),
    },
    orderBy: [{ quotedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
  return NextResponse.json({
    count: items.length,
    items: items.map((r) => ({ ...r, quotedAt: r.quotedAt.toISOString().slice(0, 10) })),
  });
}

export async function POST(req: Request) {
  const actor = await requireAgent(req);
  if (isResponse(actor)) return actor;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Send JSON { items: [...] }");
  }
  const list: RateInput[] = Array.isArray((body as { items?: unknown }).items)
    ? ((body as { items: RateInput[] }).items)
    : [body as RateInput];
  if (list.length === 0) return badRequest("No items");
  const rows = [];
  for (const item of list) {
    const r = cleanRate(item, actor.name ?? "Perago Assistant");
    if ("error" in r) return badRequest(r.error);
    rows.push(r.data);
  }
  const result = await prisma.rateItem.createMany({ data: rows });
  revalidatePath("/rates");
  return NextResponse.json({ added: result.count }, { status: 201 });
}

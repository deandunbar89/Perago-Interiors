import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ───────────────────────── Coworker (Claude) API access ─────────────────────────
// The Claude coworkers can't sign in through the login page, so they call /api/agent/* with a
// secret key instead: `Authorization: Bearer <AGENT_API_KEY>`. Everything they create is recorded
// as the user in AGENT_USER_EMAIL (falls back to the first admin). Remove AGENT_API_KEY from
// Railway's variables and the whole API switches off.

export type AgentActor = { userId: string; name: string };

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

function keyMatches(given: string, expected: string) {
  return timingSafeEqual(digest(given), digest(expected));
}

/** Returns the acting user, or a ready-made error response when the key is missing or wrong. */
export async function requireAgent(req: Request): Promise<AgentActor | NextResponse> {
  const expected = process.env.AGENT_API_KEY;
  if (!expected || expected.length < 32) {
    return NextResponse.json({ error: "Coworker API is switched off" }, { status: 503 });
  }

  const header = req.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!given || !keyMatches(given, expected)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const email = process.env.AGENT_USER_EMAIL?.trim();
  const user =
    (email && (await prisma.user.findUnique({ where: { email }, select: { id: true, name: true } }))) ||
    (await prisma.user.findFirst({
      where: { role: "ADMIN" },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }));
  if (!user) return NextResponse.json({ error: "No user to act as" }, { status: 500 });

  return { userId: user.id, name: user.name };
}

export function isResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

/** "YYYY-MM-DD" (or a full ISO date) as the app stores due dates; null clears it; undefined = not given. */
export function parseDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") throw new Error("Dates must be written as YYYY-MM-DD");
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error(`"${value}" is not a valid date (use YYYY-MM-DD)`);
  return d;
}

export function dateOnly(d: Date | null | undefined) {
  return d ? d.toISOString().slice(0, 10) : null;
}

/** Today's date on the Dubai clock, as YYYY-MM-DD. */
export function dubaiToday() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Dubai" }).format(new Date());
}

export function addDays(ymd: string, days: number) {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

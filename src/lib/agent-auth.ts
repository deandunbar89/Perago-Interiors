import { createHash, randomBytes, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APP_SECTIONS } from "@/lib/constants";

// ───────────────────────── Coworker (Claude) API access ─────────────────────────
// The Claude coworkers can't sign in through the login page, so they call /api/agent/* with a
// secret key instead: `Authorization: Bearer <AGENT_API_KEY>`. Everything they create is recorded
// as the "Perago Assistant" team member (created automatically, with a random password nobody knows,
// so it can never be used to log in). New tasks and deadlines are assigned to the owner in
// AGENT_USER_EMAIL (falls back to the first admin) unless another person is named. Remove
// AGENT_API_KEY from Railway's variables and the whole API switches off.

export type AgentActor = { userId: string; name: string; ownerId: string };

const ASSISTANT_NAME = "Perago Assistant";
const ASSISTANT_EMAIL = (process.env.AGENT_ASSISTANT_EMAIL || "assistant@peragointeriors.ae").toLowerCase();

async function assistantUser() {
  const existing = await prisma.user.findUnique({ where: { email: ASSISTANT_EMAIL }, select: { id: true, name: true } });
  if (existing) return existing;
  const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
  return prisma.user.create({
    data: {
      name: ASSISTANT_NAME,
      email: ASSISTANT_EMAIL,
      passwordHash,
      role: "MEMBER",
      allowedSections: APP_SECTIONS.filter((s) => s !== "RECRUITMENT"),
    },
    select: { id: true, name: true },
  });
}

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

  const email = process.env.AGENT_USER_EMAIL?.trim().toLowerCase();
  const owner =
    (email && (await prisma.user.findUnique({ where: { email }, select: { id: true } }))) ||
    (await prisma.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" }, select: { id: true } }));
  if (!owner) return NextResponse.json({ error: "No owner to assign work to" }, { status: 500 });

  const assistant = await assistantUser();
  return { userId: assistant.id, name: assistant.name, ownerId: owner.id };
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

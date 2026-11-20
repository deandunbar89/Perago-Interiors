import { createHmac, timingSafeEqual } from "crypto";
import { escapeText, fold, utc } from "@/lib/recruitment-calendar";

// ───────────────────────── Private feed link ─────────────────────────
// Same idea as the interviews feed: a secret per-person link Outlook can subscribe to.
// Signed with a different purpose, so an interviews link can't be reused for this feed.

function sign(userId: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return createHmac("sha256", secret).update(`deadlines-calendar:${userId}`).digest("hex");
}

export function deadlinesCalendarToken(userId: string) {
  return `${userId}.${sign(userId)}`;
}

export function userIdFromDeadlinesToken(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const userId = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(userId));
  return given.length === expected.length && timingSafeEqual(given, expected) ? userId : null;
}

// ───────────────────────── iCalendar (.ics) ─────────────────────────

export type CalendarItem = {
  kind: "deadline" | "task";
  id: string;
  title: string;
  dueDate: Date;
  updatedAt: Date;
  scope: "CRM" | "PM";
  projectTitle: string | null;
  assigneeName: string | null;
};

/** Due dates are stored as midnight UTC of the chosen day, so the UTC date is the calendar day. */
function ymd(d: Date) {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function nextDay(d: Date) {
  const n = new Date(d);
  n.setUTCDate(n.getUTCDate() + 1);
  return n;
}

function vevent(item: CalendarItem, origin: string) {
  const link =
    item.kind === "task"
      ? `${origin}/my-tasks/${item.id}`
      : `${origin}${item.scope === "PM" ? "/pm/deadlines" : "/deadlines"}/${item.id}`;
  const label = item.kind === "deadline" ? "Deadline" : "Task";
  const description = [
    item.projectTitle ? `Project: ${item.projectTitle}` : null,
    item.assigneeName ? `Assigned to: ${item.assigneeName}` : null,
    `Open in Perago: ${link}`,
  ]
    .filter(Boolean)
    .join("\n");

  return [
    "BEGIN:VEVENT",
    `UID:${item.kind}-${item.id}@perago`,
    `DTSTAMP:${utc(item.updatedAt)}`,
    `LAST-MODIFIED:${utc(item.updatedAt)}`,
    `SEQUENCE:${Math.max(0, Math.floor((item.updatedAt.getTime() - Date.UTC(2026, 0, 1)) / 60_000))}`,
    `DTSTART;VALUE=DATE:${ymd(item.dueDate)}`,
    `DTEND;VALUE=DATE:${ymd(nextDay(item.dueDate))}`,
    `SUMMARY:${escapeText(`${label}: ${item.title}${item.projectTitle ? ` (${item.projectTitle})` : ""}`)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `URL:${link}`,
    "TRANSP:TRANSPARENT",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(`${label} due: ${item.title}`)}`,
    // Deadlines: 9am the day before. Tasks: 8am on the day.
    item.kind === "deadline" ? "TRIGGER:-PT15H" : "TRIGGER:PT8H",
    "END:VALARM",
    "END:VEVENT",
  ];
}

export function buildDeadlinesCalendar(items: CalendarItem[], origin: string) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Perago Interiors//Deadlines//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Perago deadlines & tasks",
    "X-WR-TIMEZONE:Asia/Dubai",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
    ...items.flatMap((item) => vevent(item, origin)),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

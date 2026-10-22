import { createHmac, timingSafeEqual } from "crypto";
import { INTERVIEW_ROUND_LABELS, type InterviewRound } from "@/lib/constants";

// ───────────────────────── Private feed links ─────────────────────────
// Calendar apps can't sign in, so the feed is protected by a secret link instead. Each link is tied
// to one person (their user id, signed with the app's secret) and only works while that person still
// has Recruitment access — remove their access and their link stops working.

function sign(userId: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return createHmac("sha256", secret).update(`recruitment-calendar:${userId}`).digest("hex");
}

export function calendarToken(userId: string) {
  return `${userId}.${sign(userId)}`;
}

/** The user id inside a feed token, or null if the token is forged or malformed. */
export function userIdFromCalendarToken(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const userId = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(userId));
  return given.length === expected.length && timingSafeEqual(given, expected) ? userId : null;
}

// ───────────────────────── iCalendar (.ics) ─────────────────────────

export type CalendarInterview = {
  id: string;
  round: InterviewRound;
  scheduledAt: Date;
  interviewer: string | null;
  updatedAt: Date;
  candidate: { id: string; name: string; vacancy: { title: string } };
};

const INTERVIEW_MINUTES = 60;

function escapeText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Content lines may not exceed 75 octets; longer ones continue on the next line after a space. */
function fold(line: string) {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let start = 0;
  let limit = 75;
  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length);
    // never split in the middle of a multi-byte character
    while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
    parts.push(bytes.subarray(start, end).toString("utf8"));
    start = end;
    limit = 74; // continuation lines start with a space
  }
  return parts.join("\r\n ");
}

function utc(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function vevent(iv: CalendarInterview, origin: string) {
  const end = new Date(iv.scheduledAt.getTime() + INTERVIEW_MINUTES * 60_000);
  const link = `${origin}/recruitment/candidates/${iv.candidate.id}`;
  const description = [
    `Vacancy: ${iv.candidate.vacancy.title}`,
    `Round: ${INTERVIEW_ROUND_LABELS[iv.round]}`,
    iv.interviewer ? `Interviewed by: ${iv.interviewer}` : null,
    `Open in Perago: ${link}`,
  ]
    .filter(Boolean)
    .join("\n");

  return [
    "BEGIN:VEVENT",
    `UID:interview-${iv.id}@perago`,
    `DTSTAMP:${utc(iv.updatedAt)}`,
    `LAST-MODIFIED:${utc(iv.updatedAt)}`,
    // Minutes since 1 Jan 2026: only ever goes up, so calendars know when an interview was edited.
    `SEQUENCE:${Math.max(0, Math.floor((iv.updatedAt.getTime() - Date.UTC(2026, 0, 1)) / 60_000))}`,
    `DTSTART:${utc(iv.scheduledAt)}`,
    `DTEND:${utc(end)}`,
    `SUMMARY:${escapeText(`Interview: ${iv.candidate.name} (${INTERVIEW_ROUND_LABELS[iv.round]})`)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `URL:${link}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Interview in 30 minutes",
    "TRIGGER:-PT30M",
    "END:VALARM",
    "END:VEVENT",
  ];
}

export function buildCalendar(interviews: CalendarInterview[], origin: string, name = "Perago interviews") {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Perago Interiors//Recruitment//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(name)}`,
    "X-WR-TIMEZONE:Asia/Dubai",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
    ...interviews.flatMap((iv) => vevent(iv, origin)),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** The address the app is served from, for links inside calendar events. */
export function appOrigin(headers: Headers, fallbackUrl?: string) {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (host && !host.startsWith("localhost") && !host.startsWith("127.")) {
    return `${headers.get("x-forwarded-proto") ?? "https"}://${host}`;
  }
  if (process.env.RAILWAY_PUBLIC_DOMAIN) return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  return fallbackUrl ? new URL(fallbackUrl).origin : `http://${host ?? "localhost:3000"}`;
}

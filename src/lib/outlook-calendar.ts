/**
 * Puts booked interviews straight into an Outlook calendar through Microsoft Graph, and keeps
 * them in step when an interview is moved or deleted. Uses the same Microsoft 365 app
 * registration as email (needs the Calendars.ReadWrite application permission). The calendar is
 * OUTLOOK_CALENDAR_USER's, or MAIL_FROM's when that isn't set. Does nothing until configured;
 * failures are logged and never block saving the interview.
 */
import { prisma } from "@/lib/prisma";
import { graphConfigured, graphToken } from "@/lib/email";
import { INTERVIEW_ROUND_LABELS, type InterviewRound } from "@/lib/constants";

const INTERVIEW_MINUTES = 60;
const APP_URL = (process.env.APP_URL || "https://perago-interiors-production.up.railway.app").replace(/\/$/, "");

function calendarUser() {
  return process.env.OUTLOOK_CALENDAR_USER || process.env.MAIL_FROM || null;
}

export function outlookCalendarConfigured() {
  return graphConfigured() && Boolean(calendarUser());
}

const graphTime = (d: Date) => ({ dateTime: d.toISOString().replace("Z", ""), timeZone: "UTC" });

async function graph(method: string, path: string, body?: unknown) {
  const token = await graphToken();
  return fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(calendarUser()!)}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Create or update the Outlook event for one interview. */
export async function syncInterviewToOutlook(interviewId: string) {
  if (!outlookCalendarConfigured()) return;
  try {
    const iv = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { candidate: { select: { id: true, name: true, phone: true, email: true, vacancy: { select: { title: true } } } } },
    });
    if (!iv) return;

    const round = INTERVIEW_ROUND_LABELS[iv.round as InterviewRound];
    const link = `${APP_URL}/recruitment/candidates/${iv.candidate.id}`;
    const lines = [
      `<b>Vacancy:</b> ${escapeHtml(iv.candidate.vacancy.title)}`,
      `<b>Round:</b> ${escapeHtml(round)}`,
      iv.interviewer ? `<b>Interviewed by:</b> ${escapeHtml(iv.interviewer)}` : null,
      iv.candidate.phone ? `<b>Phone:</b> ${escapeHtml(iv.candidate.phone)}` : null,
      iv.candidate.email ? `<b>Email:</b> ${escapeHtml(iv.candidate.email)}` : null,
      `<a href="${link}">Open in Perago</a>`,
    ].filter(Boolean);

    const event = {
      subject: `Interview: ${iv.candidate.name} (${round}) — ${iv.candidate.vacancy.title}`,
      body: { contentType: "HTML", content: lines.join("<br>") },
      start: graphTime(iv.scheduledAt),
      end: graphTime(new Date(iv.scheduledAt.getTime() + INTERVIEW_MINUTES * 60_000)),
      isReminderOn: true,
      reminderMinutesBeforeStart: 30,
      showAs: "busy",
      categories: ["Perago – Interview"],
    };

    if (iv.outlookEventId) {
      const res = await graph("PATCH", `/events/${iv.outlookEventId}`, event);
      if (res.ok) return;
      if (res.status !== 404) throw new Error(`Outlook update failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
      // The event was deleted in Outlook — fall through and create it again.
    }
    const res = await graph("POST", "/events", event);
    if (!res.ok) throw new Error(`Outlook create failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
    const created = (await res.json()) as { id: string };
    await prisma.interview.update({ where: { id: iv.id }, data: { outlookEventId: created.id } });
  } catch (e) {
    console.error("Outlook calendar sync failed", e);
  }
}

/** Remove an interview's Outlook event (call before or after deleting the interview). */
export async function removeOutlookEvent(eventId: string | null | undefined) {
  if (!eventId || !outlookCalendarConfigured()) return;
  try {
    const res = await graph("DELETE", `/events/${eventId}`);
    if (!res.ok && res.status !== 404) throw new Error(`Outlook delete failed (${res.status})`);
  } catch (e) {
    console.error("Outlook calendar delete failed", e);
  }
}

import { graphConfigured, graphToken } from "@/lib/email";

// ───────────────────────── Coworker mailboxes (Microsoft 365 shared mailboxes) ─────────────────────────
// The coworkers send supplier enquiries and read the replies through Microsoft Graph, using the same
// "Perago App" registration as the rest of the app (needs Mail.Send and Mail.ReadWrite application
// permissions). Only the mailboxes listed here can be used — never anyone's personal inbox.

export const MAILBOXES = {
  design: (process.env.MAILBOX_DESIGN || "design@peragointeriors.ae").toLowerCase(),
  procurement: (process.env.MAILBOX_PROCUREMENT || "procurement@peragointeriors.ae").toLowerCase(),
} as const;

export type MailboxKey = keyof typeof MAILBOXES;

export function mailboxAddress(key: unknown): string | null {
  return typeof key === "string" && key in MAILBOXES ? MAILBOXES[key as MailboxKey] : null;
}

export function mailConfigured() {
  return graphConfigured();
}

export async function graphMail(mailbox: string, method: string, path: string, body?: unknown) {
  const token = await graphToken();
  return fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailbox)}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: 'outlook.body-content-type="text"' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** Turns a Graph error into a short message the coworker can act on. */
export async function graphError(res: Response, what: string) {
  const text = (await res.text()).slice(0, 400);
  if (res.status === 403 || /AccessDenied|ErrorAccessDenied|Authorization_RequestDenied/i.test(text)) {
    return `${what} failed: the Perago App isn't allowed to use this mailbox yet (needs Mail.Send / Mail.ReadWrite permission with admin consent).`;
  }
  if (res.status === 404 || /MailboxNotEnabledForRESTAPI|ResourceNotFound|ErrorInvalidUser/i.test(text)) {
    return `${what} failed: this mailbox doesn't exist yet in Microsoft 365.`;
  }
  return `${what} failed (${res.status}): ${text}`;
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Plain text (with blank-line paragraphs) → simple HTML email body. */
export function textToHtml(text: string) {
  return text
    .split(/\n{2,}/)
    .map((p) => `<p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;margin:0 0 12px">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function parseAddresses(value: unknown): string[] {
  const list = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[;,]/) : [];
  return list.map((v) => String(v).trim()).filter((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
}

/**
 * Sends email from the company Outlook (Microsoft 365) mailbox through Microsoft Graph.
 * Needs these environment variables (from an Entra ID app registration with the
 * Mail.Send application permission, admin-consented):
 *   MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET, MAIL_FROM (the mailbox to send as)
 */

/** True when the Microsoft 365 app registration is set (used for email and for the Outlook calendar). */
export function graphConfigured() {
  return Boolean(process.env.MS_TENANT_ID && process.env.MS_CLIENT_ID && process.env.MS_CLIENT_SECRET);
}

export function emailConfigured() {
  return Boolean(process.env.MS_TENANT_ID && process.env.MS_CLIENT_ID && process.env.MS_CLIENT_SECRET && process.env.MAIL_FROM);
}

export async function graphToken(): Promise<string> {
  const res = await fetch(`https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.MS_CLIENT_ID!,
      client_secret: process.env.MS_CLIENT_SECRET!,
      scope: "https://graph.microsoft.com/.default",
    }),
  });
  const data = (await res.json()) as { access_token?: string; error_description?: string };
  if (!res.ok || !data.access_token) throw new Error(`Microsoft sign-in failed: ${data.error_description ?? res.status}`);
  return data.access_token;
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!emailConfigured()) throw new Error("Email is not set up");
  const token = await graphToken();
  const res = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(process.env.MAIL_FROM!)}/sendMail`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: { subject, body: { contentType: "HTML", content: html }, toRecipients: [{ emailAddress: { address: to } }] },
      saveToSentItems: false,
    }),
  });
  if (!res.ok) throw new Error(`Sending email failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
}

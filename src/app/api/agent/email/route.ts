import { NextResponse } from "next/server";
import { badRequest, isResponse, requireAgent } from "@/lib/agent-auth";
import { graphError, graphMail, mailboxAddress, mailConfigured, MAILBOXES, parseAddresses, textToHtml } from "@/lib/agent-mail";

export const dynamic = "force-dynamic";

const MAX_ATTACHMENTS_BYTES = 3 * 1024 * 1024; // Graph's limit for attachments sent inline with a message

/**
 * Lists messages in a coworker mailbox.
 * GET /api/agent/email?mailbox=design|procurement&folder=inbox|sentitems&since=YYYY-MM-DD&unread=true&search=<text>&top=25
 */
export async function GET(req: Request) {
  const actor = await requireAgent(req);
  if (isResponse(actor)) return actor;
  if (!mailConfigured()) return NextResponse.json({ error: "Microsoft 365 isn't set up in the app" }, { status: 503 });

  const url = new URL(req.url);
  const mailbox = mailboxAddress(url.searchParams.get("mailbox"));
  if (!mailbox) return badRequest(`mailbox must be one of: ${Object.keys(MAILBOXES).join(", ")}`);

  const folder = url.searchParams.get("folder") === "sentitems" ? "sentitems" : "inbox";
  const top = Math.min(Math.max(Number(url.searchParams.get("top")) || 25, 1), 50);
  const since = url.searchParams.get("since");
  const search = url.searchParams.get("search")?.trim();

  const params = new URLSearchParams({
    $top: String(top),
    $select: "id,subject,from,toRecipients,receivedDateTime,sentDateTime,bodyPreview,hasAttachments,isRead,conversationId",
  });
  if (search) {
    params.set("$search", `"${search.replace(/"/g, "")}"`);
  } else {
    params.set("$orderby", "receivedDateTime desc");
    const filters: string[] = [];
    if (since && /^\d{4}-\d{2}-\d{2}$/.test(since)) filters.push(`receivedDateTime ge ${since}T00:00:00Z`);
    if (url.searchParams.get("unread") === "true") filters.push("isRead eq false");
    if (filters.length) params.set("$filter", filters.join(" and "));
  }

  const res = await graphMail(mailbox, "GET", `/mailFolders/${folder}/messages?${params}`);
  if (!res.ok) return NextResponse.json({ error: await graphError(res, "Reading the mailbox") }, { status: 502 });
  const data = (await res.json()) as { value: Record<string, unknown>[] };

  type Addr = { emailAddress?: { name?: string; address?: string } };
  const who = (a?: Addr) => (a?.emailAddress ? `${a.emailAddress.name ?? ""} <${a.emailAddress.address ?? ""}>`.trim() : null);

  return NextResponse.json({
    mailbox,
    folder,
    messages: data.value.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      subject: m.subject,
      from: who(m.from as Addr),
      to: ((m.toRecipients as Addr[]) ?? []).map(who),
      date: m.receivedDateTime ?? m.sentDateTime,
      preview: m.bodyPreview,
      hasAttachments: m.hasAttachments,
      isRead: m.isRead,
    })),
  });
}

/**
 * Sends an email from a coworker mailbox (Dean approves every email in chat before this is called).
 * multipart/form-data: mailbox, to, cc?, subject, body (plain text), replyTo? (message id to reply to), files[]?
 * or JSON: { mailbox, to, cc?, subject, body, replyTo? }
 */
export async function POST(req: Request) {
  const actor = await requireAgent(req);
  if (isResponse(actor)) return actor;
  if (!mailConfigured()) return NextResponse.json({ error: "Microsoft 365 isn't set up in the app" }, { status: 503 });

  let fields: Record<string, unknown> = {};
  const files: File[] = [];
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("multipart/form-data")) {
    const form = await req.formData();
    for (const [key, value] of form.entries()) {
      if (value instanceof File) files.push(value);
      else fields[key] = key === "to" || key === "cc" ? [...((fields[key] as string[]) ?? []), value] : value;
    }
  } else {
    try {
      fields = (await req.json()) as Record<string, unknown>;
    } catch {
      return badRequest("Send JSON or multipart/form-data");
    }
  }

  const mailbox = mailboxAddress(fields.mailbox);
  if (!mailbox) return badRequest(`mailbox must be one of: ${Object.keys(MAILBOXES).join(", ")}`);
  const body = typeof fields.body === "string" ? fields.body.trim() : "";
  if (!body) return badRequest("body is required");

  // Reply in an existing supplier thread (keeps the conversation together in Outlook).
  const replyTo = typeof fields.replyTo === "string" ? fields.replyTo.trim() : "";
  if (replyTo) {
    if (files.length) return badRequest("Attachments can't be added to a reply — send a new email instead");
    const res = await graphMail(mailbox, "POST", `/messages/${encodeURIComponent(replyTo)}/reply`, { comment: body });
    if (!res.ok) return NextResponse.json({ error: await graphError(res, "Sending the reply") }, { status: 502 });
    return NextResponse.json({ sent: true, from: mailbox, inReplyTo: replyTo }, { status: 201 });
  }

  const to = parseAddresses(fields.to);
  const cc = parseAddresses(fields.cc);
  const subject = typeof fields.subject === "string" ? fields.subject.trim() : "";
  if (!to.length) return badRequest("to needs at least one valid email address");
  if (!subject) return badRequest("subject is required");

  const total = files.reduce((n, f) => n + f.size, 0);
  if (total > MAX_ATTACHMENTS_BYTES) return badRequest("Attachments total more than 3 MB — share large drawings as a link instead");
  const attachments = await Promise.all(
    files.map(async (f) => ({
      "@odata.type": "#microsoft.graph.fileAttachment",
      name: f.name,
      contentType: f.type || "application/octet-stream",
      contentBytes: Buffer.from(await f.arrayBuffer()).toString("base64"),
    }))
  );

  const res = await graphMail(mailbox, "POST", "/sendMail", {
    message: {
      subject,
      body: { contentType: "HTML", content: textToHtml(body) },
      toRecipients: to.map((address) => ({ emailAddress: { address } })),
      ccRecipients: cc.map((address) => ({ emailAddress: { address } })),
      attachments,
    },
    saveToSentItems: true,
  });
  if (!res.ok) return NextResponse.json({ error: await graphError(res, "Sending the email") }, { status: 502 });

  return NextResponse.json({ sent: true, from: mailbox, to, cc, subject, attachments: files.map((f) => f.name) }, { status: 201 });
}

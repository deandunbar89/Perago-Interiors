import { NextResponse } from "next/server";
import { badRequest, isResponse, requireAgent } from "@/lib/agent-auth";
import { graphError, graphMail, mailboxAddress, MAILBOXES } from "@/lib/agent-mail";

export const dynamic = "force-dynamic";

/**
 * Reads one message in full, with its attachment list.
 * GET /api/agent/email/<id>?mailbox=design|procurement            → message (plain-text body) + attachments
 * GET /api/agent/email/<id>?mailbox=…&attachment=<attachmentId>   → that attachment's file
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAgent(req);
  if (isResponse(actor)) return actor;

  const { id } = await params;
  const url = new URL(req.url);
  const mailbox = mailboxAddress(url.searchParams.get("mailbox"));
  if (!mailbox) return badRequest(`mailbox must be one of: ${Object.keys(MAILBOXES).join(", ")}`);
  const messagePath = `/messages/${encodeURIComponent(id)}`;

  const attachmentId = url.searchParams.get("attachment");
  if (attachmentId) {
    const res = await graphMail(mailbox, "GET", `${messagePath}/attachments/${encodeURIComponent(attachmentId)}`);
    if (!res.ok) return NextResponse.json({ error: await graphError(res, "Reading the attachment") }, { status: 502 });
    const a = (await res.json()) as { name?: string; contentType?: string; contentBytes?: string };
    if (!a.contentBytes) return badRequest("That attachment isn't a file (it may be a linked item)");
    return new NextResponse(Buffer.from(a.contentBytes, "base64"), {
      headers: {
        "Content-Type": a.contentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${(a.name ?? "attachment").replace(/"/g, "")}"`,
      },
    });
  }

  const [msgRes, attRes] = await Promise.all([
    graphMail(mailbox, "GET", `${messagePath}?$select=id,subject,from,toRecipients,ccRecipients,receivedDateTime,body,conversationId,isRead`),
    graphMail(mailbox, "GET", `${messagePath}/attachments?$select=id,name,contentType,size,isInline`),
  ]);
  if (!msgRes.ok) return NextResponse.json({ error: await graphError(msgRes, "Reading the email") }, { status: 502 });
  const m = (await msgRes.json()) as Record<string, unknown> & { body?: { content?: string } };
  const atts = attRes.ok ? ((await attRes.json()) as { value: Record<string, unknown>[] }).value : [];

  // Mark as read so the next check only shows new replies.
  if (!m.isRead) await graphMail(mailbox, "PATCH", messagePath, { isRead: true }).catch(() => undefined);

  type Addr = { emailAddress?: { name?: string; address?: string } };
  const who = (a?: Addr) => (a?.emailAddress ? `${a.emailAddress.name ?? ""} <${a.emailAddress.address ?? ""}>`.trim() : null);

  return NextResponse.json({
    id: m.id,
    conversationId: m.conversationId,
    subject: m.subject,
    from: who(m.from as Addr),
    to: ((m.toRecipients as Addr[]) ?? []).map(who),
    cc: ((m.ccRecipients as Addr[]) ?? []).map(who),
    date: m.receivedDateTime,
    body: (m.body?.content ?? "").slice(0, 20000),
    attachments: atts.filter((a) => !a.isInline).map((a) => ({ id: a.id, name: a.name, contentType: a.contentType, size: a.size })),
  });
}

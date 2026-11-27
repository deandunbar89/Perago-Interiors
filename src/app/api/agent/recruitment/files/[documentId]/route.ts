import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { isResponse, requireAgent } from "@/lib/agent-auth";
import { uploadedFilePath } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** Downloads one candidate document (CV, cover letter…). GET /api/agent/recruitment/files/<documentId> */
export async function GET(req: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const actor = await requireAgent(req);
  if (isResponse(actor)) return actor;
  const { documentId } = await params;
  const doc = await prisma.recruitmentDocument.findUnique({ where: { id: documentId } });
  if (!doc) return new NextResponse("Not found", { status: 404 });
  try {
    const buffer = await readFile(uploadedFilePath("recruitment", doc.storedName));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.originalName)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse("File missing on disk", { status: 404 });
  }
}

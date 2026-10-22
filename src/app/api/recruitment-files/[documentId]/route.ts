import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { getAccess } from "@/lib/section-access";
import { uploadedFilePath } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  // CVs and offer letters are HR data: signed in isn't enough, the user needs Recruitment access.
  const access = await getAccess();
  if (!access.sections.includes("RECRUITMENT")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { documentId } = await params;
  const doc = await prisma.recruitmentDocument.findUnique({ where: { id: documentId } });
  if (!doc) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const buffer = await readFile(uploadedFilePath("recruitment", doc.storedName));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(doc.originalName)}"`,
        "Content-Length": String(doc.size),
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse("File missing on disk", { status: 404 });
  }
}

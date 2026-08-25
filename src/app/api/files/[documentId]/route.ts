import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadedFilePath } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { documentId } = await params;
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const buffer = await readFile(uploadedFilePath(doc.projectId, doc.storedName));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(doc.originalName)}"`,
        "Content-Length": String(doc.size),
      },
    });
  } catch {
    return new NextResponse("File missing on disk", { status: 404 });
  }
}

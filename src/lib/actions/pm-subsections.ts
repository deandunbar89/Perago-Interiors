"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteUploadedFile } from "@/lib/storage";
import type { PmDocCategory, UploadMode } from "@/lib/constants";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createSubsection(
  pmProjectId: string,
  category: PmDocCategory,
  formData: FormData
) {
  await requireUserId();

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required" };
  const mode = (formData.get("mode") as UploadMode) || "MULTIPLE";

  const maxSort = await prisma.pmDocSubsection.aggregate({
    where: { pmProjectId, category },
    _max: { sortOrder: true },
  });

  try {
    await prisma.pmDocSubsection.create({
      data: {
        pmProjectId,
        category,
        name,
        mode,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    });
  } catch {
    return { error: "A section with this name already exists" };
  }

  revalidatePath(`/pm/projects/${pmProjectId}`);
  return { success: true };
}

export async function deleteSubsection(pmProjectId: string, subsectionId: string) {
  await requireUserId();

  const subsection = await prisma.pmDocSubsection.findUnique({
    where: { id: subsectionId },
    include: { documents: true },
  });
  if (!subsection || subsection.pmProjectId !== pmProjectId) return;

  for (const doc of subsection.documents) {
    await deleteUploadedFile(`pm-${pmProjectId}`, doc.storedName);
  }

  await prisma.pmDocSubsection.delete({ where: { id: subsectionId } });

  revalidatePath(`/pm/projects/${pmProjectId}`);
}

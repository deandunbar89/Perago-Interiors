import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "storage", "uploads");

export async function saveUploadedFile(file: File, projectId: string) {
  const dir = path.join(UPLOAD_ROOT, projectId);
  await mkdir(dir, { recursive: true });

  const ext = path.extname(file.name);
  const storedName = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, storedName), buffer);

  return { storedName, size: buffer.length };
}

export function uploadedFilePath(projectId: string, storedName: string) {
  return path.join(UPLOAD_ROOT, projectId, storedName);
}

export async function deleteUploadedFile(projectId: string, storedName: string) {
  try {
    await unlink(uploadedFilePath(projectId, storedName));
  } catch {
    // file already gone — ignore
  }
}

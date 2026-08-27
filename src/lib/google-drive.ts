import { google } from "googleapis";
import { Readable } from "stream";

const FOLDER_MIME = "application/vnd.google-apps.folder";

function getDriveClient() {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: "v3", auth });
}

/** Escapes a name for safe use inside a Drive API `q` string literal. */
function escapeForQuery(name: string) {
  return name.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function findOrCreateFolder(
  drive: ReturnType<typeof getDriveClient> & object,
  name: string,
  parentId: string
) {
  const safeName = escapeForQuery(name);
  const existing = await drive.files.list({
    q: `name='${safeName}' and '${parentId}' in parents and mimeType='${FOLDER_MIME}' and trashed=false`,
    fields: "files(id)",
    spaces: "drive",
  });
  const found = existing.data.files?.[0];
  if (found?.id) return found.id;

  const created = await drive.files.create({
    requestBody: { name, mimeType: FOLDER_MIME, parents: [parentId] },
    fields: "id",
  });
  if (!created.data.id) throw new Error("Drive did not return a folder id");
  return created.data.id;
}

async function resolveFolderPath(
  drive: ReturnType<typeof getDriveClient> & object,
  segments: string[]
) {
  let parentId = "root";
  for (const segment of segments) {
    parentId = await findOrCreateFolder(drive, segment, parentId);
  }
  return parentId;
}

/**
 * Creates the full PM project folder template in Drive up front — every category and
 * section, whether or not anything's been uploaded yet — so the structure is ready to
 * browse immediately rather than growing one folder at a time as files land.
 */
export async function createPmProjectDriveTemplate(
  projectTitle: string,
  subsections: { category: string; alsoInCategory?: string | null; name: string }[]
) {
  try {
    const drive = getDriveClient();
    if (!drive) return;

    const projectFolderId = await resolveFolderPath(drive, ["Perago Interiors", "PM Projects", projectTitle]);
    const categoryFolders = new Map<string, string>();

    async function categoryFolderId(category: string) {
      const cached = categoryFolders.get(category);
      if (cached) return cached;
      const id = await findOrCreateFolder(drive!, category, projectFolderId);
      categoryFolders.set(category, id);
      return id;
    }

    for (const sub of subsections) {
      await findOrCreateFolder(drive, sub.name, await categoryFolderId(sub.category));
      if (sub.alsoInCategory) {
        await findOrCreateFolder(drive, sub.name, await categoryFolderId(sub.alsoInCategory));
      }
    }
  } catch (err) {
    console.error("Drive PM template failed:", err);
  }
}

/** Same idea as createPmProjectDriveTemplate, for the flatter CRM project/category structure. */
export async function createCrmProjectDriveTemplate(projectTitle: string, categories: string[]) {
  try {
    const drive = getDriveClient();
    if (!drive) return;

    const projectFolderId = await resolveFolderPath(drive, ["Perago Interiors", "CRM Projects", projectTitle]);
    for (const category of categories) {
      await findOrCreateFolder(drive, category, projectFolderId);
    }
  } catch (err) {
    console.error("Drive CRM template failed:", err);
  }
}

/**
 * Copies a file into Drive under Perago Interiors/<pathSegments...>, creating any
 * missing folders along the way. Never throws — a Drive outage should never break
 * the actual (local) upload it's backing up, so failures are logged and swallowed.
 */
export async function mirrorToDrive(
  pathSegments: string[],
  filename: string,
  mimeType: string,
  buffer: Buffer
) {
  try {
    const drive = getDriveClient();
    if (!drive) return;

    const folderId = await resolveFolderPath(drive, ["Perago Interiors", ...pathSegments]);

    await drive.files.create({
      requestBody: { name: filename, parents: [folderId] },
      media: { mimeType, body: Readable.from(buffer) },
      fields: "id",
    });
  } catch (err) {
    console.error("Drive mirror failed:", err);
  }
}

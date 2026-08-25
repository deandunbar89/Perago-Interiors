/**
 * One-time data migration: copies everything out of the old local SQLite
 * database (prisma/dev.db) into the new Postgres database that DATABASE_URL
 * points at. Run this once, right after `prisma migrate deploy` has created
 * the empty tables on Postgres, and before pointing the live app at it.
 *
 * Usage:
 *   SQLITE_DATABASE_URL="file:./dev.db" npx tsx scripts/migrate-to-postgres.ts
 * (DATABASE_URL for the Postgres target should already be set in .env)
 */
import { PrismaClient as SqliteClient } from "../node_modules/.prisma/sqlite-client";
import { PrismaClient as PgClient } from "@prisma/client";

const sqlite = new SqliteClient();
const pg = new PgClient();

async function main() {
  console.log("Reading from SQLite, writing to Postgres...\n");

  const users = await sqlite.user.findMany();
  for (const u of users) await pg.user.create({ data: u });
  console.log(`Users:        ${users.length}`);

  const clients = await sqlite.client.findMany();
  for (const c of clients) await pg.client.create({ data: c });
  console.log(`Clients:      ${clients.length}`);

  const contacts = await sqlite.contact.findMany();
  for (const c of contacts) await pg.contact.create({ data: c });
  console.log(`Contacts:     ${contacts.length}`);

  const projects = await sqlite.project.findMany();
  for (const p of projects) await pg.project.create({ data: p });
  console.log(`Projects:     ${projects.length}`);

  const pmProjects = await sqlite.pmProject.findMany();
  for (const p of pmProjects) await pg.pmProject.create({ data: p });
  console.log(`PM Projects:  ${pmProjects.length}`);

  const documents = await sqlite.document.findMany();
  for (const d of documents) await pg.document.create({ data: d });
  console.log(`Documents:    ${documents.length}`);

  const emailLogs = await sqlite.emailLog.findMany();
  for (const e of emailLogs) await pg.emailLog.create({ data: e });
  console.log(`Email logs:   ${emailLogs.length}`);

  const activities = await sqlite.activity.findMany();
  for (const a of activities) await pg.activity.create({ data: a });
  console.log(`Activities:   ${activities.length}`);

  const tasks = await sqlite.task.findMany();
  for (const t of tasks) await pg.task.create({ data: t });
  console.log(`Tasks:        ${tasks.length}`);

  const taskNotes = await sqlite.taskNote.findMany();
  for (const t of taskNotes) await pg.taskNote.create({ data: t });
  console.log(`Task notes:   ${taskNotes.length}`);

  const subtasks = await sqlite.subtask.findMany();
  for (const s of subtasks) await pg.subtask.create({ data: s });
  console.log(`Subtasks:     ${subtasks.length}`);

  const notes = await sqlite.note.findMany();
  for (const n of notes) await pg.note.create({ data: n });
  console.log(`Notes:        ${notes.length}`);

  const pmDocuments = await sqlite.pmDocument.findMany();
  for (const d of pmDocuments) await pg.pmDocument.create({ data: d });
  console.log(`PM Documents: ${pmDocuments.length}`);

  const scheduleItems = await sqlite.scheduleItem.findMany();
  for (const s of scheduleItems) await pg.scheduleItem.create({ data: s });
  console.log(`Schedule items: ${scheduleItems.length}`);

  console.log("\nDone. Verify counts above match what you expect, then double-check a few records in the live app.");
}

main()
  .catch((err) => {
    console.error("\nMigration failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await sqlite.$disconnect();
    await pg.$disconnect();
  });

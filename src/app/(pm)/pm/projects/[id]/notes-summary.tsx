import { formatDistanceToNow } from "date-fns";
import type { Note, User } from "@prisma/client";

const PREVIEW_COUNT = 3;

export default function NotesSummary({ notes }: { notes: (Note & { author: User | null })[] }) {
  if (notes.length === 0) {
    return <p className="text-sm text-slate-400">No notes yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {notes.slice(0, PREVIEW_COUNT).map((note) => (
        <li key={note.id} className="text-sm">
          <p className="mb-0.5 text-xs font-medium text-slate-500">
            {note.author?.name || "Unknown"} · {formatDistanceToNow(note.createdAt, { addSuffix: true })}
          </p>
          <p className="line-clamp-2 whitespace-pre-wrap text-slate-700">{note.body}</p>
        </li>
      ))}
    </ul>
  );
}

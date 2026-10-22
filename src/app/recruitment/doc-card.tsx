"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { Download, FileText, Trash2, UploadCloud, X } from "lucide-react";
import { format } from "date-fns";
import type { RecruitmentDocument, User } from "@prisma/client";
import { deleteCandidateDocument, uploadCandidateDocument } from "@/lib/actions/recruitment";
import type { RecruitmentDocType } from "@/lib/constants";
import { formatSize } from "./parts";

type Doc = RecruitmentDocument & { uploadedBy: Pick<User, "name"> | null };

/** One drag-and-drop upload area plus the files already filed under it (e.g. all of a candidate's CVs). */
export default function DocCard({
  candidateId,
  type,
  title,
  hint,
  documents,
}: {
  candidateId: string;
  type: RecruitmentDocType;
  title: string;
  hint?: string;
  documents: Doc[];
}) {
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.size > 0);
    if (list.length === 0) return;
    setPendingFiles((prev) => [...prev, ...list]);
    setError(null);
  }, []);

  function handleUpload() {
    if (pendingFiles.length === 0) {
      setError("Choose, drop, or paste a file");
      return;
    }
    setError(null);
    const formData = new FormData();
    pendingFiles.forEach((f) => formData.append("files", f));
    startTransition(async () => {
      const result = await uploadCandidateDocument(candidateId, type, formData);
      if (result?.error) setError(result.error);
      else {
        setPendingFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  }

  function handleDelete(documentId: string) {
    if (!confirm("Delete this file?")) return;
    startTransition(() => {
      deleteCandidateDocument(documentId);
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        <span className="text-xs text-slate-400">
          {documents.length} file{documents.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="p-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
          }}
          onPaste={(e) => {
            const files = Array.from(e.clipboardData.files || []);
            if (files.length > 0) {
              e.preventDefault();
              addFiles(files);
            }
          }}
          tabIndex={0}
          className={`rounded-lg border border-dashed p-3 outline-none transition ${
            dragActive ? "border-slate-500 bg-slate-50" : "border-slate-300"
          }`}
        >
          <div className="flex flex-col items-center gap-1 py-1 text-center">
            <UploadCloud size={20} className={dragActive ? "text-slate-600" : "text-slate-400"} />
            <p className="text-xs text-slate-600">
              Drag and drop, paste (Ctrl+V), or{" "}
              <button type="button" onClick={() => fileInputRef.current?.click()} className="font-medium underline">
                browse
              </button>
            </p>
            {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />

          {pendingFiles.length > 0 && (
            <ul className="mt-2 space-y-1">
              {pendingFiles.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center justify-between gap-2 rounded bg-slate-50 px-2 py-1 text-xs text-slate-700"
                >
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {(pendingFiles.length > 0 || error) && (
            <div className="mt-2 flex items-center justify-between gap-2">
              {error ? <p className="text-xs text-red-600">{error}</p> : <span />}
              {pendingFiles.length > 0 && (
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={pending}
                  className="rounded-lg bg-charcoal px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gold hover:text-charcoal disabled:opacity-60"
                >
                  {pending ? "Uploading…" : "Upload"}
                </button>
              )}
            </div>
          )}
        </div>

        {documents.length > 0 && (
          <ul className="mt-3 divide-y divide-slate-100">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-2 py-2">
                <FileText size={16} className="shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <a
                    href={`/api/recruitment-files/${doc.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-sm font-medium text-slate-800 hover:underline"
                  >
                    {doc.originalName}
                  </a>
                  <p className="text-[11px] text-slate-400">
                    {format(doc.createdAt, "d MMM yyyy")} · {formatSize(doc.size)}
                    {doc.uploadedBy ? ` · ${doc.uploadedBy.name}` : ""}
                  </p>
                </div>
                <a
                  href={`/api/recruitment-files/${doc.id}`}
                  download={doc.originalName}
                  title="Download"
                  className="text-slate-400 transition hover:text-slate-700"
                >
                  <Download size={14} />
                </a>
                <button
                  onClick={() => handleDelete(doc.id)}
                  title="Delete"
                  className="text-slate-400 transition hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { FileText, Trash2, Upload, Download, UploadCloud, X } from "lucide-react";
import { format } from "date-fns";
import type { PmDocSubsection, PmDocument, User } from "@prisma/client";
import { uploadPmDocument, deletePmDocument } from "@/lib/actions/pm-documents";
import { deleteSubsection } from "@/lib/actions/pm-subsections";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SubsectionCard({
  pmProjectId,
  subsection,
  documents,
}: {
  pmProjectId: string;
  subsection: PmDocSubsection;
  documents: (PmDocument & { uploadedBy: User | null })[];
}) {
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.size > 0);
      if (list.length === 0) return;
      if (subsection.mode === "SINGLE") {
        setPendingFiles([list[0]]);
      } else {
        setPendingFiles((prev) => [...prev, ...list]);
      }
      setError(null);
    },
    [subsection.mode]
  );

  function removeFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const files = Array.from(e.clipboardData.files || []);
      if (files.length > 0) {
        e.preventDefault();
        addFiles(files);
      }
    },
    [addFiles]
  );

  function handleUpload() {
    if (pendingFiles.length === 0) {
      setError("Choose, drop, or paste a file");
      return;
    }
    setError(null);
    const formData = new FormData();
    pendingFiles.forEach((f) => formData.append("files", f));

    startTransition(async () => {
      const result = await uploadPmDocument(pmProjectId, subsection.id, formData);
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
      deletePmDocument(pmProjectId, documentId);
    });
  }

  function handleDeleteSection() {
    if (!confirm(`Remove the "${subsection.name}" section? Any files in it will be deleted.`)) return;
    startTransition(() => {
      deleteSubsection(pmProjectId, subsection.id);
    });
  }

  const replaceMode = subsection.mode === "SINGLE";

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <h4 className="text-sm font-semibold text-slate-900">{subsection.name}</h4>
        <div className="flex items-center gap-2">
          {replaceMode && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
              Latest file only
            </span>
          )}
          <button
            onClick={handleDeleteSection}
            title="Remove section"
            className="text-slate-300 transition hover:text-red-600"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onPaste={handlePaste}
          tabIndex={0}
          className={`rounded-lg border border-dashed p-4 outline-none transition ${
            dragActive ? "border-slate-500 bg-slate-50" : "border-slate-300"
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-1.5 py-3 text-center">
            <UploadCloud size={22} className={dragActive ? "text-slate-600" : "text-slate-300"} />
            <p className="text-xs text-slate-600">
              Drag and drop, paste, or{" "}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="font-medium text-slate-900 underline"
              >
                browse
              </button>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple={!replaceMode}
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          {pendingFiles.length > 0 && (
            <ul className="mb-2 space-y-1 border-t border-slate-100 pt-2">
              {pendingFiles.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1 text-xs"
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <FileText size={12} className="shrink-0 text-slate-400" />
                    <span className="truncate text-slate-700">{f.name}</span>
                    <span className="shrink-0 text-slate-400">{formatSize(f.size)}</span>
                  </span>
                  <button
                    onClick={() => removeFile(i)}
                    className="shrink-0 text-slate-400 transition hover:text-red-600"
                  >
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleUpload}
              disabled={pending || pendingFiles.length === 0}
              className="flex items-center gap-1.5 rounded-lg bg-charcoal px-3 py-1.5 text-xs font-medium text-white transition hover:bg-jet disabled:opacity-60"
            >
              <Upload size={13} />
              {pending ? "Uploading…" : "Upload"}
            </button>
          </div>
          {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        </div>

        {documents.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-400">Nothing uploaded yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-3 py-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <FileText size={16} className="shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-slate-800">{doc.originalName}</p>
                    <p className="text-[11px] text-slate-400">
                      {formatSize(doc.size)} · {doc.uploadedBy?.name || "Unknown"} ·{" "}
                      {format(doc.createdAt, "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <a
                    href={`/api/pm-files/${doc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Download / view"
                    className="flex items-center justify-center rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Download size={14} />
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    title="Delete"
                    className="flex items-center justify-center rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { FileText, Trash2, Upload, Download, UploadCloud, X } from "lucide-react";
import { format } from "date-fns";
import { DOC_CATEGORIES, DOC_CATEGORY_LABELS, type DocCategory } from "@/lib/constants";
import { uploadDocument, deleteDocument } from "@/lib/actions/documents";
import type { ProjectDetail } from "./types";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsTab({ project }: { project: ProjectDetail }) {
  const [category, setCategory] = useState<DocCategory>("TENDER_DOC");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.size > 0);
    if (list.length === 0) return;
    setPendingFiles((prev) => [...prev, ...list]);
    setError(null);
  }

  function removeFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files || []);
    if (files.length > 0) {
      e.preventDefault();
      addFiles(files);
    }
  }, []);

  function handleUpload() {
    if (pendingFiles.length === 0) {
      setError("Choose, drop, or paste at least one file");
      return;
    }
    setError(null);
    const formData = new FormData();
    pendingFiles.forEach((f) => formData.append("files", f));
    formData.set("category", category);

    startTransition(async () => {
      const result = await uploadDocument(project.id, formData);
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
      deleteDocument(project.id, documentId);
    });
  }

  const grouped = DOC_CATEGORIES.map((cat) => ({
    category: cat,
    docs: project.documents.filter((d) => d.category === cat),
  })).filter((g) => g.docs.length > 0);

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onPaste={handlePaste}
        tabIndex={0}
        className={`rounded-xl border border-dashed bg-white p-5 outline-none transition ${
          dragActive ? "border-slate-500 bg-slate-50" : "border-slate-300"
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-transparent py-6 text-center">
          <UploadCloud size={28} className={dragActive ? "text-slate-600" : "text-slate-300"} />
          <p className="text-sm text-slate-600">
            Drag and drop files, paste (Ctrl+V), or{" "}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="font-medium text-slate-900 underline"
            >
              browse
            </button>
          </p>
          <p className="text-xs text-slate-400">Drawings, PDFs, contracts — up to 100MB each</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </div>

        {pendingFiles.length > 0 && (
          <ul className="mb-3 space-y-1.5 border-t border-slate-100 pt-3">
            {pendingFiles.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <FileText size={14} className="shrink-0 text-slate-400" />
                  <span className="truncate text-slate-700">{f.name}</span>
                  <span className="shrink-0 text-xs text-slate-400">{formatSize(f.size)}</span>
                </span>
                <button
                  onClick={() => removeFile(i)}
                  className="shrink-0 text-slate-400 transition hover:text-red-600"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocCategory)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            >
              {DOC_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {DOC_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleUpload}
            disabled={pending || pendingFiles.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-white transition hover:bg-jet disabled:opacity-60"
          >
            <Upload size={15} />
            {pending ? "Uploading…" : `Upload${pendingFiles.length ? ` (${pendingFiles.length})` : ""}`}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {grouped.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">
          No documents or drawings uploaded yet.
        </p>
      ) : (
        grouped.map(({ category: cat, docs }) => (
          <div key={cat} className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {DOC_CATEGORY_LABELS[cat]}
              </h3>
            </div>
            <ul className="divide-y divide-slate-100">
              {docs.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText size={18} className="shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {doc.originalName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatSize(doc.size)} · {doc.uploadedBy?.name || "Unknown"} ·{" "}
                        {format(doc.createdAt, "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <a
                      href={`/api/files/${doc.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Download / view"
                      className="flex items-center justify-center rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Download size={16} />
                    </a>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      title="Delete"
                      className="flex items-center justify-center rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}

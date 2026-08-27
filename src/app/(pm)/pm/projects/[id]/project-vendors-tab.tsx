"use client";

import { useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Download, UploadCloud, Building2 } from "lucide-react";
import type { PmDocument, Vendor } from "@prisma/client";
import {
  addVendorToProject,
  removeVendorFromProject,
  updateProjectVendorScope,
  uploadVendorDocument,
  deleteVendorDocument,
} from "@/lib/actions/pm-project-vendors";
import { VENDOR_DOC_TYPES, VENDOR_DOC_TYPE_LABELS, VENDOR_TYPE_LABELS, TRADE_LABELS } from "@/lib/constants";
import type { PmProjectDetail } from "./types";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function VendorDocCard({
  pmProjectId,
  pmProjectVendorId,
  docType,
  documents,
}: {
  pmProjectId: string;
  pmProjectVendorId: string;
  docType: (typeof VENDOR_DOC_TYPES)[number];
  documents: PmDocument[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));
    startTransition(async () => {
      const result = await uploadVendorDocument(pmProjectId, pmProjectVendorId, docType, formData);
      if (result?.error) setError(result.error);
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  function handleDelete(documentId: string) {
    if (!confirm("Delete this file?")) return;
    startTransition(() => {
      deleteVendorDocument(pmProjectId, documentId);
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h5 className="text-xs font-semibold text-slate-700">{VENDOR_DOC_TYPE_LABELS[docType]}</h5>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={pending}
          className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <UploadCloud size={12} />
          Upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="mb-1 text-[11px] text-red-600">{error}</p>}
      {documents.length === 0 ? (
        <p className="text-[11px] text-slate-400">Nothing uploaded yet.</p>
      ) : (
        <ul className="space-y-1">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="min-w-0 truncate text-slate-700">{doc.originalName}</span>
              <span className="flex shrink-0 items-center gap-1 text-slate-400">
                {formatSize(doc.size)}
                <a href={`/api/pm-files/${doc.id}`} target="_blank" rel="noopener noreferrer" className="hover:text-slate-700">
                  <Download size={12} />
                </a>
                <button onClick={() => handleDelete(doc.id)} className="hover:text-red-600">
                  <Trash2 size={12} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ScopeField({
  pmProjectId,
  pmProjectVendorId,
  scope,
}: {
  pmProjectId: string;
  pmProjectVendorId: string;
  scope: string | null;
}) {
  const [value, setValue] = useState(scope ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleBlur() {
    if (value === (scope ?? "")) return;
    const formData = new FormData();
    formData.set("scope", value);
    startTransition(async () => {
      await updateProjectVendorScope(pmProjectId, pmProjectVendorId, formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">Scope of work</label>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        rows={2}
        placeholder="What this vendor is engaged to do on this project"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
      />
      {pending && <p className="mt-1 text-[11px] text-slate-400">Saving…</p>}
      {saved && <p className="mt-1 text-[11px] text-emerald-600">Saved</p>}
    </div>
  );
}

export default function ProjectVendorsTab({
  project,
  allVendors,
}: {
  project: PmProjectDetail;
  allVendors: Vendor[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const engagedIds = new Set(project.vendors.map((v) => v.vendorId));
  const availableVendors = allVendors.filter((v) => !engagedIds.has(v.id));

  function handleAdd() {
    if (!selectedVendorId) return;
    setError(null);
    startTransition(async () => {
      const result = await addVendorToProject(project.id, selectedVendorId);
      if (result?.error) setError(result.error);
      else {
        setSelectedVendorId("");
        setAddOpen(false);
      }
    });
  }

  function handleRemove(pmProjectVendorId: string) {
    if (!confirm("Remove this vendor from the project? Any uploaded files will be deleted.")) return;
    startTransition(() => {
      removeVendorFromProject(project.id, pmProjectVendorId);
    });
  }

  return (
    <div className="space-y-4">
      {project.vendors.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">No vendors added to this project yet.</p>
      )}

      {project.vendors.map((entry) => (
        <div key={entry.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Building2 size={15} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{entry.vendor.name}</p>
                <p className="text-xs text-slate-500">
                  {VENDOR_TYPE_LABELS[entry.vendor.type as keyof typeof VENDOR_TYPE_LABELS]}
                  {entry.vendor.trade && ` · ${TRADE_LABELS[entry.vendor.trade as keyof typeof TRADE_LABELS]}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleRemove(entry.id)}
              className="text-slate-300 transition hover:text-red-600"
            >
              <Trash2 size={15} />
            </button>
          </div>

          <div className="space-y-4 p-4">
            <ScopeField pmProjectId={project.id} pmProjectVendorId={entry.id} scope={entry.scope} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {VENDOR_DOC_TYPES.map((docType) => (
                <VendorDocCard
                  key={docType}
                  pmProjectId={project.id}
                  pmProjectVendorId={entry.id}
                  docType={docType}
                  documents={entry.documents.filter((d) => d.vendorDocType === docType)}
                />
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              Added {format(entry.createdAt, "MMM d, yyyy")}
            </p>
          </div>
        </div>
      ))}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <button
          onClick={() => setAddOpen((v) => !v)}
          className="flex w-full items-center gap-1.5 px-4 py-3 text-sm font-medium text-slate-700"
        >
          <Plus size={15} />
          Add vendor to project
        </button>
        {addOpen && (
          <div className="space-y-3 border-t border-slate-100 p-4">
            <select
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            >
              <option value="">Choose a vendor…</option>
              {availableVendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({VENDOR_TYPE_LABELS[v.type as keyof typeof VENDOR_TYPE_LABELS]})
                </option>
              ))}
            </select>
            {availableVendors.length === 0 && (
              <p className="text-xs text-slate-400">
                All vendors are already on this project, or none exist yet — add one from the Vendors section.
              </p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              onClick={handleAdd}
              disabled={pending || !selectedVendorId}
              className="rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-white transition hover:bg-jet disabled:opacity-60"
            >
              {pending ? "Adding…" : "Add"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

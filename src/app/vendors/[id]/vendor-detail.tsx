"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Download, Globe, Mail, Phone, Plus, Trash2, User as UserIcon } from "lucide-react";
import type { PmProject, PmProjectVendor, Vendor, VendorDocument, VendorProjectHistory } from "@prisma/client";
import StarRating from "@/components/star-rating";
import { addVendorHistory, deleteVendorHistory, setVendorRating } from "@/lib/actions/vendor-history";
import { TRADE_LABELS, VENDOR_TYPE_LABELS } from "@/lib/constants";

type VendorFull = Vendor & {
  tradeLicenseDoc: VendorDocument | null;
  trnCertDoc: VendorDocument | null;
  history: (VendorProjectHistory & { pmProject: Pick<PmProject, "id" | "title"> | null })[];
  pmProjects: (PmProjectVendor & { pmProject: Pick<PmProject, "id" | "title" | "status"> })[];
};

const fieldClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold";

function AddHistoryForm({
  vendorId,
  projects,
  onDone,
}: {
  vendorId: string;
  projects: { id: string; title: string }[];
  onDone: () => void;
}) {
  const [rating, setRating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    if (rating) formData.set("rating", String(rating));
    startTransition(async () => {
      const result = await addVendorHistory(vendorId, formData);
      if (result?.error) setError(result.error);
      else {
        formRef.current?.reset();
        setRating(null);
        onDone();
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3 border-t border-slate-100 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select name="pmProjectId" defaultValue="" className={fieldClass}>
          <option value="">Not a live project (past work)</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <input name="projectName" placeholder="Project name (if not picked from the list)" className={fieldClass} />
        <input name="workedOn" type="date" className={fieldClass} />
        <input name="scope" placeholder="What did they do on it?" className={fieldClass} />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500">How did they perform?</span>
        <StarRating value={rating} onChange={setRating} size={20} />
      </div>
      <textarea name="notes" rows={2} placeholder="Notes — quality, timing, issues, would we use them again?" className={fieldClass} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-white transition hover:bg-gold hover:text-charcoal disabled:opacity-60"
      >
        {pending ? "Saving…" : "Add to history"}
      </button>
    </form>
  );
}

export default function VendorDetail({
  vendor,
  projects,
}: {
  vendor: VendorFull;
  projects: { id: string; title: string }[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [, startTransition] = useTransition();

  const projectRatings = vendor.history.map((h) => h.rating).filter((r): r is number => r !== null);
  const average = projectRatings.length > 0 ? projectRatings.reduce((a, b) => a + b, 0) / projectRatings.length : null;

  // Live engagements that haven't also been logged by hand, so nothing shows twice.
  const loggedProjectIds = new Set(vendor.history.map((h) => h.pmProjectId).filter(Boolean));
  const autoEngagements = vendor.pmProjects.filter((e) => !loggedProjectIds.has(e.pmProjectId));

  function handleRating(value: number | null) {
    startTransition(() => {
      setVendorRating(vendor.id, value);
    });
  }

  function handleDelete(entryId: string) {
    if (!confirm("Remove this from the history?")) return;
    startTransition(() => {
      deleteVendorHistory(vendor.id, entryId);
    });
  }

  return (
    <div className="space-y-6">
      <Link href="/vendors" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} />
        Vendors
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{vendor.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`rounded-full px-2 py-0.5 font-medium ${
              vendor.type === "CONTRACTOR" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
            }`}
          >
            {VENDOR_TYPE_LABELS[vendor.type as keyof typeof VENDOR_TYPE_LABELS]}
          </span>
          {vendor.trade && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
              {TRADE_LABELS[vendor.trade as keyof typeof TRADE_LABELS] ?? vendor.trade}
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 font-medium ${
              vendor.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
            }`}
          >
            {vendor.status === "ACTIVE" ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Contact</h3>
          <div className="space-y-1.5 text-sm text-slate-600">
            {vendor.contactName && (
              <p className="flex items-center gap-1.5 font-medium text-slate-800">
                <UserIcon size={13} className="text-slate-400" />
                {vendor.contactName}
              </p>
            )}
            {vendor.phone && (
              <p className="flex items-center gap-1.5">
                <Phone size={13} className="text-slate-400" />
                {vendor.phone}
              </p>
            )}
            {vendor.email && (
              <p className="flex items-center gap-1.5">
                <Mail size={13} className="text-slate-400" />
                {vendor.email}
              </p>
            )}
            {vendor.website && (
              <p className="flex items-center gap-1.5">
                <Globe size={13} className="text-slate-400" />
                {vendor.website}
              </p>
            )}
            {!vendor.contactName && !vendor.phone && !vendor.email && !vendor.website && (
              <p className="text-slate-400">No contact details yet — add them from the Vendors list.</p>
            )}
            {(vendor.tradeLicenseDoc || vendor.trnCertDoc) && (
              <div className="flex flex-wrap gap-3 pt-2 text-xs">
                {vendor.tradeLicenseDoc && (
                  <a
                    href={`/api/vendor-files/${vendor.tradeLicenseDoc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 underline hover:text-slate-900"
                  >
                    <Download size={11} />
                    Trade license
                  </a>
                )}
                {vendor.trnCertDoc && (
                  <a
                    href={`/api/vendor-files/${vendor.trnCertDoc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 underline hover:text-slate-900"
                  >
                    <Download size={11} />
                    TRN certificate
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Rating</h3>
          <StarRating value={vendor.rating} onChange={handleRating} size={26} />
          <p className="mt-2 text-xs text-slate-400">
            {vendor.rating ? "Click the same star again to clear it." : "Not rated yet — click a star."}
          </p>
          {average !== null && (
            <p className="mt-3 text-sm text-slate-600">
              Average from {projectRatings.length} project{projectRatings.length > 1 ? "s" : ""}:{" "}
              <span className="font-semibold text-slate-900">{average.toFixed(1)}</span> / 5
            </p>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Projects worked on with us</h2>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <button
            onClick={() => setAddOpen((v) => !v)}
            className="flex w-full items-center gap-1.5 px-4 py-3 text-sm font-medium text-slate-700"
          >
            <Plus size={15} />
            Add a project
          </button>
          {addOpen && (
            <AddHistoryForm vendorId={vendor.id} projects={projects} onDone={() => setAddOpen(false)} />
          )}
        </div>

        {autoEngagements.length === 0 && vendor.history.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No projects recorded yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {autoEngagements.map((e) => (
              <li key={e.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/pm/projects/${e.pmProject.id}`}
                      className="text-sm font-semibold text-slate-900 hover:underline"
                    >
                      {e.pmProject.title}
                    </Link>
                    {e.scope && <p className="mt-0.5 text-sm text-slate-600">{e.scope}</p>}
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    Engaged in the app
                  </span>
                </div>
              </li>
            ))}

            {vendor.history.map((h) => (
              <li key={h.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {h.pmProject ? (
                      <Link
                        href={`/pm/projects/${h.pmProject.id}`}
                        className="text-sm font-semibold text-slate-900 hover:underline"
                      >
                        {h.projectName}
                      </Link>
                    ) : (
                      <p className="text-sm font-semibold text-slate-900">{h.projectName}</p>
                    )}
                    <p className="mt-0.5 text-xs text-slate-400">
                      {h.workedOn ? format(h.workedOn, "MMM yyyy") : "Date not recorded"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {h.rating !== null && <StarRating value={h.rating} size={14} />}
                    <button
                      onClick={() => handleDelete(h.id)}
                      title="Remove"
                      className="text-slate-400 transition hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {h.scope && <p className="mt-2 text-sm text-slate-700">{h.scope}</p>}
                {h.notes && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-500">{h.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

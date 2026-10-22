"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import type { Offer, RecruitmentDocument, User } from "@prisma/client";
import { deleteOffer, saveOffer } from "@/lib/actions/recruitment";
import { OFFER_STATUSES, OFFER_STATUS_LABELS } from "@/lib/constants";
import DocCard from "../../doc-card";
import { FIELD, LABEL, OfferStatusBadge, PRIMARY_BUTTON } from "../../parts";

type Doc = RecruitmentDocument & { uploadedBy: Pick<User, "name"> | null };

export default function OfferSection({
  candidateId,
  offer,
  letters,
}: {
  candidateId: string;
  offer: Offer | null;
  letters: Doc[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveOffer(candidateId, undefined, formData);
      if (result?.error) setError(result.error);
      else setSaved(true);
    });
  }

  function handleDelete() {
    if (!confirm("Remove this offer? The offer letter files stay on file.")) return;
    startTransition(() => {
      deleteOffer(candidateId);
    });
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Offer</h2>
        {offer && <OfferStatusBadge status={offer.status} />}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <form key={offer?.updatedAt.toISOString() ?? "new"} action={handleSubmit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Status</label>
              <select name="status" defaultValue={offer?.status ?? "DRAFT"} className={FIELD}>
                {OFFER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {OFFER_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Start date</label>
              <input
                name="startDate"
                type="date"
                defaultValue={offer?.startDate ? format(offer.startDate, "yyyy-MM-dd") : ""}
                className={FIELD}
              />
            </div>
          </div>
          <div>
            <label className={LABEL}>Offered salary</label>
            <input name="salary" defaultValue={offer?.salary ?? ""} placeholder="e.g. AED 18,000 / month" className={FIELD} />
          </div>
          <div>
            <label className={LABEL}>Notes</label>
            <textarea name="notes" rows={2} defaultValue={offer?.notes ?? ""} className={FIELD} />
          </div>

          {offer && (
            <p className="text-xs text-slate-400">
              {offer.sentAt && `Sent ${format(offer.sentAt, "d MMM yyyy")}`}
              {offer.respondedAt && ` · Response ${format(offer.respondedAt, "d MMM yyyy")}`}
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-emerald-600">Saved.</p>}

          <div className="flex items-center justify-between">
            <button type="submit" disabled={pending} className={PRIMARY_BUTTON}>
              {pending ? "Saving…" : offer ? "Update offer" : "Create offer"}
            </button>
            {offer && (
              <button type="button" onClick={handleDelete} className="text-xs text-slate-400 transition hover:text-red-600">
                Remove offer
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Creating an offer moves the candidate to the Offer stage; marking it Accepted moves them to Hired.
          </p>
        </form>

        <DocCard
          candidateId={candidateId}
          type="OFFER_LETTER"
          title="Offer letter"
          hint="Upload the offer letter, and the signed copy once it's back"
          documents={letters}
        />
      </div>
    </section>
  );
}

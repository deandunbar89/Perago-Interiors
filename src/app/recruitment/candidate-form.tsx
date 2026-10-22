"use client";

import { useState, useTransition } from "react";
import type { Candidate } from "@prisma/client";
import { createCandidate, updateCandidate } from "@/lib/actions/recruitment";
import { FIELD, LABEL, PRIMARY_BUTTON } from "./parts";

const SOURCES = ["LinkedIn", "Referral", "Recruitment agency", "Job board", "Company website", "Walk-in"];

/** Add a candidate (with their CV) or edit one's details. */
export default function CandidateForm({
  vacancies,
  fixedVacancyId,
  candidate,
  onDone,
}: {
  vacancies: { id: string; title: string }[];
  /** When set (adding from a vacancy's own page) the vacancy isn't asked for. */
  fixedVacancyId?: string;
  candidate?: Candidate;
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      if (candidate) {
        const result = await updateCandidate(candidate.id, undefined, formData);
        if (result?.error) setError(result.error);
        else onDone();
        return;
      }
      // The form closes and the list updates in place, so several CVs can be added in a row.
      // (If a file fails to upload, the action opens the saved candidate so it can be retried.)
      const result = await createCandidate(undefined, formData);
      if (result?.error) setError(result.error);
      else onDone();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Full name *</label>
          <input name="name" required defaultValue={candidate?.name} className={FIELD} />
        </div>
        <div>
          <label className={LABEL}>Applying for *</label>
          {fixedVacancyId ? (
            <>
              <input type="hidden" name="vacancyId" value={fixedVacancyId} />
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                {vacancies.find((v) => v.id === fixedVacancyId)?.title ?? "This vacancy"}
              </p>
            </>
          ) : (
            <select name="vacancyId" required defaultValue={candidate?.vacancyId ?? ""} className={FIELD}>
              <option value="" disabled>
                Choose a vacancy…
              </option>
              {vacancies.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Email</label>
          <input name="email" type="email" defaultValue={candidate?.email ?? ""} className={FIELD} />
        </div>
        <div>
          <label className={LABEL}>Phone</label>
          <input name="phone" defaultValue={candidate?.phone ?? ""} className={FIELD} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Current role</label>
          <input name="currentRole" defaultValue={candidate?.currentRole ?? ""} className={FIELD} />
        </div>
        <div>
          <label className={LABEL}>Current company</label>
          <input name="currentCompany" defaultValue={candidate?.currentCompany ?? ""} className={FIELD} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Based in</label>
          <input name="location" defaultValue={candidate?.location ?? ""} className={FIELD} />
        </div>
        <div>
          <label className={LABEL}>Source</label>
          <input name="source" list="candidate-sources" defaultValue={candidate?.source ?? ""} placeholder="Where they came from" className={FIELD} />
          <datalist id="candidate-sources">
            {SOURCES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Notice period</label>
          <input name="noticePeriod" defaultValue={candidate?.noticePeriod ?? ""} placeholder="e.g. 30 days" className={FIELD} />
        </div>
        <div>
          <label className={LABEL}>Expected salary</label>
          <input name="expectedSalary" defaultValue={candidate?.expectedSalary ?? ""} placeholder="e.g. AED 18,000" className={FIELD} />
        </div>
      </div>

      <div>
        <label className={LABEL}>Notes</label>
        <textarea name="notes" rows={2} defaultValue={candidate?.notes ?? ""} className={FIELD} />
      </div>

      {!candidate && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>CV</label>
            <input name="cv" type="file" className="block w-full text-xs text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-2.5 file:py-1.5 file:text-xs file:font-medium" />
          </div>
          <div>
            <label className={LABEL}>Cover letter</label>
            <input name="coverLetter" type="file" className="block w-full text-xs text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-2.5 file:py-1.5 file:text-xs file:font-medium" />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={pending} className={PRIMARY_BUTTON}>
        {pending ? "Saving…" : candidate ? "Save changes" : "Add candidate"}
      </button>
    </form>
  );
}

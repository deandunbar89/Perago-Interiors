"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type { Candidate } from "@prisma/client";
import { createCandidate, readCandidateCv, updateCandidate } from "@/lib/actions/recruitment";
import { EMIRATES, EMIRATE_LABELS } from "@/lib/constants";
import { FIELD, LABEL, PRIMARY_BUTTON } from "./parts";

const SOURCES = ["LinkedIn", "Referral", "Recruitment agency", "Job board", "Company website", "Walk-in"];

type ReadState = { status: "idle" } | { status: "reading" } | { status: "done" } | { status: "error"; message: string };

/** Add a candidate (with their CV) or edit one's details. When CV reading is switched on, choosing a CV
 * fills in the details for the recruiter to check. */
export default function CandidateForm({
  vacancies,
  fixedVacancyId,
  candidate,
  cvReading = false,
  onDone,
}: {
  vacancies: { id: string; title: string }[];
  /** When set (adding from a vacancy's own page) the vacancy isn't asked for. */
  fixedVacancyId?: string;
  candidate?: Candidate;
  /** Whether the server can read CVs (the AI key is set). */
  cvReading?: boolean;
  onDone: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [readState, setReadState] = useState<ReadState>({ status: "idle" });
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

  /** Fills a field only if it's still empty, so anything the recruiter already typed is never overwritten. */
  function fillIfEmpty(name: string, value: string | number | null | undefined) {
    const el = formRef.current?.elements.namedItem(name);
    if (value === null || value === undefined || value === "") return;
    if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
      if (!el.value) el.value = String(value);
    }
  }

  async function handleCvChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !cvReading) return;

    setReadState({ status: "reading" });
    const data = new FormData();
    data.append("cv", file);
    try {
      const result = await readCandidateCv(data);
      if (!result.ok) {
        setReadState({ status: "error", message: result.error });
        return;
      }
      const f = result.fields;
      fillIfEmpty("name", f.name);
      fillIfEmpty("email", f.email);
      fillIfEmpty("phone", f.phone);
      fillIfEmpty("currentRole", f.currentRole);
      fillIfEmpty("currentCompany", f.currentCompany);
      fillIfEmpty("location", f.location);
      fillIfEmpty("emirate", f.emirate);
      fillIfEmpty("nationality", f.nationality);
      fillIfEmpty("yearsExperience", f.yearsExperience);
      fillIfEmpty("notes", f.summary);
      setReadState({ status: "done" });
    } catch {
      setReadState({ status: "error", message: "CV reading hit a problem. You can fill the details in by hand." });
    }
  }

  const reading = readState.status === "reading";

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3">
      {!candidate && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <label className={LABEL}>CV {cvReading && <span className="font-normal text-slate-400">— choose it first and the details below fill in automatically</span>}</label>
          <input
            name="cv"
            type="file"
            onChange={handleCvChosen}
            className="block w-full text-xs text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-white file:px-2.5 file:py-1.5 file:text-xs file:font-medium"
          />
          {reading && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
              <Loader2 size={13} className="animate-spin" />
              Reading the CV…
            </p>
          )}
          {readState.status === "done" && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700">
              <Sparkles size={13} />
              Filled in from the CV. Please check the details before saving.
            </p>
          )}
          {readState.status === "error" && <p className="mt-2 text-xs text-amber-700">{readState.message}</p>}
        </div>
      )}

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
          <label className={LABEL}>Based in (area or city)</label>
          <input name="location" defaultValue={candidate?.location ?? ""} className={FIELD} />
        </div>
        <div>
          <label className={LABEL}>Emirate</label>
          <select name="emirate" defaultValue={candidate?.emirate ?? ""} className={FIELD}>
            <option value="">Not set</option>
            {EMIRATES.map((e) => (
              <option key={e} value={e}>
                {EMIRATE_LABELS[e]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Nationality</label>
          <input name="nationality" defaultValue={candidate?.nationality ?? ""} className={FIELD} />
        </div>
        <div>
          <label className={LABEL}>Years of experience</label>
          <input name="yearsExperience" type="number" min={0} max={80} defaultValue={candidate?.yearsExperience ?? ""} className={FIELD} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Source</label>
          <input name="source" list="candidate-sources" defaultValue={candidate?.source ?? ""} placeholder="Where they came from" className={FIELD} />
          <datalist id="candidate-sources">
            {SOURCES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div>
          <label className={LABEL}>Notice period</label>
          <input name="noticePeriod" defaultValue={candidate?.noticePeriod ?? ""} placeholder="e.g. 30 days" className={FIELD} />
        </div>
      </div>

      <div>
        <label className={LABEL}>Expected salary</label>
        <input name="expectedSalary" defaultValue={candidate?.expectedSalary ?? ""} placeholder="e.g. AED 18,000" className={FIELD} />
      </div>

      <div>
        <label className={LABEL}>Notes</label>
        <textarea name="notes" rows={3} defaultValue={candidate?.notes ?? ""} className={FIELD} />
      </div>

      {!candidate && (
        <div>
          <label className={LABEL}>Cover letter</label>
          <input
            name="coverLetter"
            type="file"
            className="block w-full text-xs text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-2.5 file:py-1.5 file:text-xs file:font-medium"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={pending || reading} className={PRIMARY_BUTTON}>
        {pending ? "Saving…" : reading ? "Reading CV…" : candidate ? "Save changes" : "Add candidate"}
      </button>
    </form>
  );
}

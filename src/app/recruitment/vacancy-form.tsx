"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Vacancy } from "@prisma/client";
import { createVacancy, updateVacancy } from "@/lib/actions/recruitment";
import {
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  VACANCY_STATUSES,
  VACANCY_STATUS_LABELS,
} from "@/lib/constants";
import { FIELD, LABEL, PRIMARY_BUTTON } from "./parts";

/** Create or edit a vacancy. After creating one, jumps to its page so candidates can be added straight away. */
export default function VacancyForm({ vacancy, onDone }: { vacancy?: Vacancy; onDone: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      if (vacancy) {
        const result = await updateVacancy(vacancy.id, undefined, formData);
        if (result?.error) setError(result.error);
        else onDone();
      } else {
        const result = await createVacancy(undefined, formData);
        if (result?.error) setError(result.error);
        else {
          onDone();
          if (result?.id) router.push(`/recruitment/vacancies/${result.id}`);
        }
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <div>
        <label className={LABEL}>Job title *</label>
        <input name="title" required defaultValue={vacancy?.title} placeholder="e.g. Senior Interior Designer" className={FIELD} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Department</label>
          <input name="department" defaultValue={vacancy?.department ?? ""} placeholder="e.g. Design" className={FIELD} />
        </div>
        <div>
          <label className={LABEL}>Location</label>
          <input name="location" defaultValue={vacancy?.location ?? ""} placeholder="e.g. Dubai" className={FIELD} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={LABEL}>Type</label>
          <select name="employmentType" defaultValue={vacancy?.employmentType ?? "FULL_TIME"} className={FIELD}>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EMPLOYMENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL}>Positions</label>
          <input name="headcount" type="number" min={1} defaultValue={vacancy?.headcount ?? 1} className={FIELD} />
        </div>
        {!vacancy && (
          <div>
            <label className={LABEL}>Status</label>
            <select name="status" defaultValue="OPEN" className={FIELD}>
              {VACANCY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {VACANCY_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className={LABEL}>Salary range</label>
        <input name="salaryRange" defaultValue={vacancy?.salaryRange ?? ""} placeholder="e.g. AED 15,000 – 20,000 / month" className={FIELD} />
      </div>

      <div>
        <label className={LABEL}>Description</label>
        <textarea name="description" rows={3} defaultValue={vacancy?.description ?? ""} className={FIELD} />
      </div>

      <div>
        <label className={LABEL}>Requirements</label>
        <textarea name="requirements" rows={3} defaultValue={vacancy?.requirements ?? ""} className={FIELD} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={pending} className={PRIMARY_BUTTON}>
        {pending ? "Saving…" : vacancy ? "Save changes" : "Add vacancy"}
      </button>
    </form>
  );
}

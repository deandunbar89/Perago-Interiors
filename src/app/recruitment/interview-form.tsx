"use client";

import { useState, useTransition } from "react";
import { saveInterview } from "@/lib/actions/recruitment";
import {
  INTERVIEW_RECOMMENDATIONS,
  INTERVIEW_RECOMMENDATION_LABELS,
  INTERVIEW_ROUNDS,
  INTERVIEW_ROUND_LABELS,
  SCORE_CRITERIA,
} from "@/lib/constants";
import { toDubaiInputValue } from "@/lib/dubai-time";
import { FIELD, LABEL, PRIMARY_BUTTON } from "./parts";
import ScoreInput from "./score-input";
import type { FullInterview } from "./types";

/** Book or edit an interview round: when, who, notes, a 1–5 scorecard and an overall recommendation. */
export default function InterviewForm({
  candidateId,
  interview,
  onDone,
}: {
  candidateId: string;
  interview?: FullInterview;
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await saveInterview(candidateId, interview?.id ?? null, undefined, formData);
      if (result?.error) setError(result.error);
      else onDone();
    });
  }

  const scoreFor = (key: string) => interview?.scores.find((s) => s.criterion === key)?.score ?? null;

  return (
    <form action={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Round</label>
          <select name="round" defaultValue={interview?.round ?? "FIRST"} className={FIELD}>
            {INTERVIEW_ROUNDS.map((r) => (
              <option key={r} value={r}>
                {INTERVIEW_ROUND_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL}>Date and time (Dubai) *</label>
          <input
            name="scheduledAt"
            type="datetime-local"
            required
            defaultValue={interview ? toDubaiInputValue(interview.scheduledAt) : ""}
            className={FIELD}
          />
        </div>
      </div>

      <div>
        <label className={LABEL}>Interviewed by</label>
        <input name="interviewer" defaultValue={interview?.interviewer ?? ""} placeholder="Name(s)" className={FIELD} />
      </div>

      <div className="rounded-lg border border-slate-200 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Scorecard (1 – 5)</p>
        <div className="space-y-2">
          {SCORE_CRITERIA.map((c) => (
            <ScoreInput key={c.key} name={`score_${c.key}`} label={c.label} defaultValue={scoreFor(c.key)} />
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate-400">Leave a criterion blank if it wasn&apos;t covered.</p>
      </div>

      <div>
        <label className={LABEL}>Recommendation</label>
        <select name="recommendation" defaultValue={interview?.recommendation ?? ""} className={FIELD}>
          <option value="">No recommendation yet</option>
          {INTERVIEW_RECOMMENDATIONS.map((r) => (
            <option key={r} value={r}>
              {INTERVIEW_RECOMMENDATION_LABELS[r]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL}>Interview notes</label>
        <textarea name="notes" rows={5} defaultValue={interview?.notes ?? ""} placeholder="What was discussed, strengths, concerns…" className={FIELD} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={pending} className={PRIMARY_BUTTON}>
        {pending ? "Saving…" : interview ? "Save interview" : "Add interview"}
      </button>
    </form>
  );
}

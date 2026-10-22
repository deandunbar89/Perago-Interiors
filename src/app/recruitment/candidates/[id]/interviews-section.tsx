"use client";

import { useState, useTransition } from "react";
import { CalendarPlus, Pencil, Plus, Trash2 } from "lucide-react";
import Modal from "@/components/modal";
import { deleteInterview } from "@/lib/actions/recruitment";
import { INTERVIEW_ROUND_LABELS, SCORE_CRITERIA } from "@/lib/constants";
import { formatDubai } from "@/lib/dubai-time";
import { interviewAverage } from "@/lib/recruitment-score";
import InterviewForm from "../../interview-form";
import { RecommendationBadge, ScoreChip } from "../../parts";
import type { FullInterview } from "../../types";

export default function InterviewsSection({
  candidateId,
  interviews,
}: {
  candidateId: string;
  interviews: FullInterview[];
}) {
  const [modal, setModal] = useState<{ interview?: FullInterview } | null>(null);
  const [, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm("Delete this interview and its notes?")) return;
    startTransition(() => {
      deleteInterview(id);
    });
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Interviews</h2>
        <button
          onClick={() => setModal({})}
          className="flex items-center gap-1.5 rounded-lg bg-charcoal px-3 py-1.5 text-sm font-medium text-white transition hover:bg-gold hover:text-charcoal"
        >
          <Plus size={15} />
          Add interview
        </button>
      </div>

      {interviews.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
          No interviews yet. Book one to start scoring this candidate.
        </p>
      ) : (
        <div className="space-y-3">
          {interviews.map((iv) => (
            <article key={iv.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{INTERVIEW_ROUND_LABELS[iv.round]}</h3>
                  <p className="text-xs text-slate-500">
                    {formatDubai(iv.scheduledAt)}
                    {iv.interviewer ? ` · with ${iv.interviewer}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {iv.recommendation && <RecommendationBadge value={iv.recommendation} />}
                  <ScoreChip score={interviewAverage(iv.scores)} />
                  <a
                    href={`/api/recruitment-ics/${iv.id}`}
                    download
                    title="Add to calendar"
                    className="text-slate-400 transition hover:text-slate-700"
                  >
                    <CalendarPlus size={14} />
                  </a>
                  <button onClick={() => setModal({ interview: iv })} title="Edit" className="text-slate-400 transition hover:text-slate-700">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(iv.id)} title="Delete" className="text-slate-400 transition hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {iv.scores.length > 0 && (
                <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                  {SCORE_CRITERIA.map((c) => {
                    const score = iv.scores.find((s) => s.criterion === c.key)?.score;
                    if (!score) return null;
                    return (
                      <div key={c.key} className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-slate-600">{c.label}</span>
                        <span className="flex items-center gap-1.5">
                          <span className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <span key={n} className={`h-1.5 w-4 rounded-full ${n <= score ? "bg-charcoal" : "bg-slate-200"}`} />
                            ))}
                          </span>
                          <span className="w-3 text-right font-medium text-slate-700">{score}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {iv.notes && (
                <p className="mt-3 whitespace-pre-wrap border-t border-slate-100 pt-3 text-sm text-slate-700">{iv.notes}</p>
              )}
            </article>
          ))}
        </div>
      )}

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.interview ? "Edit interview" : "Add interview"}
        size="lg"
      >
        {modal && <InterviewForm candidateId={candidateId} interview={modal.interview} onDone={() => setModal(null)} />}
      </Modal>
    </section>
  );
}

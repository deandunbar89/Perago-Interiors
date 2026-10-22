"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import type { Candidate, Offer } from "@prisma/client";
import Modal from "@/components/modal";
import StarRating from "@/components/star-rating";
import { deleteCandidate, setCandidateRating, setCandidateStage } from "@/lib/actions/recruitment";
import { CANDIDATE_STAGES, CANDIDATE_STAGE_LABELS, type CandidateStage } from "@/lib/constants";
import CandidateForm from "../../candidate-form";
import { OfferStatusBadge, ScoreChip } from "../../parts";

export default function CandidateHeader({
  candidate,
  vacancy,
  vacancies,
  score,
  offer,
}: {
  candidate: Candidate;
  vacancy: { id: string; title: string };
  vacancies: { id: string; title: string }[];
  score: number | null;
  offer: Offer | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(candidate.rating);
  const [, startTransition] = useTransition();

  function changeStage(stage: CandidateStage) {
    let reason: string | null = null;
    if (stage === "REJECTED") {
      reason = window.prompt(`Why is ${candidate.name} being rejected? (optional)`, candidate.rejectionReason ?? "");
      if (reason === null) return;
    }
    startTransition(() => {
      setCandidateStage(candidate.id, stage, reason);
    });
  }

  function changeRating(value: number | null) {
    setRating(value);
    startTransition(() => {
      setCandidateRating(candidate.id, value);
    });
  }

  function handleDelete() {
    if (!confirm(`Delete ${candidate.name} and all their documents, interviews and offer? This can't be undone.`)) return;
    startTransition(async () => {
      await deleteCandidate(candidate.id);
      router.push(`/recruitment/vacancies/${vacancy.id}`);
    });
  }

  const subtitle = [candidate.currentRole, candidate.currentCompany].filter(Boolean).join(" · ");

  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{candidate.name}</h1>
        {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
        <p className="mt-0.5 text-sm text-slate-500">
          Applying for{" "}
          <Link href={`/recruitment/vacancies/${vacancy.id}`} className="font-medium text-slate-700 hover:underline">
            {vacancy.title}
          </Link>
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <StarRating value={rating} onChange={changeRating} size={20} />
          <ScoreChip score={score} />
          {offer && <OfferStatusBadge status={offer.status} />}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={candidate.stage}
          onChange={(e) => changeStage(e.target.value as CandidateStage)}
          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm font-medium outline-none focus:border-gold focus:ring-1 focus:ring-gold"
        >
          {CANDIDATE_STAGES.map((s) => (
            <option key={s} value={s}>
              {CANDIDATE_STAGE_LABELS[s]}
            </option>
          ))}
        </select>
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <Pencil size={14} />
          Edit
        </button>
        <button
          onClick={handleDelete}
          title="Delete candidate"
          className="rounded-lg border border-slate-300 p-2 text-slate-400 transition hover:border-red-200 hover:text-red-600"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit candidate" size="lg">
        <CandidateForm vacancies={vacancies} candidate={candidate} onDone={() => setEditing(false)} />
      </Modal>
    </div>
  );
}

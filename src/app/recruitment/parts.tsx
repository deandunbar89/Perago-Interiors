import {
  CANDIDATE_STAGE_COLORS,
  CANDIDATE_STAGE_LABELS,
  INTERVIEW_RECOMMENDATION_COLORS,
  INTERVIEW_RECOMMENDATION_LABELS,
  OFFER_STATUS_COLORS,
  OFFER_STATUS_LABELS,
  VACANCY_STATUS_COLORS,
  VACANCY_STATUS_LABELS,
  type CandidateStage,
  type InterviewRecommendation,
  type OfferStatus,
  type VacancyStatus,
} from "@/lib/constants";
import { formatScore } from "@/lib/recruitment-score";

/** Shared input styling so every recruitment form looks like the rest of the app. */
export const FIELD =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold";
export const LABEL = "mb-1 block text-xs font-medium text-slate-600";
export const PRIMARY_BUTTON =
  "rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-white transition hover:bg-gold hover:text-charcoal disabled:opacity-60";

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Badge({ label, colors }: { label: string; colors: { bg: string; text: string } }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${colors.bg} ${colors.text}`}>
      {label}
    </span>
  );
}

export function StageBadge({ stage }: { stage: CandidateStage }) {
  return <Badge label={CANDIDATE_STAGE_LABELS[stage]} colors={CANDIDATE_STAGE_COLORS[stage]} />;
}

export function VacancyStatusBadge({ status }: { status: VacancyStatus }) {
  return <Badge label={VACANCY_STATUS_LABELS[status]} colors={VACANCY_STATUS_COLORS[status]} />;
}

export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  return <Badge label={`Offer ${OFFER_STATUS_LABELS[status].toLowerCase()}`} colors={OFFER_STATUS_COLORS[status]} />;
}

export function RecommendationBadge({ value }: { value: InterviewRecommendation }) {
  return <Badge label={INTERVIEW_RECOMMENDATION_LABELS[value]} colors={INTERVIEW_RECOMMENDATION_COLORS[value]} />;
}

/** The structured 1–5 score from interview scorecards, e.g. "4.2 / 5". */
export function ScoreChip({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-slate-400">Not scored</span>;
  const tone = score >= 4 ? "bg-emerald-50 text-emerald-700" : score >= 3 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
      {formatScore(score)} / 5
    </span>
  );
}

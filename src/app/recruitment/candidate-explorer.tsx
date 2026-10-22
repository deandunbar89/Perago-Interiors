"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { FileText, Plus, Search } from "lucide-react";
import Modal from "@/components/modal";
import StarRating from "@/components/star-rating";
import ViewSwitcher, { type ExplorerView } from "@/components/view-switcher";
import { setCandidateStage } from "@/lib/actions/recruitment";
import { CANDIDATE_STAGES, CANDIDATE_STAGE_LABELS, type CandidateStage } from "@/lib/constants";
import { candidateScore } from "@/lib/recruitment-score";
import CandidateForm from "./candidate-form";
import { OfferStatusBadge, ScoreChip, StageBadge } from "./parts";
import type { CandidateRow } from "./types";

type SortKey = "newest" | "score" | "rating" | "name";

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest first",
  score: "Highest score",
  rating: "Highest rating",
  name: "Name A–Z",
};

function cvHref(c: CandidateRow) {
  const cv = c.documents.find((d) => d.type === "CV");
  return cv ? `/api/recruitment-files/${cv.id}` : null;
}

function subtitle(c: CandidateRow) {
  return [c.currentRole, c.currentCompany].filter(Boolean).join(" · ");
}

export default function CandidateExplorer({
  candidates,
  vacancies,
  fixedVacancyId,
  storageKey,
  cvReading = false,
}: {
  candidates: CandidateRow[];
  vacancies: { id: string; title: string }[];
  /** On a vacancy's own page the list is already that vacancy's candidates, so the vacancy filter and column go. */
  fixedVacancyId?: string;
  storageKey: string;
  /** Whether CVs can be read automatically (the AI key is set on the server). */
  cvReading?: boolean;
}) {
  const [view, setView] = useState<ExplorerView>("list");
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [vacancyFilter, setVacancyFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [modalOpen, setModalOpen] = useState(false);
  const [stageOverrides, setStageOverrides] = useState<Record<string, CandidateStage>>({});
  const [, startTransition] = useTransition();

  useEffect(() => {
    const saved = localStorage.getItem(storageKey) as ExplorerView | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setView(saved);
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (ready) localStorage.setItem(storageKey, view);
  }, [view, ready, storageKey]);

  const items = useMemo(
    () => candidates.map((c) => (stageOverrides[c.id] ? { ...c, stage: stageOverrides[c.id] } : c)),
    [candidates, stageOverrides]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = items.filter((c) => {
      if (vacancyFilter && c.vacancyId !== vacancyFilter) return false;
      if (stageFilter && c.stage !== stageFilter) return false;
      if (!q) return true;
      return [c.name, c.email, c.phone, c.currentRole, c.currentCompany, c.vacancy.title]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });

    const score = (c: CandidateRow) => candidateScore(c.interviews) ?? -1;
    return [...list].sort((a, b) => {
      if (sort === "score") return score(b) - score(a);
      if (sort === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
      if (sort === "name") return a.name.localeCompare(b.name);
      return b.appliedAt.getTime() - a.appliedAt.getTime();
    });
  }, [items, search, vacancyFilter, stageFilter, sort]);

  function moveCandidate(candidate: CandidateRow, stage: CandidateStage) {
    if (candidate.stage === stage) return;
    let reason: string | null = null;
    if (stage === "REJECTED") {
      reason = window.prompt(`Why is ${candidate.name} being rejected? (optional)`, "");
      if (reason === null) return;
    }
    setStageOverrides((prev) => ({ ...prev, [candidate.id]: stage }));
    startTransition(() => {
      setCandidateStage(candidate.id, stage, reason);
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidates…"
              className="w-52 rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </div>
          {!fixedVacancyId && (
            <select
              value={vacancyFilter}
              onChange={(e) => setVacancyFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            >
              <option value="">All vacancies</option>
              {vacancies.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title}
                </option>
              ))}
            </select>
          )}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          >
            <option value="">All stages</option>
            {CANDIDATE_STAGES.map((s) => (
              <option key={s} value={s}>
                {CANDIDATE_STAGE_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABELS[k]}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-400">
            {filtered.length} of {candidates.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ViewSwitcher view={view} onChange={setView} views={["list", "grid", "kanban"]} />
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-charcoal px-3 py-1.5 text-sm font-medium text-white transition hover:bg-gold hover:text-charcoal"
          >
            <Plus size={15} />
            Add candidate
          </button>
        </div>
      </div>

      {view === "list" && <ListView candidates={filtered} showVacancy={!fixedVacancyId} />}
      {view === "grid" && <GridView candidates={filtered} showVacancy={!fixedVacancyId} />}
      {view === "kanban" && (
        <KanbanView candidates={filtered} showVacancy={!fixedVacancyId} onMove={moveCandidate} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add candidate" size="lg">
        <CandidateForm vacancies={vacancies} fixedVacancyId={fixedVacancyId} cvReading={cvReading} onDone={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}

function ListView({ candidates, showVacancy }: { candidates: CandidateRow[]; showVacancy: boolean }) {
  if (candidates.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
        No candidates yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-champagne bg-charcoal text-left text-xs font-semibold uppercase tracking-wide text-cream">
            <th className="px-4 py-2.5">Candidate</th>
            {showVacancy && <th className="px-4 py-2.5">Vacancy</th>}
            <th className="px-4 py-2.5">Stage</th>
            <th className="px-4 py-2.5">Rating</th>
            <th className="px-4 py-2.5">Score</th>
            <th className="px-4 py-2.5">Applied</th>
            <th className="px-4 py-2.5">CV</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {candidates.map((c) => {
            const cv = cvHref(c);
            return (
              <tr key={c.id} className="transition hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <Link href={`/recruitment/candidates/${c.id}`} className="font-medium text-slate-900 hover:underline">
                    {c.name}
                  </Link>
                  {subtitle(c) && <p className="text-xs text-slate-400">{subtitle(c)}</p>}
                </td>
                {showVacancy && (
                  <td className="px-4 py-2.5">
                    <Link href={`/recruitment/vacancies/${c.vacancy.id}`} className="text-slate-600 hover:underline">
                      {c.vacancy.title}
                    </Link>
                  </td>
                )}
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap items-center gap-1">
                    <StageBadge stage={c.stage} />
                    {c.offer && c.stage === "OFFER" && <OfferStatusBadge status={c.offer.status} />}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <StarRating value={c.rating} size={14} />
                </td>
                <td className="px-4 py-2.5">
                  <ScoreChip score={candidateScore(c.interviews)} />
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">{format(c.appliedAt, "d MMM yyyy")}</td>
                <td className="px-4 py-2.5">
                  {cv ? (
                    <a href={cv} target="_blank" rel="noreferrer" title="Open CV" className="text-slate-500 hover:text-slate-900">
                      <FileText size={16} />
                    </a>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function GridView({ candidates, showVacancy }: { candidates: CandidateRow[]; showVacancy: boolean }) {
  if (candidates.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
        No candidates yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {candidates.map((c) => (
        <Link
          key={c.id}
          href={`/recruitment/candidates/${c.id}`}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-slate-900">{c.name}</p>
            <StageBadge stage={c.stage} />
          </div>
          {subtitle(c) && <p className="mt-0.5 text-xs text-slate-500">{subtitle(c)}</p>}
          {showVacancy && <p className="mt-1 text-xs text-slate-400">{c.vacancy.title}</p>}
          <div className="mt-3 flex items-center justify-between">
            <StarRating value={c.rating} size={14} />
            <ScoreChip score={candidateScore(c.interviews)} />
          </div>
        </Link>
      ))}
    </div>
  );
}

function KanbanView({
  candidates,
  showVacancy,
  onMove,
}: {
  candidates: CandidateRow[];
  showVacancy: boolean;
  onMove: (candidate: CandidateRow, stage: CandidateStage) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<CandidateStage | null>(null);

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {CANDIDATE_STAGES.map((stage) => {
        const items = candidates.filter((c) => c.stage === stage);
        return (
          <div
            key={stage}
            onDragOver={(e) => {
              if (!dragId) return;
              e.preventDefault();
              setOverStage(stage);
            }}
            onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              const dragged = candidates.find((c) => c.id === dragId);
              if (dragged) onMove(dragged, stage);
              setDragId(null);
              setOverStage(null);
            }}
            className={`w-64 shrink-0 rounded-xl border p-3 transition ${
              overStage === stage ? "border-gold bg-amber-50/40" : "border-slate-200 bg-slate-50"
            }`}
          >
            <h3 className="mb-3 flex items-center gap-1.5 px-1 text-sm font-semibold text-slate-700">
              {CANDIDATE_STAGE_LABELS[stage]}
              <span className="rounded-full bg-slate-200 px-1.5 text-xs font-medium text-slate-600">{items.length}</span>
            </h3>
            <div className="space-y-2">
              {items.length === 0 && <p className="px-1 text-xs text-slate-400">Nobody here.</p>}
              {items.map((c) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", c.id);
                    setDragId(c.id);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverStage(null);
                  }}
                  className={`cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing ${
                    dragId === c.id ? "opacity-40" : ""
                  }`}
                >
                  <Link href={`/recruitment/candidates/${c.id}`} className="block text-sm font-medium text-slate-900 hover:underline">
                    {c.name}
                  </Link>
                  {subtitle(c) && <p className="mt-0.5 truncate text-[11px] text-slate-500">{subtitle(c)}</p>}
                  {showVacancy && <p className="mt-0.5 truncate text-[11px] text-slate-400">{c.vacancy.title}</p>}
                  <div className="mt-2 flex items-center justify-between">
                    <StarRating value={c.rating} size={12} />
                    <ScoreChip score={candidateScore(c.interviews)} />
                  </div>
                  {/* Dragging doesn't work on a phone, so small screens get a dropdown instead. */}
                  <select
                    value={c.stage}
                    onChange={(e) => onMove(c, e.target.value as CandidateStage)}
                    className="mt-2 w-full rounded-md border border-slate-300 px-2 py-1 text-xs md:hidden"
                  >
                    {CANDIDATE_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {CANDIDATE_STAGE_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

import type {
  Candidate,
  Interview,
  InterviewScore,
  Offer,
  RecruitmentDocument,
  RecruitmentTask,
  User,
  Vacancy,
} from "@prisma/client";

/** What the candidate lists and boards need: enough to show the row, score and CV link. */
export type CandidateRow = Candidate & {
  vacancy: Pick<Vacancy, "id" | "title">;
  interviews: { scores: Pick<InterviewScore, "score">[] }[];
  documents: Pick<RecruitmentDocument, "id" | "type">[];
  offer: Pick<Offer, "status"> | null;
};

export const candidateRowInclude = {
  vacancy: { select: { id: true, title: true } },
  interviews: { select: { scores: { select: { score: true } } } },
  documents: { select: { id: true, type: true } },
  offer: { select: { status: true } },
} as const;

export type TaskRow = RecruitmentTask & {
  assignee: Pick<User, "id" | "name"> | null;
  vacancy: Pick<Vacancy, "id" | "title"> | null;
  candidate: Pick<Candidate, "id" | "name"> | null;
};

export const taskRowInclude = {
  assignee: { select: { id: true, name: true } },
  vacancy: { select: { id: true, title: true } },
  candidate: { select: { id: true, name: true } },
} as const;

export type TeamMember = Pick<User, "id" | "name">;

export type FullInterview = Interview & { scores: InterviewScore[] };

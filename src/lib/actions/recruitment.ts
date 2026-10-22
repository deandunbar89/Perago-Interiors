"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAccess } from "@/lib/section-access";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/storage";
import { mirrorToDrive } from "@/lib/google-drive";
import { notifyAll, notifyUser } from "@/lib/notify";
import { parseDubaiLocal } from "@/lib/dubai-time";
import {
  CANDIDATE_STAGES,
  EMPLOYMENT_TYPES,
  INTERVIEW_RECOMMENDATIONS,
  INTERVIEW_ROUNDS,
  OFFER_STATUSES,
  OFFER_STATUS_LABELS,
  RECRUITMENT_DOC_TYPES,
  RECRUITMENT_DRIVE_FOLDERS,
  SCORE_CRITERIA,
  VACANCY_STATUSES,
  type CandidateStage,
  type RecruitmentDocType,
  type VacancyStatus,
} from "@/lib/constants";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const UPLOAD_FOLDER = "recruitment";

/** Every recruitment action checks the Recruitment section itself — CVs, salaries and offer
 * letters are HR data, so being signed in isn't enough. */
async function requireRecruitment() {
  const [session, access] = await Promise.all([auth(), getAccess()]);
  if (!session?.user?.id || !access.sections.includes("RECRUITMENT")) throw new Error("Not allowed");
  return session.user.id;
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function pick<T extends string>(value: FormDataEntryValue | null, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function dateOrNull(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function refresh() {
  revalidatePath("/recruitment", "layout");
}

// ───────────────────────── Vacancies ─────────────────────────

function readVacancy(formData: FormData) {
  return {
    title: text(formData, "title"),
    department: text(formData, "department"),
    location: text(formData, "location"),
    employmentType: pick(formData.get("employmentType"), EMPLOYMENT_TYPES, "FULL_TIME"),
    headcount: Math.max(1, parseInt(String(formData.get("headcount") ?? "1"), 10) || 1),
    salaryRange: text(formData, "salaryRange"),
    description: text(formData, "description"),
    requirements: text(formData, "requirements"),
  };
}

export async function createVacancy(_prev: unknown, formData: FormData) {
  await requireRecruitment();
  const fields = readVacancy(formData);
  if (!fields.title) return { error: "Job title is required" };

  const status = pick(formData.get("status"), VACANCY_STATUSES, "OPEN");
  const vacancy = await prisma.vacancy.create({
    data: { ...fields, title: fields.title, status, closedAt: status === "FILLED" || status === "CLOSED" ? new Date() : null },
  });

  refresh();
  // A server-side redirect is the reliable way to move on after a save: a client-side push can be
  // cancelled by the page refresh the save triggers.
  redirect(`/recruitment/vacancies/${vacancy.id}`);
}

export async function updateVacancy(vacancyId: string, _prev: unknown, formData: FormData) {
  await requireRecruitment();
  const fields = readVacancy(formData);
  if (!fields.title) return { error: "Job title is required" };

  await prisma.vacancy.update({ where: { id: vacancyId }, data: { ...fields, title: fields.title } });
  refresh();
  return { success: true };
}

export async function setVacancyStatus(vacancyId: string, status: VacancyStatus) {
  await requireRecruitment();
  if (!(VACANCY_STATUSES as readonly string[]).includes(status)) return;
  await prisma.vacancy.update({
    where: { id: vacancyId },
    data: { status, closedAt: status === "FILLED" || status === "CLOSED" ? new Date() : null },
  });
  refresh();
}

export async function deleteVacancy(vacancyId: string) {
  await requireRecruitment();

  const docs = await prisma.recruitmentDocument.findMany({
    where: { candidate: { vacancyId } },
    select: { storedName: true },
  });
  await prisma.vacancy.delete({ where: { id: vacancyId } });
  await Promise.all(docs.map((d) => deleteUploadedFile(UPLOAD_FOLDER, d.storedName)));
  refresh();
}

// ───────────────────────── Candidates ─────────────────────────

/** Saves one uploaded file against a candidate, and copies it to Drive under
 * Perago Interiors/Recruitment/<vacancy>/<candidate>/<document type> (folders are created on first use). */
async function storeDocument(
  userId: string,
  candidate: { id: string; name: string },
  vacancyTitle: string,
  type: RecruitmentDocType,
  file: File
) {
  if (file.size > MAX_FILE_SIZE) throw new Error(`${file.name} exceeds the 100MB limit`);

  const mimeType = file.type || "application/octet-stream";
  const { storedName, size } = await saveUploadedFile(file, UPLOAD_FOLDER);
  await prisma.recruitmentDocument.create({
    data: {
      candidateId: candidate.id,
      type,
      originalName: file.name,
      storedName,
      mimeType,
      size,
      uploadedById: userId,
    },
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  await mirrorToDrive(
    ["Recruitment", vacancyTitle, candidate.name, RECRUITMENT_DRIVE_FOLDERS[type]],
    file.name,
    mimeType,
    buffer
  );
}

function readCandidate(formData: FormData) {
  return {
    name: text(formData, "name"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    currentRole: text(formData, "currentRole"),
    currentCompany: text(formData, "currentCompany"),
    location: text(formData, "location"),
    source: text(formData, "source"),
    noticePeriod: text(formData, "noticePeriod"),
    expectedSalary: text(formData, "expectedSalary"),
    notes: text(formData, "notes"),
  };
}

function realFile(value: FormDataEntryValue | null): File | null {
  return value instanceof File && value.size > 0 ? value : null;
}

export async function createCandidate(_prev: unknown, formData: FormData) {
  const userId = await requireRecruitment();

  const fields = readCandidate(formData);
  if (!fields.name) return { error: "Candidate name is required" };

  const vacancyId = text(formData, "vacancyId");
  const vacancy = vacancyId
    ? await prisma.vacancy.findUnique({ where: { id: vacancyId }, select: { id: true, title: true } })
    : null;
  if (!vacancy) return { error: "Choose the vacancy this candidate applied for" };

  const candidate = await prisma.candidate.create({
    data: { ...fields, name: fields.name, vacancyId: vacancy.id },
  });

  try {
    const cv = realFile(formData.get("cv"));
    const cover = realFile(formData.get("coverLetter"));
    if (cv) await storeDocument(userId, candidate, vacancy.title, "CV", cv);
    if (cover) await storeDocument(userId, candidate, vacancy.title, "COVER_LETTER", cover);
  } catch {
    // The candidate is saved but a file didn't upload — open them so the file can be retried.
    refresh();
    redirect(`/recruitment/candidates/${candidate.id}?upload=failed`);
  }

  await notifyAll(
    "RECRUITMENT",
    { title: `New candidate — ${candidate.name}`, body: vacancy.title, link: `/recruitment/candidates/${candidate.id}` },
    userId
  );

  refresh();
  return { success: true };
}

export async function updateCandidate(candidateId: string, _prev: unknown, formData: FormData) {
  await requireRecruitment();
  const fields = readCandidate(formData);
  if (!fields.name) return { error: "Candidate name is required" };

  const vacancyId = text(formData, "vacancyId");
  await prisma.candidate.update({
    where: { id: candidateId },
    data: { ...fields, name: fields.name, ...(vacancyId ? { vacancyId } : {}) },
  });
  refresh();
  return { success: true };
}

export async function setCandidateStage(candidateId: string, stage: CandidateStage, rejectionReason?: string | null) {
  await requireRecruitment();
  if (!(CANDIDATE_STAGES as readonly string[]).includes(stage)) return;

  await prisma.candidate.update({
    where: { id: candidateId },
    data: { stage, rejectionReason: stage === "REJECTED" ? (rejectionReason?.trim() || null) : null },
  });
  refresh();
}

export async function setCandidateRating(candidateId: string, rating: number | null) {
  await requireRecruitment();
  const value = rating === null ? null : Math.min(5, Math.max(1, Math.round(rating)));
  await prisma.candidate.update({ where: { id: candidateId }, data: { rating: value } });
  refresh();
}

export async function deleteCandidate(candidateId: string) {
  await requireRecruitment();

  const docs = await prisma.recruitmentDocument.findMany({ where: { candidateId }, select: { storedName: true } });
  await prisma.candidate.delete({ where: { id: candidateId } });
  await Promise.all(docs.map((d) => deleteUploadedFile(UPLOAD_FOLDER, d.storedName)));
  refresh();
}

// ───────────────────────── Documents ─────────────────────────

export async function uploadCandidateDocument(candidateId: string, type: RecruitmentDocType, formData: FormData) {
  const userId = await requireRecruitment();
  if (!(RECRUITMENT_DOC_TYPES as readonly string[]).includes(type)) return { error: "Unknown document type" };

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: "Choose a file to upload" };

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { id: true, name: true, vacancy: { select: { title: true } } },
  });
  if (!candidate) return { error: "Candidate not found" };

  try {
    for (const file of files) await storeDocument(userId, candidate, candidate.vacancy.title, type, file);
  } catch (err) {
    refresh();
    return { error: err instanceof Error ? err.message : "Upload failed" };
  }

  refresh();
  return { success: true };
}

export async function deleteCandidateDocument(documentId: string) {
  await requireRecruitment();
  const doc = await prisma.recruitmentDocument.findUnique({ where: { id: documentId } });
  if (!doc) return;

  await prisma.recruitmentDocument.delete({ where: { id: documentId } });
  await deleteUploadedFile(UPLOAD_FOLDER, doc.storedName);
  refresh();
}

// ───────────────────────── Interviews ─────────────────────────

export async function saveInterview(
  candidateId: string,
  interviewId: string | null,
  _prev: unknown,
  formData: FormData
) {
  await requireRecruitment();

  const scheduledAt = parseDubaiLocal(text(formData, "scheduledAt"));
  if (!scheduledAt) return { error: "Pick the interview date and time" };

  const data = {
    round: pick(formData.get("round"), INTERVIEW_ROUNDS, "FIRST"),
    scheduledAt,
    interviewer: text(formData, "interviewer"),
    notes: text(formData, "notes"),
    recommendation: pick(formData.get("recommendation"), [...INTERVIEW_RECOMMENDATIONS, ""] as const, "") || null,
  };

  const scores = SCORE_CRITERIA.flatMap(({ key }) => {
    const n = parseInt(String(formData.get(`score_${key}`) ?? ""), 10);
    return n >= 1 && n <= 5 ? [{ criterion: key, score: n }] : [];
  });

  await prisma.$transaction(async (tx) => {
    const interview = interviewId
      ? await tx.interview.update({ where: { id: interviewId }, data })
      : await tx.interview.create({ data: { ...data, candidateId } });

    await tx.interviewScore.deleteMany({ where: { interviewId: interview.id } });
    if (scores.length > 0) {
      await tx.interviewScore.createMany({ data: scores.map((s) => ({ ...s, interviewId: interview.id })) });
    }

    // Booking an interview means the candidate is at least at the interview stage.
    await tx.candidate.updateMany({
      where: { id: candidateId, stage: { in: ["NEW", "SCREENING"] } },
      data: { stage: "INTERVIEW" },
    });
  });

  refresh();
  return { success: true };
}

export async function deleteInterview(interviewId: string) {
  await requireRecruitment();
  await prisma.interview.delete({ where: { id: interviewId } });
  refresh();
}

// ───────────────────────── Offers ─────────────────────────

export async function saveOffer(
  candidateId: string,
  _prev: unknown,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const userId = await requireRecruitment();

  const status = pick(formData.get("status"), OFFER_STATUSES, "DRAFT");
  const candidateExists = await prisma.candidate.findUnique({ where: { id: candidateId }, select: { id: true } });
  if (!candidateExists) return { error: "Candidate not found" };
  const existing = await prisma.offer.findUnique({ where: { candidateId } });

  const now = new Date();
  const data = {
    status,
    salary: text(formData, "salary"),
    startDate: dateOrNull(formData.get("startDate")),
    notes: text(formData, "notes"),
    sentAt: status === "DRAFT" ? null : (existing?.sentAt ?? now),
    respondedAt: status === "ACCEPTED" || status === "DECLINED" ? (existing?.respondedAt ?? now) : null,
  };

  const offer = await prisma.offer.upsert({
    where: { candidateId },
    create: { ...data, candidateId },
    update: data,
    include: { candidate: { select: { name: true, stage: true, vacancy: { select: { title: true } } } } },
  });

  // Keep the pipeline in step with the offer.
  if (status === "ACCEPTED") {
    await prisma.candidate.update({ where: { id: candidateId }, data: { stage: "HIRED", rejectionReason: null } });
  } else if (["NEW", "SCREENING", "INTERVIEW"].includes(offer.candidate.stage)) {
    await prisma.candidate.update({ where: { id: candidateId }, data: { stage: "OFFER" } });
  }

  if (status !== "DRAFT" && existing?.status !== status) {
    await notifyAll(
      "RECRUITMENT",
      {
        title: `Offer ${OFFER_STATUS_LABELS[status].toLowerCase()} — ${offer.candidate.name}`,
        body: offer.candidate.vacancy.title,
        link: `/recruitment/candidates/${candidateId}`,
      },
      userId
    );
  }

  refresh();
  return { success: true };
}

export async function deleteOffer(candidateId: string) {
  await requireRecruitment();
  await prisma.offer.deleteMany({ where: { candidateId } });
  refresh();
}

// ───────────────────────── Tasks ─────────────────────────

export async function createRecruitmentTask(_prev: unknown, formData: FormData) {
  const userId = await requireRecruitment();

  const title = text(formData, "title");
  if (!title) return { error: "Describe the task" };

  const candidateId = text(formData, "candidateId");
  let vacancyId = text(formData, "vacancyId");
  if (candidateId && !vacancyId) {
    vacancyId = (await prisma.candidate.findUnique({ where: { id: candidateId }, select: { vacancyId: true } }))?.vacancyId ?? null;
  }
  const assigneeId = text(formData, "assigneeId");

  const task = await prisma.recruitmentTask.create({
    data: { title, dueDate: dateOrNull(formData.get("dueDate")), vacancyId, candidateId, assigneeId, createdById: userId },
  });

  await notifyUser(
    assigneeId,
    "RECRUITMENT",
    {
      title: `Recruitment task assigned — ${title}`,
      link: candidateId ? `/recruitment/candidates/${candidateId}` : "/recruitment/tasks",
    },
    userId
  );

  refresh();
  return { success: true, id: task.id };
}

export async function setRecruitmentTaskStatus(taskId: string, status: "OPEN" | "DONE") {
  await requireRecruitment();
  await prisma.recruitmentTask.update({ where: { id: taskId }, data: { status } });
  refresh();
}

export async function updateRecruitmentTask(taskId: string, data: { dueDate?: string | null; assigneeId?: string | null }) {
  const userId = await requireRecruitment();

  const patch: { dueDate?: Date | null; assigneeId?: string | null } = {};
  if (data.dueDate !== undefined) patch.dueDate = dateOrNull(data.dueDate);
  if (data.assigneeId !== undefined) patch.assigneeId = data.assigneeId || null;

  const task = await prisma.recruitmentTask.update({ where: { id: taskId }, data: patch });
  if (patch.assigneeId) {
    await notifyUser(
      patch.assigneeId,
      "RECRUITMENT",
      {
        title: `Recruitment task assigned — ${task.title}`,
        link: task.candidateId ? `/recruitment/candidates/${task.candidateId}` : "/recruitment/tasks",
      },
      userId
    );
  }
  refresh();
}

export async function deleteRecruitmentTask(taskId: string) {
  await requireRecruitment();
  await prisma.recruitmentTask.delete({ where: { id: taskId } });
  refresh();
}

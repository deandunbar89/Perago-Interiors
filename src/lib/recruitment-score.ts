/** Average of one interview's scorecard (1–5), or null if nothing was scored. */
export function interviewAverage(scores: { score: number }[]): number | null {
  if (scores.length === 0) return null;
  return scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
}

/** A candidate's overall score: the mean of their scored interviews' averages. */
export function candidateScore(interviews: { scores: { score: number }[] }[]): number | null {
  const averages = interviews.map((i) => interviewAverage(i.scores)).filter((a): a is number => a !== null);
  if (averages.length === 0) return null;
  return averages.reduce((sum, a) => sum + a, 0) / averages.length;
}

export function formatScore(score: number | null): string {
  return score === null ? "—" : score.toFixed(1);
}

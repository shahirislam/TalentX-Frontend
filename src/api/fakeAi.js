// Simulated AI helpers – no real API calls.

/**
 * Generate a job description from title, tech stack, and deadline.
 * Returns realistic placeholder text (no lorem ipsum).
 */
export function generateJobDescription(title, techStack, deadline) {
  const stack = Array.isArray(techStack) ? techStack : (techStack || '').split(',').map((s) => s.trim()).filter(Boolean);
  const stackList = stack.length ? stack.join(', ') : 'modern data and engineering tools';
  const deadlineStr = deadline ? `Application deadline: ${deadline}.` : '';

  return `We are looking for a ${title} to join our team.

Responsibilities:
- Design, build, and maintain robust data and ML systems that power product and business decisions.
- Collaborate with engineering, product, and business teams to define requirements and deliver impact.
- Own quality, reliability, and documentation of your work.

Requirements:
- Strong experience with ${stackList}.
- Ability to communicate clearly and work in a fast-paced environment.
- Prior experience in data engineering, analytics, or ML is a plus.

${deadlineStr}

We offer a competitive package and a collaborative, inclusive culture.`;
}

/**
 * Deterministic match score 0–100 from jobId and talentId (for consistency).
 */
export function getJobMatchScore(jobId, talentId) {
  const s = `${jobId}-${talentId}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return 45 + (h % 56); // 45–100
}

/**
 * Top matched talents for a job: list of { talentId, talentName, score }.
 */
export function getTalentMatchScoresForJob(jobId, talents) {
  return talents.map((t) => ({
    talentId: t.id,
    talentName: t.name,
    score: getJobMatchScore(jobId, t.id),
  })).sort((a, b) => b.score - a.score);
}

/**
 * Job match scores for a talent (for AI Job Match Feed). Returns { jobId, job, score }[].
 */
export function getJobMatchScoresForTalent(talentId, jobs) {
  return jobs.map((job) => ({
    jobId: job.id,
    job,
    score: getJobMatchScore(job.id, talentId),
  })).sort((a, b) => b.score - a.score);
}

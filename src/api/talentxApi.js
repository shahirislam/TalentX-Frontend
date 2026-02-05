/**
 * TalentX backend API – all endpoints per FRONTEND_INTEGRATION.md.
 * Normalizes responses to frontend shapes (id, company, applicationCount, etc.).
 */

import { request, ApiError } from './client.js';

function normalizeJob(j) {
  if (!j) return null;
  const id = j._id ?? j.id;
  const deadline = j.deadline ? (j.deadline.slice ? j.deadline.slice(0, 10) : j.deadline) : '';
  return {
    id,
    _id: id,
    title: j.title,
    company: j.companyName ?? j.company,
    companyName: j.companyName ?? j.company,
    techStack: Array.isArray(j.techStack) ? j.techStack : [],
    description: j.description ?? '',
    deadline,
    createdBy: j.createdBy,
    employerId: j.createdBy,
    applicationCount: j.applicationsCount ?? j.applicationCount ?? 0,
    applicationsCount: j.applicationsCount ?? j.applicationCount ?? 0,
    createdAt: j.createdAt,
    updatedAt: j.updatedAt,
  };
}

function normalizeApplicant(a) {
  const talent = a.talent || {};
  return {
    id: a._id ?? a.id,
    jobId: a.jobId?.toString?.() ?? a.jobId,
    talentId: a.talentId ?? talent.uid,
    talentName: talent.name ?? a.talentName ?? 'Talent',
    source: a.source ?? 'manual',
  };
}

function normalizeInvitation(inv) {
  const job = inv.jobId && typeof inv.jobId === 'object' ? inv.jobId : null;
  return {
    id: inv._id ?? inv.id,
    jobId: (inv.jobId?.toString?.() ?? inv.jobId) || (job?._id ?? job?.id),
    talentId: inv.talentId,
    company: job?.companyName ?? job?.company ?? inv.company ?? '',
    jobTitle: job?.title ?? inv.jobTitle ?? '',
    deadline: job?.deadline ? String(job.deadline).slice(0, 10) : (inv.deadline ?? ''),
    status: inv.status ?? 'pending',
  };
}

// —— Public (no auth) ——

export async function apiGetJobs(getToken) {
  const list = await request('jobs', {}, getToken);
  return (list || []).map(normalizeJob);
}

export async function apiGetJobById(id, getToken) {
  const j = await request(`jobs/${id}`, {}, getToken);
  return normalizeJob(j);
}

// —— Health ——

export async function apiHealth() {
  const data = await request('health', {}, null);
  return data;
}

// —— User onboarding (auth) ——

export async function apiOnboard(payload, getToken) {
  const user = await request('users/onboard', {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      role: payload.role,
    }),
  }, getToken);
  return user;
}

// —— Employer ——

export async function apiCreateJob(payload, getToken) {
  const j = await request('jobs', {
    method: 'POST',
    body: JSON.stringify({
      title: payload.title,
      companyName: payload.companyName ?? payload.company,
      techStack: Array.isArray(payload.techStack) ? payload.techStack : (payload.techStack || '').split(',').map((s) => s.trim()).filter(Boolean),
      description: payload.description ?? '',
      deadline: payload.deadline,
    }),
  }, getToken);
  return normalizeJob(j);
}

export async function apiGenerateJd(payload, getToken) {
  const data = await request('jobs/generate-jd', {
    method: 'POST',
    body: JSON.stringify({
      title: payload.title,
      techStack: Array.isArray(payload.techStack) ? payload.techStack : (payload.techStack || '').split(',').map((s) => s.trim()).filter(Boolean),
    }),
  }, getToken);
  return data.description ?? '';
}

export async function apiGetApplicants(jobId, getToken) {
  const list = await request(`jobs/${jobId}/applicants`, {}, getToken);
  return (list || []).map(normalizeApplicant);
}

// —— Talent apply ——

export async function apiApplyToJob(jobId, getToken) {
  await request(`jobs/${jobId}/apply`, { method: 'POST' }, getToken);
  return { success: true };
}

// —— Talents matched (employer) ——

export async function apiGetMatchedTalents(jobId, getToken) {
  const list = await request(`talents/matched?jobId=${encodeURIComponent(jobId)}`, {}, getToken);
  return (list || []).map((item) => ({
    talentId: item.talent?.uid ?? item.talentId,
    talentName: item.talent?.name ?? item.talentName ?? 'Talent',
    score: item.score ?? 0,
    reason: item.reason,
  }));
}

/** All signed-up job seekers (employer). */
export async function apiGetAllTalents(getToken) {
  const list = await request('talents/all', {}, getToken);
  return (list || []).map((item) => ({
    talentId: item.talent?.uid ?? item.talentId,
    talentName: item.talent?.name ?? item.talentName ?? 'Talent',
    score: item.score ?? null,
  }));
}

// —— Talent job feed (talent) ——

export async function apiGetMatchedJobs(getToken) {
  const list = await request('talent/jobs/matched', {}, getToken);
  return (list || []).map((item) => ({
    jobId: item.job?._id ?? item.job?.id,
    job: normalizeJob(item.job),
    score: item.score ?? 0,
    reason: item.reason,
  }));
}

// —— Invitations ——

export async function apiGetInvitations(getToken) {
  const list = await request('invitations', {}, getToken);
  return (list || []).map(normalizeInvitation);
}

export async function apiCreateInvitation(payload, getToken) {
  const inv = await request('invitations', {
    method: 'POST',
    body: JSON.stringify({
      jobId: payload.jobId,
      talentId: payload.talentId,
    }),
  }, getToken);
  return normalizeInvitation(inv);
}

export async function apiRespondToInvitation(invitationId, status, getToken) {
  const inv = await request(`invitations/${invitationId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  }, getToken);
  return normalizeInvitation(inv);
}

// —— Talent: my applications ——

export async function apiGetMyApplications(getToken) {
  const list = await request('talent/applications', {}, getToken);
  return (list || []).map((a) => ({
    id: a._id ?? a.id,
    jobId: a.jobId?.toString?.() ?? a.jobId,
    talentId: a.talentId,
    source: a.source ?? 'manual',
    job: a.job
      ? {
          id: a.job._id ?? a.job.id,
          title: a.job.title,
          company: a.job.companyName ?? a.job.company,
        }
      : null,
  }));
}

// Re-export for convenience
export { ApiError };

import {
  getJobsStore,
  getApplicationsStore,
  getInvitationsStore,
  getTalents,
  setJobs,
  setApplications,
  setInvitations,
} from '../data/mockData.js';
import { getTalentMatchScoresForJob } from './fakeAi.js';

export function getJobs(search = '') {
  const jobs = getJobsStore();
  const q = (search || '').toLowerCase().trim();
  if (!q) return [...jobs];
  return jobs.filter(
    (j) =>
      (j.title && j.title.toLowerCase().includes(q)) ||
      (j.company && j.company.toLowerCase().includes(q))
  );
}

export function getJobsByEmployer(employerId) {
  return getJobsStore().filter((j) => j.employerId === employerId);
}

export function getJobById(id) {
  return getJobsStore().find((j) => j.id === id) || null;
}

export function applyToJob(jobId, talentId, talentName, source = 'manual') {
  const applications = getApplicationsStore();
  const exists = applications.some((a) => a.jobId === jobId && a.talentId === talentId);
  if (exists) return { success: false, alreadyApplied: true };

  const job = getJobById(jobId);
  if (!job) return { success: false };

  const newApp = {
    id: `app-${Date.now()}`,
    jobId,
    talentId,
    talentName: talentName || 'Talent',
    source,
  };
  setApplications([...applications, newApp]);

  const jobs = getJobsStore().map((j) =>
    j.id === jobId ? { ...j, applicationCount: (j.applicationCount || 0) + 1 } : j
  );
  setJobs(jobs);
  return { success: true };
}

export function getApplicationsByJob(jobId) {
  return getApplicationsStore().filter((a) => a.jobId === jobId);
}

export function getApplicationsByEmployer(employerId) {
  const jobs = getJobsStore().filter((j) => j.employerId === employerId);
  const jobIds = new Set(jobs.map((j) => j.id));
  return getApplicationsStore().filter((a) => jobIds.has(a.jobId));
}

export function getInvitationsForTalent(talentId) {
  return getInvitationsStore().filter((i) => i.talentId === talentId);
}

export function inviteTalent(jobId, talentId, talentName, company, jobTitle, deadline) {
  const invitations = getInvitationsStore();
  const exists = invitations.some((i) => i.jobId === jobId && i.talentId === talentId);
  if (exists) return { success: false, alreadyInvited: true };

  const newInv = {
    id: `inv-${Date.now()}`,
    jobId,
    talentId,
    talentName: talentName || 'Talent',
    company: company || '',
    jobTitle: jobTitle || '',
    deadline: deadline || '',
    status: 'pending',
  };
  setInvitations([...invitations, newInv]);
  return { success: true };
}

export function respondToInvitation(invitationId, status) {
  if (status !== 'accepted' && status !== 'declined') return { success: false };
  const invitations = getInvitationsStore();
  const idx = invitations.findIndex((i) => i.id === invitationId);
  if (idx === -1) return { success: false };
  const next = invitations.map((i, n) => (n === idx ? { ...i, status } : i));
  setInvitations(next);

  if (status === 'accepted') {
    const inv = invitations[idx];
    applyToJob(inv.jobId, inv.talentId, inv.talentName, 'invitation');
  }
  return { success: true };
}

export function getTopMatchedTalentsForJob(jobId) {
  const talents = getTalents();
  return getTalentMatchScoresForJob(jobId, talents);
}

export function getApplicationsForTalent(talentId) {
  return getApplicationsStore().filter((a) => a.talentId === talentId);
}

export function createJob(payload) {
  const jobs = getJobsStore();
  const newJob = {
    id: `job-${Date.now()}`,
    employerId: payload.employerId || 'emp-1',
    title: payload.title || 'Untitled',
    company: payload.company || 'My Company',
    description: payload.description || '',
    techStack: Array.isArray(payload.techStack) ? payload.techStack : (payload.techStack || '').split(',').map((s) => s.trim()).filter(Boolean),
    deadline: payload.deadline || '',
    applicationCount: 0,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  setJobs([...jobs, newJob]);
  return newJob;
}

export function getInvitationStatus(jobId, talentId) {
  const inv = getInvitationsStore().find((i) => i.jobId === jobId && i.talentId === talentId);
  return inv ? inv.status : null;
}

export function hasApplied(jobId, talentId) {
  return getApplicationsStore().some((a) => a.jobId === jobId && a.talentId === talentId);
}

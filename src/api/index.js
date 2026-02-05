/**
 * Unified API: real backend when VITE_API_BASE_URL is set, otherwise mock.
 * All methods return Promises so components can use async/await consistently.
 */

import { isRealApi } from './client.js';
import * as real from './talentxApi.js';
import * as fake from './fakeApi.js';
import { generateJobDescription as fakeGenerateJd, getJobMatchScoresForTalent as fakeMatchJobs } from './fakeAi.js';

export { ApiError } from './client.js';
export { isRealApi } from './client.js';

function createApi(getToken) {
  if (isRealApi()) {
    return {
      getJobs: (search) => real.apiGetJobs(getToken).then((jobs) => {
        const q = (search || '').toLowerCase().trim();
        if (!q) return jobs;
        return jobs.filter(
          (j) =>
            (j.title && j.title.toLowerCase().includes(q)) ||
            (j.company && j.company.toLowerCase().includes(q))
        );
      }),
      getJobById: (id) => real.apiGetJobById(id, getToken),
      getJobsByEmployer: (employerId) => real.apiGetJobs(getToken).then((jobs) => jobs.filter((j) => (j.createdBy || j.employerId) === employerId)),
      applyToJob: (jobId) => real.apiApplyToJob(jobId, getToken),
      getApplicationsByJob: (jobId) => real.apiGetApplicants(jobId, getToken),
      getTopMatchedTalentsForJob: (jobId) => real.apiGetMatchedTalents(jobId, getToken),
      getAllTalents: () => real.apiGetAllTalents(getToken),
      getInvitationsForTalent: () => real.apiGetInvitations(getToken),
      respondToInvitation: (invitationId, status) => real.apiRespondToInvitation(invitationId, status, getToken),
      createJob: (payload) => real.apiCreateJob(payload, getToken),
      generateJobDescription: (payload) => real.apiGenerateJd(payload, getToken),
      createInvitation: (payload) => real.apiCreateInvitation(payload, getToken),
      getMatchedJobsForTalent: () => real.apiGetMatchedJobs(getToken),
      getApplicationsForTalent: () => real.apiGetMyApplications(getToken),
      hasApplied: async () => false,
      getInvitationStatus: async () => null,
    };
  }

  // Mock: wrap sync fakeApi in Promises
  return {
    getJobs: (search) => Promise.resolve(fake.getJobs(search)),
    getJobById: (id) => Promise.resolve(fake.getJobById(id)),
    getJobsByEmployer: (employerId) => Promise.resolve(fake.getJobsByEmployer(employerId)),
    applyToJob: (jobId, talentId, talentName, source) => Promise.resolve(fake.applyToJob(jobId, talentId, talentName, source)),
    getApplicationsByJob: (jobId) => Promise.resolve(fake.getApplicationsByJob(jobId)),
    getTopMatchedTalentsForJob: (jobId) => Promise.resolve(fake.getTopMatchedTalentsForJob(jobId)),
    getAllTalents: () => Promise.resolve(fake.getAllTalents()),
    getInvitationsForTalent: (talentId) => Promise.resolve(fake.getInvitationsForTalent(talentId)),
    respondToInvitation: (invitationId, status) => Promise.resolve(fake.respondToInvitation(invitationId, status)),
    createJob: (payload) => Promise.resolve(fake.createJob({
      ...payload,
      company: payload.companyName ?? payload.company,
      employerId: payload.employerId,
    })),
    generateJobDescription: (payload) => Promise.resolve(
      typeof payload === 'object'
        ? fakeGenerateJd(payload.title, payload.techStack, payload.deadline)
        : fakeGenerateJd(payload, arguments[1], arguments[2])
    ),
    createInvitation: (payload) => Promise.resolve(fake.inviteTalent(payload.jobId, payload.talentId, payload.talentName, payload.company, payload.jobTitle, payload.deadline)),
    getMatchedJobsForTalent: (talentId) => Promise.resolve(fakeMatchJobs(talentId, fake.getJobs(''))),
    getApplicationsForTalent: (talentId) => Promise.resolve(fake.getApplicationsForTalent(talentId)),
    hasApplied: (jobId, talentId) => Promise.resolve(fake.hasApplied(jobId, talentId)),
    getInvitationStatus: (jobId, talentId) => Promise.resolve(fake.getInvitationStatus(jobId, talentId)),
  };
}

export function getApi(getToken) {
  return createApi(getToken);
}

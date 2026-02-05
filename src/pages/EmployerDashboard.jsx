import { useState, useEffect, useCallback } from 'react';
import { Plus, Users, UserPlus, Building2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { ApiError } from '../api/index.js';

export default function EmployerDashboard() {
  const { user } = useAuth();
  const api = useApi();
  const employerId = user?.id || user?.uid || 'emp-1';

  const [createTitle, setCreateTitle] = useState('');
  const [createCompany, setCreateCompany] = useState('My Company');
  const [createTechStack, setCreateTechStack] = useState('');
  const [createDeadline, setCreateDeadline] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [talentJobId, setTalentJobId] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [topTalents, setTopTalents] = useState([]);
  const [invitationsKey, setInvitationsKey] = useState(0);
  const [invitedPairs, setInvitedPairs] = useState(() => new Set());
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [loadingTalents, setLoadingTalents] = useState(false);

  const loadJobs = useCallback(() => {
    setLoadingJobs(true);
    api.getJobsByEmployer(employerId).then((list) => setJobs(list || [])).finally(() => setLoadingJobs(false));
  }, [api, employerId]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    if (!selectedJobId) {
      setApplicants([]);
      return;
    }
    setLoadingApplicants(true);
    api.getApplicationsByJob(selectedJobId).then((list) => setApplicants(list || [])).finally(() => setLoadingApplicants(false));
  }, [selectedJobId, api]);

  const jobForTalents = talentJobId || selectedJobId || (jobs[0]?.id ?? null);
  useEffect(() => {
    if (!jobForTalents) {
      setTopTalents([]);
      return;
    }
    setLoadingTalents(true);
    api.getTopMatchedTalentsForJob(jobForTalents).then((list) => setTopTalents(list || [])).finally(() => setLoadingTalents(false));
  }, [jobForTalents, api, invitationsKey]);

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  const handleGenerateDescription = async () => {
    setGenerateLoading(true);
    setCreateError('');
    try {
      const payload = { title: createTitle, techStack: createTechStack };
      const desc = await api.generateJobDescription(payload);
      setCreateDescription(desc || '');
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Failed to generate');
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      await api.createJob({
        title: createTitle,
        companyName: createCompany,
        company: createCompany,
        techStack: createTechStack,
        deadline: createDeadline,
        description: createDescription,
        employerId,
      });
      setCreateTitle('');
      setCreateCompany('My Company');
      setCreateTechStack('');
      setCreateDeadline('');
      setCreateDescription('');
      loadJobs();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Failed to create job');
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async (jobId, talentId, talentName, company, jobTitle, deadline) => {
    try {
      await api.createInvitation({
        jobId,
        talentId,
        talentName,
        company,
        jobTitle,
        deadline,
      });
      setInvitedPairs((s) => new Set(s).add(`${jobId}-${talentId}`));
      setInvitationsKey((k) => k + 1);
    } catch (_) {}
  };

  const getInvitationStatus = (jobId, talentId) => {
    if (invitedPairs.has(`${jobId}-${talentId}`)) return Promise.resolve('pending');
    return api.getInvitationStatus(jobId, talentId).then((s) => s).catch(() => null);
  };

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold text-gray-900">Employer Dashboard</h1>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
          <Plus className="h-5 w-5" />
          Create Job
        </h2>
        <form onSubmit={handleCreateJob} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Job title</label>
            <input type="text" value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} placeholder="e.g. Senior Data Engineer" className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Company name</label>
            <input type="text" value={createCompany} onChange={(e) => setCreateCompany(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tech stack (comma separated)</label>
            <input type="text" value={createTechStack} onChange={(e) => setCreateTechStack(e.target.value)} placeholder="e.g. Python, Spark, AWS" className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Deadline</label>
            <input type="date" value={createDeadline} onChange={(e) => setCreateDeadline(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" required />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Job description</label>
              <button type="button" onClick={handleGenerateDescription} disabled={generateLoading} className="flex items-center gap-1 rounded-md bg-indigo-100 px-2 py-1 text-sm text-indigo-700 hover:bg-indigo-200 disabled:opacity-50">
                <Sparkles className="h-4 w-4" />
                {generateLoading ? 'Generating...' : 'Generate with AI'}
              </button>
            </div>
            <textarea value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} placeholder="Describe the role..." rows={6} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          {createError && <p className="text-sm text-red-600">{createError}</p>}
          <button type="submit" disabled={creating} className="rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            Create Job
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
          <Building2 className="h-5 w-5" />
          My Jobs
        </h2>
        {loadingJobs ? (
          <p className="text-gray-500">Loading...</p>
        ) : jobs.length === 0 ? (
          <p className="text-gray-500">No jobs yet. Create one above.</p>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div>
                  <h3 className="font-medium text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-500">{job.company} · {job.applicationCount ?? 0} applicants</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSelectedJobId(selectedJobId === job.id ? null : job.id)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100">
                    View applicants
                  </button>
                  <button type="button" onClick={() => setTalentJobId(talentJobId === job.id ? null : job.id)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100">
                    Top talents
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedJob && (
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
            <Users className="h-5 w-5" />
            Applicants – {selectedJob.title}
          </h2>
          {loadingApplicants ? <p className="text-gray-500">Loading...</p> : applicants.length === 0 ? <p className="text-gray-500">No applicants yet.</p> : (
            <ul className="space-y-2">
              {applicants.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded border border-gray-100 p-3">
                  <span className="font-medium text-gray-900">{a.talentName}</span>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-sm text-gray-600">{a.source}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <TopTalentsSection
        jobs={jobs}
        jobForTalents={jobForTalents}
        setTalentJobIdState={setTalentJobId}
        topTalents={topTalents}
        loadingTalents={loadingTalents}
        getInvitationStatus={getInvitationStatus}
        handleInvite={handleInvite}
      />
    </div>
  );
}

function TopTalentsSection({ jobs, jobForTalents, setTalentJobIdState, topTalents, loadingTalents, getInvitationStatus, handleInvite }) {
  const [statusMap, setStatusMap] = useState({});
  useEffect(() => {
    if (!jobForTalents || !topTalents.length) return;
    topTalents.forEach((t) => {
      getInvitationStatus(jobForTalents, t.talentId).then((s) => {
        setStatusMap((m) => ({ ...m, [t.talentId]: s }));
      });
    });
  }, [jobForTalents, topTalents, getInvitationStatus]);

  const job = jobs.find((j) => j.id === jobForTalents);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
        <UserPlus className="h-5 w-5" />
        Top Matched Talents
        {jobs.length > 0 && (
          <select value={jobForTalents || ''} onChange={(e) => setTalentJobIdState(e.target.value || null)} className="ml-2 rounded border border-gray-300 py-1 pl-2 pr-6 text-sm">
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        )}
      </h2>
      {!jobForTalents ? (
        <p className="text-gray-500">Create a job first to see matched talents.</p>
      ) : loadingTalents ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <ul className="space-y-3">
          {topTalents.map((t) => {
            const status = statusMap[t.talentId];
            return (
              <li key={t.talentId} className="flex flex-wrap items-center justify-between gap-4 rounded border border-gray-100 p-4">
                <div>
                  <span className="font-medium text-gray-900">{t.talentName}</span>
                  <span className="ml-2 rounded bg-indigo-100 px-2 py-0.5 text-sm text-indigo-800">Match: {t.score}%</span>
                </div>
                <div className="flex items-center gap-2">
                  {status === 'pending' && <span className="text-sm text-amber-600">Pending</span>}
                  {status === 'accepted' && <span className="text-sm text-green-600">Accepted</span>}
                  {status === 'declined' && <span className="text-sm text-gray-500">Declined</span>}
                  {!status && (
                    <button type="button" onClick={() => handleInvite(jobForTalents, t.talentId, t.talentName, job?.company, job?.title, job?.deadline)} className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700">
                      Invite
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

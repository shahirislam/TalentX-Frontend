import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Mail, History, Building2, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { isRealApi } from '../api/index.js';

export default function TalentDashboard() {
  const { user } = useAuth();
  const api = useApi();
  const talentId = user?.id || user?.uid || 'talent-1';

  const [matchFeed, setMatchFeed] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [respondKey, setRespondKey] = useState(0);

  const loadFeed = useCallback(() => {
    setLoadingFeed(true);
    if (isRealApi()) {
      api.getMatchedJobsForTalent().then((list) => setMatchFeed(list || [])).finally(() => setLoadingFeed(false));
    } else {
      api.getMatchedJobsForTalent(talentId).then((list) => setMatchFeed(list || [])).finally(() => setLoadingFeed(false));
    }
  }, [api, talentId]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    setLoadingInvitations(true);
    api.getInvitationsForTalent(talentId).then((list) => setInvitations(list || [])).finally(() => setLoadingInvitations(false));
  }, [talentId, api, respondKey]);

  useEffect(() => {
    setLoadingApplications(true);
    api.getApplicationsForTalent(talentId).then((list) => setApplications(list || [])).finally(() => setLoadingApplications(false));
  }, [talentId, api, respondKey]);

  const handleRespond = async (invitationId, status) => {
    try {
      await api.respondToInvitation(invitationId, status);
      setRespondKey((k) => k + 1);
    } catch (_) {}
  };

  const allJobs = matchFeed.map((item) => item.job || item).filter(Boolean);

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold text-gray-900">Talent Dashboard</h1>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
          <Briefcase className="h-5 w-5" />
          AI Job Match Feed
        </h2>
        <p className="mb-4 text-sm text-gray-500">Jobs sorted by relevance score.</p>
        {loadingFeed ? (
          <p className="text-gray-500">Loading...</p>
        ) : matchFeed.length === 0 ? (
          <p className="text-gray-500">No jobs available.</p>
        ) : (
          <ul className="space-y-3">
            {matchFeed.map((item) => {
              const jobId = item.jobId ?? item.job?.id;
              const job = item.job || item;
              const score = item.score ?? 0;
              return (
                <li key={jobId}>
                  <Link to={`/jobs/${jobId}`} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-100 p-4 transition hover:bg-gray-50">
                    <div>
                      <h3 className="font-medium text-gray-900">{job.title}</h3>
                      <p className="text-sm text-gray-600">{job.company}</p>
                    </div>
                    <span className="rounded bg-indigo-100 px-2.5 py-1 text-sm font-medium text-indigo-800">{score}% match</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
          <Mail className="h-5 w-5" />
          Invitations
        </h2>
        {loadingInvitations ? (
          <p className="text-gray-500">Loading...</p>
        ) : invitations.length === 0 ? (
          <p className="text-gray-500">No invitations.</p>
        ) : (
          <ul className="space-y-3">
            {invitations.map((inv) => (
              <li key={inv.id} className="rounded-lg border border-gray-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900">{inv.jobTitle}</h3>
                    <p className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Building2 className="h-4 w-4" />
                      {inv.company}
                    </p>
                    {inv.deadline && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        Deadline: {inv.deadline}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {inv.status === 'pending' && (
                      <>
                        <button type="button" onClick={() => handleRespond(inv.id, 'accepted')} className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700">
                          Accept
                        </button>
                        <button type="button" onClick={() => handleRespond(inv.id, 'declined')} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100">
                          Decline
                        </button>
                      </>
                    )}
                    {inv.status === 'accepted' && <span className="text-sm text-green-600">Accepted</span>}
                    {inv.status === 'declined' && <span className="text-sm text-gray-500">Declined</span>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
          <History className="h-5 w-5" />
          Application History
        </h2>
        {loadingApplications ? (
          <p className="text-gray-500">Loading...</p>
        ) : applications.length === 0 ? (
          <p className="text-gray-500">No applications yet.</p>
        ) : (
          <ul className="space-y-2">
            {applications.map((app) => {
              const job = allJobs.find((j) => j.id === app.jobId) || {};
              return (
                <li key={app.id} className="flex items-center justify-between rounded border border-gray-100 p-3">
                  <div>
                    <span className="font-medium text-gray-900">{job.title ?? 'Job'}</span>
                    <span className="ml-2 text-gray-600">{job.company ?? ''}</span>
                  </div>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-sm text-gray-600">{app.source}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

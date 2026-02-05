import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Building2, Calendar, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { ApiError } from '../api/index.js';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const api = useApi();
  const [job, setJob] = useState(null);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getJobById(id)
      .then((j) => { if (!cancelled) setJob(j); })
      .catch(() => { if (!cancelled) setJob(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, api]);

  useEffect(() => {
    if (!job || !isAuthenticated || user?.role !== 'talent') return;
    api.hasApplied(id, user.id).then((v) => setApplied(!!v)).catch(() => {});
  }, [job, id, isAuthenticated, user?.id, user?.role, api]);

  const deadlinePassed = job?.deadline && new Date(job.deadline) < new Date();
  const canApply = job && !deadlinePassed && !applied;

  const handleApply = async () => {
    if (!canApply) return;
    if (!isAuthenticated || user?.role !== 'talent') {
      navigate('/login', { state: { returnTo: `/jobs/${id}` } });
      return;
    }
    setApplying(true);
    setMessage(null);
    setError(null);
    try {
      await api.applyToJob(id, user.id, user.name, 'manual');
      setApplied(true);
      setMessage('Application submitted successfully.');
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setApplied(true);
        setMessage('You have already applied to this job.');
      } else {
        setError(err instanceof ApiError ? err.message : 'Application failed.');
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">Loading...</div>;
  }

  if (!job) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
        Job not found. <Link to="/" className="text-indigo-600 hover:underline">Back to listings</Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm md:p-8">
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        Back to jobs
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900">{job.title}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-gray-600">
        <span className="flex items-center gap-1.5">
          <Building2 className="h-4 w-4" />
          {job.company}
        </span>
        {job.deadline && (
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Deadline: {job.deadline}
          </span>
        )}
      </div>
      {job.techStack?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {job.techStack.map((tech) => (
            <span key={tech} className="rounded-full bg-gray-100 px-3 py-0.5 text-sm text-gray-700">
              {tech}
            </span>
          ))}
        </div>
      )}
      <div className="mt-6 whitespace-pre-wrap text-gray-700">{job.description}</div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        {canApply && isAuthenticated && user?.role === 'talent' && (
          <button
            type="button"
            onClick={handleApply}
            disabled={applying}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {applying ? 'Submitting...' : 'Apply'}
          </button>
        )}
        {canApply && !isAuthenticated && (
          <button
            type="button"
            onClick={() => navigate('/login', { state: { returnTo: `/jobs/${id}` } })}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700"
          >
            Apply (login required)
          </button>
        )}
        {(applied || deadlinePassed) && (
          <span className="text-gray-500">
            {deadlinePassed ? 'Application deadline has passed.' : 'You have applied to this job.'}
          </span>
        )}
        {message && <p className="text-sm text-green-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}

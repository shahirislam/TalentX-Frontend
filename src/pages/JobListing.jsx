import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import JobCard from '../components/JobCard.jsx';
import { useApi } from '../hooks/useApi.js';

export default function JobListing() {
  const [search, setSearch] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const api = useApi();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getJobs(search).then((list) => {
      if (!cancelled) setJobs(list || []);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [search, api]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Job Listings</h1>
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by job title or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {jobs.length === 0 ? (
            <p className="text-gray-500">No jobs match your search.</p>
          ) : (
            jobs.map((job) => <JobCard key={job.id} job={job} />)
          )}
        </div>
      )}
    </div>
  );
}

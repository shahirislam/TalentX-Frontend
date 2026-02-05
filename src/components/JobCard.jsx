import { Link } from 'react-router-dom';
import { Building2, Users } from 'lucide-react';

export default function JobCard({ job }) {
  return (
    <Link
      to={`/jobs/${job.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
    >
      <h3 className="font-semibold text-gray-900">{job.title}</h3>
      <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
        <span className="flex items-center gap-1">
          <Building2 className="h-4 w-4" />
          {job.company}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {job.applicationCount ?? 0} applications
        </span>
      </div>
    </Link>
  );
}

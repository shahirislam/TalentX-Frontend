// In-memory store for MVP. All mutations affect these arrays.

const STORAGE_KEYS = {
  JOBS: 'talentx_mock_jobs',
  APPLICATIONS: 'talentx_mock_applications',
  INVITATIONS: 'talentx_mock_invitations',
};

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return fallback;
}

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (_) {}
}

const initialJobs = [
  {
    id: 'job-1',
    employerId: 'emp-1',
    title: 'Senior Data Engineer',
    company: 'DataFlow Inc',
    description: 'Design and implement scalable data pipelines using modern cloud platforms. Work with cross-functional teams to define data models and ensure data quality across the organization.',
    techStack: ['Python', 'Spark', 'AWS', 'SQL', 'Terraform'],
    deadline: '2025-03-15',
    applicationCount: 12,
    createdAt: '2025-01-10',
  },
  {
    id: 'job-2',
    employerId: 'emp-1',
    title: 'ML Engineer – Recommendation Systems',
    company: 'DataFlow Inc',
    description: 'Build and optimize recommendation and personalization models. Experience with large-scale ML systems and A/B testing is required.',
    techStack: ['Python', 'TensorFlow', 'PyTorch', 'Kubernetes', 'GCP'],
    deadline: '2025-03-01',
    applicationCount: 8,
    createdAt: '2025-01-12',
  },
  {
    id: 'job-3',
    employerId: 'emp-2',
    title: 'Data Analyst',
    company: 'Analytics Pro',
    description: 'Turn business questions into clear analyses and dashboards. Partner with product and engineering to define metrics and track performance.',
    techStack: ['SQL', 'Python', 'Tableau', 'dbt', 'BigQuery'],
    deadline: '2025-02-28',
    applicationCount: 24,
    createdAt: '2025-01-05',
  },
  {
    id: 'job-4',
    employerId: 'emp-2',
    title: 'AI Research Scientist',
    company: 'Analytics Pro',
    description: 'Conduct research in NLP and computer vision. Publish and present work; collaborate with engineering to ship models to production.',
    techStack: ['Python', 'PyTorch', 'Transformers', 'MLOps'],
    deadline: '2025-04-10',
    applicationCount: 5,
    createdAt: '2025-01-20',
  },
  {
    id: 'job-5',
    employerId: 'emp-1',
    title: 'Data Platform Engineer',
    company: 'DataFlow Inc',
    description: 'Own the internal data platform: ingestion, warehousing, and access. Ensure reliability, security, and self-serve analytics.',
    techStack: ['Java', 'Kafka', 'Snowflake', 'dbt', 'Airflow'],
    deadline: '2025-03-20',
    applicationCount: 7,
    createdAt: '2025-01-15',
  },
];

const initialApplications = [
  { id: 'app-1', jobId: 'job-1', talentId: 'talent-1', talentName: 'Alex Chen', source: 'manual' },
  { id: 'app-2', jobId: 'job-1', talentId: 'talent-2', talentName: 'Sam Rivera', source: 'invitation' },
  { id: 'app-3', jobId: 'job-2', talentId: 'talent-1', talentName: 'Alex Chen', source: 'manual' },
  { id: 'app-4', jobId: 'job-3', talentId: 'talent-2', talentName: 'Sam Rivera', source: 'manual' },
];

const initialInvitations = [
  { id: 'inv-1', jobId: 'job-1', talentId: 'talent-3', talentName: 'Jordan Lee', company: 'DataFlow Inc', jobTitle: 'Senior Data Engineer', deadline: '2025-03-15', status: 'pending' },
  { id: 'inv-2', jobId: 'job-2', talentId: 'talent-2', talentName: 'Sam Rivera', company: 'DataFlow Inc', jobTitle: 'ML Engineer – Recommendation Systems', deadline: '2025-03-01', status: 'accepted' },
  { id: 'inv-3', jobId: 'job-4', talentId: 'talent-1', talentName: 'Alex Chen', company: 'Analytics Pro', jobTitle: 'AI Research Scientist', deadline: '2025-04-10', status: 'declined' },
];

const talents = [
  { id: 'talent-1', name: 'Alex Chen' },
  { id: 'talent-2', name: 'Sam Rivera' },
  { id: 'talent-3', name: 'Jordan Lee' },
  { id: 'talent-4', name: 'Morgan Taylor' },
  { id: 'talent-5', name: 'Casey Kim' },
];

// Mutable in-memory state (optionally synced to localStorage for persistence across refresh)
let jobs = loadFromStorage(STORAGE_KEYS.JOBS, initialJobs);
let applications = loadFromStorage(STORAGE_KEYS.APPLICATIONS, initialApplications);
let invitations = loadFromStorage(STORAGE_KEYS.INVITATIONS, initialInvitations);

function persist() {
  saveToStorage(STORAGE_KEYS.JOBS, jobs);
  saveToStorage(STORAGE_KEYS.APPLICATIONS, applications);
  saveToStorage(STORAGE_KEYS.INVITATIONS, invitations);
}

export function getJobsStore() {
  return jobs;
}

export function getApplicationsStore() {
  return applications;
}

export function getInvitationsStore() {
  return invitations;
}

export function getTalents() {
  return talents;
}

export function setJobs(next) {
  jobs = next;
  persist();
}

export function setApplications(next) {
  applications = next;
  persist();
}

export function setInvitations(next) {
  invitations = next;
  persist();
}

export { talents };

export interface Job {
  id: number;
  title: string;
  company_name: string;
  location: string;
  employment_type: string;
  description: string;
  is_verified: boolean;
  trust_score: number;
  apply_link: string;
  source: string;
  created_at: string;
  recruiter_id?: number;
  recruiter_name?: string;
  skills_required?: string;
  location_type?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  salary_frequency?: string;
  equity?: boolean;
  experience_level?: string;
  ai_score?: number;
  status?: string;
  views?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  resume?: string;
  savedJobs: string[];
  applications: Application[];
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: 'pending' | 'reviewed' | 'interview' | 'rejected' | 'accepted';
  appliedDate: string;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  description: string;
  website?: string;
  size?: string;
  industry?: string;
}

export interface Recruiter {
  id: number;
  name: string;
  company_name: string;
  official_email: string;
  is_verified: boolean;
  created_at: string;
}

export interface DirectJob {
  id: number;
  recruiter_id: number;
  title: string;
  skills_required: string;
  location: string;
  description: string;
  employment_type: string;
  ai_score: number;
  status: 'active' | 'rejected' | 'pending';
  created_at: string;
}

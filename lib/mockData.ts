import { Job, User, Application } from '@/types';

export const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$120k - $160k',
    description: 'We are seeking an experienced Frontend Developer to join our dynamic team...',
    requirements: ['5+ years React experience', 'TypeScript proficiency', 'Next.js knowledge'],
    benefits: ['Health insurance', '401k matching', 'Remote work options'],
    postedDate: 'Jan 15, 2024',
  },
  {
    id: '2',
    title: 'Product Designer',
    company: 'DesignHub',
    location: 'New York, NY',
    type: 'Full-time',
    salary: '$100k - $140k',
    description: 'Join our creative team to design innovative user experiences...',
    requirements: ['3+ years UI/UX design', 'Figma expertise', 'Portfolio required'],
    benefits: ['Flexible hours', 'Professional development', 'Stock options'],
    postedDate: 'Jan 14, 2024',
  },
  {
    id: '3',
    title: 'DevOps Engineer',
    company: 'CloudSystems',
    location: 'Remote',
    type: 'Remote',
    salary: '$130k - $170k',
    description: 'Looking for a DevOps engineer to manage our cloud infrastructure...',
    requirements: ['AWS/Azure experience', 'Kubernetes', 'CI/CD pipelines'],
    benefits: ['Fully remote', 'Unlimited PTO', 'Learning budget'],
    postedDate: 'Jan 13, 2024',
  },
];

export const mockUser: User = {
  id: 'user1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1 (555) 123-4567',
  location: 'San Francisco, CA',
  savedJobs: ['1', '3'],
  applications: [
    {
      id: 'app1',
      jobId: '1',
      jobTitle: 'Senior Frontend Developer',
      company: 'TechCorp Inc.',
      status: 'interview',
      appliedDate: 'Jan 10, 2024',
    },
  ],
};

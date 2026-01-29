'use client';

import { useState, useEffect } from 'react';
import { Zap, ArrowRight, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { Job } from '@/types';
import JobCard from './JobCard';

interface RecommendedJobsProps {
  userId: string;
  title?: string;
}

export default function RecommendedJobs({ userId, title = "Recommended Jobs" }: RecommendedJobsProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendedJobs = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/recommended-jobs`);
        if (res.ok) {
          const data = await res.json();
          setJobs(data);
        }
      } catch (error) {
        console.error('Failed to fetch recommended jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendedJobs();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-16 h-16 border-4 border-charcoal border-t-electric rounded-full animate-spin"></div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-20 glow-card">
        <Briefcase className="h-16 w-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No recommended jobs yet</p>
        <p className="text-gray-400 text-sm mt-2">Add target roles to your profile to see recommendations!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-12 gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-2">
            <span className="glow-text">{title}</span>
          </h2>
          <p className="text-gray-500 inter text-xs sm:text-sm">✅ MATCHING YOUR GOALS • 🎯 AI-CURATED • ⚡ PERFECT FIT</p>
        </div>
        <Link href="/jobs" className="flex items-center text-electric hover:text-electric font-semibold group text-sm sm:text-base">
          See All Jobs
          <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}

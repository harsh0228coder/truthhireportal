'use client';

import Link from 'next/link';
import { 
  MapPin, Briefcase, Clock, Bookmark, Shield, 
  ArrowRight, DollarSign, Building2, CheckCircle2 
} from 'lucide-react';
import { Job } from '@/types';

interface JobCardProps {
  job: Job;
  onSave?: (jobId: number) => void;
  isSaved?: boolean;
}

export default function JobCard({ job, onSave, isSaved }: JobCardProps) {
  
  // 1. Time Logic
  const getPostedLabel = (dateStr: string) => {
    if (!dateStr) return 'Today';
    const posted = new Date(dateStr);
    const now = new Date();
    const postedDate = new Date(posted.getFullYear(), posted.getMonth(), posted.getDate());
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = nowDate.getTime() - postedDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'New'; 
    if (diffDays === 0) return 'New';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  const timeLabel = getPostedLabel(job.created_at);

  // 2. Salary Formatting
  const formatSalary = (min?: number, max?: number, currency: string = 'INR') => {
    if (!min && !max) return "Salary not disclosed";

    const symbol = currency === 'USD' ? '$' : '₹';
    const k = (num: number) => num >= 100000 ? `${(num/100000).toFixed(1).replace('.0','')}L` : `${(num/1000).toFixed(0)}k`;
    
    if (min && max) return `${symbol}${k(min)} - ${k(max)}`;
    if (min) return `${symbol}${k(min)}+`;
    return null;
  };

  const salaryString = formatSalary(job.salary_min, job.salary_max, job.currency);
  const hasSalary = salaryString !== "Salary not disclosed";

  // 3. Trust Score Color Logic
  const getTrustColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (score >= 50) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    return 'text-red-400 bg-red-400/10 border-red-400/20';
  };

  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <div className="relative bg-[#111] hover:bg-[#161616] border border-white/10 hover:border-white/20 rounded-xl p-4 md:p-5 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-[2px]">
        
        <div className="flex flex-col sm:flex-row gap-4 md:gap-5">
          
          {/* --- LOGO SECTION --- */}
          <div className="shrink-0 flex items-start justify-between sm:block">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-[#1a1a1a] border border-white/5 flex items-center justify-center text-xl font-bold text-gray-400 group-hover:text-white group-hover:bg-white/5 transition-colors">
              {job.company_name ? job.company_name.charAt(0).toUpperCase() : <Building2 size={24} />}
            </div>
            
            {/* Mobile Actions (Visible only on small screens) */}
            <div className="flex flex-col items-end gap-2 sm:hidden">
                 <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[11px] font-bold ${getTrustColor(job.trust_score)}`}>
                    <CheckCircle2 size={11} />
                    <span>{job.trust_score}% Trust Score</span>
                 </div>
                 <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSave?.(job.id);
                    }}
                    className={`p-1.5 rounded-full transition-all ${
                      isSaved 
                        ? 'text-blue-400 bg-blue-400/10' 
                        : 'text-gray-500 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
                  </button>
            </div>
          </div>

          {/* --- MAIN CONTENT --- */}
          <div className="flex-1 min-w-0">
            
            {/* Header: Title & Actions (Desktop Layout) */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-xl font-bold text-gray-100 group-hover:text-blue-400 transition-colors truncate pr-2">
                  {job.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs md:text-sm font-medium text-gray-400 truncate max-w-[200px]">{job.company_name}</span>
                  {job.is_verified && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                      <Shield size={12} className="fill-blue-500/20" /> VERIFIED JOB
                    </span>
                  )}
                </div>
              </div>

              {/* Right Side: Trust Score + Save (Hidden on Mobile, Visible on Desktop) */}
              <div className="hidden sm:flex flex-col items-end gap-2 shrink-0">
                 <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[14px] font-bold ${getTrustColor(job.trust_score)}`}>
                    <CheckCircle2 size={14} />
                    <span>{job.trust_score}% Trust Score</span>
                 </div>

                 <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSave?.(job.id);
                    }}
                    className={`p-1.5 rounded-full transition-all self-end ${
                      isSaved 
                        ? 'text-blue-400 bg-blue-400/10' 
                        : 'text-gray-500 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
                  </button>
              </div>
            </div>

            {/* Metrics Row (Salary, Location, Type) */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-3 md:gap-x-4 mt-3 text-xs md:text-sm text-gray-400">
              
              {/* Conditional Salary Style */}
              {hasSalary ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold whitespace-nowrap">
                    {salaryString}
                  </span>
              ) : (
                  <span className="flex items-center gap-1.5 text-yellow-400 whitespace-nowrap">
                    {salaryString}
                  </span>
              )}
              
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <MapPin size={14} /> {job.location}
              </span>
              
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Briefcase size={14} /> {job.employment_type}
              </span>
            </div>

            {/* Tags / Skills */}
            {job.skills_required && (
                <div className="flex flex-wrap gap-2 mt-4">
                    {job.skills_required.split(',').slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-2 py-1 text-[10px] md:text-[11px] font-medium text-gray-400 bg-[#1a1a1a] border border-white/5 rounded-md">
                            {skill.trim()}
                        </span>
                    ))}
                    {job.skills_required.split(',').length > 3 && (
                        <span className="px-2 py-1 text-[10px] md:text-[11px] text-gray-500">+ more</span>
                    )}
                </div>
            )}

            {/* Footer: Time Only (Clean Look) */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                <span className="text-[13px] text-gray-600 font-medium flex items-center gap-1">
                    <Clock size={12} /> {timeLabel}
                </span>
                
                <span className="flex items-center gap-1 text-[13px] font-bold text-gray-500 group-hover:text-blue-400 transition-colors">
                    Details <ArrowRight size={12} />
                </span>
            </div>

          </div>
        </div>
      </div>
    </Link>
  );
}
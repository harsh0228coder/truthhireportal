'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, Target, Lightbulb, Bookmark, 
  RefreshCw, Award, Clock, CheckCircle2, 
  XCircle, Briefcase, Search, ChevronDown, ChevronRight, Building2
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface JobDetails {
  id: string | number; // Unified ID type
  title: string;
  company: string;
  location: string;
  salary: string | null;
}

interface Application {
  id: number;
  status: string;
  match_score: number;
  applied_at: string;
  job: JobDetails;
}

interface SavedJob {
  id: number;
  job: JobDetails;
  saved_at: string;
}

interface SkillGap {
  skill_name: string;
  frequency: number;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [avgScore, setAvgScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);

  const fetchDashboard = async () => {
    const token = localStorage.getItem('token');
    const id = localStorage.getItem('user_id');
    
    if (!token || !id) {
      router.push('/login');
      return;
    }
    
    setRefreshing(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
        setSavedJobs(data.saved_jobs || []);
        // Ensure we always get an array
        setSkillGaps(data.skill_gaps || []);
        setAvgScore(data.avg_match_score || 0);
      } else {
        toast.error("Failed to load dashboard data");
      }
    } catch (error) {
      console.error("Connection error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const name = localStorage.getItem('user_name');
    if (name) setUserName(name);
    fetchDashboard();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const statusCounts = {
    applied: applications.filter(a => a.status === 'applied').length,
    shortlisted: applications.filter(a => ['shortlisted', 'screening'].includes(a.status)).length,
    interview: applications.filter(a => a.status === 'interview').length,
    offer: applications.filter(a => a.status === 'hired').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  const visibleSkills = showAllSkills ? skillGaps : skillGaps.slice(0, 5);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 pb-20 pt-10 md:pt-14">
      <Toaster position="top-right" />
      
      {/* Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-blue-900/10 rounded-full blur-[80px] md:blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-purple-900/10 rounded-full blur-[80px] md:blur-[100px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-8 md:mb-10">
          <div>
            <div className="flex items-center gap-2 text-gray-400 text-xs md:text-sm mb-1">
               <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-blue-400">{userName}</span>
            </h1>
            <p className="text-gray-400 text-xs md:text-sm mt-1">Here is what's happening with your job applications today.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
                onClick={fetchDashboard} 
                disabled={refreshing}
                className="p-2.5 bg-[#111] border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-white/20 transition disabled:opacity-50"
                title="Refresh Data"
            >
                <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
            </button>
            <Link href="/jobs" className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-bold transition shadow-lg shadow-blue-600/20">
              <Search size={18} /> Find Jobs
            </Link>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Left Column (Stats & Apps) */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            
            {/* Trust Score Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] to-[#0B0F19] rounded-2xl border border-blue-500/20 p-6 md:p-8 shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Award size={120} className="text-blue-500" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                    <div>
                        <div className="flex items-center justify-center md:justify-start gap-2 text-blue-400 font-bold uppercase tracking-wider text-[10px] md:text-xs mb-2">
                            <TrendingUp size={14} /> AI Performance Metric
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Average Trust Score</h2>
                        <p className="text-gray-400 text-xs md:text-sm max-w-md mx-auto md:mx-0">
                            This score reflects how well your resume matches the jobs you are applying for. Improve it by tailoring your resume.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative w-28 h-28 md:w-32 md:h-32 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                                <circle 
                                  cx="50" cy="50" r="45" 
                                  stroke="currentColor" strokeWidth="8" fill="transparent" 
                                  className={`${avgScore > 70 ? 'text-green-500' : avgScore > 40 ? 'text-amber-500' : 'text-red-500'}`}
                                  strokeDasharray={283}
                                  strokeDashoffset={283 - (283 * avgScore) / 100}
                                  strokeLinecap="round"
                                />
                            </svg>
                            <span className="absolute text-2xl md:text-3xl font-bold text-white flex items-baseline">
                                {avgScore}<span className="text-sm md:text-lg ml-0.5 text-gray-400">%</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pipeline Status */}
            <div className="bg-[#111] rounded-2xl border border-white/10 p-5 md:p-6">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                        <Target size={18} className="text-blue-500" /> Application Pipeline
                    </h2>
                </div>
              
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    <StatusCard title="Applied" count={statusCounts.applied} color="blue" icon={<Clock size={16} />} />
                    <StatusCard title="Shortlisted" count={statusCounts.shortlisted} color="green" icon={<CheckCircle2 size={16} />} />
                    <StatusCard title="Interview" count={statusCounts.interview} color="purple" icon={<Briefcase size={16} />} />
                    <StatusCard title="Offer" count={statusCounts.offer} color="yellow" icon={<Award size={16} />} />
                    <StatusCard title="Rejected" count={statusCounts.rejected} color="red" icon={<XCircle size={16} />} />
                </div>
            </div>

            {/* Recent Apps */}
            <div className="bg-[#111] rounded-2xl border border-white/10 p-5 md:p-6 min-h-[300px]">
                <h2 className="text-base md:text-lg font-bold text-white mb-4">Recent Applications</h2>
                
                <div className="space-y-3">
                    {applications.slice(0, 4).map((app) => (
                        <ApplicationRow key={app.id} app={app} />
                    ))}
                    
                    {applications.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                            <Building2 className="mb-3 opacity-50" size={32} />
                            <p className="text-sm">No applications yet.</p>
                            <Link href="/jobs" className="mt-2 text-blue-500 text-xs font-bold hover:underline">Start applying now</Link>
                        </div>
                    )}
                </div>
            </div>
          </div>

          {/* Right Column (Skills & Saved) */}
          <div className="space-y-6 md:space-y-8">
            
            {/* SKILLS GAP SECTION */}
            <div className="bg-[#111] rounded-2xl border border-white/10 p-5 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Lightbulb size={18} className="text-yellow-400" />
                    <h3 className="text-base md:text-lg font-bold text-white">Skills to Learn</h3>
                </div>
                <p className="text-xs text-gray-400 mb-4">These are skills you were missing in recent job applications.</p>
                
                <div className="space-y-3">
                    {visibleSkills.map((skill, idx) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/5 flex items-center justify-between group hover:border-white/10 transition animate-in fade-in slide-in-from-left-2">
                            <span className="text-gray-200 font-medium text-sm">{skill.skill_name}</span>
                            <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20 font-mono">
                                Missed {skill.frequency}x
                            </span>
                        </div>
                    ))}
                    
                    {skillGaps.length === 0 && (
                        <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                            <p className="text-gray-500 text-xs">No skill gaps found yet.</p>
                            <p className="text-gray-600 text-[10px] mt-1">Apply to jobs to let AI analyze your profile.</p>
                        </div>
                    )}
                </div>

                {/* READ MORE / SHOW LESS BUTTON */}
                {skillGaps.length > 5 && (
                    <button 
                        onClick={() => setShowAllSkills(!showAllSkills)}
                        className="mt-4 w-full flex items-center justify-center gap-1 text-xs font-bold text-gray-500 hover:text-white transition py-2 rounded hover:bg-white/5"
                    >
                        {showAllSkills ? 'Show Less' : `View all ${skillGaps.length} skills`}
                        <ChevronDown size={14} className={`transition-transform duration-200 ${showAllSkills ? 'rotate-180' : ''}`} />
                    </button>
                )}
            </div>

            {/* SAVED JOBS */}
            <div className="bg-[#111] rounded-2xl border border-white/10 p-5 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Bookmark size={18} className="text-blue-500" />
                    <h3 className="text-base md:text-lg font-bold text-white">Saved Jobs</h3>
                </div>
                <div className="space-y-3">
                    {savedJobs.slice(0, 3).map((saved) => (
                        <Link key={saved.id} href={saved.job.id ? `/jobs/${saved.job.id}` : '#'} className="block bg-white/5 rounded-lg p-3 border border-white/5 hover:border-blue-500/30 hover:bg-white/10 transition group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-white font-medium text-sm line-clamp-1 group-hover:text-blue-400 transition">{saved.job.title}</h4>
                                    <p className="text-gray-500 text-xs mt-1">{saved.job.company}</p>
                                </div>
                                <ChevronRight size={14} className="text-gray-600 group-hover:text-white transition" />
                            </div>
                        </Link>
                    ))}
                    {savedJobs.length === 0 && (
                        <div className="text-center py-8 text-gray-500 text-xs">
                            You haven't saved any jobs yet.
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-gradient-to-b from-blue-600 to-blue-800 rounded-2xl p-6 text-center relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="font-bold text-white text-lg mb-2">Resume Score Low?</h3>
                    <p className="text-blue-100 text-xs mb-4">Use our AI tool to optimize your resume for specific job descriptions.</p>
                    <Link href="/tools/check-chances" className="inline-block bg-white text-blue-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-100 transition">
                        Check My Chances
                    </Link>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ title, count, color, icon }: { title: string; count: number; color: string; icon: React.ReactNode }) {
  const colorStyles: any = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <div className={`rounded-xl p-3 md:p-4 border flex flex-col items-center justify-center text-center transition hover:bg-opacity-20 ${colorStyles[color]}`}>
      <div className="mb-2 opacity-80">{icon}</div>
      <div className="text-xl md:text-2xl font-bold text-white mb-1">{count}</div>
      <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider opacity-70">{title}</div>
    </div>
  );
}

function ApplicationRow({ app }: { app: Application }) {
  const statusColors: any = {
    applied: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    shortlisted: 'text-green-400 bg-green-400/10 border-green-400/20',
    interview: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    hired: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    rejected: 'text-red-400 bg-red-400/10 border-red-400/20',
  };

  return (
    <Link href={app.job.id ? `/jobs/${app.job.id}` : '#'} className="flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-xl p-3 md:p-4 transition group">
      <div className="flex items-center gap-3 md:gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg bg-[#1a1a1a] text-gray-500 border border-white/10 flex-shrink-0`}>
            {(app.job.company || "C").substring(0,1)}
        </div>
        <div>
            <h4 className="text-white font-medium text-sm group-hover:text-blue-400 transition line-clamp-1">{app.job.title}</h4>
            <div className="flex items-center gap-2 md:gap-3 mt-1 text-xs text-gray-500">
                <span className="line-clamp-1 max-w-[100px]">{app.job.company}</span>
                <span className="w-1 h-1 bg-gray-700 rounded-full flex-shrink-0"></span>
                <span>{new Date(app.applied_at).toLocaleDateString()}</span>
            </div>
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-1 md:gap-2">
        <span className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wide border ${statusColors[app.status] || statusColors.applied}`}>
          {app.status}
        </span>
        <div className="text-[9px] md:text-[10px] text-gray-500 font-mono">
            Match: <span className={app.match_score > 70 ? "text-green-500" : "text-amber-500"}>{app.match_score}%</span>
        </div>
      </div>
    </Link>
  );
}

function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-[#050505] p-6 md:p-8 pt-24 md:pt-28">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="h-16 md:h-20 bg-white/5 rounded-xl animate-pulse w-2/3 md:w-1/3"></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="h-40 md:h-48 bg-white/5 rounded-2xl animate-pulse"></div>
                        <div className="h-56 md:h-64 bg-white/5 rounded-2xl animate-pulse"></div>
                    </div>
                    <div className="space-y-8">
                        <div className="h-56 md:h-64 bg-white/5 rounded-2xl animate-pulse"></div>
                        <div className="h-40 md:h-48 bg-white/5 rounded-2xl animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
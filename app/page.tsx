'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchJobs } from '@/lib/api';
import { Job } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  Shield, CheckCircle2, Activity, ArrowRight, 
  Lock, ArrowUpRight, FileText, Search, Briefcase, X,
  Code2, PenTool, BarChart3, Megaphone, 
  Wallet, Users2, TrendingUp, Layers, ChevronRight, Globe2,
  Sparkles, Zap, Check, Bell, Loader2, Mail
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast'; 

// --- 1. SMART CATEGORIZATION LOGIC ---
const getDepartment = (title: string): string => {
  if (!title) return 'Other';
  const t = title.toLowerCase().replace(/[\(\)\/\-\.,&|]/g, ' ');

  if (t.includes('hr ') || t.includes('human res') || t.includes('recruit') || t.includes('talent') || t.includes('people') || t.includes('admin') || t.includes('operations')) return 'HR & Admin';
  if (t.includes('sales') || t.includes('business dev') || t.includes('bde') || t.includes('sdr') || t.includes('account exec') || t.includes('account man') || t.includes('client growth') || t.includes('revenue')) return 'Sales';
  if (t.includes('design') || t.includes('ui') || t.includes('ux') || t.includes('creative') || t.includes('art ') || t.includes('graphic') || t.includes('visual')) return 'Design';
  if (t.includes('engineer') || t.includes('developer') || t.includes('dev') || t.includes('stack') || t.includes('data') || t.includes('qa ') || t.includes('tech') || t.includes('software') || t.includes('web') || t.includes('android') || t.includes('ios') || t.includes('cloud')) return 'Engineering';
  if (t.includes('product') || t.includes('manager') || t.includes('owner') || t.includes('scrum')) return 'Product';
  if (t.includes('market') || t.includes('social') || t.includes('seo') || t.includes('content') || t.includes('brand') || t.includes('media')) return 'Marketing';
  if (t.includes('finance') || t.includes('accountant') || t.includes('audit') || t.includes('tax') || t.includes('ca ')) return 'Finance';
  if (t.includes('support') || t.includes('customer') || t.includes('client') || t.includes('help')) return 'Support';

  return 'Other';
};

export default function Home() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [query, setQuery] = useState('');
  
  // --- WAITLIST MODAL STATE ---
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [waitlistCategory, setWaitlistCategory] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // 🟢 UX STATES
  const [submitSuccess, setSubmitSuccess] = useState(false); 
  const [alreadyJoined, setAlreadyJoined] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsSignedIn(!!token);

    fetchJobs()
      .then(data => {
        setJobs(data); 
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch jobs", err);
        setLoading(false);
      });
  }, []);

  // --- 2. SEARCH HANDLER ---
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault(); 
    if (query.trim()) {
      router.push(`/jobs?q=${encodeURIComponent(query)}`);
    }
  };

  // --- 3. DYNAMIC COUNT ---
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
        'Engineering': 0, 'Design': 0, 'Product': 0, 'Marketing': 0,
        'Sales': 0, 'HR & Admin': 0, 'Finance': 0, 'Support': 0, 'Other': 0 
    };
    jobs.forEach(job => {
        const dept = getDepartment(job.title || "");
        if (counts[dept] !== undefined) counts[dept]++;
    });
    return counts;
  }, [jobs]);

  const formatSalary = (amount: number) => {
    if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`; 
    return `${(amount / 1000).toFixed(0)}k`; 
  };

  const tickerData = jobs.length > 0 ? [...jobs, ...jobs] : [];

  // --- HANDLE CATEGORY CLICK ---
  const handleCategoryClick = (slug: string, count: number, label: string) => {
      if (count > 0) {
          router.push(`/jobs?department=${encodeURIComponent(slug)}`);
      } else {
          setWaitlistCategory(label);
          setSubmitSuccess(false); 
          setAlreadyJoined(false);
          setEmail('');
          setIsWaitlistOpen(true);
      }
  };

  // --- 🆕 INTELLIGENT SUBMIT LOGIC ---
  const handleWaitlistSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      
      try {
        const res = await fetch('http://localhost:8000/waitlist/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, category: waitlistCategory })
        });

        const data = await res.json();

        // Artificial delay for smooth UX
        await new Promise(resolve => setTimeout(resolve, 600));

        if (data.status === 'exists') {
            // 🟡 Case: Already Joined -> Show "Don't Worry" Modal
            setAlreadyJoined(true);
        } else if (res.ok) {
            // 🟢 Case: Success -> Show "Success" Modal
            setSubmitSuccess(true);
        } else {
            toast.error("Something went wrong. Please try again.");
        }
      } catch (error) {
        toast.error("Connection failed.");
      } finally {
        setSubmitting(false);
      }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
      <Toaster position="top-right" />
      
      {/* GLOBAL STYLES & ANIMATIONS */}
      <style jsx global>{`
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-scroll { animation: scroll 40s linear infinite; }
        .ticker-container:hover .animate-scroll { animation-play-state: paused; }
        
        .bg-grid-pattern {
          background-image: linear-gradient(to right, #ffffff05 1px, transparent 1px),
                            linear-gradient(to bottom, #ffffff05 1px, transparent 1px);
          background-size: 50px 50px;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; opacity: 0; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }

        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-16 pb-16 md:pt-20 md:pb-32 overflow-hidden w-full">
        <div className="absolute inset-0 bg-grid-pattern [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)] pointer-events-none"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] md:h-[500px] bg-gradient-to-b from-blue-900/20 via-transparent to-transparent blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-8 xl:gap-12 items-center">
          
          {/* LEFT: Content */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 md:space-y-8 w-full">
            <div className="animate-fade-in-up inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl hover:border-blue-500/30 transition-all cursor-default group">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] md:text-xs font-semibold text-gray-300 tracking-wide uppercase">AI-Powered Verification Engine v2.0</span>
            </div>

            <h1 className="animate-fade-in-up delay-100 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] md:leading-[1.1]">
              <span className="block text-white">Stop applying to</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-200 to-blue-500">
                  Fake Jobs.
              </span>
            </h1>

            <p className="animate-fade-in-up delay-200 text-base sm:text-lg md:text-xl text-gray-400 max-w-lg lg:max-w-xl leading-relaxed">
              The only platform that audits every listing. We filter out <span className="text-red-400 font-medium">ghost jobs</span>, <span className="text-yellow-400 font-medium">scams</span>, and <span className="text-white font-medium">unverified recruiters</span> so you can build a career, not just hope for one.
            </p>

            <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              {isSignedIn ? (
                <Link href="/jobs" className="w-full sm:w-auto relative group overflow-hidden rounded-xl bg-white px-8 py-3.5 md:py-4 font-bold text-black shadow-xl transition-all hover:scale-[1.02] hover:bg-gray-200">
                  <span className="relative flex items-center justify-center gap-2">
                    Find Verified Jobs <ArrowRight size={18} />
                  </span>
                </Link>
              ) : (
                <Link href="/signup" className="w-full sm:w-auto relative group overflow-hidden rounded-xl bg-white px-8 py-3.5 md:py-4 font-bold text-black shadow-xl transition-all hover:scale-[1.02] hover:bg-gray-100">
                  <span className="relative flex items-center justify-center gap-2">
                    Start for Free <ArrowRight size={18} />
                  </span>
                </Link>
              )}
              
              <Link href="/about" className="w-full sm:w-auto px-8 py-3.5 md:py-4 rounded-xl font-semibold text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all flex items-center justify-center gap-2">
                <Shield size={18} /> How it works
              </Link>
            </div>

            <div className="animate-fade-in-up delay-300 pt-2 md:pt-4 flex items-center gap-4 md:gap-6 text-xs md:text-sm text-gray-500 font-medium">
              <div className="flex -space-x-2 md:-space-x-3">
                {[1,2,3].map(i => (
                  <div key={i} className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-[#050505] bg-gradient-to-br from-gray-700 to-gray-900"></div>
                ))}
              </div>
              <p>Trusted by 10,000+ Candidates</p>
            </div>
          </div>

          {/* RIGHT: Visuals */}
          <div className="relative hidden lg:block animate-fade-in-up delay-200 perspective-1000 w-full max-w-lg mx-auto lg:max-w-none">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

            <div className="relative transform rotate-y-12 hover:rotate-y-0 transition-transform duration-700 ease-out preserve-3d">
              <div className="bg-[#0f0f0f]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative z-20">
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                  </div>
                  <div className="bg-black/30 px-3 py-1 rounded-md text-[10px] font-mono text-gray-500 flex items-center gap-2">
                    <Lock size={10} /> truthhire-secure.com
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-blue-500/30 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <CheckCircle2 size={20} className="text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">Senior Frontend Engineer</h4>
                        <p className="text-xs text-blue-400">Verified • Salary Transparent</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-lg border border-blue-500/20">
                      98% Match
                    </div>
                  </div>

                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between opacity-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                        <span className="font-bold text-gray-500">A</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-300 text-sm">Product Designer</h4>
                        <p className="text-xs text-gray-500">Pending Verification</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/20 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-red-500/5 backdrop-blur-[1px] z-10 flex items-center justify-center">
                      <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                        <Shield size={12} /> BLOCKED BY AI
                      </span>
                    </div>
                    <div className="flex items-center gap-4 opacity-40">
                      <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                        <span className="font-bold text-gray-500">X</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-300 text-sm">Data Entry (Instant Hire)</h4>
                        <p className="text-xs text-red-400">Suspicious Activity</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-8 -top-8 bg-[#1a1a1a] p-4 rounded-xl border border-white/10 shadow-xl animate-float z-30">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/20 p-2 rounded-lg text-green-400">
                    <Zap size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Response Rate</p>
                    <p className="text-lg font-bold text-white">High</p>
                  </div>
                </div>
              </div>

              <div className="absolute -left-8 bottom-12 bg-[#1a1a1a] p-4 rounded-xl border border-white/10 shadow-xl animate-float-delayed z-30">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                    <Search size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Resume Audit</p>
                    <p className="text-lg font-bold text-white">Passed</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ================= REAL-TIME JOBS TICKER ================= */}
      <section className="py-8 bg-[#050505] border-b border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-8 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4 text-center sm:text-left">
           <h3 className="text-xl font-bold text-white flex items-center gap-3">
             <span className="relative flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
             </span>
             Latest Verified Jobs
           </h3>
           <Link href="/jobs" className="text-base font-medium text-blue-400 hover:text-white transition-colors flex items-center gap-1">
             View All Active Jobs <ArrowRight size={14} />
           </Link>
        </div>

        <div className="relative w-full ticker-container">
          <div className="absolute left-0 top-0 bottom-0 w-8 md:w-24 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-8 md:w-24 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none"></div>

          <div className="flex animate-scroll w-max gap-4 md:gap-5 px-6">
              {tickerData.map((job, i) => (
                <Link 
                  href={`/jobs/${job.id}`}
                  key={i} 
                  className="w-[280px] md:w-[340px] bg-[#121212] border border-white/5 rounded-xl p-4 md:p-5 flex items-center gap-4 group transition-all duration-300 hover:scale-105 hover:border-blue-500/30 hover:bg-[#151515] hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] relative cursor-pointer"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-white flex items-center justify-center text-black font-bold text-lg md:text-xl shadow-sm flex-shrink-0">
                    {job.company_name ? job.company_name.charAt(0).toUpperCase() : 'C'}
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <h4 className="font-medium text-white text-sm truncate group-hover:text-blue-400 transition-colors">
                      {job.title}
                    </h4>
                    <div className="text-gray-400 text-xs mt-1 mb-1.5 flex items-center gap-1.5">
                      <span className="truncate max-w-[80px] md:max-w-[100px]">{job.company_name}</span>
                      <span className="w-1 h-1 bg-gray-600 rounded-full flex-shrink-0"></span>
                      <span className="truncate max-w-[60px] md:max-w-[80px]">{job.location}</span>
                    </div>
                    <div className="text-[10px] md:text-xs font-bold text-green-400 bg-white/5 px-2 py-1 rounded inline-block group-hover:bg-white/10 transition-colors">
                        {job.salary_min && job.salary_max ? (
                            <>{job.currency === 'INR' ? '₹' : '$'} {formatSalary(job.salary_min)} - {formatSalary(job.salary_max)}</>
                        ) : "Salary not disclosed"}
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white transform group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform shadow-lg shadow-blue-500/20">
                          <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
                      </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
      </section>

      {/* ================= EXPLORE CATEGORIES (WITH WAITLIST LOGIC) ================= */}
      <section className="py-20 border-b border-white/5 bg-[#050505] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <span className="text-blue-500 font-bold text-sm uppercase tracking-widest mb-2 block">Career Pathways</span>
                <h2 className="text-3xl md:text-4xl font-bold text-white">Find Your Niche</h2>
              </div>
              <Link href="/jobs" className="text-base font-medium text-blue-400 hover:text-white transition-colors flex items-center gap-1">
                Browse All Categories <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { icon: Code2, label: 'Engineering', count: categoryCounts['Engineering'], slug: 'Engineering' },
                      { icon: PenTool, label: 'Design', count: categoryCounts['Design'], slug: 'Design' },
                      { icon: BarChart3, label: 'Product', count: categoryCounts['Product'], slug: 'Product' },
                      { icon: Megaphone, label: 'Marketing', count: categoryCounts['Marketing'], slug: 'Marketing' },
                      { icon: TrendingUp, label: 'Sales', count: categoryCounts['Sales'], slug: 'Sales' },
                      { icon: Users2, label: 'HR & Admin', count: categoryCounts['HR & Admin'], slug: 'HR & Admin' },
                      { icon: Wallet, label: 'Finance', count: categoryCounts['Finance'], slug: 'Finance' },
                      { icon: Layers, label: 'Other', count: categoryCounts['Other'], slug: 'Other' },
                    ].map((cat, i) => (
                      <div 
                        onClick={() => handleCategoryClick(cat.slug, cat.count, cat.label)}
                        key={i}
                        className="group relative h-52 bg-[#111] rounded-[2rem] border border-white/10 p-6 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:border-blue-500/50 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                      >
                        <div className="absolute top-8 left-0 w-full text-[5rem] font-black text-white/5 leading-none select-none pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0">
                            {cat.label.split(' ')[0]}
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">{cat.label}</h3>
                            <p className="text-[14px] text-gray-500 mt-1">{cat.count > 0 ? `${cat.count} Jobs Available` : 'Hiring soon'}</p>
                        </div>
                        <div className="relative z-10 flex items-end justify-between">
                            <span className="flex items-center gap-1 text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                                {cat.count > 0 ? 'View all' : 'Get notified'} <ChevronRight size={16} />
                            </span>
                        </div>
                        <cat.icon strokeWidth={1.5} className="absolute -bottom-6 -right-6 w-28 h-28 text-[#1a1a1a] group-hover:text-blue-600/20 transition-all duration-500 transform group-hover:scale-110 group-hover:-rotate-12 z-0" />
                      </div>
                    ))}
                </div>
        </div>
      </section>

      {/* ================= 🌟 IMPROVED WAITLIST MODAL ================= */}
      {isWaitlistOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#131316] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative">
                
                {/* Close Button */}
                <button 
                    onClick={() => setIsWaitlistOpen(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-20"
                >
                    <X size={20} />
                </button>

                {/* --- 1. ALREADY JOINED VIEW (REASSURANCE) --- */}
                {alreadyJoined ? (
                    <div className="p-10 text-center animate-in zoom-in-95 duration-300">
                        {/* Calm Blue Icon */}
                        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                            <Shield className="text-blue-500 w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">You are secured.</h3>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                            No need to sign up again. We have your email <strong>{email}</strong> in our priority queue for {waitlistCategory}.
                        </p>
                        <div className="bg-white/5 border border-white/5 rounded-xl p-3 mb-6 text-xs text-gray-300">
                            <span className="text-green-400 font-bold">Status:</span> Confirmed on Waitlist
                        </div>
                        <button 
                            onClick={() => setIsWaitlistOpen(false)}
                            className="w-full bg-[#1a1a1a] hover:bg-[#252525] border border-white/10 text-white font-medium py-3 rounded-xl transition-all"
                        >
                            Okay, got it
                        </button>
                    </div>
                ) : submitSuccess ? (
                    /* --- 2. SUCCESS VIEW --- */
                    <div className="p-10 text-center animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                            <Check className="text-green-500 w-8 h-8 animate-bounce" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">You're on the list!</h3>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                            We've added <strong>{email}</strong> to the priority queue for {waitlistCategory} jobs. Keep an eye on your inbox.
                        </p>
                        <button 
                            onClick={() => setIsWaitlistOpen(false)}
                            className="w-full bg-[#1a1a1a] hover:bg-[#252525] border border-white/10 text-white font-medium py-3 rounded-xl transition-all"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    /* --- 3. INPUT VIEW --- */
                    <div className="p-8 text-center relative">
                        {/* Background Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none"></div>
                        
                        <div className="w-14 h-14 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-5 border border-white/10 relative z-10">
                            <Bell className="text-blue-400 w-6 h-6" />
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2 relative z-10">
                            {waitlistCategory} Jobs Coming Soon
                        </h3>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed relative z-10">
                            We are currently verifying the best <strong>{waitlistCategory}</strong> roles. Enter your email to get early access when we launch.
                        </p>

                        <form onSubmit={handleWaitlistSubmit} className="relative z-10">
                            <div className="flex flex-col gap-3">
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input 
                                        type="email" 
                                        placeholder="Enter your email address" 
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : 'Notify Me'}
                                </button>
                            </div>
                        </form>
                        
                        <p className="text-[10px] text-gray-600 mt-4 relative z-10">
                            No spam. Unsubscribe anytime.
                        </p>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* ================= HOW IT WORKS ================= */}
      <section className="py-24 bg-[#050505] relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-900/30 to-transparent -translate-y-1/2 hidden md:block"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              From Resume to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-blue-400">Offer Letter</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Our AI doesn't just list jobs; it engineers your path to getting hired.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="group relative">
                <div className="relative h-full bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center transition-transform duration-300 group-hover:-translate-y-1">
                    <div className="absolute top-2 right-4 text-6xl font-black text-white/5 select-none">01</div>
                    <div className="w-16 h-16 bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6 text-blue-400"><FileText size={32} /></div>
                    <h3 className="text-xl font-bold text-white mb-3">Upload Resume</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">Drag & drop your PDF. Our engine parses your skills in milliseconds.</p>
                </div>
            </div>
            <div className="group relative mt-8 md:mt-0">
                <div className="relative h-full bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center transition-transform duration-300 group-hover:-translate-y-1">
                    <div className="absolute top-2 right-4 text-6xl font-black text-white/5 select-none">02</div>
                    <div className="w-16 h-16 bg-purple-900/20 rounded-2xl flex items-center justify-center mb-6 text-purple-400"><Activity size={32} /></div>
                    <h3 className="text-xl font-bold text-white mb-3">Truth Score™</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">Get an instant 0-100% compatibility score for every job.</p>
                </div>
            </div>
            <div className="group relative">
                <div className="relative h-full bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center transition-transform duration-300 group-hover:-translate-y-1">
                    <div className="absolute top-2 right-4 text-6xl font-black text-white/5 select-none">03</div>
                    <div className="w-16 h-16 bg-green-900/20 rounded-2xl flex items-center justify-center mb-6 text-green-400"><Code2 size={32} /></div>
                    <h3 className="text-xl font-bold text-white mb-3">Gap Analysis</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">Missing a skill? We highlight keywords the ATS is looking for.</p>
                </div>
            </div>
            <div className="group relative mt-8 md:mt-0">
                <div className="relative h-full bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center transition-transform duration-300 group-hover:-translate-y-1">
                    <div className="absolute top-2 right-4 text-6xl font-black text-white/5 select-none">04</div>
                    <div className="w-16 h-16 bg-orange-900/20 rounded-2xl flex items-center justify-center mb-6 text-orange-400"><ArrowUpRight size={32} /></div>
                    <h3 className="text-xl font-bold text-white mb-3">Direct Connect</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">Skip the middlemen. Apply directly to the recruiter's inbox.</p>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA (Responsive Fixed) ================= */}
      <section className="py-8 px-4 sm:px-6 mb-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-[#111] border border-white/10 rounded-[24px] md:rounded-[32px] overflow-hidden min-h-[350px] md:min-h-[400px] flex flex-col items-center justify-center p-6 sm:p-12 shadow-2xl">
              
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:30px_30px] md:bg-[size:40px_40px] pointer-events-none"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),transparent_70%)] pointer-events-none"></div>

              {/* Floating Elements (Hidden on Mobile) */}
              <div className="absolute top-10 left-10 md:top-1/4 md:left-24 w-10 h-10 md:w-14 md:h-14 bg-[#1a1a1a] border border-white/5 rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl hidden lg:flex animate-float z-10"><span className="text-sm md:text-xl font-bold text-white">G</span></div>
              <div className="absolute bottom-10 right-10 md:bottom-1/4 md:right-48 w-10 h-10 md:w-14 md:h-14 bg-[#1a1a1a] border border-white/5 rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl hidden lg:flex animate-float-delayed z-10"><div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-yellow-500 border-2 md:border-4 border-[#1a1a1a] ring-2 ring-yellow-500/50"></div></div>

              <div className="relative z-20 text-center w-full max-w-2xl px-2">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 md:mb-8 text-white tracking-tight leading-tight">
                    Find your dream <br className="hidden sm:block"/>
                    job in a <span className="text-blue-500 inline-block relative">
                      click
                      <svg className="absolute w-full h-2 -bottom-1 left-0 text-blue-500 opacity-40" viewBox="0 0 100 10" preserveAspectRatio="none">
                        <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="transparent" />
                      </svg>
                    </span>
                  </h2>

                  {/* FUNCTIONAL SEARCH BOX (FORM) */}
                  <form onSubmit={handleSearch} className="relative flex items-center max-w-lg mx-auto w-full group mb-6">
                    <div className="absolute -inset-1 bg-blue-500 rounded-full blur opacity-20 group-hover:opacity-30 transition duration-500 hidden sm:block"></div>
                    
                    <input 
                      type="text" 
                      placeholder="Role, Skill, or Company..." 
                      className="relative w-full h-12 sm:h-14 md:h-16 pl-6 pr-14 sm:pr-20 rounded-full bg-white text-black text-base sm:text-lg font-medium placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-xl transition-all"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    
                    <button 
                      type="submit"
                      className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30 text-white"
                    >
                        <Search className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
                    </button>
                  </form>

                  {/* TRENDING PILLS */}
                  <div className="flex flex-wrap justify-center gap-2 mb-6 md:mb-8 opacity-80">
                    <span className="text-[10px] sm:text-xs text-gray-500 font-semibold uppercase tracking-wider mr-1 mt-1.5 hidden sm:inline-block">Trending:</span>
                    {['Remote', 'Python', 'Product', 'Design'].map((tag) => (
                      <button 
                        key={tag}
                        onClick={() => router.push(`/jobs?q=${encodeURIComponent(tag)}`)}
                        className="px-2.5 py-1 sm:px-3 sm:py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-[10px] sm:text-xs text-gray-300 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex justify-center gap-6 text-xs sm:text-sm text-gray-400">
                    <Link href="/jobs" className="hover:text-blue-400 transition-colors flex items-center gap-2 group">
                       <Briefcase size={14} className="group-hover:text-blue-500 transition-colors" /> View 1,240+ Open Roles
                    </Link>
                  </div>
              </div>
          </div>
        </div>
      </section>

    </div>
  );
}
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, FileText, CheckCircle2, Download, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// Forces Vercel to render this page dynamically per request instead of crashing during static export
export const dynamic = "force-dynamic";

function TailorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");

  const [user, setUser] = useState<any>(null);
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingJob, setFetchingJob] = useState(!!jobId);
  const [tailorResult, setTailorResult] = useState<any>(null);
  
  // 🟢 NEW: State for the dynamic loading text animation
  const [loadingText, setLoadingText] = useState("Initializing Truth Engine™...");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchUser(token);
    if (jobId) fetchJobDetails(jobId);

    // Pull saved Job Description from Check Chances / Job Details page if present
    const savedJd = sessionStorage.getItem("tailor_jd");
    if (savedJd) {
      setJobDesc(savedJd);
      sessionStorage.removeItem("tailor_jd");
    }
  }, [jobId]);

  // 🟢 NEW: Effect to cycle through loading messages to keep user engaged
  useEffect(() => {
    if (!loading) return;
    
    const steps = [
      "Scanning Job Description...",
      "Extracting verified baseline skills...",
      "Bridging ATS vocabulary gaps...",
      "Formatting Overleaf PDF...",
      "Finalizing optimizations..."
    ];
    
    let step = 0;
    setLoadingText(steps[step]);
    
    const interval = setInterval(() => {
      step++;
      if (step < steps.length) {
        setLoadingText(steps[step]);
      }
    }, 2500); // Changes text every 2.5 seconds
    
    return () => clearInterval(interval);
  }, [loading]);

  const fetchUser = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setUser(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchJobDetails = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${id}`);
      if (res.ok) {
        const data = await res.json();
        setJobDesc(data.description);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingJob(false);
    }
  };

  const handleTailorResume = async () => {
    if (!jobDesc || jobDesc.length < 80) {
      toast.error("Please provide a complete Job Description.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}/tailor-resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          job_description: jobDesc,
          job_id: jobId ? parseInt(jobId) : null,
          jd_preview: jobDesc.substring(0, 100)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to tailor resume");
      }

      setTailorResult(data);
      toast.success("Resume tailored successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user || fetchingJob) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-28 md:pt-36 pb-16 selection:bg-blue-500/30 overflow-hidden relative">
      <Toaster position="top-center" />
      
      {/* Premium Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)] pointer-events-none z-0"></div>
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full h-[400px] md:h-[600px] bg-gradient-to-b from-blue-900/10 via-transparent to-transparent blur-3xl pointer-events-none z-0"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center">
        
        {/* Minimal & Bold Header (UseSprout Style) */}
        <div className="text-center mb-10 md:mb-14 w-full">
          <div className="animate-fade-in-up inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300 text-[11px] md:text-[13px] font-medium mb-8 backdrop-blur-md">
            <Sparkles size={14} className="text-blue-400" /> Truth Engine™ PDF Generator
          </div>
          
          <h1 className="animate-fade-in-up delay-100 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            <span className="text-gray-400 font-medium block md:inline">Tailor your resume.</span><br className="hidden md:block"/>
            <span className="text-white font-bold block md:inline mt-2 md:mt-0">
              Beat the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-500">ATS algorithms.</span>
            </span>
          </h1>
          
          <p className="animate-fade-in-up delay-200 text-base md:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed px-2">
            Paste a target job description below. Our AI bridges your vocabulary gap and outputs a professional, single-column Overleaf-standard PDF in seconds.
          </p>
        </div>

        {tailorResult ? (
          /* --- SUCCESS STATE --- */
          <div className="w-full bg-gradient-to-b from-[#111] to-[#0a0a0a] border border-green-500/20 rounded-[24px] p-8 md:p-12 animate-in zoom-in-95 duration-500 shadow-[0_0_50px_-10px_rgba(34,197,94,0.15)] relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-green-500/10 blur-[80px] rounded-full pointer-events-none"></div>
            
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Resume Tailored Successfully</h2>
              <p className="text-gray-400 text-sm md:text-base max-w-lg mb-8">Your experience has been professionally reframed to perfectly match the target job description.</p>
              
              <div className="flex items-center gap-6 md:gap-12 mb-10 bg-[#050505]/50 border border-white/5 rounded-2xl p-6 md:p-8">
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-2">Old Score</p>
                  <p className="text-4xl md:text-5xl font-bold text-gray-500">{tailorResult.score_before}%</p>
                </div>
                <ArrowRight className="w-8 h-8 md:w-10 md:h-10 text-gray-600" />
                <div className="text-center">
                  <p className="text-xs text-green-500 uppercase font-bold tracking-widest mb-2 flex items-center justify-center gap-1"><Sparkles size={12} /> New Score</p>
                  <p className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]">{tailorResult.score_after}%</p>
                </div>
              </div>

              <div className="w-full bg-[#050505] rounded-xl p-5 md:p-6 text-left border border-white/5 mb-10">
                <p className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <CheckCircle2 size={16} className="text-blue-500"/> Bridged Keywords
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {tailorResult.matched_skills.map((skill: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* 🟢 Premium Liquid Glass Download Button */}
              <a 
                href={tailorResult.pdf_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-[280px] sm:w-auto px-10 py-4 rounded-full bg-gradient-to-b from-green-500/20 to-transparent backdrop-blur-xl border border-green-500/30 text-white text-base font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(34,197,94,0.2)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] hover:bg-green-500/20 hover:border-green-400/50 hover:shadow-[0_8px_40px_rgba(34,197,94,0.4)] hover:-translate-y-0.5"
              >
                <Download size={20} /> Download Optimized PDF
              </a>
              
              <p className="text-[11px] text-gray-500 mt-5 font-medium uppercase tracking-wider">
                Generations used today: <span className="text-white">{tailorResult.used_today} / {tailorResult.daily_limit}</span>
              </p>
            </div>
          </div>
        ) : (
          /* --- INPUT / LOADING STATE --- */
          <div className="w-full max-w-3xl bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-[24px] p-6 sm:p-8 animate-fade-in-up delay-300 shadow-2xl relative">
            
            {/* 🟢 NEW: Dynamic Micro-Interaction Loading Screen */}
            {loading ? (
               <div className="flex flex-col items-center justify-center py-16 md:py-24 px-4 text-center relative overflow-hidden w-full">
                 {/* Shimmer overlay */}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent skew-x-12 animate-shimmer"></div>
                 
                 <div className="relative w-20 h-20 mb-8">
                   <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <Sparkles className="w-8 h-8 text-blue-400 animate-pulse" />
                   </div>
                 </div>
                 
                 <h3 className="text-xl md:text-2xl font-bold text-white mb-3 tracking-tight transition-all duration-300 relative z-10">
                   {loadingText}
                 </h3>
                 <p className="text-gray-500 text-[13px] md:text-sm max-w-xs relative z-10">
                   Applying strict anti-hallucination guardrails...
                 </p>
               </div>
            ) : (
              <>
                <label className="block text-sm font-bold text-gray-300 mb-3 ml-1">Target Job Description</label>
                <textarea
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="w-full h-64 md:h-72 bg-[#050505] border border-white/10 rounded-2xl p-5 text-sm md:text-base text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none mb-8 shadow-inner"
                />

                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-start gap-3 text-[11px] md:text-xs text-gray-400 max-w-[280px] md:max-w-sm ml-1">
                    <AlertTriangle size={18} className="text-yellow-500 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">We use strict anti-hallucination guardrails. Our AI will only professionally reframe skills that already exist in your baseline resume.</p>
                  </div>

                  {/* 🟢 Premium Liquid Glass Submit Button */}
                  <button
                    onClick={handleTailorResume}
                    disabled={!user.resume_text}
                    className="w-full md:w-auto px-8 py-4 rounded-full bg-gradient-to-b from-blue-500/20 to-transparent backdrop-blur-xl border border-blue-500/30 text-white text-base font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(59,130,246,0.2)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] hover:bg-blue-500/20 hover:border-blue-400/50 hover:shadow-[0_8px_40px_rgba(59,130,246,0.4)] hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <FileText className="w-5 h-5" /> Tailor My Resume
                  </button>
                </div>
                
                {!user.resume_text && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] md:w-auto bg-red-500/10 backdrop-blur-md border border-red-500/30 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-2xl z-20">
                    <AlertTriangle className="w-8 h-8 text-red-400 mb-2" />
                    <p className="text-red-300 text-sm font-bold mb-3">Resume Required</p>
                    <p className="text-xs text-red-200/80 mb-4 max-w-xs">You must upload a baseline PDF resume to your profile before you can tailor it for specific jobs.</p>
                    <button onClick={() => router.push('/profile')} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors">
                      Go to Profile
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TailorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>}>
      <TailorContent />
    </Suspense>
  );
}
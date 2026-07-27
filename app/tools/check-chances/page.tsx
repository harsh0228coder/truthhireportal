'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  UploadCloud, Search, AlertCircle, CheckCircle2, 
  ArrowLeft, Loader2, FileText, X, Sparkles, Link as LinkIcon, Type,
  Zap, Brain, Target, AlertTriangle, RefreshCw, ArrowRight, Lock, ChevronRight, BarChart3, ShieldCheck
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Premium Score Gauge Component
const ScoreGauge = ({ score }: { score: number }) => {
    let color = "text-red-500";
    if (score >= 50) { color = "text-yellow-500"; }
    if (score >= 75) { color = "text-green-500"; }

    return (
        <div className="relative flex items-center justify-center">
            {/* Outer Glow Ring */}
            <div className={`absolute inset-0 rounded-full blur-xl opacity-20 bg-current ${color}`}></div>
            
            <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center bg-[#111] rounded-full border border-white/10 shadow-2xl">
                <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                    <circle
                        className="text-gray-800 stroke-current"
                        strokeWidth="8"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                    ></circle>
                    <circle
                        className={`${color} progress-ring__circle stroke-current transition-all duration-1000 ease-out`}
                        strokeWidth="8"
                        strokeLinecap="round"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        strokeDasharray="251.2"
                        strokeDashoffset={`calc(251.2 - (251.2 * ${score}) / 100)`}
                    ></circle>
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-3xl md:text-4xl font-bold text-white tracking-tighter">{score}%</span>
                    <span className="text-[8px] md:text-[10px] text-gray-500 uppercase font-bold tracking-widest">Match</span>
                </div>
            </div>
        </div>
    );
};

export default function CheckMyChances() {
  const router = useRouter(); 
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsSignedIn(!!token);
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1] || ''));
        const id = payload?.user_id ?? payload?.sub ?? payload?.id;
        if (id) setUserId(Number(id));
      } catch { /* ignore malformed token */ }
    }
  }, []);
  
  // UI States
  const [hasStarted, setHasStarted] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'job'>('upload');

  // Input States
  const [inputType, setInputType] = useState<'text' | 'url'>('text');
  const [jobDesc, setJobDesc] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState("");
  
  // Process States
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [fetchingUrl, setFetchingUrl] = useState(false);

  // --- API HANDLERS ---

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    if (file.size > 2 * 1024 * 1024) return toast.error("File size must be under 2MB");

    setParsing(true);
    setFileName(file.name);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/parse-resume`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      setResumeText(data.text);
      toast.success("Resume parsed successfully");
      setActiveTab('job');
    } catch (err) {
      toast.error("Failed to parse resume");
      setFileName("");
    } finally {
      setParsing(false);
    }
  };

  const handleFetchJob = async () => {
    if (!jobUrl) return toast.error("Please enter a valid URL");
    setFetchingUrl(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fetch-job-content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setJobDesc(data.content);
        setInputType('text');
        toast.success("Job description extracted!");
      } else {
        toast.error("Could not auto-fetch. Please paste description manually.");
        setInputType('text'); 
      }
    } catch (err) {
      toast.error("Network Error. Please paste description manually.");
      setInputType('text');
    } finally {
      setFetchingUrl(false);
    }
  };

  const handleAnalyze = async () => {
    if (!jobDesc || !resumeText) return toast.error("Missing Resume or Job Description");
    
    if (!isSignedIn) {
        setShowLoginModal(true);
        return;
    }

    setLoading(true);
    setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analyze-gap`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ resume_text: resumeText, job_description: jobDesc })
      });
      const data = await res.json();
      
      setTimeout(() => {
          setResult(data);
          setLoading(false);
      }, 2000);
      
    } catch (err) {
      toast.error("Analysis failed. Try again.");
      setLoading(false);
    }
  };

  const clearResume = () => {
    setResumeText("");
    setFileName("");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-hidden relative">
      <Toaster position="top-center" />
      
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      {/* Premium Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)] pointer-events-none z-0"></div>
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full h-[400px] md:h-[600px] bg-gradient-to-b from-blue-900/10 via-transparent to-transparent blur-3xl pointer-events-none z-0"></div>

      {/* --- MARKETING LANDING SECTION (Multi-Section Layout) --- */}
      {!hasStarted && (
        <div className="relative z-10">
            {/* SECTION 1: HERO */}
            <div className="pt-24 md:pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
                <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-default mb-8 backdrop-blur-md">
                    <Sparkles size={14} className="text-blue-400" />
                    <span className="text-[11px] md:text-[13px] font-medium text-gray-300">Profile Analysis Engine</span>
                </div>
                
                <h1 className="animate-fade-in-up delay-100 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto">
                    <span className="text-gray-400 font-medium block md:inline">See how you stack up</span><br className="hidden md:block"/>
                    <span className="text-white font-bold block md:inline mt-2 md:mt-0">
                        before you <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-500">apply.</span>
                    </span>
                </h1>
                
                <p className="animate-fade-in-up delay-200 text-base md:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10 md:mb-12 px-2">
                    Stop guessing what recruiters want. Our AI parses your resume against any job description to predict your ATS match score and highlight critical missing skills instantly.
                </p>

                <div className="animate-fade-in-up delay-300 w-full sm:w-auto px-4">
                    <button 
                        onClick={() => setHasStarted(true)}
                        className="w-full sm:w-auto px-10 py-4 rounded-full bg-gradient-to-b from-blue-500/20 to-transparent backdrop-blur-xl border border-blue-500/30 text-white text-base font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(59,130,246,0.2)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] hover:bg-blue-500/20 hover:border-blue-400/50 hover:shadow-[0_8px_40px_rgba(59,130,246,0.4)] hover:-translate-y-0.5 group"
                    >
                        Analyze My Resume <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* SECTION 2: FEATURES GRID */}
            <div className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-fade-in-up delay-300 border-t border-white/5 bg-[#050505]/50">
                <div className="text-center mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Actionable feedback, zero fluff.</h2>
                    <p className="text-sm md:text-base text-gray-500 max-w-2xl mx-auto">Everything you need to tailor your application and bypass the automated rejection pile.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {/* Feature 1 */}
                    <div className="bg-[#111] border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-colors shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px] group-hover:bg-blue-500/20 transition-colors"></div>
                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20">
                            <BarChart3 size={20} className="text-blue-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-3">ATS Match Score</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Get a strict 0-100% compatibility score based on exactly how modern Applicant Tracking Systems weigh your experience against the JD requirements.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-[#111] border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-colors shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[50px] group-hover:bg-purple-500/20 transition-colors"></div>
                        <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/20">
                            <ShieldCheck size={20} className="text-purple-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-3">Missing Skills Gap</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Instantly identify the exact keywords, tools, and methodologies you are missing. Know what the recruiter is looking for before they even ask.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-[#111] border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-colors shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-[50px] group-hover:bg-green-500/20 transition-colors"></div>
                        <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 border border-green-500/20">
                            <Brain size={20} className="text-green-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-3">Harsh AI Feedback</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Receive constructive, direct feedback from our AI coach on how to reframe your existing experience to better align with the seniority of the role.
                        </p>
                    </div>
                </div>
            </div>

            {/* SECTION 3: BOTTOM CTA */}
            <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto mb-12">
                <div className="bg-gradient-to-br from-blue-950/40 via-[#111] to-[#0a0a0a] border border-blue-500/20 rounded-[32px] p-8 md:p-12 text-center relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                    <div className="relative z-10">
                        <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">Ready to test your resume?</h2>
                        <p className="text-sm md:text-base text-gray-400 mb-8 max-w-xl mx-auto">Upload your PDF and paste a job description. It takes exactly 10 seconds.</p>
                        <button 
                            onClick={() => setHasStarted(true)}
                            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95"
                        >
                            Start Analysis
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- MAIN INTERFACE (Active Tool) --- */}
      {hasStarted && (
        <div className="relative pt-24 md:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 animate-in slide-in-from-right-8 duration-500">
            
            {/* Minimal Tool Header */}
            <div className="flex items-center gap-3 md:gap-4 mb-8 md:mb-12">
                <button onClick={() => setHasStarted(false)} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors bg-[#111] border border-white/10">
                    <ArrowLeft size={16} />
                </button>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold flex items-center gap-3">
                      Gap Analysis Engine
                  </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
            
            {/* LEFT COLUMN: INPUT PANELS */}
            <div className="lg:col-span-5 space-y-6">
                
                {/* STEP 1: RESUME CARD */}
                <div className={`p-6 md:p-8 rounded-[24px] border transition-all duration-300 relative overflow-hidden ${activeTab === 'upload' ? 'bg-[#111]/80 backdrop-blur-xl border-blue-500/30 shadow-[0_8px_32px_rgba(59,130,246,0.1)]' : 'bg-[#0a0a0a] border-white/5 opacity-70 hover:opacity-100 cursor-pointer'}`}>
                    {activeTab === 'upload' && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>}
                    
                    <div className="flex justify-between items-center mb-6" onClick={() => setActiveTab('upload')}>
                        <h2 className="text-lg font-bold flex items-center gap-3 text-white">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-inner ${activeTab === 'upload' || resumeText ? 'bg-blue-600 text-white' : 'bg-[#1a1a1a] text-gray-500 border border-white/10'}`}>1</div>
                            Baseline Resume
                        </h2>
                        {resumeText && <CheckCircle2 className="text-green-500" size={20} />}
                    </div>

                    {(activeTab === 'upload' || !resumeText) && (
                        <div className="animate-in fade-in duration-300">
                            {!fileName ? (
                                <div className="relative group">
                                    <input type="file" onChange={handleFileUpload} className="hidden" id="resume-upload" accept=".pdf" />
                                    <label htmlFor="resume-upload" className="flex flex-col items-center justify-center w-full h-36 border border-dashed border-white/20 rounded-2xl cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all bg-[#050505] text-center px-4">
                                        {parsing ? (
                                            <div className="flex flex-col items-center gap-3 text-blue-400">
                                              <Loader2 className="animate-spin" size={24} />
                                              <span className="text-sm font-medium">Extracting Text...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 bg-[#1a1a1a] border border-white/5 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all text-gray-400">
                                                    <UploadCloud size={20} />
                                                </div>
                                                <span className="text-sm text-gray-300 font-bold mb-1">Click to Upload PDF</span>
                                                <span className="text-[11px] text-gray-500">Max 2MB (Secure Local Parsing)</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between bg-[#050505] p-4 rounded-2xl border border-white/10">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 shrink-0"><FileText size={20} /></div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-white text-sm truncate">{fileName}</p>
                                            <p className="text-[11px] text-gray-500 mt-0.5">{resumeText.length} characters extracted</p>
                                        </div>
                                    </div>
                                    <button onClick={clearResume} className="p-2 hover:bg-[#1a1a1a] rounded-lg text-gray-400 hover:text-white transition shrink-0"><X size={18}/></button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* STEP 2: JOB CARD */}
                <div className={`p-6 md:p-8 rounded-[24px] border transition-all duration-300 relative overflow-hidden ${activeTab === 'job' ? 'bg-[#111]/80 backdrop-blur-xl border-purple-500/30 shadow-[0_8px_32px_rgba(168,85,247,0.1)]' : 'bg-[#0a0a0a] border-white/5 opacity-70 hover:opacity-100 cursor-pointer'}`}>
                    {activeTab === 'job' && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>}
                    
                    <div className="flex justify-between items-center mb-6" onClick={() => setActiveTab('job')}>
                        <h2 className="text-lg font-bold flex items-center gap-3 text-white">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-inner ${activeTab === 'job' || jobDesc ? 'bg-purple-600 text-white' : 'bg-[#1a1a1a] text-gray-500 border border-white/10'}`}>2</div>
                            Target Job
                        </h2>
                        {jobDesc && <CheckCircle2 className="text-green-500" size={20} />}
                    </div>

                    {(activeTab === 'job' || !jobDesc) && (
                        <div className="animate-in fade-in duration-300">
                            {/* Toggle Switch */}
                            <div className="flex bg-[#050505] p-1.5 rounded-xl border border-white/10 w-full mb-4">
                                <button onClick={() => setInputType('text')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${inputType === 'text' ? 'bg-[#1a1a1a] text-white shadow-md border border-white/5' : 'text-gray-500 hover:text-white'}`}>
                                    <Type size={14} /> Paste Text
                                </button>
                                <button onClick={() => setInputType('url')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${inputType === 'url' ? 'bg-[#1a1a1a] text-white shadow-md border border-white/5' : 'text-gray-500 hover:text-white'}`}>
                                    <LinkIcon size={14} /> Fetch URL
                                </button>
                            </div>

                            {inputType === 'text' ? (
                                <div className="relative group">
                                    <textarea 
                                        className="w-full h-48 md:h-56 p-5 bg-[#050505] border border-white/10 rounded-2xl text-sm text-gray-300 placeholder:text-gray-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none resize-none leading-relaxed no-scrollbar shadow-inner"
                                        placeholder="Paste the full job description here..."
                                        value={jobDesc}
                                        onChange={(e) => setJobDesc(e.target.value)}
                                    />
                                    <div className="absolute bottom-4 right-4 text-[10px] text-gray-500 bg-[#111] px-2 py-1 rounded border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                                        {jobDesc.length} chars
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-3">
                                        <input 
                                            type="url" 
                                            placeholder="https://linkedin.com/jobs/..."
                                            className="w-full bg-[#050505] border border-white/10 rounded-xl px-5 py-4 text-sm text-white outline-none focus:border-purple-500 shadow-inner"
                                            value={jobUrl}
                                            onChange={(e) => setJobUrl(e.target.value)}
                                        />
                                        <button 
                                            onClick={handleFetchJob}
                                            disabled={fetchingUrl || !jobUrl}
                                            className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 active:scale-95"
                                        >
                                            {fetchingUrl ? <Loader2 className="animate-spin" size={18} /> : "Fetch Content"}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-gray-500 text-center mt-2">Supports public LinkedIn, Indeed, and Glassdoor URLs.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Liquid Glass Analyze Button */}
                <div className="pt-2">
                  <button 
                      onClick={handleAnalyze}
                      disabled={loading || !jobDesc || !resumeText}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-base rounded-[1rem] flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(59,130,246,0.2)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
                  >
                      {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5 fill-current" />}
                      {loading ? "Analyzing Profile..." : "Calculate My Chances"}
                  </button>
                </div>

            </div>

            {/* RIGHT COLUMN: RESULTS */}
            <div className="lg:col-span-7 mt-8 lg:mt-0" ref={scrollRef}>
                {loading ? (
                    <div className="h-full min-h-[500px] bg-[#111]/50 backdrop-blur-xl border border-white/10 rounded-[24px] flex flex-col items-center justify-center relative overflow-hidden p-8 shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent skew-x-12 animate-shimmer"></div>
                        <div className="relative w-20 h-20 mb-8">
                          <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                          <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Brain className="w-8 h-8 text-blue-400 animate-pulse" />
                          </div>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight relative z-10">Running Truth Engine™</h3>
                        <div className="space-y-3 text-center relative z-10">
                            <p className="text-blue-400 text-sm font-medium animate-pulse">Extracting keywords...</p>
                            <p className="text-gray-500 text-sm">Evaluating experience overlap...</p>
                        </div>
                    </div>
                ) : !result ? (
                    <div className="h-full min-h-[400px] lg:min-h-[500px] bg-[#0a0a0a] border border-white/5 rounded-[24px] flex flex-col items-center justify-center text-center p-8 opacity-70">
                        <div className="w-20 h-20 bg-[#111] rounded-[1.5rem] flex items-center justify-center mb-6 border border-white/5 shadow-inner">
                            <Target size={32} className="text-gray-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-300 mb-2">Ready to Analyze</h3>
                        <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
                            Complete the steps on the left to see your predicted ATS success rate and identify critical missing skills.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        
                        {/* SCORE HEADER CARD */}
                        <div className="bg-[#111] border border-white/10 rounded-[24px] p-8 md:p-10 relative overflow-hidden shadow-2xl">
                            <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                            
                            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 relative z-10">
                                <ScoreGauge score={result.match_score} />
                                <div className="flex-1 text-center md:text-left space-y-4">
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Compatibility Verdict</p>
                                        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                                            {result.match_score >= 80 ? "Excellent Fit 🚀" : result.match_score >= 60 ? "Good Potential 👍" : "Low Match ⚠️"}
                                        </h2>
                                    </div>
                                    <div className="flex flex-wrap justify-center md:justify-start">
                                        <span className={`px-4 py-1.5 rounded-lg text-xs font-bold border shadow-sm ${result.is_eligible ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                            {result.is_eligible ? "Application Recommended" : "Not Recommended"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COACH MESSAGE */}
                        <div className="bg-gradient-to-r from-blue-900/10 to-transparent border-l-4 border-blue-500 rounded-r-2xl p-6 relative bg-[#0a0a0a]">
                            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Sparkles size={14} className="text-blue-500" /> AI Coach Insight
                            </h4>
                            <p className="text-sm md:text-base text-gray-300 leading-relaxed italic">
                                "{result.coach_message}"
                            </p>
                        </div>

                        {/* SKILLS BREAKDOWN GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* MATCHED */}
                            <div className="bg-[#111] border border-white/10 rounded-[20px] p-6 shadow-lg">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-green-500" /> Matched Skills
                                </h3>
                                <div className="flex flex-wrap gap-2.5">
                                    {result.matched_skills.length > 0 ? result.matched_skills.map((skill: string) => (
                                        <span key={skill} className="px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 text-xs rounded-lg font-bold">
                                            {skill}
                                        </span>
                                    )) : <span className="text-sm text-gray-500 italic">No direct matches found.</span>}
                                </div>
                            </div>

                            {/* MISSING */}
                            <div className="bg-[#111] border border-white/10 rounded-[20px] p-6 shadow-lg">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-red-500" /> Critical Gaps
                                </h3>
                                <div className="flex flex-wrap gap-2.5">
                                    {result.missing_skills.length > 0 ? result.missing_skills.map((skill: string) => (
                                        <span key={skill} className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 text-xs rounded-lg font-bold opacity-90">
                                            {skill}
                                        </span>
                                    )) : <span className="text-sm text-green-500 italic font-medium">No major skills missing!</span>}
                                </div>
                            </div>
                        </div>

                        {/* 🟢 PREMIUM ROUTING BUTTON FOR TAILORING */}
                        <div className="bg-[#0a0a0a] border border-blue-500/20 rounded-[20px] p-6 relative overflow-hidden shadow-xl mt-4">
                            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
                            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex-1">
                                    <h4 className="text-lg font-bold text-white mb-2">
                                        Don't just see the gap. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Close it.</span>
                                    </h4>
                                    <p className="text-sm text-gray-400 leading-relaxed max-w-md">
                                        Get an ATS-safe PDF generated specifically for this JD. No fake skills — just perfect keyword reframing.
                                    </p>
                                </div>
                                <div className="md:w-auto shrink-0">
                                    <button 
                                        onClick={() => {
                                            sessionStorage.setItem("tailor_jd", jobDesc);
                                            router.push("/tailor");
                                        }}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95"
                                    >
                                        <Sparkles size={18} /> Tailor Resume Now
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button onClick={() => {setResult(null); setActiveTab('job'); setJobDesc("");}} className="w-full sm:flex-1 py-3 bg-[#222] hover:bg-[#333] text-white border border-white/10 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2">
                                <RefreshCw size={16} /> Analyze Another
                            </button>
                            <Link href="/jobs" className="w-full sm:flex-1 py-3 bg-white text-black hover:bg-gray-200 rounded-xl font-bold text-sm text-center transition flex items-center justify-center gap-2">
                                Find Better Jobs <ArrowRight size={16} />
                            </Link>
                        </div>

                    </div>
                )}
            </div>

            </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#111] border border-white/10 rounded-3xl max-w-md w-full p-8 shadow-2xl relative">
                <button onClick={() => setShowLoginModal(false)} className="absolute top-5 right-5 text-gray-500 hover:text-white"><X size={20} /></button>
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                        <Lock className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Login Required</h3>
                    <p className="text-sm text-gray-400 mb-8 leading-relaxed px-2">
                        To run an AI analysis and save your results, you need to be logged into your TruthHire account.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <button onClick={() => setShowLoginModal(false)} className="w-full sm:flex-1 py-3.5 rounded-xl border border-white/10 text-gray-300 font-bold hover:bg-white/5 transition text-sm">Cancel</button>
                        <Link href="/login" className="w-full sm:flex-1">
                            <button className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-600/20 text-sm">Login Now</button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}
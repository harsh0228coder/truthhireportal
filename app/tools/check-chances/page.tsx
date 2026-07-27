'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  UploadCloud, Search, AlertCircle, CheckCircle2, 
  ArrowLeft, Loader2, FileText, X, Sparkles, Link as LinkIcon, Type,
  Zap, Brain, Target, AlertTriangle, RefreshCw, ArrowRight, Lock, ChevronRight, BarChart3, ShieldCheck, PlayCircle, Key, Lightbulb, UserCheck, ArrowDown, Activity
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Premium Score Gauge Component
const ScoreGauge = ({ score, size = "large" }: { score: number, size?: "small" | "large" }) => {
    let color = "text-red-500";
    if (score >= 50) { color = "text-yellow-500"; }
    if (score >= 75) { color = "text-green-500"; }

    const dims = size === "large" ? "w-32 h-32 md:w-40 md:h-40" : "w-20 h-20 md:w-24 md:h-24";
    const textClass = size === "large" ? "text-3xl md:text-4xl" : "text-xl md:text-2xl";

    return (
        <div className="relative flex items-center justify-center">
            {/* Outer Glow Ring */}
            <div className={`absolute inset-0 rounded-full blur-xl opacity-20 bg-current ${color}`}></div>
            
            <div className={`relative ${dims} flex items-center justify-center bg-[#111] rounded-full border border-white/10 shadow-2xl`}>
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
                    <span className={`${textClass} font-bold text-white tracking-tighter`}>{score}%</span>
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
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden relative">
      <Toaster position="top-center" />
      
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes flow {
            0% { transform: translateY(0); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateY(20px); opacity: 0; }
        }
        .animate-flow { animation: flow 2s infinite; }
      `}</style>
      
      {/* Premium Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)] pointer-events-none z-0"></div>

      {/* ========================================================= */}
      {/* MARKETING LANDING PAGE (!hasStarted)                      */}
      {/* ========================================================= */}
      {!hasStarted && (
        <div className="relative z-10 w-full">
            
            {/* 1. HERO SECTION */}
            <section className="pt-32 pb-16 md:pt-40 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                    
                    {/* Left: Content */}
                    <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                        <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-md">
                            <Sparkles size={14} /> Truth Engine™ Active
                        </div>
                        
                        <h1 className="animate-fade-in-up delay-100 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
                            Know Your Chances <br className="hidden lg:block"/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-500">Before You Apply</span>
                        </h1>
                        
                        <p className="animate-fade-in-up delay-200 text-base md:text-lg text-gray-400 max-w-xl leading-relaxed mb-8">
                            Upload your resume and let AI compare it with the job description. Get your interview chances, ATS score, missing skills, and personalized improvement suggestions in seconds.
                        </p>

                        <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                            <button 
                                onClick={() => setHasStarted(true)}
                                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                            >
                                Analyze My Resume <ChevronRight size={18} />
                            </button>
                            <button 
                                onClick={() => {
                                    document.getElementById('live-preview')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <PlayCircle size={18} /> View Demo
                            </button>
                        </div>
                    </div>

                    {/* Right: Animated AI Card */}
                    <div className="relative animate-in slide-in-from-right-8 duration-700 w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
                        <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none"></div>
                            
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse">
                                    <Brain className="text-white" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">AI Engine Processing</h3>
                                    <p className="text-blue-400 text-xs font-medium">Matching candidate to role...</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                {/* Staggered list items to simulate loading */}
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="text-green-500" size={20} />
                                    <span className="text-gray-300 font-medium text-sm">Parsing Resume Details</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="text-green-500" size={20} />
                                    <span className="text-gray-300 font-medium text-sm">Extracting Required Skills</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="text-green-500" size={20} />
                                    <span className="text-gray-300 font-medium text-sm">Calculating ATS Match Rate</span>
                                </div>
                                <div className="flex items-center gap-3 relative">
                                    <Loader2 className="text-blue-500 animate-spin absolute -left-0.5" size={22} />
                                    <span className="text-white font-bold text-sm ml-8">Predicting Interview Chances...</span>
                                </div>
                            </div>

                            {/* Fake progress bar */}
                            <div className="w-full h-1.5 bg-white/10 rounded-full mt-8 overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full w-3/4 animate-pulse"></div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* 2. HOW IT WORKS */}
            <section className="py-20 border-t border-white/5 bg-[#050505]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">How It Works</h2>
                    <p className="text-gray-400 mb-16">Complete analysis in under 30 seconds.</p>
                    
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 lg:gap-8 relative">
                        
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 z-0"></div>

                        {[
                            { icon: UploadCloud, title: "Upload Resume" },
                            { icon: Brain, title: "AI Analyzes Profile" },
                            { icon: Target, title: "Compares with Job" },
                            { icon: BarChart3, title: "Get Action Plan" }
                        ].map((step, i) => (
                            <React.Fragment key={i}>
                                <div className="relative z-10 flex flex-col items-center bg-[#050505] p-2">
                                    <div className="w-16 h-16 bg-[#111] border border-white/10 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
                                        <step.icon size={24} className="text-blue-400" />
                                    </div>
                                    <h3 className="font-bold text-white text-sm whitespace-nowrap">{step.title}</h3>
                                </div>
                                {/* Mobile Arrow */}
                                {i < 3 && <ArrowDown size={20} className="md:hidden text-white/20 my-2" />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. WHAT YOU'LL GET (Feature Grid) */}
            <section className="py-20 border-t border-white/5 bg-[#0a0a0a]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What You'll Get</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">Everything you need to bypass the automated rejection pile and land your dream interview.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: Target, title: "Interview Chance Score", desc: "A realistic probability of getting called for an interview." },
                            { icon: ShieldCheck, title: "ATS Compatibility Score", desc: "See exactly how parsing algorithms rate your resume format." },
                            { icon: Activity, title: "Skill Gap Analysis", desc: "A side-by-side comparison of your skills vs. the job requirements." },
                            { icon: Key, title: "Missing Keywords", desc: "Discover the critical terms recruiters are searching for." },
                            { icon: Lightbulb, title: "AI Improvement Suggestions", desc: "Actionable advice on how to rewrite specific bullet points." },
                            { icon: UserCheck, title: "Recruiter Match Insights", desc: "Understand how a human recruiter views your seniority level." }
                        ].map((feat, i) => (
                            <div key={i} className="bg-[#111] border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-colors group">
                                <feat.icon size={28} className="text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                                <h3 className="font-bold text-white text-lg mb-2">{feat.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. LIVE ANALYSIS PREVIEW */}
            <section id="live-preview" className="py-24 border-t border-white/5 relative overflow-hidden bg-[#050505]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none"></div>
                
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">See It In Action</h2>
                    <p className="text-gray-400 mb-12">This is what your personalized analysis dashboard looks like.</p>

                    {/* Realistic Mockup Dashboard */}
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-[32px] p-2 shadow-2xl mx-auto max-w-4xl text-left">
                        <div className="bg-[#111] rounded-[24px] border border-white/5 p-6 md:p-10 relative overflow-hidden">
                            {/* Mock Header */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10 pb-8 border-b border-white/5">
                                <div className="flex items-center gap-6 w-full sm:w-auto">
                                    <ScoreGauge score={84} size="small" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Interview Chance</p>
                                        <h3 className="text-2xl font-bold text-white">Excellent Fit 🚀</h3>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="text-center px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                                        <p className="text-xl font-bold text-white">92%</p>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">ATS Score</p>
                                    </div>
                                    <div className="text-center px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                                        <p className="text-xl font-bold text-white">88%</p>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Skill Match</p>
                                    </div>
                                </div>
                            </div>

                            {/* Mock Content */}
                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <AlertTriangle size={16} className="text-red-500" /> Missing Skills
                                    </h4>
                                    <div className="flex gap-2">
                                        <span className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 text-xs rounded-lg font-bold">Docker</span>
                                        <span className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 text-xs rounded-lg font-bold">AWS</span>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Sparkles size={16} className="text-blue-500" /> Top Recommendation
                                    </h4>
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                                        <p className="text-sm text-blue-200">
                                            Add measurable achievements to your latest role (e.g., "Improved load time by X%") to increase your chances by 12%.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. FINAL CTA */}
            <section className="py-24 border-t border-white/5 bg-[#0a0a0a] relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Stop Guessing. Start Applying Smarter.</h2>
                    <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
                        Find out where you stand before you hit Apply and get AI-powered recommendations to improve your chances.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button 
                            onClick={() => setHasStarted(true)}
                            className="w-full sm:w-auto px-10 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95"
                        >
                            Analyze My Resume
                        </button>
                        <button 
                            onClick={() => {
                                setHasStarted(true);
                                setTimeout(() => setActiveTab('upload'), 100);
                            }}
                            className="w-full sm:w-auto px-10 py-4 rounded-xl bg-white text-black hover:bg-gray-200 font-bold transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <UploadCloud size={18} /> Upload Resume
                        </button>
                    </div>
                </div>
            </section>
        </div>
      )}

      {/* ========================================================= */}
      {/* ACTIVE TOOL INTERFACE (hasStarted)                        */}
      {/* ========================================================= */}
      {hasStarted && (
        <div className="relative pt-24 md:pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 animate-in slide-in-from-bottom-12 duration-500">
            
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
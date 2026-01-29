'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  UploadCloud, Search, AlertCircle, CheckCircle2, 
  ArrowLeft, Loader2, FileText, X, Sparkles, Link as LinkIcon, Type,
  Zap, Brain, Target, AlertTriangle, RefreshCw, ArrowRight, Lock, ChevronRight
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
  const [isSignedIn, setIsSignedIn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsSignedIn(!!token);
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
      const res = await fetch("${process.env.NEXT_PUBLIC_API_URL}/parse-resume", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      setResumeText(data.text);
      toast.success("Resume parsed successfully");
      setActiveTab('job'); // Auto-switch to next step
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
      const res = await fetch("${process.env.NEXT_PUBLIC_API_URL}/fetch-job-content", {
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
    // Scroll to visualization area
    setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch("${process.env.NEXT_PUBLIC_API_URL}/analyze-gap", {
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
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-electric/30">
      <Toaster position="top-center" />
      
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .glass-panel {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(12px);
        }
      `}</style>
      
      {/* --- HERO SECTION --- */}
      {!hasStarted && (
        <div className="relative pt-20 pb-12 px-4 md:px-6 border-b border-white/5 bg-grid-pattern overflow-hidden min-h-[80vh] flex flex-col justify-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[400px] bg-electric/10 blur-[80px] md:blur-[100px] rounded-full pointer-events-none"></div>
            
            <div className="max-w-4xl mx-auto text-center relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/20 border border-blue-500/30 text-blue-400 text-[10px] md:text-xs font-bold tracking-widest uppercase mb-6 animate-in fade-in zoom-in duration-500">
                    <Brain size={12} /> Truth Engine™ Analysis
                </div>
                
                <h1 className="text-3xl md:text-6xl font-bold mb-6 tracking-tight animate-in slide-in-from-bottom-4 duration-700">
                    Will you get the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Interview?</span>
                </h1>
                
                <p className="text-base md:text-lg text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed animate-in slide-in-from-bottom-5 duration-700 delay-100 px-4">
                    Stop applying blindly. Our AI simulates the Recruiter's Decision Process to predict your success rate instantly.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 w-full max-w-4xl mx-auto mb-12 animate-in slide-in-from-bottom-6 duration-700 delay-200 px-2">
                    {[
                        { icon: UploadCloud, title: "1. Upload Resume", desc: "We parse your skills & exp." },
                        { icon: Search, title: "2. Add Job Desc", desc: "Paste JD or URL to match." },
                        { icon: Zap, title: "3. Get Score", desc: "See your approval chances." }
                    ].map((step, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 p-5 md:p-6 rounded-2xl text-left hover:bg-white/10 transition group">
                            <step.icon className="text-blue-400 mb-4 group-hover:scale-110 transition-transform" size={24} />
                            <h3 className="font-bold text-white mb-1 text-sm md:text-base">{step.title}</h3>
                            <p className="text-xs md:text-sm text-gray-500">{step.desc}</p>
                        </div>
                    ))}
                </div>

                <button 
                    onClick={() => setHasStarted(true)}
                    className="w-full sm:w-auto inline-flex h-12 md:h-14 px-8 md:px-10 bg-white text-black hover:bg-gray-200 rounded-full font-bold text-base md:text-lg items-center justify-center gap-2 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-blue-500/50 hover:scale-105 animate-in slide-in-from-bottom-8 duration-700 delay-300"
                >
                    Launch Analyzer <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
      )}

      {/* --- MAIN INTERFACE --- */}
      {hasStarted && (
        <div className="animate-in slide-in-from-right-8 duration-500 max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
            
            {/* TOOL HEADER */}
            <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8 pb-4 md:pb-6 border-b border-white/5">
                <button onClick={() => setHasStarted(false)} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition">
                    <ArrowLeft size={18} />
                </button>
                <h1 className="text-lg md:text-2xl font-bold flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                    Truth Engine 
                    <span className="text-[10px] md:text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20 uppercase tracking-wider font-bold w-fit">AI Analysis Active</span>
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            
            {/* LEFT COLUMN: INPUTS */}
            <div className="lg:col-span-6 space-y-4 md:space-y-6">
                
                {/* STEP 1: RESUME */}
                <div className={`p-4 md:p-6 rounded-2xl border transition-all duration-300 ${activeTab === 'upload' ? 'bg-[#111] border-electric/50 shadow-[0_0_30px_rgba(37,99,235,0.1)]' : 'glass-panel border-white/5 opacity-80 hover:opacity-100'}`}>
                    <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setActiveTab('upload')}>
                        <h2 className="text-base md:text-lg font-bold flex items-center gap-3 text-white">
                            <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold ${activeTab === 'upload' || resumeText ? 'bg-electric text-white' : 'bg-white/10 text-gray-500'}`}>1</div>
                            Upload Resume
                        </h2>
                        {resumeText && <CheckCircle2 className="text-green-500" size={18} />}
                    </div>

                    {(activeTab === 'upload' || !resumeText) && (
                        <div className="mt-4 animate-in fade-in duration-300">
                            {!fileName ? (
                                <div className="relative group">
                                    <input type="file" onChange={handleFileUpload} className="hidden" id="resume-upload" accept=".pdf" />
                                    <label htmlFor="resume-upload" className="flex flex-col items-center justify-center w-full h-32 md:h-36 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-electric/50 hover:bg-white/5 transition-all bg-black/20 text-center px-4">
                                        {parsing ? (
                                            <div className="flex items-center gap-2 text-electric text-sm md:text-base"><Loader2 className="animate-spin" /> Extracting Text...</div>
                                        ) : (
                                            <>
                                                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                    <UploadCloud className="text-gray-400 group-hover:text-white" size={20} />
                                                </div>
                                                <span className="text-xs md:text-sm text-gray-300 font-medium">Click to Upload PDF</span>
                                                <span className="text-[10px] md:text-xs text-gray-500 mt-1">Max 2MB (Secure Processing)</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between bg-white/5 p-3 md:p-4 rounded-xl border border-white/10">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 shrink-0"><FileText size={18} /></div>
                                        <div className="text-xs md:text-sm min-w-0">
                                            <p className="font-bold text-white truncate">{fileName}</p>
                                            <p className="text-[10px] text-gray-500">{resumeText.length} chars extracted</p>
                                        </div>
                                    </div>
                                    <button onClick={clearResume} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition shrink-0"><X size={16}/></button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* STEP 2: JOB */}
                <div className={`p-4 md:p-6 rounded-2xl border transition-all duration-300 ${activeTab === 'job' ? 'bg-[#111] border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.1)]' : 'glass-panel border-white/5 opacity-80 hover:opacity-100'}`}>
                    <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setActiveTab('job')}>
                        <h2 className="text-base md:text-lg font-bold flex items-center gap-3 text-white">
                            <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold ${activeTab === 'job' || jobDesc ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-500'}`}>2</div>
                            Target Job
                        </h2>
                        {jobDesc && <CheckCircle2 className="text-green-500" size={18} />}
                    </div>

                    {(activeTab === 'job' || !jobDesc) && (
                        <div className="mt-4 space-y-4 animate-in fade-in duration-300">
                            {/* Toggle Tabs */}
                            <div className="flex bg-black/40 p-1 rounded-lg border border-white/10 w-full md:w-fit">
                                <button onClick={() => setInputType('text')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${inputType === 'text' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}>
                                    <Type size={14} /> Text
                                </button>
                                <button onClick={() => setInputType('url')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${inputType === 'url' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}>
                                    <LinkIcon size={14} /> URL
                                </button>
                            </div>

                            {inputType === 'text' ? (
                                <div className="relative group">
                                    <textarea 
                                        className="w-full h-40 md:h-48 p-4 bg-black/30 border border-white/10 rounded-xl text-xs md:text-sm text-gray-300 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none resize-none leading-relaxed no-scrollbar"
                                        placeholder="Paste the full job description here..."
                                        value={jobDesc}
                                        onChange={(e) => setJobDesc(e.target.value)}
                                    />
                                    <div className="absolute bottom-3 right-3 text-[10px] text-gray-500 bg-[#111] px-2 py-1 rounded border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {jobDesc.length} chars
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex flex-col md:flex-row gap-2">
                                        <input 
                                            type="url" 
                                            placeholder="https://linkedin.com/jobs/..."
                                            className="w-full md:flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
                                            value={jobUrl}
                                            onChange={(e) => setJobUrl(e.target.value)}
                                        />
                                        <button 
                                            onClick={handleFetchJob}
                                            disabled={fetchingUrl || !jobUrl}
                                            className="w-full md:w-auto bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {fetchingUrl ? <Loader2 className="animate-spin" size={18} /> : "Fetch"}
                                        </button>
                                    </div>
                                    <p className="text-[10px] md:text-xs text-gray-500 pl-1">Supports LinkedIn, Indeed, Glassdoor (Public URLs only).</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <button 
                    onClick={handleAnalyze}
                    disabled={loading || !jobDesc || !resumeText}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-base md:text-lg rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Sparkles fill="currentColor" />}
                    Calculate My Chances
                </button>

            </div>

            {/* RIGHT COLUMN: RESULTS */}
            <div className="lg:col-span-6 mt-8 lg:mt-0" ref={scrollRef}>
                {loading ? (
                    <div className="h-full min-h-[400px] bg-[#111] border border-white/10 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden p-6">
                        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <Brain className="w-10 h-10 md:w-12 md:h-12 text-blue-500 animate-bounce" />
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Analyzing Profile...</h3>
                        <div className="space-y-2 text-center">
                            <p className="text-gray-500 text-xs md:text-sm animate-fade-in">Matching Skills...</p>
                            <p className="text-gray-500 text-xs md:text-sm animate-fade-in delay-75">Checking Experience...</p>
                            <p className="text-gray-500 text-xs md:text-sm animate-fade-in delay-150">Predicting Success...</p>
                        </div>
                    </div>
                ) : !result ? (
                    <div className="h-full min-h-[300px] md:min-h-[500px] glass-panel rounded-3xl flex flex-col items-center justify-center text-center p-6 md:p-8">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
                            <Target size={28} className="text-gray-600" />
                        </div>
                        <h3 className="text-lg md:text-xl font-bold text-gray-300 mb-2">Ready to Analyze</h3>
                        <p className="text-gray-500 text-xs md:text-sm max-w-xs mx-auto">
                            Our engine compares 50+ data points between your resume and the job description.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        
                        {/* SCORE HEADER */}
                        <div className="bg-[#111] border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                            
                            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 relative z-10">
                                <ScoreGauge score={result.match_score} />
                                <div className="flex-1 text-center md:text-left space-y-3">
                                    <div>
                                        <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Compatibility Verdict</p>
                                        <h2 className="text-2xl md:text-3xl font-black text-white">
                                            {result.match_score >= 80 ? "Excellent Fit 🚀" : result.match_score >= 60 ? "Good Potential 👍" : "Low Match ⚠️"}
                                        </h2>
                                    </div>
                                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                        <span className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-bold border ${result.is_eligible ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                            {result.is_eligible ? "Application Recommended" : "Not Recommended"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COACH MESSAGE */}
                        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-white/10 rounded-2xl p-5 md:p-6 relative">
                            <div className="absolute -top-3 left-6 bg-blue-600 text-white p-1.5 rounded-lg shadow-lg">
                                <Sparkles size={16} fill="currentColor" />
                            </div>
                            <h4 className="text-sm font-bold text-blue-200 mb-2 mt-2">AI Coach Insight</h4>
                            <p className="text-xs md:text-sm text-gray-300 leading-relaxed italic">
                                "{result.coach_message}"
                            </p>
                        </div>

                        {/* SKILLS BREAKDOWN GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* MATCHED */}
                            <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-green-500" /> Matched Skills
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {result.matched_skills.length > 0 ? result.matched_skills.map((skill: string) => (
                                        <span key={skill} className="px-2 md:px-3 py-1 md:py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] md:text-xs rounded-lg font-bold">
                                            {skill}
                                        </span>
                                    )) : <span className="text-xs text-gray-500 italic">No direct matches found.</span>}
                                </div>
                            </div>

                            {/* MISSING */}
                            <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                                    <AlertTriangle size={14} className="text-red-500" /> Critical Gaps
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {result.missing_skills.length > 0 ? result.missing_skills.map((skill: string) => (
                                        <span key={skill} className="px-2 md:px-3 py-1 md:py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] md:text-xs rounded-lg font-bold opacity-90">
                                            {skill}
                                        </span>
                                    )) : <span className="text-xs text-green-500 italic font-medium">No major skills missing!</span>}
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
            <div className="bg-[#111] border border-white/10 rounded-2xl max-w-md w-full p-6 md:p-8 shadow-2xl relative">
                <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>
                <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                        <Lock className="h-7 w-7 md:h-8 md:w-8 text-blue-500" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Login Required</h3>
                    <p className="text-sm md:text-base text-gray-400 mb-8 leading-relaxed">
                        To run an AI analysis and save your results, you need to be logged into your TruthHire account.
                    </p>
                    <div className="flex gap-4 w-full">
                        <button onClick={() => setShowLoginModal(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 font-bold hover:bg-white/5 transition text-sm">Cancel</button>
                        <Link href="/login" className="flex-1">
                            <button className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-500/20 text-sm">Login Now</button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}
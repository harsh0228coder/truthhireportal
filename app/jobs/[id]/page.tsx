"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchJobs } from "@/lib/api";
import { Job } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  MapPin, Briefcase, Clock, Building2, ArrowLeft, Shield,
  ExternalLink, Bookmark, CheckCircle, Calendar, X, AlertCircle,
  FileText, Zap, Lock, AlertTriangle, Share2, Globe,
  ChevronDown, ChevronUp, Check, Target, ArrowRight, DollarSign, Loader2,
  Briefcase as BriefcaseIcon, Sparkles, Brain, ArrowUpRight, Laptop, Activity,
  ThumbsUp, ThumbsDown, Send, CheckSquare
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// --- COMPONENTS ---

// 1. GAP ANALYSIS SECTION (Fixed Rating Logic)
const GapAnalysisSection = ({ analyzing, result, onAnalyze, jobId }: any) => {
  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const [showFeedbackTags, setShowFeedbackTags] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false); // 🔒 Tracks if user already voted

  // Check if feedback was already submitted for this job on mount
  useEffect(() => {
    const feedbackKey = `feedback_submitted_${jobId}`;
    const submitted = localStorage.getItem(feedbackKey);
    if (submitted === 'true') {
      setHasSubmitted(true);
      const savedRating = localStorage.getItem(`feedback_rating_${jobId}`) as 'up' | 'down' | null;
      if (savedRating) setRating(savedRating);
    }
  }, [jobId]);

  // Options for feedback
  const feedbackOptions = ["Inaccurate", "Missed Skills", "Hallucinated", "Too Generic"];

  // Handle Main Rating Click
  const handleRate = async (vote: 'up' | 'down') => {
    if (hasSubmitted) return; // 🔒 Stop if already submitted
    if (rating === vote) return;
    
    setRating(vote);
    
    if (vote === 'up') {
        setShowFeedbackTags(false);
        await submitFeedback('up', []); // Auto-submit thumbs up
    } else {
        setShowFeedbackTags(true); // Open dropdown for thumbs down
    }
  };

  // Handle Tag Toggling
  const toggleTag = (e: React.MouseEvent, tag: string) => {
      e.stopPropagation();
      const newTags = selectedTags.includes(tag) 
        ? selectedTags.filter(t => t !== tag)
        : [...selectedTags, tag];
      setSelectedTags(newTags);
  };

  // Handle Cancel/Close Popup (The Fix)
  const handleCancelFeedback = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowFeedbackTags(false);
      setRating(null); // Reset rating so it doesn't stay red
      setSelectedTags([]);
  };

  // Submit Down Vote
  const handleSubmitDownVote = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (selectedTags.length === 0) {
          toast.error("Please select at least one reason");
          return;
      }
      await submitFeedback('down', selectedTags);
      setShowFeedbackTags(false);
  };

  // API Logic
  const submitFeedback = async (vote: 'up' | 'down', tags: string[]) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsSubmitting(true);
    try {
        await fetch('${process.env.NEXT_PUBLIC_API_URL}/feedback/ai-analysis', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                job_id: jobId,
                resume_text: "snapshot", 
                job_desc: "snapshot",
                ai_response: result,
                rating: vote,
                tags: tags
            })
        });
        toast.success("Thanks for your feedback!");
        setHasSubmitted(true); // 🔒 Lock the buttons
        
        // Persist feedback submission to localStorage
        const feedbackKey = `feedback_submitted_${jobId}`;
        const ratingKey = `feedback_rating_${jobId}`;
        localStorage.setItem(feedbackKey, 'true');
        localStorage.setItem(ratingKey, vote);
    } catch (e) { 
        console.error("Feedback error", e); 
        toast.error("Failed to submit feedback");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (analyzing) {
    return (
      <div className="bg-[#111] border border-white/10 rounded-2xl p-8 mb-8 flex flex-col items-center justify-center text-center min-h-[250px] animate-pulse relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-shimmer"></div>
        <Loader2 className="w-10 h-10 text-electric animate-spin mb-4 relative z-10" />
        <h3 className="text-white font-bold text-lg mb-1 relative z-10">Running Truth Engine™...</h3>
        <p className="text-gray-400 text-sm relative z-10">Analyzing resume context against job requirements.</p>
      </div>
    );
  }

  if (result?.error === 'no_resume') {
    return (
      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 mb-8 flex items-center gap-6">
        <AlertCircle className="w-8 h-8 text-yellow-500 flex-shrink-0" />
        <div>
            <h4 className="text-white font-bold text-lg">Resume Required</h4>
            <p className="text-sm text-gray-400">Upload your resume to unlock AI insights.</p>
        </div>
        <Link href="/profile" className="ml-auto bg-white text-black px-6 py-2 rounded-lg font-bold text-sm">Upload</Link>
      </div>
    );
  }

  if (result) {
    const isGoodMatch = result.match_score >= 60;
    
    return (
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden mb-8 shadow-2xl relative group">
        
        {/* HEADER */}
        <div className="bg-white/5 border-b border-white/5 p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${isGoodMatch ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                    <Brain size={28} />
                </div>
                <div>
                    <h3 className="text-white font-bold text-lg">Match Analysis</h3>
                    <div className="flex items-center gap-2 text-sm">
                        <span className={isGoodMatch ? "text-green-400 font-bold" : "text-orange-400 font-bold"}>
                            {result.match_score}% Match
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">Truth Engine™ Verified</span>
                    </div>
                </div>
            </div>
            
            {/* RATING FEATURE (Fixed & Responsive) */}
            <div className="relative">
                <div className={`flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5 transition-opacity duration-300 ${hasSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {hasSubmitted ? (
                        <div className="flex items-center gap-2 px-2">
                             <CheckSquare size={18} className="text-green-500" />
                             <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Feedback Sent</span>
                        </div>
                    ) : (
                        <>
                            <button 
                                onClick={() => handleRate('up')}
                                disabled={hasSubmitted}
                                className={`p-2 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95 ${rating === 'up' ? 'text-green-400 bg-green-500/20 ring-1 ring-green-500/50' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                                title="Accurate Analysis"
                            >
                                <ThumbsUp size={22} className={rating === 'up' ? "fill-green-400" : ""} />
                            </button>
                            
                            <div className="w-px h-6 bg-white/10 mx-1"></div>
                            
                            <button 
                                onClick={() => handleRate('down')}
                                disabled={hasSubmitted}
                                className={`p-2 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95 ${rating === 'down' ? 'text-red-400 bg-red-500/20 ring-1 ring-red-500/50' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                                title="Report Issue"
                            >
                                <ThumbsDown size={22} className={rating === 'down' ? "fill-red-400" : ""} />
                            </button>
                        </>
                    )}
                </div>

                {/* FEEDBACK POPUP (Responsive & Proper Closing) */}
                {showFeedbackTags && !hasSubmitted && (
                    <div className="absolute top-full right-0 mt-3 w-64 max-w-[90vw] bg-[#151515] border border-white/10 rounded-xl p-5 shadow-2xl z-50 animate-in slide-in-from-top-2 ring-1 ring-white/5">
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-xs text-gray-300 font-bold uppercase tracking-wide">What's wrong?</p>
                            <button onClick={handleCancelFeedback} className="text-gray-500 hover:text-white transition-colors p-1"><X size={16} /></button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-5">
                            {feedbackOptions.map(tag => (
                                <button
                                    key={tag}
                                    onClick={(e) => toggleTag(e, tag)}
                                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 ${selectedTags.includes(tag) ? 'bg-red-500/20 border-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'}`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={handleSubmitDownVote}
                            disabled={isSubmitting}
                            className="w-full bg-white text-black text-xs font-bold py-3 rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg"
                        >
                            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <><Send size={14} /> Submit Feedback</>}
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-6">
            <div className="relative bg-gradient-to-r from-blue-500/10 to-transparent border-l-4 border-blue-500 pl-4 py-3 rounded-r-lg">
                <p className="text-gray-200 text-sm italic leading-relaxed">"{result.coach_message}"</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* STRENGTHS */}
                <div>
                    <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <CheckCircle size={14}/> Your Strengths
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {result.matched_skills?.map((s: string) => (
                            <span key={s} className="px-3 py-1.5 bg-green-500/5 text-green-300 border border-green-500/10 text-xs font-medium rounded-md">
                                {s}
                            </span>
                        ))}
                    </div>
                </div>

                {/* MISSING SKILLS */}
                {result.missing_skills?.length > 0 && (
                    <div>
                        <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <AlertTriangle size={14}/> Critical Gaps
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {result.missing_skills?.map((s: string) => (
                                <span key={s} className="px-3 py-1.5 bg-red-500/10 text-red-300 border border-red-500/20 text-xs font-medium rounded-md flex items-center gap-1.5">
                                    <X size={10} /> {s}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    );
  }

  // DEFAULT STATE
  return (
    <div className="bg-gradient-to-r from-[#111] to-[#0d0d0d] border border-white/10 rounded-2xl p-1 mb-8 shadow-2xl relative overflow-hidden group">
      <div className="bg-[#111] rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
         <div className="flex-1 text-center md:text-left">
             <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-electric" />
                <h3 className="text-xl font-bold text-white">Unlock Application Intelligence</h3>
             </div>
             <p className="text-sm text-gray-400 leading-relaxed max-w-xl">
                Our AI engine will analyze your resume against this specific job description to predict your success rate.
             </p>
         </div>
         <button 
            onClick={onAnalyze} 
            className="flex-shrink-0 bg-electric hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transform hover:scale-105"
         >
            <Target size={18} /> Check My Chances
         </button>
      </div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-electric/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-electric/20 transition-all duration-700"></div>
    </div>
  );
};

const CompanyCard = ({ job }: { job: any }) => {
  const isRecruiterPost = job.recruiter_name && job.recruiter_name !== "TruthHire Team" && job.recruiter_name !== "Hiring Manager";
  const posterName = isRecruiterPost ? job.recruiter_name : "Hiring Team";
  const posterLabel = isRecruiterPost ? "Recruiter" : "Posted by";

  return (
    <div className="bg-[#111] border border-white/10 rounded-xl p-5 mb-6 shadow-sm hover:border-white/20 transition-all group">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-xl font-bold text-white border border-white/10 flex-shrink-0 shadow-lg">
           {job.company_name ? job.company_name.charAt(0) : 'C'}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-bold text-white truncate">{job.company_name}</h3>
                {job.is_verified && (
                    <CheckCircle size={16} className="text-blue-500 flex-shrink-0" fill="currentColor" fillOpacity={0.2} />
                )}
            </div>
            {job.company_website ? (
              <a href={job.company_website.startsWith('http') ? job.company_website : `https://${job.company_website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 transition-colors">
                Visit Website <ExternalLink size={10}/>
              </a>
            ) : (
                <p className="text-xs text-gray-500">Official Profile</p>
            )}
        </div>
      </div>
      <div className="h-px bg-white/5 w-full my-4"></div>
      <div className="flex items-center gap-3">
         <div className={`w-8 h-8 rounded-full flex items-center justify-center border border-white/10 ${isRecruiterPost ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-400'}`}>
            {isRecruiterPost ? <span className="text-xs font-bold">{posterName[0]}</span> : <BriefcaseIcon size={14} />}
         </div>
         <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider leading-none mb-0.5">{posterLabel}</p>
            <p className="text-xs text-white font-medium leading-none">{posterName}</p>
         </div>
      </div>
    </div>
  );
};

export default function JobDetailPage() {
  const params = useParams(); // Using hook as standard for client components
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [similarJobs, setSimilarJobs] = useState<Job[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [userResume, setUserResume] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  
  // --- NEW: Low Score Warning State ---
  const [showLowScoreWarning, setShowLowScoreWarning] = useState(false);
  
  const [coverNote, setCoverNote] = useState('');
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const latestAnalysisRef = useRef<number>(0);
  const hasViewedRef = useRef(false);

  useEffect(() => {
    const authToken = localStorage.getItem('token');
    setIsSignedIn(!!authToken);
    setToken(authToken);
  }, []);

  // --- ⚡ OPTIMIZED PARALLEL FETCHING ---
  useEffect(() => {
    if (!params?.id) return;

    const loadData = async () => {
        try {
            // Start both requests concurrently
            const jobPromise = fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${params.id}`).then(res => res.ok ? res.json() : null);
            const allJobsPromise = fetchJobs(); // Assuming this is fast enough, otherwise create a dedicated /jobs/similar endpoint

            const [jobData, allJobs] = await Promise.all([jobPromise, allJobsPromise]);

            if (jobData) {
                setJob(jobData);
                
                // 🟢 NEW: Update Browser Title Dynamically
                document.title = `${jobData.title} at ${jobData.company_name} - TruthHire`; 

                // Track view only once per session
                if (!hasViewedRef.current) {
                    hasViewedRef.current = true;
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${params.id}/view`, { method: 'POST' }).catch(() => {});
                }
                
                // Track view only once per session
                if (!hasViewedRef.current) {
                    hasViewedRef.current = true;
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${params.id}/view`, { method: 'POST' }).catch(() => {});
                }

                // Process similar jobs in memory (since we have allJobs)
                // Ideally, this should be a backend endpoint: /jobs/{id}/similar
                if (allJobs) {
                    const related = allJobs.filter((j: Job) => 
                        String(j.id) !== params.id && (
                            j.employment_type === jobData.employment_type || 
                            j.title.toLowerCase().includes(jobData.title.split(' ')[0].toLowerCase())
                        )
                    ).slice(0, 3);
                    setSimilarJobs(related);
                }
            }
        } catch (error) {
            console.error("Failed to load job data", error);
        } finally {
            setLoading(false);
        }
    };

    loadData();

    // 2. FETCH USER CONTEXT (Independent)
    if (isSignedIn && token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.resume_filename) setUserResume(data.resume_filename);
        });
      
      const jobId = String(params.id);
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${jobId}/check-applied`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data?.has_applied) setHasApplied(true); });
      
      const savedResult = localStorage.getItem(`job_analysis_${params.id}`);
      if (savedResult) setResult(JSON.parse(savedResult));
    }
  }, [params?.id, isSignedIn, token]);

  // --- MODIFIED: Handle Apply Click (Gatekeeper Logic) ---
  const handleHeroApply = async () => {
    if (!isSignedIn || !token) { setShowLoginPrompt(true); return; }
    if (hasApplied) return;

    // Case 1: Result exists
    if (result) {
        if (result.match_score < 60) {
            setShowLowScoreWarning(true); // ⚠️ Low Score Warning
        } else {
            setShowApplyModal(true); // ✅ Good Score -> Easy Apply
        }
    } 
    // Case 2: No result yet -> Run Analysis then check
    else {
        await handleCheckChances(true); // true = auto-open modal after analysis
    }
  };

  // --- LOGIC: Run AI Analysis ---
  const handleCheckChances = async (autoOpenApply = false) => {
    if (!isSignedIn || !token) { setShowLoginPrompt(true); return; }
    if (analyzing) return;
    
    setAnalyzing(true);
    // Scroll to analysis section to show loading
    document.getElementById('analysis-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    setResult(null);
    const myId = ++latestAnalysisRef.current;

    try {
      const parseRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!parseRes.ok) { if (myId === latestAnalysisRef.current) setResult({ error: 'no_resume' }); return; }
      const userData = await parseRes.json();
      const text = userData.resume_text; 
      
      if (!text || text.trim() === '') { 
          if (myId === latestAnalysisRef.current) setResult({ error: 'no_resume' }); 
          return; 
      }
      
      const analyzeRes = await fetch('${process.env.NEXT_PUBLIC_API_URL}/analyze-gap', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
            resume_text: text, 
            job_description: job?.description || '',
            job_id: String(job?.id), 
            user_id: String(userData.id)
        })
      });

      if (!analyzeRes.ok) throw new Error('Analysis failed');
      const analysis = await analyzeRes.json();
      
      if (myId === latestAnalysisRef.current) {
        setResult(analysis);
        localStorage.setItem(`job_analysis_${job?.id}`, JSON.stringify(analysis));
        
        if (autoOpenApply) {
            if (analysis.match_score < 60) {
                setShowLowScoreWarning(true);
            } else {
                setShowApplyModal(true);
            }
        }
      }
    } catch (error) {
      if (myId === latestAnalysisRef.current) setResult({ error: 'failed' });
    } finally {
      if (myId === latestAnalysisRef.current) setAnalyzing(false);
    }
  };

  const handleEasyApply = async () => {
    if (!isSignedIn || !token) { setShowLoginPrompt(true); return; }
    if (!userResume) return alert('Please upload your resume first');

    setApplying(true);
    try {
      const jobId = String(job?.id); // No prefix stripping needed anymore
      const response = await fetch('${process.env.NEXT_PUBLIC_API_URL}/jobs/apply', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ job_id: parseInt(jobId), cover_note: coverNote })
      });

      if (response.ok) {
        setHasApplied(true);
        setApplySuccess(true);
        setShowLowScoreWarning(false); // Close warning if open
        setTimeout(() => { setShowApplyModal(false); setApplySuccess(false); }, 2000);
      } else {
        alert('Application failed');
      }
    } catch (err) { alert('Failed to submit'); } finally { setApplying(false); }
  };

  // --- HELPER: Format Salary ---
  const formatSalary = (min: number | undefined, max: number | undefined, currency: string = "₹", freq: string = "Monthly") => {
    if (!min && !max) return "Salary not disclosed";
    
    const formatNum = (n: number) => {
        if (n >= 100000) return `${(n / 100000).toFixed(1).replace('.0', '')}L`;
        if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
        return n.toLocaleString();
    };

    const suffix = freq === 'Monthly' ? '/mo' : '/yr';
    const curr = currency === 'INR' ? '₹' : '$';

    if (min && max) return `${curr} ${formatNum(min)} - ${formatNum(max)} ${suffix}`;
    if (min) return `${curr} ${formatNum(min)} ${suffix}`;
    if (max) return `Up to ${curr} ${formatNum(max)} ${suffix}`;
    return "Salary not disclosed";
  };

  // --- JOB POSTED DATE LOGIC (CALENDAR DAYS) ---
  const getPostedLabel = (dateStr: string) => {
    if (!dateStr) return 'Today';
    const posted = new Date(dateStr);
    const now = new Date();
    
    // Reset time components to compare strictly by calendar date
    const postedDate = new Date(posted.getFullYear(), posted.getMonth(), posted.getDate());
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Calculate difference in days
    const diffTime = nowDate.getTime() - postedDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Newly Posted'; // Handle future dates (timezone overlap)
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  // --- JOB DESCRIPTION RENDERER ---
  const renderDescription = (text: string) => {
    if (!text) return <p className="text-gray-500 italic">No description available.</p>;

    const fullText = (!isExpanded && text.length > 800) ? text.slice(0, 800) + '...' : text;
    
    const lines = fullText.split('\n').map(l => l.trim()).filter(l => l);
    const sections: { title: string | null, items: string[] }[] = [];
    let currentSection: { title: string | null, items: string[] } = { title: null, items: [] };

    const headerPattern = /^(About|Job Description|Responsibilities|Requirements|Qualifications|Skills|Benefits|What We Offer)(?::?)$/i;

    lines.forEach(line => {
        if (headerPattern.test(line) || (line.endsWith(':') && line.length < 40)) {
            if (currentSection.items.length > 0 || currentSection.title) {
                sections.push(currentSection);
            }
            currentSection = { title: line.replace(':', ''), items: [] };
        } else {
            currentSection.items.push(line);
        }
    });
    if (currentSection.items.length > 0 || currentSection.title) sections.push(currentSection);

    return (
      <div className="space-y-3 text-gray-300 text-[15px] leading-relaxed font-sans">
        {sections.map((sec, i) => {
            if (sec.title && /benefit|offer|perk/i.test(sec.title) && sec.items.length === 0) {
                return null;
            }

            return (
                <div key={i}>
                    {sec.title && <h3 className="text-white font-bold text-lg mb-2">{sec.title}</h3>}
                    <ul className="space-y-2">
                        {sec.items.map((item, j) => {
                            if (/^[-•*●▪›]/.test(item) || /^\d+\./.test(item)) {
                                return (
                                    <li key={j} className="flex gap-3 items-start pl-1">
                                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
                                        <span className="flex-1 text-gray-300 leading-relaxed">{item.replace(/^[-•*●▪›]\s?|^\d+\.\s?/, '')}</span>
                                    </li>
                                );
                            }
                            return <p key={j} className="mb-3 leading-relaxed">{item}</p>;
                        })}
                    </ul>
                </div>
            );
        })}
      </div>
    );
  };

  if (loading) return <LoadingSpinner />;
  if (!job) return null;

  const isExternalLink = job.apply_link && !job.apply_link.includes('@');
  const activityStatus = (job as any).activity_status || "Active"; // Safe fallback

  const postedString = getPostedLabel(job.created_at);

  // Status Badge Logic
  let activityConfig = { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: CheckCircle };
  if (activityStatus === 'Inactive') activityConfig = { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: X };
  else if (activityStatus === 'Hiring Actively') activityConfig = { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Activity };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-electric/30">
      <Toaster position="top-right" />
      
      {/* --- HERO SECTION --- */}
      <div className="relative border-b border-white/10 bg-[#0a0a0a] pt-8 pb-12">
        <div className="absolute inset-0 bg-gradient-to-b from-electric/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link href="/jobs" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Search
          </Link>

          <div className="flex flex-col lg:flex-row gap-8 lg:items-start justify-between">
            <div className="flex flex-col md:flex-row gap-6 w-full lg:w-auto">
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-charcoal to-black border border-white/10 flex items-center justify-center text-3xl md:text-4xl font-bold text-gray-700 shadow-2xl flex-shrink-0">
                {job.company_name ? job.company_name.charAt(0) : 'C'}
              </div>
              
              <div className="flex-1">
                <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 leading-tight">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-400">
                  <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4 text-electric" /> {job.company_name}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-gray-500" /> {job.location}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-gray-500" /> {postedString}</span>
                  {/* HERO SALARY */}
                  <span className="flex items-center gap-1.5 text-green-400 font-semibold w-full md:w-auto mt-1 md:mt-0">
                      {formatSalary(job.salary_min, job.salary_max, job.currency, job.salary_frequency)}
                      {job.equity && <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">+ Equity</span>}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {job.is_verified && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[12px] md:text-[14px] font-medium">
                      <Shield className="h-3 w-3 md:h-4 md:w-4" /> Verified Job
                    </span>
                  )}
                  {/* --- 🆕 ACTIVITY BADGE --- */}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${activityConfig.bg} border ${activityConfig.border} ${activityConfig.color} text-[12px] md:text-[14px] font-medium`}>
                      <activityConfig.icon className="h-3 w-3 md:h-4 md:w-4" /> {activityStatus}
                  </span>
                  
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300 text-[12px] md:text-[14px] font-medium">
                    {job.employment_type}
                  </span>
                </div>
              </div>
            </div>

            {/* Hero Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto mt-6 lg:mt-0">
               <button onClick={() => setSaved(!saved)} className={`w-full sm:w-auto p-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${saved ? 'bg-electric/10 border-electric text-electric' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}>
                <Bookmark className="h-5 w-5" fill={saved ? 'currentColor' : 'none'} />
              </button>
              
              {isExternalLink ? (
                <a href={job.apply_link} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto flex-1 lg:flex-none">
                  <button className="w-full lg:w-auto px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all bg-white text-black hover:bg-gray-200">
                    Apply on Company Site <ExternalLink className="h-4 w-4" />
                  </button>
                </a>
              ) : (
                <button 
                  onClick={handleHeroApply}
                  disabled={hasApplied}
                  className={`w-full sm:w-auto flex-1 lg:flex-none px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${hasApplied ? 'bg-green-600 cursor-not-allowed text-white' : 'bg-electric hover:bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'}`}
                >
                  {hasApplied ? <><CheckCircle className="h-5 w-5" /> Applied</> : <><Zap className="h-5 w-5" /> Apply for Job</>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT GRID --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* LEFT COLUMN (Content) */}
          <div className="lg:col-span-8 space-y-6 md:space-y-8 order-2 lg:order-1">
            
            {/* 1. GAP ANALYSIS SECTION (HERO FEATURE) */}
            <div id="analysis-section">
                <GapAnalysisSection 
                    analyzing={analyzing} 
                    result={result} 
                    onAnalyze={() => handleCheckChances(false)}
                    jobId={job.id} // Pass Job ID for Feedback
                />
            </div>

            {/* 2. JOB DESCRIPTION */}
            <div className="relative bg-[#111] border border-white/5 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-2"><FileText className="h-5 w-5 text-electric" /> Job Description</h2>
              {renderDescription(job.description || '')}
              {(job.description?.length || 0) > 800 && (
                <div className="mt-6 flex justify-center">
                  <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2 text-xs md:text-sm font-bold text-white bg-white/5 hover:bg-white/10 px-6 py-2 rounded-full transition-all border border-white/10">
                    {isExpanded ? <>Read Less <ChevronUp className="h-4 w-4" /></> : <>Read More <ChevronDown className="h-4 w-4" /></>}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (Sidebar) */}
          <div className="lg:col-span-4 space-y-6 order-1 lg:order-2">
            
            {/* COMPANY CARD */}
            <CompanyCard job={job} />

            {/* JOB OVERVIEW */}
            <div className="bg-[#111] border border-white/10 rounded-xl p-6 sticky top-24">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2"><BriefcaseIcon size={20} className="text-gray-500" /> Job Overview</h3>
              <div className="space-y-4">
                  
                  {/* WORK MODE / LOCATION TYPE (ADDED) */}
                  <div className="flex items-start justify-between pb-3 border-b border-white/5">
                      <span className="text-gray-500 text-sm flex items-center gap-2"><Laptop size={14}/> Work Mode</span>
                      <span className="text-white text-sm font-medium text-right">{job.location_type || "On-site"}</span>
                  </div>

                  <div className="flex items-start justify-between pb-3 border-b border-white/5">
                      <span className="text-gray-500 text-sm">Employment</span>
                      <span className="text-white text-sm font-medium text-right">{job.employment_type}</span>
                  </div>
                  
                  <div className="flex items-start justify-between pb-3 border-b border-white/5">
                      <span className="text-gray-500 text-sm">Location</span>
                      <span className="text-white text-sm font-medium text-right">{job.location}</span>
                  </div>
                  
                  {/* SALARY (FIXED FORMAT) */}
                  <div className="flex items-start justify-between pb-3 border-b border-white/5">
                      <span className="text-gray-500 text-sm">Salary</span>
                      <span className="text-green-400 text-sm font-bold text-right">
                          {formatSalary(job.salary_min, job.salary_max, job.currency, job.salary_frequency)}
                      </span>
                  </div>

                  {job.equity && (<div className="flex items-start justify-between pb-3 border-b border-white/5"><span className="text-gray-500 text-sm">Equity</span><span className="text-yellow-400 text-sm font-medium text-right">Offered</span></div>)}
                  
                  {job.experience_level && (<div className="flex items-start justify-between pb-3 border-b border-white/5"><span className="text-gray-500 text-sm">Experience</span><span className="text-white text-sm font-medium text-right">{job.experience_level}</span></div>)}

                  <div className="flex items-start justify-between"><span className="text-gray-500 text-sm">Posted</span><span className="text-white text-sm font-medium text-right">{postedString}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- SIMILAR JOBS SECTION (RESTORED) --- */}
      {similarJobs.length > 0 && (
        <div className="border-t border-white/10 bg-[#0a0a0a] py-12 md:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl md:text-2xl font-bold text-white">Similar Opportunities</h2>
                    <Link href="/jobs" className="text-electric text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">View All Jobs <ArrowRight size={14} /></Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {similarJobs.map((simJob) => (
                        <Link href={`/jobs/${simJob.id}`} key={simJob.id} className="group block bg-[#111] border border-white/10 rounded-xl p-5 hover:border-white/20 hover:shadow-lg transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-charcoal to-black border border-white/10 flex items-center justify-center font-bold text-gray-500 group-hover:text-white transition-colors">
                                    {simJob.company_name ? simJob.company_name.charAt(0) : 'C'}
                                </div>
                                <div className="px-2 py-1 bg-white/5 rounded text-[10px] text-gray-400 border border-white/5">{simJob.employment_type}</div>
                            </div>
                            <h3 className="font-bold text-white text-lg mb-1 group-hover:text-electric transition-colors line-clamp-1">{simJob.title}</h3>
                            <p className="text-sm text-gray-500 mb-4">{simJob.company_name}</p>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={12}/> {simJob.location}</span>
                                <span className="text-xs text-electric font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">View <ArrowUpRight size={12}/></span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* --- LOW SCORE WARNING MODAL (NEW) --- */}
      {showLowScoreWarning && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl max-w-md w-full p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border-t-4 border-t-yellow-500">
            <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6">
                    <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Match Score Low</h3>
                <p className="text-gray-400 mb-8 leading-relaxed">
                    Your compatibility score is <strong className="text-yellow-500">{result?.match_score || 0}%</strong>. 
                    Applicants with scores below 60% are less likely to be shortlisted. 
                    We recommend improving your resume before applying.
                </p>
                <div className="flex flex-col w-full gap-3">
                    <button 
                        onClick={() => setShowLowScoreWarning(false)} 
                        className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/10"
                    >
                        Review My Profile
                    </button>
                    <button 
                        onClick={() => {
                            setShowLowScoreWarning(false);
                            setShowApplyModal(true);
                        }} 
                        className="w-full py-3.5 text-gray-500 hover:text-white text-sm font-medium transition-colors"
                    >
                        Continue & Apply Anyway
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* --- APPLY MODAL --- */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl max-w-md w-full p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {applySuccess ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h4 className="text-2xl font-bold text-white mb-2">Application Sent!</h4>
                <p className="text-gray-400">Your application has been submitted successfully.</p>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white">Quick Apply</h3>
                  <button onClick={() => setShowApplyModal(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-400 mb-2">Cover Note (Optional)</label>
                  <textarea 
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-electric transition resize-none"
                    rows={4}
                    placeholder="Why are you a great fit for this role?"
                  />
                </div>
                
                <button 
                  onClick={handleEasyApply}
                  disabled={applying}
                  className="w-full bg-electric hover:bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {applying ? <><Loader2 className="animate-spin" size={20} /> Submitting...</> : <><Zap size={20} /> Submit Application</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- LOGIN PROMPT --- */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl max-w-md w-full p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-electric/10 rounded-full flex items-center justify-center mb-4"><Lock className="h-8 w-8 text-electric" /></div>
              <h3 className="text-2xl font-bold text-white mb-2">Login Required</h3>
              <p className="text-gray-400 mb-6">Please login to access this feature and unlock your career opportunities.</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setShowLoginPrompt(false)} className="flex-1 py-3 bg-charcoal hover:bg-white/5 rounded-lg text-sm font-medium transition">Cancel</button>
                <Link href="/login" className="flex-1"><button className="w-full py-3 bg-electric hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition">Login</button></Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
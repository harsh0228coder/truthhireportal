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
    const toastId = toast.loading("Analyzing gap and generating Overleaf-style PDF...");

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
      toast.success("Resume tailored successfully!", { id: toastId });
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (!user || fetchingJob) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20 pb-12 selection:bg-blue-500/30">
      <Toaster position="top-center" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold mb-4">
            <Sparkles size={16} /> AI Resume Tailor
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Beat the ATS. Land the Interview.
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Paste a Job Description below. Our engine will bridge your vocabulary gap and generate a classic, single-column Overleaf-standard PDF designed to hit a 90%+ parse rate.
          </p>
        </div>

        {tailorResult ? (
          /* --- SUCCESS STATE --- */
          <div className="bg-[#111] border border-green-500/30 rounded-2xl p-8 animate-in zoom-in-95 duration-500 shadow-[0_0_40px_-10px_rgba(34,197,94,0.2)]">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Resume Tailored Successfully</h2>
              
              <div className="flex items-center gap-6 my-8">
                <div className="text-center">
                  <p className="text-sm text-gray-500 uppercase font-bold mb-1">Old Score</p>
                  <p className="text-3xl font-bold text-red-400">{tailorResult.score_before}%</p>
                </div>
                <ArrowRight className="w-8 h-8 text-gray-600" />
                <div className="text-center">
                  <p className="text-sm text-gray-500 uppercase font-bold mb-1">New Score</p>
                  <p className="text-4xl font-black text-green-500">{tailorResult.score_after}%</p>
                </div>
              </div>

              <div className="w-full bg-[#0a0a0a] rounded-xl p-4 text-left border border-white/5 mb-8">
                <p className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-blue-500"/> Bridged Keywords
                </p>
                <div className="flex flex-wrap gap-2">
                  {tailorResult.matched_skills.map((skill: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <a 
                href={tailorResult.pdf_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-xl font-bold transition-all shadow-lg"
              >
                <Download size={20} /> Download Professional PDF
              </a>
              <p className="text-xs text-gray-500 mt-4">Generations used today: {tailorResult.used_today} / {tailorResult.daily_limit}</p>
            </div>
          </div>
        ) : (
          /* --- INPUT STATE --- */
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 sm:p-8">
            <label className="block text-sm font-bold text-gray-300 mb-2">Target Job Description</label>
            <textarea
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              placeholder="Paste the full job description here..."
              className="w-full h-64 bg-[#050505] border border-white/10 rounded-xl p-4 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none mb-6"
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3 text-xs text-gray-400 max-w-sm">
                <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                <p>We use strict anti-hallucination guardrails. We will only reframe skills that exist in your baseline resume.</p>
              </div>

              <button
                onClick={handleTailorResume}
                disabled={loading || !user.resume_text}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white px-8 py-3.5 rounded-xl font-bold transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                {loading ? "Optimizing PDF..." : "Tailor My Resume"}
              </button>
            </div>
            {!user.resume_text && (
              <p className="text-red-400 text-xs text-right mt-2 font-bold">⚠️ You must upload a baseline resume in your profile first.</p>
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
'use client';

import { useState } from 'react';
import { Sparkles, Loader2, X, Download, TrendingUp, CheckCircle2, AlertTriangle, Zap, Info } from 'lucide-react';
import toast from 'react-hot-toast';

interface TailorResult {
  id: number;
  pdf_url: string;
  score_before: number;
  score_after: number;
  improvement: number;
  matched_skills: string[];
  still_missing: string[];
  used_today: number;
  daily_limit: number;
}

interface AiResumeTailorProps {
  /** Numeric TruthHire user id (from localStorage). */
  userId: number | null;
  /** JD text to tailor for. Required. */
  jobDescription: string;
  /** Optional job id if launched from a Job Details page. */
  jobId?: number | null;
  /** Short preview line saved to history (e.g. "SDE-II @ Razorpay"). */
  jdPreview?: string;
  /** Compact — used inline on the Check Chances result panel. Non-compact = job details CTA. */
  variant?: 'compact' | 'cta';
  /** Optional override of the current baseline score to display in the "before" state. */
  baselineScore?: number;
}

/**
 * "Tailor my resume for this JD" — one-click flow that:
 *   1. POSTs the JD to /users/{id}/tailor-resume
 *   2. Displays before/after scores + link to download the ATS-safe PDF
 *   3. Enforces the 3/day free-tier limit visually
 */
export default function AiResumeTailor({
  userId,
  jobDescription,
  jobId = null,
  jdPreview,
  variant = 'compact',
  baselineScore,
}: AiResumeTailorProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TailorResult | null>(null);
  const [open, setOpen] = useState(false);

  const canRun = !!userId && !!jobDescription && jobDescription.trim().length > 60;

  const runTailor = async () => {
    if (!userId) {
      toast.error('Please log in to use the AI Resume Tailor');
      return;
    }
    if (!jobDescription || jobDescription.trim().length < 60) {
      toast.error('Job description is too short');
      return;
    }

    setLoading(true);
    setOpen(true);
    const toastId = toast.loading('Reframing your resume against this JD...');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/tailor-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          job_description: jobDescription,
          job_id: jobId,
          jd_preview: jdPreview || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || 'Tailoring failed');
      }
      setResult(data as TailorResult);
      toast.success(`Score jumped ${data.score_before}% → ${data.score_after}%!`, { id: toastId });
    } catch (e: any) {
      toast.error(e?.message || 'Something went wrong', { id: toastId });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // -------- The trigger button ------------------------------------------
  const trigger = (
    <button
      type="button"
      onClick={runTailor}
      disabled={loading || !canRun}
      data-testid="ai-tailor-trigger"
      className={
        variant === 'cta'
          ? 'w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed'
          : 'w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600/90 to-indigo-600/90 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs md:text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed'
      }
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" /> Reframing…
        </>
      ) : (
        <>
          <Sparkles size={16} className="fill-current" />
          Tailor my resume for this JD
        </>
      )}
    </button>
  );

  // -------- The result modal --------------------------------------------
  const modal = open && (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={() => !loading && setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto"
        data-testid="ai-tailor-modal"
      >
        <button
          onClick={() => !loading && setOpen(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-white z-10"
          data-testid="ai-tailor-close"
        >
          <X size={20} />
        </button>

        {/* Loading state */}
        {loading && (
          <div className="p-10 flex flex-col items-center justify-center gap-4 text-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse" />
              <div className="relative w-16 h-16 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
                <Sparkles className="text-blue-300 animate-pulse" size={28} />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Reframing your resume…</h3>
              <p className="text-sm text-gray-400 mt-1 max-w-sm">
                Our AI is mapping your real experience to this JD&apos;s keywords.
                No skills are ever invented — only your baseline is used.
              </p>
            </div>
          </div>
        )}

        {/* Result state */}
        {!loading && result && (
          <div className="p-6 md:p-8 space-y-6">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-full px-2.5 py-1">
                <Zap size={12} className="fill-current" /> AI Resume Tailor
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mt-3 leading-tight">
                Your resume just went from{' '}
                <span className="text-red-400">{result.score_before}%</span> →{' '}
                <span className="text-green-400">{result.score_after}%</span>
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                +{result.improvement} points against this specific JD — using only skills from your baseline resume.
              </p>
            </div>

            {/* Score bars */}
            <div className="space-y-3">
              <ScoreBar label="Before" score={result.score_before} tone="red" />
              <ScoreBar label="After" score={result.score_after} tone="green" />
            </div>

            {/* Skills */}
            {result.matched_skills.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-green-500" /> Now matching in your tailored resume
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.matched_skills.slice(0, 12).map((s) => (
                    <span
                      key={s}
                      className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 text-[11px] rounded-md font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.still_missing.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={12} className="text-orange-500" /> Still worth learning
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.still_missing.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[11px] rounded-md font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Trust callout */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/10">
              <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-gray-400 leading-relaxed">
                TruthHire&apos;s Golden Rule: we <span className="text-white font-semibold">never invent skills</span>.
                We only reframe your existing experience to match the JD&apos;s terminology, and format it for maximum
                ATS parseability (Workday, Taleo, Greenhouse, Lever).
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={result.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="ai-tailor-download"
                className="flex-1 py-3 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-sm text-center transition flex items-center justify-center gap-2"
              >
                <Download size={16} /> Download tailored PDF
              </a>
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 font-medium text-sm transition"
              >
                Close
              </button>
            </div>

            {/* Usage */}
            <p className="text-center text-[11px] text-gray-500">
              {result.used_today} of {result.daily_limit} free tailored resumes used today.{' '}
              {result.used_today >= result.daily_limit && (
                <span className="text-orange-400">Come back tomorrow for more.</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {trigger}
      {/* Optional small helper line under the button */}
      {variant === 'compact' && !loading && !result && (
        <p className="text-[10px] text-gray-500 text-center mt-1.5">
          Uses your saved profile resume. 3 free / day.
        </p>
      )}
      {modal}
    </>
  );
}

function ScoreBar({ label, score, tone }: { label: string; score: number; tone: 'red' | 'green' }) {
  const barColor = tone === 'green' ? 'bg-green-500' : 'bg-red-500';
  const textColor = tone === 'green' ? 'text-green-400' : 'text-red-400';
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-400 font-medium">{label}</span>
        <span className={`font-bold ${textColor}`}>{score}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-700`}
          style={{ width: `${Math.max(3, score)}%` }}
        />
      </div>
    </div>
  );
}

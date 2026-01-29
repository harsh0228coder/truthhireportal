'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, BrainCircuit, Users, Mic, Send,
  ChevronRight, RefreshCw, Loader2, PlayCircle, 
  CheckCircle2, Sparkles, AlertCircle, XCircle, Cpu
} from 'lucide-react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

export default function InterviewPrepPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params?.id;
  
  // --- STATES ---
  const [mode, setMode] = useState<'selection' | 'intro' | 'active' | 'summary'>('selection');
  const [interviewType, setInterviewType] = useState<'technical' | 'hr'>('technical');
  const [loading, setLoading] = useState(false);
  const [prepData, setPrepData] = useState<any>(null);

  // Active Interview States
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  // --- 1. GENERATE SESSION ---
  const handleGenerate = async (type: 'technical' | 'hr') => {
    setInterviewType(type);
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${applicationId}/generate-prep?type=${type}`, { method: 'POST' });
      if (!res.ok) throw new Error("Failed to generate");
      const result = await res.json();
      setPrepData(result);
      setMode('intro');
    } catch (err) {
      toast.error("AI is busy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. SUBMIT ANSWER ---
  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) return toast.error("Please type an answer first.");
    setAnalyzing(true);

    const currentQuestion = prepData.interview_flow[currentQIndex].question;

    try {
        const res = await fetch("${process.env.NEXT_PUBLIC_API_URL}/interview/analyze-answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                question: currentQuestion,
                user_answer: userAnswer,
                job_role: "Candidate"
            })
        });
        const result = await res.json();
        setFeedback(result);
        
        const newHistoryItem = {
            question: currentQuestion,
            answer: userAnswer,
            rating: result.rating,
            feedback: result.feedback,
            model_answer: result.model_answer
        };
        setHistory([...history, newHistoryItem]);

    } catch (err) {
        toast.error("Failed to analyze answer");
    } finally {
        setAnalyzing(false);
    }
  };

  // --- 3. NEXT QUESTION ---
  const handleNext = () => {
      if (currentQIndex < prepData.interview_flow.length - 1) {
          setCurrentQIndex(prev => prev + 1);
          setUserAnswer("");
          setFeedback(null);
      } else {
          setMode('summary');
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${applicationId}/complete-prep`, { method: 'POST' });
      }
  };

  // --- 4. END SESSION HANDLER ---
  const handleEndSession = () => {
    if (confirm("Are you sure you want to end the interview? Your progress will be lost.")) {
        router.push('/my-applications');
    }
  };

  // --- UI HELPERS ---
  const getRatingColor = (rating: number) => {
      if (rating >= 8) return "text-green-400 border-green-500/50 bg-green-500/10";
      if (rating >= 5) return "text-yellow-400 border-yellow-500/50 bg-yellow-500/10";
      return "text-red-400 border-red-500/50 bg-red-500/10";
  };

  // ================= RENDER: 1. SELECTION SCREEN =================
  if (mode === 'selection') {
    return (
      <div className="min-h-screen bg-[#050505] text-white font-sans pt-24 pb-12 px-4 md:px-8 flex flex-col items-center">
         <div className="max-w-4xl w-full text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
               Interview Simulator
            </h1>
            <p className="text-gray-400 mb-12 text-sm md:text-base max-w-xl mx-auto">
               Select a mode to generate a real-time AI interview session tailored to this specific job application.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={() => handleGenerate('technical')} disabled={loading} className="group bg-[#111] border border-white/10 hover:border-blue-500/50 rounded-2xl p-6 md:p-8 text-left transition-all hover:bg-blue-500/5 shadow-lg relative overflow-hidden">
                    <div className="mb-4 p-4 bg-blue-500/10 rounded-xl w-fit text-blue-400 ring-1 ring-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                        {loading && interviewType === 'technical' ? <Loader2 className="animate-spin" size={28}/> : <Cpu size={32}/>}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Technical Round</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">Focuses on technical knowledge, problem-solving skills, and role-specific scenarios.</p>
                </button>

                <button onClick={() => handleGenerate('hr')} disabled={loading} className="group bg-[#111] border border-white/10 hover:border-green-500/50 rounded-2xl p-6 md:p-8 text-left transition-all hover:bg-green-500/5 shadow-lg relative overflow-hidden">
                    <div className="mb-4 p-4 bg-green-500/10 rounded-xl w-fit text-green-400 ring-1 ring-green-500/20 group-hover:bg-green-500/20 transition-colors">
                        {loading && interviewType === 'hr' ? <Loader2 className="animate-spin" size={28}/> : <Users size={32}/>}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">HR Screening</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">Focuses on behavioral questions, cultural fit, strengths, and soft skills.</p>
                </button>
            </div>
            
            <Link href="/my-applications" className="mt-12 inline-flex items-center text-gray-500 hover:text-white transition gap-2 text-sm font-medium py-2 px-4 rounded-lg hover:bg-white/5">
               <ArrowLeft size={16}/> Back to Dashboard
            </Link>
         </div>
      </div>
    );
  }

  // ================= RENDER: 2. INTRO / PREP SCREEN =================
  if (mode === 'intro') {
      return (
        <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12 px-4 flex flex-col items-center">
            <div className="max-w-2xl w-full bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-6">
                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                        <Sparkles className="text-yellow-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Your AI Prep Brief</h2>
                        <p className="text-xs text-gray-400">Read this before starting</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white/5 p-5 rounded-xl border border-white/5">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Mic size={12} /> Suggested Elevator Pitch
                        </h3>
                        <p className="text-base italic text-gray-200 leading-relaxed">"{prepData.elevator_pitch}"</p>
                    </div>

                    <div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Topics Covered</h3>
                        <div className="flex flex-wrap gap-2">
                            {prepData.topics.map((t: string, i: number) => (
                                <span key={i} className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">{t}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => setMode('active')} 
                    className="w-full mt-8 py-3.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-white/10"
                >
                    <PlayCircle size={18} /> Start Interview Session
                </button>
            </div>
        </div>
      );
  }

  // ================= RENDER: 3. ACTIVE INTERVIEW =================
  if (mode === 'active') {
      const currentQ = prepData.interview_flow[currentQIndex];
      const progress = ((currentQIndex) / prepData.interview_flow.length) * 100;

      return (
        <div className="min-h-screen bg-[#050505] text-white font-sans">
            <Toaster position="top-center" />
            
            {/* Progress Bar */}
            <div className="h-1 bg-white/10 w-full fixed top-0 z-50">
                <div className="h-full bg-blue-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="max-w-3xl mx-auto px-4 md:px-6 pt-24 pb-12">
                
                {/* Header with END Button */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <span className="text-gray-500 font-mono text-sm">Q{currentQIndex + 1} <span className="text-gray-700">/</span> {prepData.interview_flow.length}</span>
                        <div className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-gray-300">{interviewType}</div>
                    </div>
                    
                    <button 
                        onClick={handleEndSession}
                        className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    >
                        <XCircle size={14} /> End Session
                    </button>
                </div>

                {/* Question Card */}
                <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 mb-6 shadow-2xl">
                    <h2 className="text-xl md:text-2xl font-medium leading-relaxed text-white">{currentQ.question}</h2>
                    {!feedback && (
                        <div className="mt-6 flex items-start gap-2 text-gray-500 text-xs bg-white/[0.03] p-3 rounded-lg border border-white/5">
                            <Sparkles size={14} className="text-yellow-500 mt-0.5 flex-shrink-0"/>
                            <span><strong className="text-gray-400">AI Hint:</strong> {currentQ.hint}</span>
                        </div>
                    )}
                </div>

                {/* Interaction Area */}
                {!feedback ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <textarea
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder="Type your answer here..."
                            className="w-full h-48 bg-[#080808] border border-white/10 rounded-2xl p-5 text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none text-base leading-relaxed transition-all placeholder:text-gray-700" 
                        />
                        
                        <div className="flex justify-end">
                            <button 
                                onClick={handleSubmitAnswer}
                                disabled={analyzing || !userAnswer.trim()}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition flex items-center gap-2 disabled:opacity-50 text-sm shadow-lg shadow-blue-600/20"
                            >
                                {analyzing ? <Loader2 className="animate-spin" size={18}/> : <Send size={18} />}
                                {analyzing ? "Analyzing Response..." : "Submit Answer"}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* FEEDBACK RESULT */
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className={`p-6 rounded-2xl border ${getRatingColor(feedback.rating)} flex flex-col md:flex-row items-start gap-6 relative overflow-hidden`}>
                            <div className="flex items-center gap-4 md:block text-center md:text-left min-w-[100px]">
                                <div>
                                    <span className="block text-4xl font-black tracking-tight">{feedback.rating}<span className="text-lg font-normal opacity-60">/10</span></span>
                                    <span className="text-[10px] uppercase font-bold opacity-70 tracking-widest">Score</span>
                                </div>
                            </div>
                            
                            <div className="w-full h-px md:w-px md:h-20 bg-current opacity-20"></div>
                            
                            <div className="flex-1">
                                <h4 className="font-bold mb-2 text-sm uppercase tracking-wider opacity-80">Feedback</h4>
                                <p className="text-sm opacity-90 leading-relaxed">{feedback.feedback}</p>
                            </div>
                        </div>

                        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-green-500 rounded-l-2xl"></div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-green-500"/> Model Answer
                            </h4>
                            <p className="text-gray-300 italic text-sm leading-relaxed">"{feedback.model_answer}"</p>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button 
                                onClick={handleNext}
                                className="px-8 py-3.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition flex items-center gap-2 text-sm shadow-lg shadow-white/10"
                            >
                                {currentQIndex < prepData.interview_flow.length - 1 ? "Next Question" : "Finish Interview"} <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
      );
  }

  // ================= RENDER: 4. SUMMARY =================
  if (mode === 'summary') {
      const avgScore = Math.round(history.reduce((acc, curr) => acc + curr.rating, 0) / history.length);
      
      return (
        <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12 px-4 flex flex-col items-center justify-center">
            <div className="max-w-2xl w-full text-center">
                <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                    <CheckCircle2 size={48} />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">Session Complete!</h1>
                <p className="text-gray-400 mb-10 text-sm md:text-base">You successfully completed the {interviewType} simulation.</p>

                <div className="grid grid-cols-3 gap-4 mb-10">
                    <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Questions</p>
                        <p className="text-2xl font-bold text-white">{history.length}</p>
                    </div>
                    <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Avg Score</p>
                        <p className={`text-2xl font-bold ${getRatingColor(avgScore).split(' ')[0]}`}>{avgScore}/10</p>
                    </div>
                    <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Focus</p>
                        <p className="text-base font-bold text-white capitalize truncate">{interviewType}</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button onClick={() => setMode('selection')} className="px-8 py-3.5 bg-[#111] border border-white/10 rounded-xl hover:bg-white/5 text-sm font-medium transition text-gray-300 hover:text-white">
                        Start New Session
                    </button>
                    <Link href="/my-applications" className="px-8 py-3.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 text-sm shadow-lg shadow-white/10">
                        Back to Applications
                    </Link>
                </div>
            </div>
        </div>
      );
  }
  
  return null;
}
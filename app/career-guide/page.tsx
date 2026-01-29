'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, FileText, MessageSquare, 
  ArrowRight, Search, Zap, CheckCircle2, 
  AlertTriangle, Briefcase, ExternalLink,
  GraduationCap, TrendingUp, Cpu, Rocket, 
  Code2, Database, Cloud, Terminal, Mic
} from 'lucide-react';

export default function CareerGuide() {
  
  const externalResources = [
    { name: "LeetCode", desc: "Coding Practice", url: "https://leetcode.com/" },
    { name: "Levels.fyi", desc: "Salary Data", url: "https://www.levels.fyi/" },
    { name: "Glassdoor", desc: "Company Reviews", url: "https://www.glassdoor.com/" },
    { name: "MDN Web Docs", desc: "Web Dev Standards", url: "https://developer.mozilla.org/" },
    { name: "Stratechery", desc: "Tech Industry News", url: "https://stratechery.com/" }
  ];

  // Expanded skill list for the ticker
  const skills = [
    { name: "React.js & Next.js", icon: <Code2 size={14} className="text-blue-400"/> },
    { name: "Python & GenAI", icon: <Cpu size={14} className="text-yellow-400"/> },
    { name: "System Design", icon: <Database size={14} className="text-purple-400"/> },
    { name: "Cloud (AWS/Azure)", icon: <Cloud size={14} className="text-orange-400"/> },
    { name: "Data Structures", icon: <Terminal size={14} className="text-green-400"/> },
    { name: "TypeScript", icon: <Code2 size={14} className="text-blue-600"/> },
    { name: "DevOps & CI/CD", icon: <Settings size={14} className="text-gray-400"/> },
    { name: "GraphQL", icon: <Database size={14} className="text-pink-400"/> },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* Custom Keyframes */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* ================= HERO SECTION ================= */}
      {/* Adjusted padding: pt-16/pb-12 for mobile, pt-24/pb-20 for desktop */}
      <section className="relative pt-16 pb-12 md:pt-18 md:pb-20 px-6 border-b border-white/5 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] md:w-[1000px] h-[300px] md:h-[500px] bg-blue-600/10 rounded-full blur-[80px] md:blur-[100px] -z-10"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-4 md:mb-6 animate-in fade-in slide-in-from-bottom-2">
                <GraduationCap size={14} /> Student Career Center
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 md:mb-6 tracking-tight leading-tight">
                Master the Art of <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-blue-400">Getting Hired.</span>
            </h1>
            <p className="text-base md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Don't just apply. Strategize. Follow the TruthHire workflow to bypass filters and land verified interviews.
            </p>
        </div>
      </section>

      {/* ================= MARKET INTELLIGENCE (SCROLLABLE TICKER) ================= */}
      <div className="border-y border-white/5 bg-[#080808] relative overflow-hidden group">
        
        <div className="absolute left-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-r from-[#080808] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-l from-[#080808] to-transparent z-10 pointer-events-none"></div>

        <div className="flex items-center py-3 md:py-4">
            {/* Label (Hidden on mobile to save space) */}
            <div className="hidden md:flex items-center gap-2 px-6 border-r border-white/10 z-20 bg-[#080808]">
                <TrendingUp size={16} className="text-green-500" />
                <span className="font-semibold text-white text-base whitespace-nowrap">Trending Skills:</span>            </div>

            {/* Scrolling Track */}
            <div className="flex overflow-hidden w-full mask-gradient">
                <div className="flex animate-marquee whitespace-nowrap">
                    {[...skills, ...skills, ...skills].map((skill, i) => (
                        <div key={i} className="mx-2 md:mx-3 flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-sm md:text-base font-medium text-gray-300 hover:bg-white/10 hover:border-white/20 hover:text-white transition-colors cursor-default">
                            {skill.icon}
                            <span>{skill.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* Main Content Container - Adjusted Spacing */}
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 space-y-16 md:space-y-24">

        {/* ================= 1. THE TRUTHHIRE ROADMAP ================= */}
        <section>
            <div className="text-center mb-8 md:mb-12">
                <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">Your Roadmap to Success</h2>
                <p className="text-sm md:text-base text-gray-400">The 4-step TruthHire process to land your dream role.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-6">
                
                {/* Step 1 */}
                <div className="bg-[#111] border border-white/10 p-6 rounded-xl relative group hover:border-blue-500/30 transition-all">
                    <div className="absolute -top-3 left-6 bg-[#111] border border-white/10 px-3 py-1 text-[10px] md:text-xs font-bold text-gray-400 rounded-full group-hover:text-blue-400 group-hover:border-blue-500/30 transition-colors">Step 01</div>
                    <div className="mb-4 text-blue-500 bg-blue-500/10 w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center">
                        <FileText size={20} className="md:w-6 md:h-6" />
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-white mb-2">Build Profile</h3>
                    <p className="text-xs md:text-sm text-gray-400 mb-4 leading-relaxed">Upload your resume. Our system automatically parses your skills and experience.</p>
                    <ul className="text-xs text-gray-500 space-y-2">
                        <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500"/> Resume Parsing</li>
                        <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500"/> Skill Extraction</li>
                    </ul>
                </div>

                {/* Step 2 */}
                <div className="bg-[#111] border border-white/10 p-6 rounded-xl relative group hover:border-blue-500/30 transition-all">
                    <div className="absolute -top-3 left-6 bg-[#111] border border-white/10 px-3 py-1 text-[10px] md:text-xs font-bold text-gray-400 rounded-full group-hover:text-blue-400 group-hover:border-blue-500/30 transition-colors">Step 02</div>
                    <div className="mb-4 text-purple-500 bg-purple-500/10 w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center">
                        <Cpu size={20} className="md:w-6 md:h-6" />
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-white mb-2">Check Chances</h3>
                    <p className="text-xs md:text-sm text-gray-400 mb-4 leading-relaxed">Use our AI tool to compare your resume against a Job Description.</p>
                    <ul className="text-xs text-gray-500 space-y-2">
                        <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500"/> Match Scoring</li>
                        <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500"/> Missing Keywords</li>
                    </ul>
                </div>

                {/* Step 3 */}
                <div className="bg-[#111] border border-white/10 p-6 rounded-xl relative group hover:border-blue-500/30 transition-all">
                    <div className="absolute -top-3 left-6 bg-[#111] border border-white/10 px-3 py-1 text-[10px] md:text-xs font-bold text-gray-400 rounded-full group-hover:text-blue-400 group-hover:border-blue-500/30 transition-colors">Step 03</div>
                    <div className="mb-4 text-yellow-500 bg-yellow-500/10 w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center">
                        <ShieldCheck size={20} className="md:w-6 md:h-6" />
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-white mb-2">Apply Securely</h3>
                    <p className="text-xs md:text-sm text-gray-400 mb-4 leading-relaxed">Apply to "TruthVerified" jobs. No ghost postings, no fake recruiters.</p>
                    <ul className="text-xs text-gray-500 space-y-2">
                        <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500"/> Verified Badge</li>
                        <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500"/> Direct HR Reach</li>
                    </ul>
                </div>

                {/* Step 4 */}
                <div className="bg-[#111] border border-white/10 p-6 rounded-xl relative group hover:border-blue-500/30 transition-all">
                    <div className="absolute -top-3 left-6 bg-[#111] border border-white/10 px-3 py-1 text-[10px] md:text-xs font-bold text-gray-400 rounded-full group-hover:text-blue-400 group-hover:border-blue-500/30 transition-colors">Step 04</div>
                    <div className="mb-4 text-green-500 bg-green-500/10 w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center">
                        <Rocket size={20} className="md:w-6 md:h-6" />
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-white mb-2">Win the Interview</h3>
                    <p className="text-xs md:text-sm text-gray-400 mb-4 leading-relaxed">Use our AI prep tool to practice role-specific questions.</p>
                    <ul className="text-xs text-gray-500 space-y-2">
                        <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500"/> AI Mock Questions</li>
                        <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500"/> Salary Tips</li>
                    </ul>
                </div>
            </div>
        </section>

        {/* ================= 2. AI TOOLKIT ================= */}
        <section>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-8 gap-3">
                <div>
                    <div className="flex items-center gap-2 text-yellow-500 font-bold mb-2 uppercase text-[10px] md:text-xs tracking-wider">
                        <Zap size={14} /> Exclusive Technology
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold">AI Command Center</h2>
                </div>
                <p className="text-gray-400 text-sm md:text-right max-w-md">
                    Tools built specifically to bypass automated rejection filters.
                </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                {/* Tool 1 */}
                <Link href="/dashboard" className="group relative bg-gradient-to-br from-[#111] to-[#0A0A0A] border border-white/10 p-6 md:p-10 rounded-2xl md:rounded-3xl hover:border-blue-500/50 transition-all overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-blue-600/10 rounded-full blur-[60px] md:blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-600/20 transition-all"></div>
                    
                    <div className="relative z-10">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-[#1a1a1a] border border-white/10 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform shadow-lg">
                            <Search size={24} className="text-blue-400 md:w-7 md:h-7" />
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3">Gap Analysis Engine</h3>
                        <p className="text-sm md:text-base text-gray-400 mb-6 md:mb-8 leading-relaxed">
                            Paste your resume and a job description. Our AI will tell you exactly what keywords you are missing and give you a match score out of 100.
                        </p>
                        <div className="flex items-center gap-2 text-blue-400 text-sm md:text-base font-bold group-hover:gap-4 transition-all">
                            Analyze My Resume <ArrowRight size={16} />
                        </div>
                    </div>
                </Link>

                {/* Tool 2 */}
                <Link href="/dashboard" className="group relative bg-gradient-to-br from-[#111] to-[#0A0A0A] border border-white/10 p-6 md:p-10 rounded-2xl md:rounded-3xl hover:border-purple-500/50 transition-all overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-purple-600/10 rounded-full blur-[60px] md:blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-600/20 transition-all"></div>
                    
                    <div className="relative z-10">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-[#1a1a1a] border border-white/10 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform shadow-lg">
                            <Mic size={24} className="text-purple-400 md:w-7 md:h-7" />
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3">AI Interview Simulator</h3>
                        <p className="text-sm md:text-base text-gray-400 mb-6 md:mb-8 leading-relaxed">
                            Nervous about the interview? Practice with our AI. It generates role-specific questions and gives you instant feedback.
                        </p>
                        <div className="flex items-center gap-2 text-purple-400 text-sm md:text-base font-bold group-hover:gap-4 transition-all">
                            Start Practicing <ArrowRight size={16} />
                        </div>
                    </div>
                </Link>
            </div>
        </section>

        {/* ================= 3. PRO GUIDES ================= */}
        <section className="grid md:grid-cols-3 gap-4 md:gap-6">
            <div className="col-span-full mb-2 md:mb-4">
                <h2 className="text-2xl font-bold">Quick Guides</h2>
            </div>

            {/* Guide 1 */}
            <Link href="#safety-checklist" className="bg-[#111] p-5 md:p-6 rounded-xl border border-white/10 hover:bg-[#161616] transition cursor-pointer group">
                <h3 className="font-bold text-base md:text-lg mb-2 text-white group-hover:text-blue-400 transition-colors">🎓 Spotting Fake Jobs</h3>
                <p className="text-xs md:text-sm text-gray-400">Click to jump to our scam checklist. Learn how to verify any job offer instantly.</p>
                <div className="mt-3 md:mt-4 flex items-center text-xs font-bold text-blue-500">Read Checklist <ArrowRight size={12} className="ml-1"/></div>
            </Link>
            
            {/* Guide 2 */}
            <Link href="#" className="bg-[#111] p-5 md:p-6 rounded-xl border border-white/10 hover:bg-[#161616] transition cursor-pointer group">
                <h3 className="font-bold text-base md:text-lg mb-2 text-white group-hover:text-blue-400 transition-colors">💼 Negotiation 101</h3>
                <p className="text-xs md:text-sm text-gray-400">Scripts to ask for a higher salary without losing the offer. (Coming Soon)</p>
                <div className="mt-3 md:mt-4 flex items-center text-xs font-bold text-gray-500">Coming Soon</div>
            </Link>

            {/* Guide 3 */}
            <Link href="/dashboard" className="bg-[#111] p-5 md:p-6 rounded-xl border border-white/10 hover:bg-[#161616] transition cursor-pointer group">
                <h3 className="font-bold text-base md:text-lg mb-2 text-white group-hover:text-blue-400 transition-colors">🚀 Application Tracker</h3>
                <p className="text-xs md:text-sm text-gray-400">View all your applications, check status updates, and see your match scores.</p>
                <div className="mt-3 md:mt-4 flex items-center text-xs font-bold text-blue-500">Go to Jobs <ArrowRight size={12} className="ml-1"/></div>
            </Link>
        </section>

        {/* ================= 4. SAFETY CHECKLIST ================= */}
        <section id="safety-checklist" className="bg-gradient-to-r from-red-950/20 to-[#111] border border-red-500/20 rounded-2xl p-6 md:p-12 relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-0 right-0 p-6 md:p-12 opacity-5">
                <ShieldCheck size={120} className="md:w-[200px] md:h-[200px]" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 md:gap-3 text-red-400 font-bold mb-4 md:mb-6 uppercase tracking-widest text-[10px] md:text-xs">
                    <AlertTriangle size={14} className="md:w-4 md:h-4" /> Trust & Safety Protocol
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">The "Is it Fake?" Checklist</h2>
                
                <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                    <div className="space-y-4 md:space-y-6">
                        <p className="text-sm md:text-base text-gray-300 leading-relaxed">
                            Scammers target freshers. Before you accept any offer letter or interview request, run it through this checklist. If any point fails, <span className="text-white font-bold">do not proceed.</span>
                        </p>
                        <div className="p-3 md:p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-xs md:text-sm">
                            <strong>Golden Rule:</strong> Real jobs never ask you to pay money for training, laptops, or "security deposits".
                        </div>
                    </div>

                    <div className="space-y-3 md:space-y-4">
                        {[
                            "Did they interview you via video/in-person? (Text-only is a scam)",
                            "Is the email from a corporate domain? (@gmail/yahoo is suspicious)",
                            "Did they ask for money? (Real jobs pay YOU)",
                            "Is the salary unrealistic for your experience level?",
                            "Did you check their verification status on TruthHire?"
                        ].map((item, i) => (
                            <div key={i} className="flex gap-3 items-start">
                                <div className="mt-1 w-4 h-4 md:w-5 md:h-5 rounded-full border border-red-500/50 flex items-center justify-center shrink-0">
                                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-red-500 rounded-full"></div>
                                </div>
                                <p className="text-gray-300 text-xs md:text-sm">{item}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>

        {/* ================= 5. EXTERNAL RESOURCES ================= */}
        <section className="pt-4 md:pt-8 text-center md:text-left">
            <h3 className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 md:mb-6">Trusted External Resources</h3>
            <div className="flex flex-wrap gap-3 md:gap-4 justify-center md:justify-start">
                {externalResources.map((res, i) => (
                    <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 md:gap-3 px-4 py-2 md:px-5 md:py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group">
                        <div className="text-left">
                            <div className="font-bold text-white text-xs md:text-sm flex items-center gap-1">
                                {res.name} <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
                            </div>
                            <div className="text-[9px] md:text-[10px] text-gray-500">{res.desc}</div>
                        </div>
                    </a>
                ))}
            </div>
        </section>

      </div>
    </div>
  );
}

// Simple Helper for icon
function Settings({size, className}: {size: number, className: string}) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
}
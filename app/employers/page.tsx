'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, CheckCircle2, Zap, LayoutDashboard, 
  Briefcase, FileText, Ban, Filter, 
  ChevronRight, Star, Clock, Shield, Users, Eye, TrendingUp,
  MapPin, Plus, Lock, AlertTriangle, DollarSign
} from 'lucide-react';

export default function EmployerHome() {
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'jobs' | 'ats'>('overview');

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden relative">

      {/* GLOBAL STYLES & BACKGROUNDS */}
      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)] pointer-events-none z-0"></div>

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-28 pb-16 lg:pt-32 lg:pb-24 overflow-hidden border-b border-white/5 z-10">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[300px] lg:w-[600px] h-[300px] lg:h-[600px] bg-blue-600/15 rounded-full blur-[100px] lg:blur-[140px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[250px] lg:w-[500px] h-[250px] lg:h-[500px] bg-purple-600/15 rounded-full blur-[100px] lg:blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 lg:mb-8 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] lg:text-xs font-bold uppercase tracking-wider animate-in fade-in zoom-in duration-500 backdrop-blur-md">
               <Zap size={14} className="fill-current" /> AI-Powered Recruitment
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight mb-6 leading-[1.1] animate-in slide-in-from-bottom-4 duration-700">
               Don&apos;t review 100 resumes. <br className="hidden md:block" />
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-purple-400">
                 Review the top 10.
               </span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-gray-400 mb-8 lg:mb-10 max-w-2xl mx-auto leading-relaxed px-2 animate-in slide-in-from-bottom-5 duration-700 delay-100">
               TruthHire automatically calculates a precise match score between your JD and the candidate. 
               <span className="text-white font-semibold block mt-2">If the score is less than 50%, they won't appear at the top of your pipeline.</span> 
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full sm:w-auto animate-in slide-in-from-bottom-6 duration-700 delay-200">
               <Link 
                 href="/recruiter/register"
                 className="w-full sm:w-auto inline-flex h-12 lg:h-14 px-8 bg-white text-black hover:bg-gray-200 rounded-full font-bold text-sm lg:text-base items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:-translate-y-0.5"
               >
                 Post a Job for Free <ArrowRight size={18} />
               </Link>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 animate-in fade-in duration-1000 delay-300">
               <span className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-400 font-medium bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                 <CheckCircle2 size={16} className="text-green-500" /> No credit card required
               </span>
               <span className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-400 font-medium bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                 <CheckCircle2 size={16} className="text-green-500" /> Unlimited Free Posts
               </span>
            </div>
        </div>
      </section>

      {/* ================= DASHBOARD PREVIEW ================= */}
      <section className="py-20 lg:py-28 relative z-10">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center mb-12 lg:mb-16">
               <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">Your Hiring Command Center</h2>
               <p className="text-base lg:text-lg text-gray-400 max-w-2xl mx-auto">
                  Experience the exact dashboard you get. Clean, powerful, and data-driven.
               </p>
            </div>

            {/* Interactive Tabs */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10">
               {[
                  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                  { id: 'jobs', label: 'Active Listings', icon: Briefcase },
                  { id: 'ats', label: 'Applicant Tracking', icon: Users },
               ].map((tab) => (
                  <button
                     key={tab.id}
                     onClick={() => setDashboardTab(tab.id as any)}
                     className={`flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 border ${
                        dashboardTab === tab.id 
                           ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-[0_0_20px_rgba(37,99,235,0.2)]' 
                           : 'bg-[#111]/50 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                     }`}
                  >
                     <tab.icon size={16} className="sm:w-[18px] sm:h-[18px]" /> {tab.label}
                  </button>
               ))}
            </div>

            {/* DASHBOARD MOCKUP CONTAINER (Glassmorphism) */}
            <div className="relative mx-auto max-w-6xl bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 rounded-2xl lg:rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row h-auto md:h-[650px] animate-float">
                
                {/* 1. SIDEBAR (Desktop Only) */}
                <div className="w-64 bg-[#050505]/50 border-r border-white/5 hidden md:flex flex-col flex-shrink-0">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-8 px-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Briefcase className="text-white" size={16} fill="currentColor" />
                            </div>
                            <span className="text-lg font-bold text-white tracking-tight">Recruiter</span>
                        </div>
                        
                        <div className="space-y-1.5">
                            <div className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${dashboardTab === 'overview' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                <LayoutDashboard size={18} /> Overview
                            </div>
                            <div className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${dashboardTab === 'jobs' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                <Briefcase size={18} /> Jobs & Hiring
                            </div>
                            <div className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${dashboardTab === 'ats' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                                <Users size={18} /> Applicant Tracking
                            </div>
                            <div className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors">
                                <FileText size={18} /> Company Profile
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. MAIN CONTENT AREA */}
                <div className="flex-1 flex flex-col min-w-0 bg-transparent">
                    
                    {/* Header */}
                    <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#050505]/30 flex-shrink-0 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <h2 className="text-base md:text-lg font-bold text-white truncate">
                                {dashboardTab === 'overview' && 'Dashboard Overview'}
                                {dashboardTab === 'jobs' && 'Active Listings'}
                                {dashboardTab === 'ats' && 'Applicant Tracking System'}
                            </h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white text-black px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:bg-gray-200 transition-colors cursor-pointer">
                                <Plus size={14} /> <span className="hidden sm:inline">Post New Job</span><span className="sm:hidden">Post Job</span>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Body - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
                        
                        {/* === TAB 1: OVERVIEW === */}
                        {dashboardTab === 'overview' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 md:space-y-8">
                                {/* Stats */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                                    {[
                                        { label: "Total Jobs Posted", value: "3", icon: Briefcase, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                                        { label: "Active Roles", value: "1", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
                                        { label: "Total Candidates", value: "12", icon: Users, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
                                        { label: "Profile Views", value: "450", icon: Eye, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
                                    ].map((stat, i) => (
                                        <div key={i} className={`bg-[#111]/50 border ${stat.border} p-5 rounded-2xl hover:bg-[#111] transition-colors`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                                                    <stat.icon size={20} />
                                                </div>
                                            </div>
                                            <h3 className="text-2xl md:text-3xl font-black text-white mb-1">{stat.value}</h3>
                                            <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Recent Activity */}
                                <div className="bg-[#111]/50 border border-white/10 rounded-2xl overflow-hidden">
                                    <div className="px-5 md:px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#050505]/50">
                                        <h3 className="font-bold text-white text-sm">Recent Activity</h3>
                                        <span className="text-blue-400 text-xs font-bold cursor-pointer hover:text-blue-300">View All</span>
                                    </div>
                                    <div className="px-5 md:px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group">
                                        <div>
                                            <p className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">Senior Frontend Engineer</p>
                                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Clock size={12}/> Posted 2 days ago • Remote</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">12</p>
                                            <p className="text-[9px] uppercase text-gray-500 font-bold tracking-widest">APPLICANTS</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* === TAB 2: ACTIVE LISTINGS === */}
                        {dashboardTab === 'jobs' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                {/* Create New Card */}
                                <div className="border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-8 hover:bg-white/5 hover:border-blue-500/50 transition-all cursor-pointer group h-[200px] md:h-[220px]">
                                    <div className="w-12 h-12 rounded-full bg-[#111] border border-white/10 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:border-blue-500 group-hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all">
                                        <Plus size={24} className="text-gray-400 group-hover:text-white transition-colors" />
                                    </div>
                                    <p className="text-gray-400 font-medium text-sm group-hover:text-white transition-colors">Create New Job Listing</p>
                                </div>

                                {/* Job Card */}
                                <div className="bg-[#111]/50 border border-white/10 rounded-2xl p-6 relative group h-[200px] md:h-[220px] flex flex-col justify-between hover:border-blue-500/30 hover:bg-[#111] transition-all shadow-lg">
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="p-2.5 bg-[#1a1a1a] rounded-xl border border-white/5 group-hover:border-blue-500/20 transition-colors">
                                                <Briefcase size={20} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                                            </div>
                                            <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">Active</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mt-2 group-hover:text-blue-400 transition-colors">Senior Frontend Engineer</h3>
                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><MapPin size={12}/> Remote</p>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2">
                                        <div className="flex gap-4 text-xs text-gray-400 font-medium">
                                            <span className="flex items-center gap-1.5"><Users size={14}/> 12</span>
                                            <span className="flex items-center gap-1.5"><Eye size={14}/> 140</span>
                                        </div>
                                        <button className="bg-white/10 text-white hover:bg-white hover:text-black border border-white/10 px-4 py-1.5 rounded-lg text-xs font-bold transition-all">Manage Role</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* === TAB 3: APPLICANT TRACKING === */}
                        {dashboardTab === 'ats' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col lg:flex-row gap-4 md:gap-6 h-auto lg:h-[calc(100%-2rem)]">
                                
                                {/* Left List (Applicants) */}
                                <div className="w-full lg:w-1/3 flex flex-col gap-4 h-[300px] lg:h-full flex-shrink-0">
                                    <div className="bg-[#111]/50 border border-white/10 rounded-2xl flex flex-col overflow-hidden h-full">
                                        <div className="p-4 border-b border-white/5 bg-[#050505]/50 flex justify-between items-center">
                                            <h3 className="font-bold text-white text-sm">Pipeline (1)</h3>
                                            <Filter size={14} className="text-gray-400" />
                                        </div>
                                        <div className="p-3 overflow-y-auto no-scrollbar">
                                            <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/30 cursor-pointer hover:bg-blue-600/20 transition-colors">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h4 className="font-bold text-white text-sm">Alex Morgan</h4>
                                                        <p className="text-xs text-gray-400 mt-0.5">Frontend Developer</p>
                                                    </div>
                                                    <div className="bg-green-500/10 text-green-400 px-2 py-1 rounded text-[10px] font-black border border-green-500/20">
                                                        70%
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] text-gray-500">
                                                    <span className="flex items-center gap-1"><Clock size={10}/> 2h ago</span>
                                                    <span className="bg-white/10 px-2 py-1 rounded uppercase font-bold text-gray-300">Under Review</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Detail View */}
                                <div className="flex-1 bg-[#111]/50 border border-white/10 rounded-2xl overflow-hidden flex flex-col h-auto lg:h-full min-h-[450px]">
                                    <div className="p-5 md:p-6 border-b border-white/5 flex items-center justify-between bg-[#050505]/50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl md:text-2xl font-bold text-white shadow-lg shadow-blue-500/20">
                                                A
                                            </div>
                                            <div>
                                                <h2 className="text-lg md:text-xl font-bold text-white">Alex Morgan</h2>
                                                <p className="text-blue-400 text-xs md:text-sm font-medium mt-0.5">Frontend Developer</p>
                                                <p className="text-gray-500 text-[11px] flex items-center gap-1.5 mt-1.5"><MapPin size={12}/> San Francisco • alex@example.com</p>
                                            </div>
                                        </div>
                                        <div className="text-right bg-[#111] p-3 rounded-xl border border-white/5">
                                            <div className="text-2xl md:text-3xl font-black text-green-400">70%</div>
                                            <div className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mt-0.5">Match Score</div>
                                        </div>
                                    </div>

                                    <div className="p-5 md:p-6 space-y-6 overflow-y-auto no-scrollbar flex-1">
                                        
                                        {/* Intelligence */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                                                <div className="flex items-center gap-2 mb-3 text-green-400 text-xs font-bold uppercase tracking-wider"><CheckCircle2 size={16}/> Verified Skills</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {['React', 'TypeScript', 'Tailwind', 'Node.js'].map(s => (
                                                        <span key={s} className="px-2.5 py-1 bg-green-500/10 text-green-400 text-[11px] rounded-lg border border-green-500/20 font-medium">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                                                <div className="flex items-center gap-2 mb-3 text-red-400 text-xs font-bold uppercase tracking-wider"><AlertTriangle size={16}/> Missing Required</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {['GraphQL', 'AWS Cloud'].map(s => (
                                                        <span key={s} className="px-2.5 py-1 bg-red-500/10 text-red-400 text-[11px] rounded-lg border border-red-500/20 font-medium">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                            <h4 className="text-sm font-bold text-white mb-2">AI Summary</h4>
                                            <p className="text-xs text-gray-400 leading-relaxed">
                                                Candidate possesses strong foundational knowledge in frontend technologies perfectly aligning with the JD. However, lacks explicit cloud architecture experience (AWS) which was marked as a secondary requirement.
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="p-5 bg-[#050505]/80 border-t border-white/5 flex justify-end gap-3 mt-auto backdrop-blur-md">
                                        <button className="px-5 py-2.5 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/10 transition-colors">Reject</button>
                                        <button className="px-6 py-2.5 bg-white text-black text-xs font-bold rounded-xl hover:bg-gray-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)]">Shortlist Candidate</button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
         </div>
      </section>

      {/* ================= FINAL CTA (Liquid Glass) ================= */}
      <section className="py-16 md:py-24 px-4 sm:px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-[2rem] lg:rounded-[3rem] bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/10 overflow-hidden shadow-2xl p-8 md:p-16 text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 blur-[80px] rounded-full pointer-events-none"></div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold tracking-widest uppercase mb-6 backdrop-blur-md">
                <Zap size={12} className="fill-current" />
                <span>Start Hiring Today</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
                Hire the top 10% <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  without the noise.
                </span>
              </h2>

              <p className="text-sm sm:text-base lg:text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                Join the platform where candidates are AI-verified against your exact needs. 
                Post your first job in minutes—no credit card needed.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto px-4 sm:px-0">
                <Link
                  href="/recruiter/register"
                  className="w-full sm:w-auto inline-flex h-14 px-8 bg-white text-black hover:bg-gray-200 rounded-full font-bold text-sm md:text-base items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:-translate-y-0.5"
                >
                  Post a Job for Free <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
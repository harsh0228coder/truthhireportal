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
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-20 pb-12 lg:pt-20 lg:pb-18 overflow-hidden border-b border-white/5">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[300px] lg:w-[600px] h-[300px] lg:h-[600px] bg-blue-600/10 rounded-full blur-[80px] lg:blur-[120px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[250px] lg:w-[500px] h-[250px] lg:h-[500px] bg-purple-600/10 rounded-full blur-[80px] lg:blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 lg:mb-8 rounded-full bg-blue-900/20 border border-blue-500/30 text-blue-400 text-[10px] lg:text-xs font-bold uppercase tracking-wider animate-in fade-in zoom-in duration-500">
               <Zap size={14} className="fill-current" /> AI-Powered Recruitment
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight mb-6 leading-[1.1] animate-in slide-in-from-bottom-4 duration-700">
               Don&apos;t review 100 resumes. <br className="hidden md:block" />
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-purple-400">
                 Review the top 10.
               </span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-gray-400 mb-8 lg:mb-10 max-w-2xl mx-auto leading-relaxed px-2 animate-in slide-in-from-bottom-5 duration-700 delay-100">
               TruthHire automatically calculates a match score between your JD and the candidate. 
               <span className="text-white font-semibold block sm:inline"> If the score is less than 50%, they cant apper on top place.</span> 
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full sm:w-auto animate-in slide-in-from-bottom-6 duration-700 delay-200">
               <Link 
                 href="/recruiter/register"
                 className="w-full sm:w-auto inline-flex h-12 px-8 bg-white text-black hover:bg-gray-200 rounded-full font-bold text-base items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-blue-500/50 hover:scale-105"
               >
                 Post a Job for Free <ArrowRight size={18} />
               </Link>
            </div>

            <p className="mt-8 text-xs sm:text-sm text-gray-500 font-medium flex flex-wrap justify-center gap-x-6 gap-y-2 animate-in fade-in duration-1000 delay-300">
               <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-500" /> No credit card required</span>
               <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-500" /> Unlimited Free Posts</span>
            </p>
        </div>
      </section>

      {/* ================= DASHBOARD PREVIEW ================= */}
      <section className="py-20 bg-[#09090b] relative overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none"></div>

         <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center mb-12">
               <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">Your Hiring Command Center</h2>
               <p className="text-base text-gray-400 max-w-2xl mx-auto">
                  Experience the exact dashboard you get. Clean, powerful, and data-driven.
               </p>
            </div>

            {/* Interactive Tabs */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-8">
               {[
                  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                  { id: 'jobs', label: 'Active Listings', icon: Briefcase },
                  { id: 'ats', label: 'Applicant Tracking', icon: Users },
               ].map((tab) => (
                  <button
                     key={tab.id}
                     onClick={() => setDashboardTab(tab.id as any)}
                     className={`flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 border ${
                        dashboardTab === tab.id 
                           ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)]' 
                           : 'bg-[#111] text-gray-400 border-white/10 hover:bg-white/5 hover:text-white'
                     }`}
                  >
                     <tab.icon size={14} className="sm:w-4 sm:h-4" /> {tab.label}
                  </button>
               ))}
            </div>

            {/* DASHBOARD MOCKUP CONTAINER */}
            <div className="relative mx-auto max-w-6xl bg-[#09090b] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[650px] md:h-[600px]">
                
                {/* 1. SIDEBAR (Desktop Only) */}
                <div className="w-64 bg-[#09090b] border-r border-[#27272a] hidden md:flex flex-col flex-shrink-0">
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-8 px-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg">
                                <Briefcase className="text-white" size={16} fill="currentColor" />
                            </div>
                            <span className="text-lg font-bold text-white tracking-tight">Recruiter</span>
                        </div>
                        
                        <div className="space-y-1">
                            <div className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${dashboardTab === 'overview' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>
                                <LayoutDashboard size={18} /> Overview
                            </div>
                            <div className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${dashboardTab === 'jobs' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>
                                <Briefcase size={18} /> Jobs & Hiring
                            </div>
                            <div className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${dashboardTab === 'ats' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>
                                <Users size={18} /> Applicant Tracking
                            </div>
                            <div className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400">
                                <FileText size={18} /> Company Profile
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. MAIN CONTENT AREA */}
                <div className="flex-1 flex flex-col bg-[#000000] min-w-0">
                    
                    {/* Header */}
                    <div className="h-16 border-b border-[#27272a] flex items-center justify-between px-6 bg-[#09090b] flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <h2 className="text-sm md:text-lg font-bold text-white truncate">
                                {dashboardTab === 'overview' && 'Dashboard'}
                                {dashboardTab === 'jobs' && 'Active Listings'}
                                {dashboardTab === 'ats' && 'Applicant Tracking'}
                            </h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white text-black px-3 py-1.5 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-2 shadow-lg cursor-default">
                                <Plus size={14} /> <span className="hidden sm:inline">Post Job</span><span className="sm:hidden">New</span>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Body - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8">
                        
                        {/* === TAB 1: OVERVIEW === */}
                        {dashboardTab === 'overview' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6 md:space-y-8">
                                {/* Stats */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                                    {[
                                        { label: "Total Jobs", value: "3", icon: Briefcase, color: "text-blue-400", bg: "bg-blue-900/20" },
                                        { label: "Active Roles", value: "1", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-900/20" },
                                        { label: "Candidates", value: "12", icon: Users, color: "text-blue-500", bg: "bg-blue-900/20" },
                                        { label: "Views", value: "450", icon: Eye, color: "text-purple-400", bg: "bg-purple-900/20" },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-[#09090b] border border-[#27272a] p-4 md:p-5 rounded-xl">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                                                    <stat.icon size={18} />
                                                </div>
                                            </div>
                                            <h3 className="text-xl md:text-2xl font-bold text-white mb-1">{stat.value}</h3>
                                            <p className="text-[10px] md:text-xs text-gray-400 font-medium">{stat.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Recent Activity */}
                                <div className="bg-[#09090b] border border-[#27272a] rounded-xl overflow-hidden">
                                    <div className="px-4 md:px-6 py-4 border-b border-[#27272a] flex justify-between items-center">
                                        <h3 className="font-bold text-white text-sm">Recent Activity</h3>
                                        <span className="text-blue-400 text-xs font-medium cursor-pointer">View All</span>
                                    </div>
                                    <div className="px-4 md:px-6 py-4 flex items-center justify-between hover:bg-[#111] transition-colors cursor-pointer">
                                        <div>
                                            <p className="font-bold text-white text-sm">Senior Frontend Engineer</p>
                                            <p className="text-xs text-gray-500 mt-1">Remote • Posted 2 days ago</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-white">12</p>
                                            <p className="text-[9px] uppercase text-gray-500 font-bold tracking-wider">APPLICANTS</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* === TAB 2: ACTIVE LISTINGS === */}
                        {dashboardTab === 'jobs' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                {/* Create New Card */}
                                <div className="border-2 border-dashed border-[#27272a] rounded-xl flex flex-col items-center justify-center p-8 hover:bg-[#09090b] hover:border-blue-500/50 transition-all cursor-pointer group h-[180px] md:h-[200px]">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#111] flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Plus size={20} className="text-gray-400 group-hover:text-white" />
                                    </div>
                                    <p className="text-gray-400 font-medium text-sm group-hover:text-white">Create New Job</p>
                                </div>

                                {/* Job Card */}
                                <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-5 md:p-6 relative group h-[180px] md:h-[200px] flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="p-2 bg-[#111] rounded-lg border border-[#27272a]">
                                                <Briefcase size={18} className="text-white" />
                                            </div>
                                            <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Active</span>
                                        </div>
                                        <h3 className="text-base md:text-lg font-bold text-white mt-2">Senior Frontend Engineer</h3>
                                        <p className="text-xs text-gray-500">Remote</p>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-[#27272a] pt-4 mt-2">
                                        <div className="flex gap-3 text-xs text-gray-400">
                                            <span className="flex items-center gap-1"><Users size={12}/> 12</span>
                                            <span className="flex items-center gap-1"><Eye size={12}/> 140</span>
                                        </div>
                                        <button className="bg-white text-black px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-200 transition">Manage</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* === TAB 3: APPLICANT TRACKING === */}
                        {dashboardTab === 'ats' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col lg:flex-row gap-4 md:gap-6 h-full">
                                
                                {/* Left List (Applicants) */}
                                <div className="w-full lg:w-1/3 flex flex-col gap-4 h-[250px] lg:h-full">
                                    <div className="bg-[#09090b] border border-[#27272a] rounded-xl flex flex-col overflow-hidden h-full">
                                        <div className="p-3 md:p-4 border-b border-[#27272a] bg-[#111]">
                                            <h3 className="font-bold text-white text-sm">Applicants (1)</h3>
                                        </div>
                                        <div className="p-2 overflow-y-auto">
                                            <div className="p-3 md:p-4 rounded-lg bg-[#151515] border border-blue-500/30 cursor-pointer">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-bold text-white text-sm">Alex Morgan</h4>
                                                        <p className="text-xs text-gray-400">Frontend Developer</p>
                                                    </div>
                                                    <div className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded text-[10px] font-bold">
                                                        70%
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] text-gray-500 mt-2">
                                                    <span>Applied 2h ago</span>
                                                    <span className="bg-[#222] px-2 py-0.5 rounded uppercase font-bold text-gray-300">Applied</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Detail View */}
                                <div className="flex-1 bg-[#09090b] border border-[#27272a] rounded-xl overflow-hidden flex flex-col h-full min-h-[400px]">
                                    <div className="p-4 md:p-6 border-b border-[#27272a] flex items-center justify-between bg-[#111]">
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-lg md:text-xl font-bold text-white">A</div>
                                            <div>
                                                <h2 className="text-base md:text-lg font-bold text-white">Alex Morgan</h2>
                                                <p className="text-blue-400 text-xs font-medium">Frontend Developer</p>
                                                <p className="text-gray-500 text-[10px] flex items-center gap-1 mt-0.5"><MapPin size={10}/> San Francisco • alex@example.com</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl md:text-3xl font-black text-white">70%</div>
                                            <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Match Score</div>
                                        </div>
                                    </div>

                                    <div className="p-4 md:p-6 space-y-6 overflow-y-auto">
                                        
                                        {/* Intelligence (Updated to show only matched and missing) */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="bg-green-900/10 border border-green-500/20 rounded-lg p-3 md:p-4">
                                                <div className="flex items-center gap-2 mb-3 text-green-400 text-xs font-bold uppercase"><CheckCircle2 size={14}/> Matched Skills</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {['React', 'TypeScript', 'Tailwind', 'Node.js'].map(s => (
                                                        <span key={s} className="px-2 py-1 bg-green-500/20 text-green-300 text-[10px] rounded font-bold">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="bg-red-900/10 border border-red-500/20 rounded-lg p-3 md:p-4">
                                                <div className="flex items-center gap-2 mb-3 text-red-400 text-xs font-bold uppercase"><AlertTriangle size={14}/> Missing Skills</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {['GraphQL', 'AWS'].map(s => (
                                                        <span key={s} className="px-2 py-1 bg-red-500/20 text-red-300 text-[10px] rounded font-bold">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 bg-[#111] border-t border-[#27272a] flex justify-end gap-3 mt-auto">
                                        <button className="px-4 py-2 border border-red-500/30 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/10 transition">Reject</button>
                                        <button className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-500 transition shadow-lg">Shortlist Candidate</button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
         </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="py-16 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl bg-[#111] border border-white/10 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 blur-[80px] rounded-full pointer-events-none"></div>

            <div className="relative z-10 px-6 py-16 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold tracking-widest uppercase mb-6">
                <Zap size={10} className="fill-current" />
                <span>Start Hiring Today</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                Hire the top 10% <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-purple-400">
                  without the noise.
                </span>
              </h2>

              <p className="text-base text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
                Join the platform where 100% of candidates are AI-verified. 
                Post your first job in minutes—no credit card needed.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/recruiter/register"
                  className="w-full sm:w-auto inline-flex h-12 px-8 bg-white text-black hover:bg-gray-200 rounded-full font-bold text-base items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-blue-500/50 hover:scale-105"
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
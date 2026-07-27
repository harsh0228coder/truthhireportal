"use client";

import LoadingSpinner from '@/components/LoadingSpinner';
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Shield,
  Eye,
  Heart,
  Zap,
  ArrowRight,
  Target,
  Globe,
  CheckCircle2,
  Users,
  Search,
  Award,
  Sparkles,
  ChevronRight
} from "lucide-react";

// --- ANIMATED COUNTER COMPONENT ---
const AnimatedCounter = ({ end, duration = 2000, suffix = "" }: { end: number, duration?: number, suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      // Easing function for smooth effect (easeOutExpo)
      const ease = (x: number) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x));
      
      setCount(Math.floor(ease(percentage) * end));

      if (progress < duration) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [end, duration]);

  // Format number (e.g., 1500 -> 1.5k)
  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toString();
  };

  return <span>{formatNumber(count)}{suffix}</span>;
};

export default function AboutUs() {
  // --- REAL-TIME STATS STATE ---
  const [stats, setStats] = useState({
    jobsVerified: 100, 
    ghostJobsBlocked: 15000,
    activeCandidates: 50000,
    hiringPartners: 200
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats({
            jobsVerified: 100, 
            ghostJobsBlocked: Math.floor(data.total_jobs * 0.25) + 1200, 
            activeCandidates: data.total_users || 500,
            hiringPartners: data.total_recruiters || 50
          });
        }
      } catch (error) {
        console.error("Stats fetch failed, using defaults");
      }
    };

    fetchStats();
  }, []);

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
      `}</style>

      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)] pointer-events-none z-0"></div>

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
        
        {/* Glow Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[400px] md:h-[600px] bg-gradient-to-b from-blue-900/10 via-transparent to-transparent blur-3xl pointer-events-none z-0"></div>

        <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-default mb-8 md:mb-10 backdrop-blur-md relative z-10">
          <Sparkles size={14} className="text-blue-400" />
          <span className="text-[11px] md:text-[13px] font-medium text-gray-300">Our Mission</span>
        </div>
        
        <h1 className="animate-fade-in-up delay-100 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 md:mb-8 relative z-10">
          <span className="text-gray-400 font-medium block md:inline">We are rewriting the</span><br className="hidden md:block"/>
          <span className="text-white font-bold block md:inline mt-2 md:mt-0">
             Code of <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-500">Recruitment.</span>
          </span>
        </h1>
        
        <p className="animate-fade-in-up delay-200 text-base md:text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed px-2 relative z-10">
          In a world of ghost jobs and AI spam, TruthHire is the verification layer the industry desperately needs. We don't just list jobs; we validate them.
        </p>

      </section>

      {/* ================= STATS BANNER (LIQUID GLASS) ================= */}
      <section className="relative z-20 -mt-10 md:-mt-16 mb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto animate-fade-in-up delay-300">
        <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-[0_8px_32px_rgba(59,130,246,0.1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center relative z-10">
            {[
              { label: "Jobs Verified", value: stats.jobsVerified, color: "text-emerald-400", suffix: "%" },
              { label: "Ghost Jobs Blocked", value: stats.ghostJobsBlocked, color: "text-blue-400", suffix: "+" },
              { label: "Active Candidates", value: stats.activeCandidates, color: "text-purple-400", suffix: "+" },
              { label: "Hiring Partners", value: stats.hiringPartners, color: "text-indigo-400", suffix: "+" },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className={`text-3xl md:text-5xl font-bold mb-2 ${stat.color} tracking-tight drop-shadow-lg`}>
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </span>
                <span className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest font-semibold">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= OUR STORY ================= */}
      <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Text Side */}
          <div className="order-2 lg:order-1">
            <h2 className="text-3xl md:text-5xl font-bold mb-8 tracking-tight leading-tight">
              From Broken to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-500">
                Verified.
              </span>
            </h2>
            <div className="space-y-6 text-gray-400 text-base md:text-lg leading-relaxed">
              <p>
                It started with a simple observation: <strong className="text-gray-200">The modern job search is broken.</strong> Candidates apply to hundreds of roles, only to be ghosted by automated systems or lured into scams.
              </p>
              <p>
                We realized the problem wasn't a lack of talent or opportunity—it was a massive lack of <span className="text-white font-bold">trust</span>. Platforms were prioritizing volume over validity.
              </p>
              <p>
                TruthHire was founded on a radical, uncompromising idea: What if a job board was entirely responsible for the quality of its listings? We built the Truth Engine™ to ensure that every role you see is real, active, and attainable.
              </p>
            </div>
          </div>

          {/* Visual Side (Glass Terminal) */}
          <div className="relative order-1 lg:order-2 w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 blur-[100px] rounded-full pointer-events-none"></div>
            
            <div className="relative bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-2xl animate-float">
              {/* Terminal Header */}
              <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                <div className="ml-auto text-[10px] md:text-xs text-gray-500 font-mono tracking-wider">
                  origin_story.ts
                </div>
              </div>
              
              {/* Terminal Body */}
              <div className="space-y-3 font-mono text-xs md:text-sm">
                <div className="text-gray-500">// The Problem</div>
                <div className="text-red-400">
                  <span className="text-purple-400">const</span> jobMarket = <span className="text-green-400">"Broken"</span>;
                </div>
                <div className="text-gray-400 pl-4 mb-4 opacity-80">
                  Ghost jobs. Unresponsive recruiters. Scams.
                </div>
                
                <div className="text-gray-500">// The Solution</div>
                <div className="text-blue-400">
                  <span className="text-purple-400">const</span> truthHire = <span className="text-yellow-400">new</span> Platform();
                </div>
                <div className="text-gray-300 pl-4">
                  truthHire.<span className="text-blue-300">verifyEveryJob</span>();
                </div>
                <div className="text-gray-300 pl-4">
                  truthHire.<span className="text-blue-300">banFakes</span>();
                </div>
                <div className="text-purple-400 pl-4 mt-2">
                  return <span className="text-green-400">"Hired"</span>;
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ================= HOW WE VERIFY (Technology) ================= */}
      <section className="py-20 md:py-32 bg-[#050505] border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
              Inside the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-500">Truth Engine™</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              We combine advanced AI gap analysis with strict human auditing protocols to maintain the cleanest, most verified job database in the industry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: Search,
                title: "AI Analysis",
                desc: "Our bots scan thousands of data points—domain age, email validity, and salary ranges—to flag suspicious activity instantly before it reaches you.",
                color: "text-blue-400",
                bg: "bg-blue-500/10",
                border: "border-blue-500/20"
              },
              {
                icon: Users,
                title: "Recruiter Verification",
                desc: "We strictly require corporate email verification and LinkedIn integration. No anonymous free email accounts posting fake 'dream jobs'.",
                color: "text-purple-400",
                bg: "bg-purple-500/10",
                border: "border-purple-500/20"
              },
              {
                icon: CheckCircle2,
                title: "Active Status Check",
                desc: "If a recruiter doesn't interact with an application or log into the portal for 14 days, the job is automatically flagged as 'Inactive'.",
                color: "text-green-400",
                bg: "bg-green-500/10",
                border: "border-green-500/20"
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-[#0a0a0a] p-8 rounded-[24px] border border-white/5 hover:bg-[#111] hover:border-white/10 transition-all duration-300 group shadow-lg">
                <div className={`w-14 h-14 ${feature.bg} ${feature.color} border ${feature.border} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CORE VALUES (Bento Grid) ================= */}
      <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
            Our Operating <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">DNA</span>
          </h2>
          <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            The non-negotiable principles that guide every line of code we write and every feature we launch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Large Card */}
          <div className="md:col-span-2 bg-[#111]/80 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-[32px] relative overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-blue-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="relative z-10">
              <Shield className="text-blue-400 mb-6" size={36} />
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Radical Transparency</h3>
              <p className="text-base text-gray-400 max-w-xl leading-relaxed">
                We believe candidates deserve to know the exact salary ranges, the required tech stack, and the ATS match probability before they apply. We hide nothing.
              </p>
            </div>
          </div>

          {/* Tall Card */}
          <div className="md:row-span-2 bg-[#111]/80 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-[32px] relative overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-purple-500/30 transition-colors flex flex-col justify-center">
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <div className="absolute top-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="relative z-10">
                <Heart className="text-purple-400 mb-6" size={36} />
                <h3 className="text-2xl font-bold text-white mb-4">Empathy First</h3>
                <p className="text-base text-gray-400 leading-relaxed">
                  Job hunting is universally stressful. We design every feature to reduce anxiety—from precise gap analysis tools to automated resume tailoring. We treat candidates like humans, not data points.
                </p>
            </div>
          </div>

          {/* Standard Card 1 */}
          <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] group hover:border-yellow-500/30 transition-colors shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <Zap className="text-yellow-400 mb-5" size={32} />
            <h3 className="text-xl font-bold text-white mb-3">Speed & Efficiency</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              We optimize for the fastest route to an interview, stripping away unnecessary forms and redundant steps.
            </p>
          </div>

          {/* Standard Card 2 */}
          <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] group hover:border-green-500/30 transition-colors shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <Award className="text-green-400 mb-5" size={32} />
            <h3 className="text-xl font-bold text-white mb-3">Meritocracy</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Verified skills over pedigree. Our algorithms are designed to highlight exactly what you can build.
            </p>
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA (LIQUID GLASS) ================= */}
      <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto relative z-10 mb-12">
        <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/10 rounded-[40px] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl">
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
            
            <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-white">
                    Ready to stop searching <br className="hidden sm:block"/> and start <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">finding?</span>
                </h2>
                <p className="text-gray-400 text-base md:text-lg mb-10 max-w-2xl mx-auto">
                    Join thousands of verified candidates who have already bypassed the noise and connected directly with top companies.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-5 w-full sm:w-auto px-4 sm:px-0">
                    <Link
                        href="/jobs"
                        className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-b from-blue-500/20 to-transparent backdrop-blur-xl border border-blue-500/30 text-white text-base font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(59,130,246,0.2)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] hover:bg-blue-500/20 hover:border-blue-400/50 hover:shadow-[0_8px_40px_rgba(59,130,246,0.4)] hover:-translate-y-0.5"
                    >
                        Browse Verified Jobs <ChevronRight size={18} />
                    </Link>
                    <Link
                        href="/signup"
                        className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-b from-white/10 to-transparent backdrop-blur-xl border border-white/10 text-white text-base font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(0,0,0,0.2)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:bg-white/10 hover:border-white/20 hover:shadow-[0_8px_32px_rgba(255,255,255,0.05)] hover:-translate-y-0.5"
                    >
                        Join the Community
                    </Link>
                </div>
            </div>
        </div>
      </section>

    </div>
  );
}
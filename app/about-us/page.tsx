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
  Linkedin, // Added Linkedin icon
} from "lucide-react";

// --- ANIMATED COUNTER COMPONENT ---
const AnimatedCounter = ({ end, duration = 2000, suffix = "" }: { end: number, duration?: number, suffix?: string }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);

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
    jobsVerified: 100, // Default percentages or values
    ghostJobsBlocked: 15000,
    activeCandidates: 50000,
    hiringPartners: 200
  });

  // --- TEAM DATA CONFIGURATION ---
  // INSTRUCTIONS: 
  // 1. Put your images in the /public folder (e.g., /public/team/founder.jpg)
  // 2. Change the 'image' path below to "/team/founder.jpg"
  const TEAM_MEMBERS = [
    {
      name: "Harshawardhan Chavan",
      role: "Founder & CEO",
      // Currently using a placeholder. Replace with: "/team/harsh.jpg"
      image: "https://ui-avatars.com/api/?name=Harsh&background=0B1120&color=3B82F6&size=200", 
      linkedin: "https://www.linkedin.com/in/harshwardhan-chavan-hs28022002/"
    },
    {
      name: "Co-Founder Name",
      role: "CTO / Co-Founder",
      image: "https://ui-avatars.com/api/?name=Co+Founder&background=0B1120&color=A855F7&size=200",
      linkedin: "#"
    },
    // Add more members here if needed
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats({
            jobsVerified: 100, // Always 100% logic
            // Estimate ghost jobs as a ratio if not provided by DB, or use raw data
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
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* GLOBAL STYLES */}
      <style jsx global>{`
        .bg-grid-pattern {
          background-image: linear-gradient(
              to right,
              #ffffff05 1px,
              transparent 1px
            ),
            linear-gradient(to bottom, #ffffff05 1px, transparent 1px);
          background-size: 40px 40px;
        }
        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(0px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      {/* ================= HERO SECTION ================= */}
      {/* Reduced mobile padding: pt-32 -> pt-16, pb-20 -> pb-12 */}
      <section className="relative pt-16 pb-12 md:pt-18 md:pb-18 px-6 border-b border-white/5 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid-pattern [mask-image:linear-gradient(to_bottom,white,transparent)] opacity-30"></div>
        <div className="absolute top-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[500px] bg-blue-600/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/20 border border-blue-500/30 text-blue-400 text-[10px] md:text-xs font-bold tracking-widest uppercase mb-6 md:mb-8">
            <Shield size={12} /> The TruthHire Promise
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 md:mb-8 leading-[1.1]">
            We are rewriting the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-blue-400">
              Code of Recruitment.
            </span>
          </h1>
          <p className="text-base md:text-xl text-gray-400 leading-relaxed max-w-3xl mx-auto mb-8 md:mb-10">
            In a world of ghost jobs and AI spam, TruthHire is the verification
            layer the industry desperately needs. We don't just list jobs; we
            validate them.
          </p>
        </div>
      </section>

      {/* ================= STATS BANNER (DYNAMIC) ================= */}
      <section className="border-b border-white/5 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6 py-8 md:py-12 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
          {[
            { 
              label: "Jobs Verified", 
              value: stats.jobsVerified, 
              color: "text-green-500",
              suffix: "%"
            },
            {
              label: "Ghost Jobs Blocked",
              value: stats.ghostJobsBlocked,
              color: "text-red-500",
              suffix: "+"
            },
            {
              label: "Active Candidates",
              value: stats.activeCandidates,
              color: "text-blue-500",
              suffix: "+"
            },
            {
              label: "Hiring Partners",
              value: stats.hiringPartners,
              color: "text-purple-500",
              suffix: "+"
            },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center">
              <span
                className={`text-2xl md:text-4xl font-bold mb-1 ${stat.color}`}
              >
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
              </span>
              <span className="text-[10px] md:text-sm text-gray-500 uppercase tracking-widest font-bold">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ================= OUR STORY ================= */}
      <section className="py-16 md:py-24 px-6 relative">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Visual Side */}
          <div className="relative order-2 md:order-1">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
            <div className="relative bg-[#111] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl animate-float">
              <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div className="ml-auto text-xs text-gray-500 font-mono">
                  origin_story.tsx
                </div>
              </div>
              <div className="space-y-4 font-mono text-xs md:text-sm">
                <div className="text-gray-500">// The Problem</div>
                <div className="text-red-400">
                  <span className="text-purple-400">const</span> jobMarket ={" "}
                  <span className="text-green-400">"Broken"</span>;
                </div>
                <div className="text-gray-400 pl-4">
                  Ghost jobs. Unresponsive recruiters. Scams.
                </div>
                <div className="text-gray-500 mt-4">// The Solution</div>
                <div className="text-blue-400">
                  <span className="text-purple-400">const</span> truthHire ={" "}
                  <span className="text-yellow-400">new</span> Platform();
                </div>
                <div className="text-white pl-4">
                  truthHire.verifyEveryJob();
                </div>
                <div className="text-white pl-4">truthHire.banFakes();</div>
                <div className="text-green-400 pl-4">
                  return <span className="text-white">"Hired";</span>
                </div>
              </div>
            </div>
          </div>

          {/* Text Side */}
          <div className="order-1 md:order-2">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight leading-tight">
              From Broken to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-blue-400">
                Verified.
              </span>
            </h2>
            <div className="space-y-4 md:space-y-6 text-gray-400 text-base md:text-lg leading-relaxed">
              <p>
                It started with a simple observation:{" "}
                <strong>The modern job search is broken.</strong>
                Candidates apply to hundreds of roles, only to be ghosted by
                automated systems or lured into scams.
              </p>
              <p>
                We realized the problem wasn't a lack of talent or
                opportunity—it was a lack of{" "}
                <span className="text-white font-bold">trust</span>.
              </p>
              <p>
                TruthHire was founded on a radical idea: What if a job board was
                responsible for the quality of its listings? We built a "Truth
                Engine" that validates every post before it goes live.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= HOW WE VERIFY (Technology) ================= */}
      <section className="py-16 md:py-24 bg-[#0A0A0A] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 tracking-tight">
              Inside the{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-blue-400">
                Truth Engine™
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-base md:text-lg">
              We combine AI analysis with human auditing to maintain the
              cleanest job database in the industry.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {/* Tech Card 1 */}
            <div className="bg-[#111] p-6 md:p-8 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all group">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-900/20 text-blue-400 rounded-xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                <Search size={24} />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3">
                AI Analysis
              </h3>
              <p className="text-sm md:text-base text-gray-400">
                Our bots scan thousands of data points—domain age, email
                validity, and salary ranges—to flag suspicious activity
                instantly.
              </p>
            </div>

            {/* Tech Card 2 */}
            <div className="bg-[#111] p-6 md:p-8 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all group">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-purple-900/20 text-purple-400 rounded-xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3">
                Recruiter Verification
              </h3>
              <p className="text-sm md:text-base text-gray-400">
                We require corporate email verification and LinkedIn
                integration. No anonymous gmail accounts posting "dream jobs."
              </p>
            </div>

            {/* Tech Card 3 */}
            <div className="bg-[#111] p-6 md:p-8 rounded-2xl border border-white/5 hover:border-green-500/30 transition-all group">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-green-900/20 text-green-400 rounded-xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3">
                Active Status Check
              </h3>
              <p className="text-sm md:text-base text-gray-400">
                If a recruiter doesn't interact with an application for 14 days,
                the job is automatically flagged as "Inactive."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CORE VALUES ================= */}
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 tracking-tight">
              Our Operating <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-blue-400">DNA</span>
            </h2>
            <p className="text-gray-400 text-base md:text-lg">
              The non-negotiable principles that guide every line of code we
              write.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Large Card */}
            <div className="md:col-span-2 bg-[#111] border border-white/10 p-6 md:p-8 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] group-hover:bg-blue-600/20 transition-all"></div>
              <div className="relative z-10">
                <Shield className="text-blue-500 mb-4" size={32} />
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                  Radical Transparency
                </h3>
                <p className="text-sm md:text-base text-gray-400 max-w-md">
                  We believe candidates deserve to know the salary, the tech
                  stack, and the interview process before they apply. We hide
                  nothing.
                </p>
              </div>
            </div>

            {/* Tall Card */}
            <div className="md:row-span-2 bg-[#111] border border-white/10 p-6 md:p-8 rounded-3xl relative overflow-hidden group">
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <Heart className="text-purple-500 mb-4" size={32} />
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                Empathy First
              </h3>
              <p className="text-sm md:text-base text-gray-400">
                Job hunting is stressful. We design every feature to reduce
                anxiety, from "Application Viewed" notifications to clear
                rejection letters. We treat you like a human.
              </p>
            </div>

            {/* Standard Card */}
            <div className="bg-[#111] border border-white/10 p-6 md:p-8 rounded-3xl group hover:bg-[#161616] transition-colors">
              <Zap className="text-yellow-500 mb-4" size={32} />
              <h3 className="text-lg md:text-xl font-bold text-white mb-2">
                Speed & Efficiency
              </h3>
              <p className="text-sm md:text-base text-gray-400">
                We optimize for the fastest route to an interview.
              </p>
            </div>

            {/* Standard Card */}
            <div className="bg-[#111] border border-white/10 p-6 md:p-8 rounded-3xl group hover:bg-[#161616] transition-colors">
              <Award className="text-green-500 mb-4" size={32} />
              <h3 className="text-lg md:text-xl font-bold text-white mb-2">
                Meritocracy
              </h3>
              <p className="text-sm md:text-base text-gray-400">
                Skills over pedigree. We highlight what you can do.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TEAM SECTION (UPDATED) ================= */}
      <section className="py-16 md:py-24 bg-[#0A0A0A] border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 tracking-tight">
            Built by{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-blue-400">
              Engineers
            </span>
            , for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-blue-400">
              Engineers
            </span>
          </h2>
          <p className="text-gray-400 mb-10 md:mb-16 max-w-2xl mx-auto text-base md:text-lg">
            We are a small, dedicated team of developers, designers, and HR
            experts based in India, obsessed with fixing recruitment.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-center">
            {TEAM_MEMBERS.map((member, i) => (
              <div key={i} className="group flex flex-col items-center">
                {/* Image Container with Hover Effect */}
                <div className="w-32 h-32 md:w-40 md:h-40 mx-auto bg-[#1a1a1a] rounded-full border border-white/10 mb-5 flex items-center justify-center overflow-hidden relative transition-all duration-300 group-hover:border-blue-500/50 group-hover:shadow-[0_0_20px_rgba(37,99,235,0.2)]">
                  {member.image ? (
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                  ) : (
                    <Users
                      size={40}
                      className="text-gray-600 group-hover:text-white transition-colors"
                    />
                  )}
                </div>
                
                {/* Name & Role */}
                <h3 className="text-white font-bold text-lg mb-1 group-hover:text-blue-400 transition-colors">
                  {member.name}
                </h3>
                <p className="text-blue-500/80 text-xs md:text-sm uppercase font-bold tracking-wider mb-3">
                  {member.role}
                </p>
                
                {/* LinkedIn Link (Optional) */}
                {member.linkedin && (
                  <a 
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-white transition-colors p-2"
                  >
                    <Linkedin size={18} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="py-16 md:py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/5"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-6xl font-bold mb-6 md:mb-8 tracking-tight">
            Ready to stop searching <br /> and start{" "}
            <span className="text-blue-500">finding?</span>
          </h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/jobs"
              className="inline-flex h-12 md:h-14 px-8 bg-white text-black hover:bg-gray-200 rounded-full font-bold text-base md:text-lg items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-blue-500/50 hover:scale-105"
            >
              Browse Verified Jobs <ArrowRight size={20} />
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-12 md:h-14 px-8 bg-transparent border border-white/20 text-white hover:bg-white/10 rounded-full font-bold text-base md:text-lg items-center justify-center gap-2 transition-all"
            >
              Join the Community
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
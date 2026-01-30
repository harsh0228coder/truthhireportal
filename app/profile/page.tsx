"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  MapPin, Mail, Phone, Github, Linkedin, Globe,
  Briefcase, Building2, FileText,
  Shield, Zap, Share2,
  Edit3, Download, Wallet, Hourglass, TrendingUp, Clock,
  Upload, Loader2, Target, ArrowRight, CheckCircle2, AlertCircle, Plus, Eye
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// --- UTILITY: Parse JSON Data ---
const safeParse = (data: any, fallback: any = []) => {
  if (!data) return fallback;
  if (Array.isArray(data)) return data;
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      if (typeof parsed === "string") return JSON.parse(parsed);
      return parsed;
    } catch (e) {
      return data.includes(",") ? data.split(",").map((s: string) => s.trim()) : fallback;
    }
  }
  return fallback;
};

// --- COMPONENT: Circular Progress Bar ---
const ProfileScoreCircle = ({ score }: { score: number }) => {
  const radius = 45; 
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  // Color logic
  let color = "text-red-500";
  if (score >= 50) color = "text-yellow-500";
  if (score >= 75) color = "text-green-500";

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        {/* Background Track */}
        <circle
          cx="56"
          cy="56"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          className="text-white/5"
        />
        {/* Progress Arc */}
        <circle
          cx="56"
          cy="56"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${color} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-white">{score}%</span>
      </div>
    </div>
  );
};

export default function ProfilePage() {
  const router = useRouter();
  
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingResume, setUploadingResume] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push("/login");
    } else {
      setIsSignedIn(true);
      fetchUserProfile();
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Failed to fetch profile");
      
      const data = await res.json();
      setUser(data);
    } catch (e) {
      console.error("Profile Fetch Error", e);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file.");
      return;
    }

    setUploadingResume(true);
    const toastId = toast.loading("Uploading resume...");

    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token');
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}/resume`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");

        const data = await response.json();
        
        setUser({ ...user, resume_filename: data.filename });
        toast.success("Resume updated successfully!", { id: toastId });
    } catch (error) {
        console.error(error);
        toast.error("Failed to upload resume", { id: toastId });
    } finally {
        setUploadingResume(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const calculateProfileStrength = () => {
    if (!user) return { score: 0, missing: [] };

    let score = 0;
    const missing: { label: string, points: number }[] = [];

    // 1. Basic Info (15%)
    if (user.name && user.email && user.phone) score += 15;
    else missing.push({ label: "Contact Info", points: 15 });

    // 2. Headline & Location (10%)
    if (user.headline && user.location) score += 10;
    else missing.push({ label: "Headline & Location", points: 10 });

    // 3. Profile Photo (10%)
    if (user.profile_image) score += 10;
    else missing.push({ label: "Profile Photo", points: 10 });

    // 4. Resume (20%) - Critical
    if (user.resume_filename) score += 20;
    else missing.push({ label: "Resume PDF", points: 20 });

    // 5. Bio / Summary (10%)
    if (user.bio && user.bio.length > 20) score += 10;
    else missing.push({ label: "Summary", points: 10 });

    // 6. Skills (10%)
    const skills = safeParse(user.skills);
    if (skills.length >= 3) score += 10;
    else missing.push({ label: "At least 3 Skills", points: 10 });

    // 7. Experience (15%)
    const exp = safeParse(user.experiences);
    if (exp.length > 0) score += 15;
    else missing.push({ label: "Work Experience", points: 15 });

    // 8. Education (10%)
    const eduList = safeParse(user.education);
    if (eduList.length > 0 || user.degree) score += 10;
    else missing.push({ label: "Education", points: 10 });

    return { score: Math.min(score, 100), missing };
  };

  const { score, missing } = calculateProfileStrength();

  const getProfileImageUrl = (filename: string) => {
    if (!filename) return null;
    return filename.startsWith("http") ? filename : `${process.env.NEXT_PUBLIC_API_URL}/static/profile_images/${filename}`;
  };

  const getEducationList = (user: any) => {
    const parsed = safeParse(user.education, null);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    if (parsed && typeof parsed === 'object' && (parsed.school || parsed.degree)) return [parsed];
    if (user.college || user.degree) {
        return [{
            school: user.college,
            degree: user.degree,
            field: user.field,
            year: user.batch_year
        }];
    }
    return [];
  };
  
  const educations = user ? getEducationList(user) : [];

  if (loading || !user) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30 pt-10">
      <Toaster position="top-center" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#050505] to-[#050505] pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-8">
          
          {/* --- MAIN CONTENT --- */}
          <div className="order-1 lg:order-2 lg:col-span-3 space-y-6">
            
            {/* INSIGHT BANNER */}
            {user.skill_gaps && user.skill_gaps.length > 0 && (
                <div className="bg-[#111] border border-white/10 border-l-4 border-l-blue-500 rounded-r-xl p-6 relative overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-2">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                        <div>
                            <h3 className="text-white font-bold flex items-center gap-2 text-lg">
                                <TrendingUp className="text-blue-500 w-5 h-5" /> 
                                Recommended Skills
                            </h3>
                            <p className="text-sm text-gray-400 mt-2 max-w-2xl leading-relaxed">
                                Missing key skills for your target roles. Learning these can boost visibility by 40%.
                            </p>
                        </div>
                        
                        <div className="flex flex-col items-start md:items-end gap-3">
                            <div className="flex flex-wrap gap-2">
                                {user.skill_gaps.slice(0, 4).map((gap: any, i: number) => (
                                    <span key={i} className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-gray-200 text-xs font-medium hover:bg-white/10 transition cursor-default flex items-center gap-1.5">
                                        {gap.skill_name}
                                    </span>
                                ))}
                            </div>
                            <Link 
                                href="/dashboard" 
                                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors group"
                            >
                                View detailed analysis <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* 1. HERO CARD */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 sm:p-8 relative">
                <Link 
                    href="/profile/edit" 
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition shadow-lg shadow-blue-500/20"
                >
                    <Edit3 size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Edit Profile</span> <span className="sm:hidden">Edit</span>
                </Link>

                <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start text-center sm:text-left">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white/5 bg-gray-800 flex items-center justify-center text-3xl sm:text-4xl font-bold text-white shadow-xl overflow-hidden shrink-0 bg-gradient-to-br from-blue-600 to-purple-700">
                        {user.profile_image ? (
                            <img 
                                src={getProfileImageUrl(user.profile_image)} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="select-none">
                                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                            </span>
                        )}
                    </div>

                    <div className="flex-1 w-full">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{user.name || "User"}</h1>
                        <p className="text-blue-400 font-medium mt-1 sm:text-lg">{user.headline || "Add a headline in Edit Profile"}</p>
                        
                        <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-gray-400 mt-4">
                            <span className="flex items-center gap-1.5"><MapPin size={15} /> {user.location || "Location not set"}</span>
                            <span className="flex items-center gap-1.5"><Mail size={15} /> {user.email}</span>
                            {user.phone && <span className="flex items-center gap-1.5"><Phone size={15} /> {user.phone}</span>}
                        </div>
                        
                        <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-6">
                            {user.linkedin_url && <a href={user.linkedin_url} target="_blank" className="p-2 bg-white/5 rounded-lg hover:bg-[#0077b5] hover:text-white text-gray-400 transition"><Linkedin size={18} /></a>}
                            {user.github_url && <a href={user.github_url} target="_blank" className="p-2 bg-white/5 rounded-lg hover:bg-white hover:text-black text-gray-400 transition"><Github size={18} /></a>}
                            {user.portfolio_url && <a href={user.portfolio_url} target="_blank" className="p-2 bg-white/5 rounded-lg hover:bg-purple-600 hover:text-white text-gray-400 transition"><Globe size={18} /></a>}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- PROFESSIONAL SNAPSHOT --- */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Briefcase size={18} className="text-blue-400"/> Professional Snapshot
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-blue-500/30 transition text-center sm:text-left">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 flex flex-col sm:flex-row items-center sm:items-start gap-1.5 justify-center sm:justify-start">
                            <Clock size={12} className="text-blue-400"/> Experience
                        </p>
                        <p className="text-lg font-bold text-white">
                            {user.total_experience !== null ? user.total_experience : 0} Years
                        </p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-yellow-500/30 transition text-center sm:text-left">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 flex flex-col sm:flex-row items-center sm:items-start gap-1.5 justify-center sm:justify-start">
                            <Hourglass size={12} className="text-yellow-400"/> Notice Period
                        </p>
                        <p className="text-lg font-bold text-white break-words">
                            {user.notice_period || "Not set"}
                        </p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-green-500/30 transition text-center sm:text-left">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 flex flex-col sm:flex-row items-center sm:items-start gap-1.5 justify-center sm:justify-start">
                            <Wallet size={12} className="text-green-400"/> Current CTC
                        </p>
                        <p className="text-lg font-bold text-white">
                            {user.current_salary || "Not set"}
                        </p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-purple-500/30 transition text-center sm:text-left">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 flex flex-col sm:flex-row items-center sm:items-start gap-1.5 justify-center sm:justify-start">
                            <TrendingUp size={12} className="text-purple-400"/> Expected CTC
                        </p>
                        <p className="text-lg font-bold text-white">
                            {user.expected_salary || "Negotiable"}
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. ABOUT */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <FileText size={18} className="text-blue-400"/> About
                </h2>
                <p className="text-gray-300 leading-7 text-sm whitespace-pre-line">
                    {user.bio || "No summary added. Click 'Edit Profile' to add one."}
                </p>
            </div>

            {/* 3. EXPERIENCE */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Briefcase size={18} className="text-blue-400"/> Experience
                </h2>
                <div className="space-y-8 pl-2 relative">
                    <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-white/5"></div>
                    {safeParse(user.experiences).length > 0 ? (
                        safeParse(user.experiences).map((exp: any, i: number) => (
                            <div key={i} className="relative pl-8">
                                <div className="absolute left-0 top-1.5 w-4 h-4 bg-[#111] border-2 border-blue-500 rounded-full z-10"></div>
                                <h3 className="text-white font-bold text-base">{exp.role || exp.job_title}</h3>
                                <div className="text-blue-400 font-medium text-sm mb-1">{exp.company}</div>
                                <div className="text-xs text-gray-500 mb-2">
                                    {exp.start_date || exp.start_year} - {exp.end_date || exp.end_year || (exp.currently_working ? "Present" : "")}
                                </div>
                                <p className="text-sm text-gray-400">{exp.description}</p>
                            </div>
                        ))
                    ) : (
                        <p className="pl-8 text-gray-500 text-sm">No experience details available.</p>
                    )}
                </div>
            </div>

            {/* 4. PROJECTS */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Github size={18} className="text-blue-400"/> Projects
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.projects && user.projects.length > 0 ? (
                        user.projects.map((proj: any) => (
                            <div key={proj.id} className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
                                <h4 className="text-white font-bold mb-2">{proj.title}</h4>
                                <p className="text-xs text-gray-400 line-clamp-2 mb-3">{proj.description}</p>
                                {proj.tech_stack && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {proj.tech_stack.split(',').slice(0, 3).map((t: string, i: number) => (
                                            <span key={i} className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-1 rounded border border-blue-500/20">{t}</span>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    {proj.live_link && <a href={proj.live_link} target="_blank" className="text-xs text-blue-400 hover:underline">View Live</a>}
                                    {proj.github_link && <a href={proj.github_link} target="_blank" className="text-xs text-blue-400 hover:underline">View Code</a>}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-sm">No projects added.</p>
                    )}
                </div>
            </div>

            {/* 5. EDUCATION & SKILLS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Building2 size={18} className="text-blue-400"/> Education</h2>
                    <div className="space-y-6">
                        {educations.length > 0 ? educations.map((edu: any, i: number) => (
                            <div key={i} className="relative pl-4 border-l-2 border-white/10">
                                <h3 className="text-white font-bold">{edu.school || "University"}</h3>
                                <p className="text-gray-400 text-sm">{edu.degree} {edu.field ? `in ${edu.field}` : ""}</p>
                                <p className="text-gray-500 text-xs mt-1">Class of {edu.year || edu.graduation_year || "Unknown"}</p>
                            </div>
                        )) : (
                            <p className="text-gray-500 text-sm italic">No education added.</p>
                        )}
                    </div>
                </div>

                <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Zap size={18} className="text-blue-400"/> Skills</h2>
                    <div className="flex flex-wrap gap-2">
                        {safeParse(user.skills).map((skill: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

          </div>

          {/* --- SIDEBAR --- */}
          <div className="order-2 lg:order-1 lg:col-span-1 space-y-6">
            
            {/* SCORE CARD (FIXED SVG) */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold text-lg">Profile Score</h3>
                <span className={`text-xs font-bold px-2 py-1 rounded border ${score > 75 ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'}`}>
                  {score > 75 ? 'Excellent' : 'Intermediate'}
                </span>
              </div>
              
              {/* FIXED CIRCLE HERE */}
              <div className="flex justify-center pb-4">
                  <ProfileScoreCircle score={score} />
              </div>

              {/* Missing Actions List */}
              {missing.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-3">To Improve Score:</p>
                      <ul className="space-y-2">
                          {missing.slice(0, 3).map((m, i) => (
                              <li key={i} className="text-xs text-blue-300 flex items-center gap-2 hover:text-white transition cursor-default">
                                  <div className="p-1 bg-blue-500/20 rounded-full"><Plus size={10} className="text-blue-400"/></div>
                                  Add {m.label} <span className="text-gray-500 ml-auto text-[10px]">+{m.points}%</span>
                              </li>
                          ))}
                      </ul>
                      <Link href="/profile/edit" className="block mt-4 text-center text-xs font-bold text-white bg-white/10 hover:bg-white/20 py-2 rounded-lg transition">
                          Complete Profile
                      </Link>
                  </div>
              )}
            </div>

            {/* Other Sidebar Actions */}
            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-2 space-y-1">
                <Link href="/my-applications" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition">
                  <FileText size={18} className="text-blue-500"/>
                  <span className="text-sm font-medium">My Applications</span>
                </Link>
                <Link href="/jobs" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition">
                  <Shield size={18} className="text-green-500"/>
                  <span className="text-sm font-medium">Saved Jobs</span>
                </Link>
                <button onClick={() => {navigator.clipboard.writeText(window.location.href); toast.success("Link copied!");}} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition text-left">
                  <Share2 size={18} className="text-purple-500"/>
                  <span className="text-sm font-medium">Share Profile</span>
                </button>
              </div>
            </div>

            {/* RESUME UPLOAD SECTION */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Resume</h3>
                    {user.resume_filename && (
                        <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-[10px] font-bold border border-green-500/20">Uploaded</span>
                    )}
                </div>

                {user.resume_filename ? (
                    <div className="mb-4">
                        <div className="flex items-center gap-3 mb-4 p-3 bg-white/5 rounded-xl border border-white/5">
                            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500 shrink-0">
                                <FileText size={20} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm text-white truncate w-32 font-medium">
                                    {/* Show a cleaner name if it's a long URL */}
                                    {user.resume_filename.startsWith("http") ? "Resume.pdf" : user.resume_filename}
                                </p>
                                <p className="text-[10px] text-gray-500">PDF Document</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {/* ✅ FIXED: Smart URL Logic */}
                            <a 
                                href={
                                    user.resume_filename.startsWith("http") 
                                    ? user.resume_filename 
                                    : `${process.env.NEXT_PUBLIC_API_URL}/static/resumes/${user.resume_filename}`
                                } 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex-1 text-center bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                            >
                                {/* Changed from 'Download' to 'View' as requested */}
                                <Eye size={14} /> View Resume
                            </a>
                            
                            <button onClick={() => fileInputRef.current?.click()} className="flex-1 text-center bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-lg transition flex items-center justify-center gap-2">
                                <Edit3 size={14} /> Update
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="mb-4 text-center p-6 border-2 border-dashed border-white/10 rounded-xl hover:border-white/20 transition-colors cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-all text-gray-400">
                            <Upload size={20} />
                        </div>
                        <p className="text-sm font-bold text-white mb-1">Upload Resume</p>
                        <p className="text-[10px] text-gray-500">PDF only (Max 5MB)</p>
                    </div>
                )}

                {/* HIDDEN FILE INPUT */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="application/pdf" 
                    onChange={handleResumeUpload} 
                />

                {uploadingResume && (
                    <div className="flex items-center justify-center gap-2 text-xs text-blue-400 mt-2 font-medium animate-pulse">
                        <Loader2 size={12} className="animate-spin" /> Uploading new resume...
                    </div>
                )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
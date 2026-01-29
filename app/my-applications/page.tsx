"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import { 
  ArrowLeft, Building2, MapPin, Clock, 
  CheckCircle, Circle, XCircle, MessageSquare, Eye, 
  Loader2, Filter, Trash2, X, IndianRupee, Laptop2
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// --- TYPES based on main.py response ---
interface Application {
  id: number;
  status: string;
  match_score: number;
  applied_at: string;
  interview_attempts: number;
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    salary: string;
  };
}

export default function MyApplicationsPage() {
  const router = useRouter();
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'applied' | 'interviews'>('applied');
  
  // Delete State
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // 1. Check Authentication
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login"); // Redirect to custom login
      return;
    }

    // 2. Fetch Data
    const fetchApps = async () => {
      try {
        const res = await fetch("http://localhost:8000/candidate/applications", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setApplications(data);
        } else {
          toast.error("Failed to load applications");
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        toast.error("Network error");
      } finally {
        setLoading(false);
      }
    };
    
    fetchApps();
  }, [router]);

  // --- DELETE HANDLER ---
  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/applications/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setApplications(prev => prev.filter(app => app.id !== deleteId));
        toast.success("Application deleted");
        setDeleteId(null);
      } else {
        toast.error("Failed to delete application");
      }
    } catch (error) {
      toast.error("Server error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter logic based on status from main.py (lowercase statuses)
  const displayedApps = activeTab === 'applied' 
    ? applications 
    : applications.filter(app => ['screening', 'interview', 'hired', 'shortlisted'].includes(app.status));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#050505] pb-16 text-white font-sans pt-10">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/profile" className="p-2 bg-[#111] rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">My Applications</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-white/10 mb-8">
          <button 
            onClick={() => setActiveTab('applied')}
            className={`pb-4 text-sm font-medium transition relative ${
              activeTab === 'applied' ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            All Applications
            {activeTab === 'applied' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white rounded-t-full"></span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('interviews')}
            className={`pb-4 text-sm font-medium transition relative ${
              activeTab === 'interviews' ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Shortlisted & Interviews
            {activeTab === 'interviews' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white rounded-t-full"></span>
            )}
          </button>
        </div>

        {/* Count */}
        <p className="text-gray-400 text-sm mb-6 flex items-center gap-2">
          {displayedApps.length} applications found
          <Filter size={14} className="ml-auto" />
        </p>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedApps.length > 0 ? (
            displayedApps.map((app) => (
              <ApplicationCard 
                key={app.id} 
                app={app} 
                onDelete={() => setDeleteId(app.id)} 
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-[#111] rounded-xl border border-white/5">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <Building2 className="text-gray-400 w-8 h-8" />
              </div>
              <h3 className="text-white font-bold text-lg">No applications yet</h3>
              <p className="text-gray-500 text-sm mt-2 mb-6">Start applying to jobs to track them here.</p>
              <Link href="/jobs" className="bg-white hover:bg-gray-200 text-black px-6 py-2.5 rounded-lg font-bold transition text-sm">
                Find Jobs
              </Link>
            </div>
          )}
        </div>

      </div>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
                <button 
                    onClick={() => setDeleteId(null)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
                >
                    <X size={20} />
                </button>

                <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4 mx-auto border border-red-500/20">
                    <Trash2 size={24} />
                </div>

                <h3 className="text-xl font-bold text-center mb-2">Delete Application?</h3>
                <p className="text-center text-gray-400 text-sm mb-6 leading-relaxed">
                    Are you sure you want to delete this application? This action cannot be undone.
                </p>

                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => setDeleteId(null)}
                        className="py-3 rounded-xl border border-white/10 text-gray-300 font-bold hover:bg-white/5 transition text-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition flex items-center justify-center gap-2 text-sm"
                    >
                        {isDeleting ? <Loader2 size={16} className="animate-spin"/> : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

function ApplicationCard({ app, onDelete }: { app: Application, onDelete: () => void }) {
  const isRejected = app.status === 'rejected';
  const isInterview = ['screening', 'interview', 'hired', 'shortlisted'].includes(app.status);
  
  // Safe date parsing
  const dateStr = app.applied_at 
    ? new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'Recent';

  // Company Initial
  const companyInitial = app.job.company ? app.job.company.charAt(0).toUpperCase() : 'C';

  return (
    <div className="bg-[#111] rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300 group shadow-lg flex flex-col h-full relative">
      
      {/* Delete Button */}
      <button 
        onClick={onDelete}
        className="absolute top-4 right-4 p-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
        title="Delete Application"
      >
        <Trash2 size={18} />
      </button>

      {/* Top Section */}
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-4 pr-8">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xl font-bold text-gray-400 flex-shrink-0 group-hover:border-white/20 group-hover:text-white transition-colors">
              {companyInitial}
            </div>
            <div>
              <h3 className="font-bold text-white text-lg leading-tight line-clamp-1 group-hover:text-gray-200 transition-colors">
                {app.job.title}
              </h3>
              <p className="text-sm text-gray-400 mt-1">{app.job.company}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-400 mb-2">
          <div className="flex items-center gap-2"><MapPin size={14} className="text-gray-500" /> {app.job.location || 'Remote'}</div>
          {app.job.salary && <div className="flex items-center gap-2"><IndianRupee size={14} className="text-gray-500" /> {app.job.salary}</div>}
        </div>
      </div>

      {/* Status Box */}
      <div className={`px-5 py-4 border-t ${
        isRejected ? 'bg-red-500/5 border-red-500/10' : 
        isInterview ? 'bg-green-500/5 border-green-500/10' : 
        'bg-white/5 border-white/10'
      }`}>
        
        {/* Timeline */}
        <div className="relative pl-4 space-y-6 border-l-2 border-white/10 ml-1.5 my-2">
          <div className="relative">
            <div className="absolute -left-[26px] bg-[#111] rounded-full p-0.5"><CheckCircle size={16} className="text-green-500" /></div>
            <p className="text-sm font-bold text-white leading-none">Applied</p>
            <p className="text-xs text-gray-500 mt-1">{dateStr}</p>
          </div>

          <div className="relative">
            <div className="absolute -left-[26px] bg-[#111] rounded-full p-0.5">
               {isRejected ? <XCircle size={16} className="text-red-500" /> : isInterview ? <CheckCircle size={16} className="text-green-500" /> : <Circle size={16} className="text-gray-500" />}
            </div>
            <p className={`text-sm font-bold leading-none ${isRejected ? 'text-red-400' : isInterview ? 'text-green-400' : 'text-gray-400'} capitalize`}>
              {isRejected ? 'Not Selected' : app.status}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {isRejected ? 'Better luck next time' : isInterview ? 'Check Email for details' : 'In Review'}
            </p>
          </div>
        </div>

        {/* --- ACTION BUTTONS --- */}
        {isInterview && (
          <div className="mt-5 space-y-3">
            {/* ATTEMPTS BADGE */}
            {app.interview_attempts > 0 && (
              <div className="flex items-center justify-between text-xs bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                <span className="text-gray-400">Mock Interviews Taken</span>
                <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded text-[10px] border border-white/10">
                  {app.interview_attempts} Attempts
                </span>
              </div>
            )}

            {/* PRACTICE BUTTON - PROFESSIONAL WHITE */}
            <Link 
              href={`/my-applications/${app.id}/prepare`} 
              className="w-full flex items-center justify-center gap-2 bg-white text-black py-2.5 rounded-lg text-sm font-bold hover:bg-gray-200 transition shadow-lg shadow-white/5"
            >
              {app.interview_attempts > 0 ? "Practice Again" : "Start Interview Prep"}
              <Laptop2 size={18} />
            </Link>

            {/* BUTTON ROW */}
            <div className="flex gap-2">
                {/* View Details */}
                <Link 
                    href={app.job.id ? `/jobs/${app.job.id}` : '#'} 
                    onClick={(e) => { if(!app.job.id) e.preventDefault(); }}
                    className={`flex-1 flex items-center justify-center gap-2 border border-white/10 py-2.5 rounded-lg text-xs font-bold transition-all
                        ${app.job.id 
                            ? 'bg-transparent text-gray-300 hover:bg-white/5 hover:text-white' 
                            : 'bg-white/5 text-gray-600 cursor-not-allowed'
                        }`}
                >
                  <Eye size={14} /> 
                  View Job
                </Link>
            </div>
          </div>
        )}

      </div>
      
      {/* Footer Timestamp */}
      <div className="px-5 py-2 bg-white/[0.02] text-xs text-gray-600 flex items-center gap-1 border-t border-white/5">
         <Clock size={12} /> Last updated recently
      </div>

    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Eye,
  Users,
  CheckCircle,
  TrendingUp,
  FileText,
  Loader2,
  X,
  AlertCircle,
  Briefcase,
  LogOut,
  ChevronRight,
  Trash2,
  ArrowLeft,
  Clock,
  ShieldAlert,
  AlertTriangle,
  MapPin,
  Mail,
  DollarSign,
  UserCheck,
  MousePointer2,
  Calendar,
  Building2,
  Globe,
  Save,
  ShieldCheck,
  MessageSquare,
  XCircle,
  Search,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// --- CSS TO HIDE SCROLLBAR BUT ALLOW SCROLLING ---
const noScrollStyle = `
  .no-scrollbar::-webkit-scrollbar {
      display: none;
  }
  .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
  }
`;

const REJECTION_TEMPLATES: Record<string, string> = {
  "Missing Key Skills":
    "While your profile is impressive, we are currently prioritizing candidates with more specific hands-on experience in the core technical skills required for this role.",
  "Insufficient Experience":
    "For this specific seniority level, we are seeking a candidate with a longer track record of professional experience in similar capacities.",
  "Salary Mismatch":
    "Unfortunately, the compensation expectations mentioned fall outside the budget range we have allocated for this position at this time.",
  "Role Filled":
    "We have recently filled this position and are no longer accepting new applications. However, we will keep your resume on file for future openings.",
  "Location Issue":
    "At this time, we are prioritizing candidates who are currently located in the hiring region or can relocate immediately.",
  "Not a Cultural Fit":
    "After reviewing your application, we feel that your specific working style and preferences might not be the best match for our current team dynamics.",
};

export default function RecruiterDashboard() {
  const router = useRouter();

  // --- STATE ---
  const [recruiterId, setRecruiterId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<
    "dashboard" | "jobs" | "ats" | "interviews" | "settings"
  >("dashboard");

  // Data States
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Profile State
  const [profileData, setProfileData] = useState<any>({
    name: "",
    company_name: "",
    company_website: "",
    company_description: "",
    company_size: "",
    location: "",
    industry: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Modals
  const [resumeData, setResumeData] = useState<{
    name: string;
    url: string | null;
    text: string;
  } | null>(null);
  const [rejectModal, setRejectModal] = useState<{
    show: boolean;
    appId: number | null;
    name: string;
  }>({ show: false, appId: null, name: "" });
  const [deleteCandidateModal, setDeleteCandidateModal] = useState<{
    show: boolean;
    appId: number | null;
    name: string;
  }>({ show: false, appId: null, name: "" });
  const [deleteJobModal, setDeleteJobModal] = useState<{
    show: boolean;
    jobId: number | null;
    title: string;
  }>({ show: false, jobId: null, title: "" });

  const [feedbackReason, setFeedbackReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [isDeletingCandidate, setIsDeletingCandidate] = useState(false);
  const [isDeletingJob, setIsDeletingJob] = useState(false);

  // --- 🔐 AUTH INITIALIZATION ---
  useEffect(() => {
    const token = localStorage.getItem("recruiter_token");

    if (!token) {
      router.push("/recruiter/login");
      return;
    }

    initializeDashboard(token);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("recruiter_token");
    localStorage.removeItem("recruiter_id");
    localStorage.removeItem("recruiter_name");
    router.push("/recruiter/login");
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem("recruiter_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const initializeDashboard = async (token: string) => {
    try {
      const meRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recruiters/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (meRes.status === 401) {
        toast.error("Session expired. Please login again.");
        handleSignOut();
        return;
      }

      if (meRes.ok) {
        const meData = await meRes.json();
        const id = meData.id;
        setRecruiterId(id);

        await Promise.all([
          fetchJobs(id),
          fetchAnalytics(id),
          fetchProfile(id),
        ]);
      } else {
        toast.error("Recruiter profile not found.");
      }
    } catch (err) {
      console.error("Init Error:", err);
      toast.error("Failed to connect to server.");
    } finally {
      setLoadingData(false);
    }
  };

  // --- API FUNCTIONS ---
  const fetchJobs = async (id: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recruiters/${id}/jobs`,
      );
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (err) {
      toast.error("Failed to load jobs.");
    }
  };

  const fetchAnalytics = async (id: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recruiters/${id}/analytics`,
      );
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error("Failed to fetch analytics");
    }
  };

  const fetchProfile = async (id: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recruiters/${id}/profile`,
      );
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      }
    } catch (e) {
      console.error("Profile fetch failed");
    }
  };

  const saveProfile = async () => {
    if (!recruiterId) return;
    setIsSavingProfile(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recruiters/${recruiterId}/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          } as Record<string, string>, // ✅ Fixed: Cast to Record<string, string>
          body: JSON.stringify(profileData),
        },
      );
      if (response.ok) toast.success("Company profile updated!");
      else toast.error("Update failed.");
    } catch (e) {
      toast.error("Network error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const fetchApplicants = async (jobId: number) => {
    setLoadingApplicants(true);
    setApplicants([]);
    setSelectedCandidate(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recruiters/jobs/${jobId}/applicants`,
      );
      if (response.ok) {
        const data = await response.json();
        setApplicants(data);
      }
    } catch (err) {
      toast.error("Failed to fetch applicants");
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleJobClick = (job: any) => {
    setSelectedJob(job);
    setActiveView("ats");
    fetchApplicants(job.id);
  };

  // --- JOB ACTIONS ---
  const openDeleteJobModal = (jobId: number, title: string) => {
    setDeleteJobModal({ show: true, jobId, title });
  };

  const confirmDeleteJob = async () => {
    if (!deleteJobModal.jobId) return;
    setIsDeletingJob(true);
    const toastId = toast.loading("Deleting job...");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recruiters/jobs/${deleteJobModal.jobId}`,
        {
          method: "DELETE",
          headers: getAuthHeader() as Record<string, string>, // ✅ Added cast
        },
      );

      if (response.ok) {
        if (recruiterId) {
          await fetchJobs(recruiterId);
          await fetchAnalytics(recruiterId);
        }
        if (selectedJob?.id === deleteJobModal.jobId) {
          setActiveView("jobs");
          setSelectedJob(null);
        }
        toast.success("Job deleted successfully", { id: toastId });
        setDeleteJobModal({ show: false, jobId: null, title: "" });
      } else {
        throw new Error("Failed to delete");
      }
    } catch (err) {
      toast.error("Failed to delete job", { id: toastId });
    } finally {
      setIsDeletingJob(false);
    }
  };

  // --- APPLICANT ACTIONS ---
  const openDeleteCandidateModal = (appId: number, name: string) => {
    setDeleteCandidateModal({ show: true, appId, name });
  };

  const confirmDeleteCandidate = async () => {
    if (!deleteCandidateModal.appId) return;

    setIsDeletingCandidate(true);
    const toastId = toast.loading("Removing candidate...");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/applications/${deleteCandidateModal.appId}`,
        {
          method: "DELETE",
          headers: getAuthHeader() as Record<string, string>, // ✅ Added cast
        },
      );

      if (response.ok) {
        toast.success("Candidate removed", { id: toastId });
        const updatedList = applicants.filter(
          (app) => app.id !== deleteCandidateModal.appId,
        );
        setApplicants(updatedList);
        if (selectedCandidate?.id === deleteCandidateModal.appId)
          setSelectedCandidate(null);
        setDeleteCandidateModal({ show: false, appId: null, name: "" });
      } else {
        throw new Error("Failed");
      }
    } catch (err) {
      toast.error("Failed to remove candidate", { id: toastId });
    } finally {
      setIsDeletingCandidate(false);
    }
  };

  const handleStatusClick = (appId: number, name: string, status: string) => {
    if (status === "rejected") {
      setRejectModal({ show: true, appId, name });
      setFeedbackReason("");
    } else {
      updateApplicantStatus(appId, status);
    }
  };

  const handleReasonSelect = (reason: string) => {
    setFeedbackReason(REJECTION_TEMPLATES[reason]);
  };

  const submitRejection = async () => {
    if (!rejectModal.appId) return;
    if (!feedbackReason.trim()) {
      toast.error("Please provide feedback.");
      return;
    }
    setIsRejecting(true);
    await updateApplicantStatus(rejectModal.appId, "rejected", feedbackReason);
    setIsRejecting(false);
  };

  const updateApplicantStatus = async (
    applicantId: number,
    status: string,
    feedback: string | null = null,
  ) => {
    const toastId = toast.loading("Updating status...");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recruiters/applicants/${applicantId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          } as Record<string, string>, // ✅ Added cast
          body: JSON.stringify({ status, feedback }),
        },
      );

      if (response.ok) {
        toast.success(
          status === "rejected" ? "Feedback Sent" : "Candidate Updated!",
          { id: toastId },
        );

        setApplicants((prev) =>
          prev.map((app) =>
            app.id === applicantId ? { ...app, status } : app,
          ),
        );

        if (selectedCandidate?.id === applicantId) {
          setSelectedCandidate((prev: any) => ({ ...prev, status }));
        }

        if (rejectModal.show) {
          setRejectModal({ show: false, appId: null, name: "" });
          setFeedbackReason("");
        }
      } else {
        toast.error("Failed to update", { id: toastId });
      }
    } catch (err) {
      toast.error("Network error", { id: toastId });
    }
  };

  const NavItem = ({ label, icon: Icon, view }: any) => (
    <button
      onClick={() => setActiveView(view)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium mb-1 ${
        activeView === view
          ? "bg-electric text-white shadow-[0_0_15px_rgba(79,14,237,0.4)]"
          : "text-gray-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon size={18} /> {label}
    </button>
  );

  if (loadingData) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-electric animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void flex font-sans text-gray-200 selection:bg-electric/30 overflow-hidden">
      <style>{noScrollStyle}</style>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1e293b",
            color: "#fff",
            border: "1px solid #334155",
          },
        }}
      />

      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-charcoal border-r border-white/5 hidden lg:flex flex-col flex-shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8 px-2">
            <div className="w-8 h-8 rounded-lg bg-electric flex items-center justify-center">
              <Briefcase className="text-white" size={18} fill="currentColor" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Recruiter
            </span>
          </div>

          <nav className="space-y-1">
            <NavItem label="Overview" icon={FileText} view="dashboard" />
            <NavItem label="Jobs & Hiring" icon={Users} view="jobs" />
            <NavItem label="Interviews" icon={Calendar} view="interviews" />
            <NavItem label="Company Profile" icon={Building2} view="settings" />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/5">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition text-sm font-medium w-full px-2"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-void/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 flex-shrink-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {activeView === "dashboard" && "Dashboard"}
              {activeView === "jobs" && "Active Listings"}
              {activeView === "ats" && "Applicant Tracking"}
              {activeView === "interviews" && "AI Interview Copilot"}
              {activeView === "settings" && "Company Profile"}
            </h2>
          </div>
          <button
            onClick={() => router.push("/recruiter/post-job")}
            className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all shadow-lg"
          >
            <Plus size={14} /> Post Job
          </button>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-6 no-scrollbar">
          {/* 1. DASHBOARD OVERVIEW */}
          {activeView === "dashboard" && analytics && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    label: "Total Jobs",
                    value: analytics.total_jobs,
                    icon: Briefcase,
                    color: "text-blue-400",
                    bg: "bg-blue-500/10",
                    border: "border-blue-500/20",
                  },
                  {
                    label: "Active Roles",
                    value: analytics.active_jobs,
                    icon: CheckCircle,
                    color: "text-green-400",
                    bg: "bg-green-500/10",
                    border: "border-green-500/20",
                  },
                  {
                    label: "Candidates",
                    value: analytics.total_applications,
                    icon: Users,
                    color: "text-electric",
                    bg: "bg-electric/10",
                    border: "border-electric/20",
                  },
                  {
                    label: "Total Views",
                    value: analytics.total_views,
                    icon: Eye,
                    color: "text-purple-400",
                    bg: "bg-purple-500/10",
                    border: "border-purple-500/20",
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className={`p-6 rounded-2xl border ${stat.border} bg-charcoal shadow-lg hover:bg-white/5 transition-all group`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div
                        className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}
                      >
                        <stat.icon size={22} />
                      </div>
                      <TrendingUp
                        size={16}
                        className="text-gray-600 group-hover:text-green-500 transition-colors"
                      />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-1">
                      {stat.value}
                    </h3>
                    <p className="text-sm text-gray-400 font-medium">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Recent Jobs Table */}
              <div className="bg-charcoal border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center">
                  <h3 className="font-bold text-white">Recent Activity</h3>
                  <button
                    onClick={() => setActiveView("jobs")}
                    className="text-electric text-sm hover:text-white transition flex items-center gap-1"
                  >
                    View All <ChevronRight size={14} />
                  </button>
                </div>
                <div className="divide-y divide-white/5">
                  {jobs.slice(0, 3).map((job) => (
                    <div
                      key={job.id}
                      className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition group cursor-pointer"
                      onClick={() => handleJobClick(job)}
                    >
                      <div>
                        <p className="font-bold text-gray-200 group-hover:text-white transition">
                          {job.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {job.location}
                          </span>
                          <span className="text-xs text-gray-600">•</span>
                          <span className="text-xs text-gray-500">
                            {new Date(job.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-xl font-bold text-white">
                            {job.applications || 0}
                          </p>
                          <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">
                            Applicants
                          </p>
                        </div>
                        <ChevronRight
                          className="text-gray-600 group-hover:text-electric transition"
                          size={20}
                        />
                      </div>
                    </div>
                  ))}
                  {jobs.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      No activity yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. JOBS GRID VIEW */}
          {activeView === "jobs" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <button
                  onClick={() => router.push("/recruiter/post-job")}
                  className="border-2 border-dashed border-white/10 rounded-2xl p-6 hover:border-electric/50 hover:bg-white/5 transition-all flex flex-col items-center justify-center text-gray-500 hover:text-white group h-full min-h-[200px]"
                >
                  <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-electric flex items-center justify-center mb-3 transition-colors">
                    <Plus className="group-hover:text-white transition-colors" />
                  </div>
                  <span className="font-bold">Create New Job</span>
                </button>

                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-charcoal border border-white/5 rounded-2xl p-6 hover:border-white/20 hover:shadow-2xl transition-all duration-300 flex flex-col group relative"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2.5 bg-white/5 rounded-lg text-white group-hover:bg-electric group-hover:text-white transition-colors">
                        <Briefcase size={20} />
                      </div>
                      <div
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${job.status === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}
                      >
                        {job.status}
                      </div>
                    </div>

                    <h3
                      className="font-bold text-xl text-white leading-tight mb-1 group-hover:text-electric transition cursor-pointer"
                      onClick={() => handleJobClick(job)}
                    >
                      {job.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-6 flex items-center gap-1">
                      <MapPin size={12} /> {job.location}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex gap-4 text-sm font-medium text-gray-400">
                        {/* Views Count updated here */}
                        <span
                          className="flex items-center gap-1.5 hover:text-white transition"
                          title="Applicants"
                        >
                          <Users size={16} className="text-electric" />{" "}
                          {job.applications || 0}
                        </span>
                        <span
                          className="flex items-center gap-1.5 hover:text-white transition"
                          title="Views"
                        >
                          <Eye size={16} className="text-purple-400" />{" "}
                          {job.views || 0}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteJobModal(job.id, job.title);
                          }}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          onClick={() => handleJobClick(job)}
                          className="bg-white text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-200 transition"
                        >
                          Manage
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. ATS VIEW (IMPROVED) */}
          {activeView === "ats" && selectedJob && (
            <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <button
                  onClick={() => setActiveView("jobs")}
                  className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-bold transition-colors group"
                >
                  <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-electric transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                  Back to Jobs
                </button>
                <div className="text-right">
                  <h2 className="text-lg font-bold text-white">
                    {selectedJob.title}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {selectedJob.location} • {selectedJob.employment_type}
                  </p>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                {/* LEFT: LIST (Refined) */}
                <div className="lg:w-1/3 flex flex-col gap-4 h-full">
                  <div className="bg-charcoal border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-lg flex-1">
                    <div className="p-4 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
                      <h3 className="font-bold text-white text-sm">
                        Applicants ({applicants.length})
                      </h3>
                      {loadingApplicants && (
                        <Loader2 className="w-3 h-3 animate-spin text-electric" />
                      )}
                    </div>

                    {/* Search in list (Mock UI) */}
                    <div className="p-2 border-b border-white/5">
                      <div className="bg-[#111] rounded-lg flex items-center px-3 py-2 border border-white/5">
                        <Search size={14} className="text-gray-500 mr-2" />
                        <input
                          placeholder="Filter candidates..."
                          className="bg-transparent border-none outline-none text-xs text-white w-full placeholder:text-gray-600"
                        />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
                      {applicants.map((app) => (
                        <div
                          key={app.id}
                          onClick={() => setSelectedCandidate(app)}
                          className={`p-3 rounded-xl cursor-pointer border transition-all flex items-start gap-3 ${
                            selectedCandidate?.id === app.id
                              ? "bg-[#1A1A1A] border-electric/50 shadow-[inset_0_0_20px_rgba(79,14,237,0.1)]"
                              : "bg-transparent border-transparent hover:bg-white/5"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${selectedCandidate?.id === app.id ? "bg-electric text-white" : "bg-white/10 text-gray-400"}`}
                          >
                            {app.applicant_name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <h4
                                className={`font-bold text-sm truncate ${selectedCandidate?.id === app.id ? "text-white" : "text-gray-300"}`}
                              >
                                {app.applicant_name}
                              </h4>
                              <div
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  app.match_score >= 80
                                    ? "bg-green-500/20 text-green-400"
                                    : app.match_score >= 60
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : "bg-red-500/20 text-red-400"
                                }`}
                              >
                                {app.match_score}%
                              </div>
                            </div>
                            <p className="text-[11px] text-gray-500 truncate mb-1">
                              {app.headline || "No headline"}
                            </p>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                  app.status === "shortlisted"
                                    ? "bg-green-500/10 text-green-400"
                                    : app.status === "rejected"
                                      ? "bg-red-500/10 text-red-400"
                                      : "bg-white/5 text-gray-500"
                                }`}
                              >
                                {app.status}
                              </span>
                              <span className="text-[10px] text-gray-600 flex items-center gap-1">
                                <Clock size={8} />{" "}
                                {app.metrics?.notice_period || "Imm."}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {applicants.length === 0 && (
                        <div className="p-8 text-center text-gray-500 text-sm">
                          No applicants yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT: DETAILS (Refined) */}
                <div className="flex-1 bg-charcoal border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-lg relative h-full">
                  {selectedCandidate ? (
                    <div className="flex-1 overflow-y-auto no-scrollbar bg-[#0B0F19]">
                      {/* 1. HERO */}
                      <div className="p-8 border-b border-white/10 bg-gradient-to-b from-[#111] to-[#0B0F19] relative">
                        <button
                          onClick={() =>
                            openDeleteCandidateModal(
                              selectedCandidate.id,
                              selectedCandidate.applicant_name,
                            )
                          }
                          className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg transition"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="flex items-start gap-6">
                          <div className="w-20 h-20 rounded-2xl bg-[#1A1A1A] flex items-center justify-center text-3xl font-bold text-white shadow-2xl shrink-0 border border-white/10">
                            {selectedCandidate.applicant_name[0]}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h2 className="text-2xl font-bold text-white">
                                  {selectedCandidate.applicant_name}
                                </h2>
                                <p className="text-blue-400 text-sm font-medium mb-3">
                                  {selectedCandidate.headline}
                                </p>
                                <div className="flex gap-4 text-xs text-gray-400">
                                  <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                                    <MapPin size={12} />{" "}
                                    {selectedCandidate.metrics?.location}
                                  </span>
                                  <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                                    <Mail size={12} />{" "}
                                    {selectedCandidate.applicant_email}
                                  </span>
                                </div>
                              </div>
                              <div className="text-center bg-[#151515] p-3 rounded-xl border border-white/5">
                                <div
                                  className={`text-3xl font-black tracking-tighter ${
                                    selectedCandidate.match_score >= 80
                                      ? "text-green-400"
                                      : selectedCandidate.match_score >= 60
                                        ? "text-yellow-400"
                                        : "text-red-400"
                                  }`}
                                >
                                  {selectedCandidate.match_score}%
                                </div>
                                <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mt-1">
                                  Match Score
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-8 space-y-8">
                        {/* METRICS GRID */}
                        <section>
                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <UserCheck size={14} className="text-electric" />{" "}
                            Key Metrics
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                              {
                                label: "Notice Period",
                                val: selectedCandidate.metrics?.notice_period,
                                icon: Clock,
                                color: "text-yellow-500",
                              },
                              {
                                label: "Experience",
                                val: selectedCandidate.metrics?.experience,
                                icon: Briefcase,
                                color: "text-blue-500",
                              },
                              {
                                label: "Current CTC",
                                val: selectedCandidate.metrics?.current_salary,
                                icon: DollarSign,
                                color: "text-green-500",
                              },
                              {
                                label: "Expected CTC",
                                val: selectedCandidate.metrics?.expected_salary,
                                icon: TrendingUp,
                                color: "text-purple-500",
                              },
                            ].map((m, i) => (
                              <div
                                key={i}
                                className="bg-[#151515] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <m.icon size={14} className={m.color} />
                                  <span className="text-gray-500 text-[10px] uppercase font-bold">
                                    {m.label}
                                  </span>
                                </div>
                                <div className="text-white font-bold text-sm truncate">
                                  {m.val || "N/A"}
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>

                        {/* AI INTELLIGENCE */}
                        <section>
                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <ShieldAlert size={14} className="text-electric" />{" "}
                            Truth Intelligence
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-[#151515] border border-green-500/10 rounded-xl p-5">
                              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
                                <div className="p-1 bg-green-500/10 rounded text-green-500">
                                  <CheckCircle size={14} />
                                </div>
                                <span className="text-sm font-bold text-gray-200">
                                  Verified Skills
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {selectedCandidate.analysis?.matched_skills.map(
                                  (skill: string) => (
                                    <span
                                      key={skill}
                                      className="px-2.5 py-1 bg-green-900/10 text-green-400 text-xs rounded-md font-medium border border-green-900/20"
                                    >
                                      {skill}
                                    </span>
                                  ),
                                )}
                              </div>
                            </div>
                            <div className="bg-[#151515] border border-red-500/10 rounded-xl p-5">
                              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
                                <div className="p-1 bg-red-500/10 rounded text-red-500">
                                  <AlertTriangle size={14} />
                                </div>
                                <span className="text-sm font-bold text-gray-200">
                                  Missing / Unverified
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {selectedCandidate.analysis?.missing_skills.map(
                                  (skill: string) => (
                                    <span
                                      key={skill}
                                      className="px-2.5 py-1 bg-red-900/10 text-red-400 text-xs rounded-md font-medium border border-red-900/20"
                                    >
                                      {skill}
                                    </span>
                                  ),
                                )}
                              </div>
                            </div>
                          </div>
                        </section>

                        {/* VERDICT */}
                        <section className="bg-gradient-to-r from-electric/5 to-transparent border-l-2 border-electric pl-4 py-2">
                          <p className="text-[10px] text-electric font-bold uppercase mb-1">
                            AI Assessment Verdict
                          </p>
                          <p className="text-sm text-gray-300 leading-relaxed italic">
                            "{selectedCandidate.analysis?.verdict}"
                          </p>
                        </section>
                      </div>

                      {/* FOOTER ACTIONS */}
                      <div className="p-6 border-t border-white/10 bg-[#111] flex justify-between items-center sticky bottom-0 z-10">
                        <button
                          onClick={() =>
                            selectedCandidate.resume_url &&
                            window.open(selectedCandidate.resume_url, "_blank")
                          }
                          className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition group"
                        >
                          <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10">
                            <FileText size={16} />
                          </div>
                          View Original Resume
                        </button>
                        {selectedCandidate.status === "applied" ||
                        selectedCandidate.status === "pending" ? (
                          <div className="flex gap-3">
                            <button
                              onClick={() =>
                                handleStatusClick(
                                  selectedCandidate.id,
                                  selectedCandidate.applicant_name,
                                  "rejected",
                                )
                              }
                              className="px-6 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold text-sm transition"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() =>
                                handleStatusClick(
                                  selectedCandidate.id,
                                  selectedCandidate.applicant_name,
                                  "shortlisted",
                                )
                              }
                              className="px-6 py-2.5 rounded-xl bg-electric hover:bg-blue-600 text-white font-bold text-sm transition shadow-lg shadow-blue-900/20"
                            >
                              Shortlist Candidate
                            </button>
                          </div>
                        ) : (
                          <div
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 ${selectedCandidate.status === "shortlisted" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}
                          >
                            {selectedCandidate.status === "shortlisted" ? (
                              <CheckCircle size={16} />
                            ) : (
                              <XCircle size={16} />
                            )}{" "}
                            Currently {selectedCandidate.status}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-[#0B0F19]">
                      <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center mb-4 border border-white/5">
                        <MousePointer2 size={32} className="opacity-20" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        No Candidate Selected
                      </h3>
                      <p className="text-sm text-gray-500">
                        Select an applicant from the list to view Truth
                        Intelligence
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 4. INTERVIEWS VIEW (Placeholder) */}
          {activeView === "interviews" && (
            <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in zoom-in-95">
              <div className="w-20 h-20 bg-electric/10 rounded-full flex items-center justify-center mb-6 text-electric border border-electric/20">
                <Calendar size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                AI Interview Copilot
              </h2>
              <p className="text-gray-400 max-w-md mb-8">
                Generate custom interview scripts, schedule rounds, and track
                feedback all in one place. Coming in the next update.
              </p>
              <button
                onClick={() => setActiveView("dashboard")}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition"
              >
                Back to Dashboard
              </button>
            </div>
          )}

          {/* 5. COMPANY SETTINGS VIEW (LOGO UPLOAD REMOVED) */}
          {activeView === "settings" && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Company Profile
                  </h2>
                  <p className="text-sm text-gray-400">
                    Manage your branding and verification details.
                  </p>
                </div>
                <button
                  onClick={saveProfile}
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 bg-electric text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition shadow-lg shadow-blue-900/20 disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <Save size={18} />
                  )}{" "}
                  Save Changes
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left: Branding (LOGO REPLACED WITH AVATAR) */}
                <div className="space-y-6">
                  <div className="bg-charcoal border border-white/10 rounded-2xl p-6 text-center">
                    <div className="w-32 h-32 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center text-5xl font-bold text-white shadow-xl border border-white/10">
                      {profileData.company_name
                        ? profileData.company_name.charAt(0)
                        : "C"}
                    </div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">
                      Company Avatar
                    </p>
                    <p className="text-[10px] text-gray-600">
                      Auto-generated from name
                    </p>
                  </div>

                  <div className="bg-charcoal border border-white/10 rounded-2xl p-6">
                    <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-green-500" />{" "}
                      Verification Status
                    </h4>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl mb-3">
                      <span className="text-sm text-gray-300">
                        Email Verified
                      </span>
                      <CheckCircle size={16} className="text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <span className="text-sm text-gray-300">
                        Identity Verified
                      </span>
                      {profileData.is_verified ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : (
                        <span className="text-xs text-yellow-500 font-bold">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Form */}
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-charcoal border border-white/10 rounded-2xl p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={profileData.company_name}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              company_name: e.target.value,
                            })
                          }
                          className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-electric outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                          Recruiter Name
                        </label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              name: e.target.value,
                            })
                          }
                          className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-electric outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                          Website
                        </label>
                        <div className="relative">
                          <Globe
                            className="absolute left-3 top-3.5 text-gray-600"
                            size={16}
                          />
                          <input
                            type="text"
                            placeholder="https://"
                            value={profileData.company_website}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                company_website: e.target.value,
                              })
                            }
                            className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-electric outline-none transition"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                          Industry
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Fintech"
                          value={profileData.industry}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              industry: e.target.value,
                            })
                          }
                          className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-electric outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                          Location (HQ)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Pune, India"
                          value={profileData.location}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              location: e.target.value,
                            })
                          }
                          className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-electric outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                          Company Size
                        </label>
                        <select
                          value={profileData.company_size}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              company_size: e.target.value,
                            })
                          }
                          className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-electric outline-none transition appearance-none"
                        >
                          <option value="">Select Size</option>
                          <option value="1-10">1-10 Employees</option>
                          <option value="11-50">11-50 Employees</option>
                          <option value="51-200">51-200 Employees</option>
                          <option value="201-500">201-500 Employees</option>
                          <option value="500+">500+ Employees</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                        About Company
                      </label>
                      <textarea
                        rows={4}
                        value={profileData.company_description}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            company_description: e.target.value,
                          })
                        }
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-electric outline-none transition resize-none"
                        placeholder="Tell candidates about your mission..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- MODAL 1: RESUME VIEWER --- */}
      {resumeData && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex justify-end">
          <div className="w-full md:w-3/5 h-full bg-charcoal border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div>
                <h3 className="font-bold text-lg text-white">
                  {resumeData.name}
                </h3>
                <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
                  Resume Preview
                </span>
              </div>
              <button
                onClick={() => setResumeData(null)}
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <X className="text-white" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-8 bg-[#0B0F19]">
              {resumeData.url ? (
                <iframe
                  src={resumeData.url}
                  className="w-full h-full rounded-xl shadow-lg bg-white"
                  title="Resume PDF"
                />
              ) : (
                <div className="bg-charcoal p-10 rounded-xl border border-white/10 max-w-3xl mx-auto">
                  <div className="flex items-center gap-2 text-yellow-400 bg-yellow-500/10 p-4 rounded-xl mb-6 text-sm font-bold border border-yellow-500/20">
                    <AlertCircle size={18} /> Rendering text version (PDF file
                    not found)
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300 leading-relaxed">
                    {resumeData.text}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: PROFESSIONAL REJECTION --- */}
      {rejectModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 transition-all duration-300">
          <div className="bg-[#111827] border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden scale-in-95 animate-in duration-200">
            <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="text-red-500" size={20} />
                  Reject Candidate
                </h3>
                <p className="text-sm text-gray-400 mt-0.5">
                  Providing specific feedback helps candidates improve.
                </p>
              </div>
              <button
                onClick={() =>
                  setRejectModal({ show: false, appId: null, name: "" })
                }
                className="text-gray-500 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                  Quick Select Reason
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(REJECTION_TEMPLATES).map((reason) => (
                    <button
                      key={reason}
                      onClick={() => handleReasonSelect(reason)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        feedbackReason === REJECTION_TEMPLATES[reason]
                          ? "bg-white text-black border-white"
                          : "bg-white/5 text-gray-400 border-white/10 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <MessageSquare size={12} /> Feedback Message Preview
                  </label>
                  <span className="text-[10px] text-gray-600">
                    Visible to {rejectModal.name}
                  </span>
                </div>

                <div className="relative group">
                  <textarea
                    placeholder="Select a reason above or type here..."
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-gray-200 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 outline-none transition resize-none leading-relaxed"
                    rows={5}
                    onChange={(e) => setFeedbackReason(e.target.value)}
                    value={feedbackReason}
                  />
                  {!feedbackReason && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-gray-600 text-sm flex items-center gap-2 opacity-50">
                        <AlertTriangle size={14} /> Reason required
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex gap-3 justify-end">
              <button
                onClick={() =>
                  setRejectModal({ show: false, appId: null, name: "" })
                }
                className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-400 font-bold text-sm hover:bg-white/5 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={submitRejection}
                disabled={isRejecting || !feedbackReason}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isRejecting ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  "Reject & Send Feedback"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: DELETE CONFIRMATION (CANDIDATE) --- */}
      {deleteCandidateModal.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[110] p-4 transition-all duration-300">
          <div className="bg-[#111827] border border-white/10 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden scale-in-95 animate-in duration-200">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <Trash2 className="text-red-500" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Remove Candidate?
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Are you sure you want to remove{" "}
                <span className="font-bold text-white">
                  {deleteCandidateModal.name}
                </span>{" "}
                from the pipeline? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setDeleteCandidateModal({
                      show: false,
                      appId: null,
                      name: "",
                    })
                  }
                  className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-bold text-sm hover:bg-white/5 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteCandidate}
                  disabled={isDeletingCandidate}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeletingCandidate ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    "Remove"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: DELETE CONFIRMATION (JOB) --- */}
      {deleteJobModal.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[110] p-4 transition-all duration-300">
          <div className="bg-[#111827] border border-white/10 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden scale-in-95 animate-in duration-200">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <AlertTriangle className="text-red-500" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Delete Job Post?
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Are you sure you want to delete{" "}
                <span className="font-bold text-white">
                  "{deleteJobModal.title}"
                </span>
                ? All applications will be permanently removed.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setDeleteJobModal({ show: false, jobId: null, title: "" })
                  }
                  className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-bold text-sm hover:bg-white/5 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteJob}
                  disabled={isDeletingJob}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeletingJob ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    "Delete Job"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Briefcase, Users, Building2, LogOut, 
  Trash2, Search, CheckCircle, XCircle, ShieldAlert, Loader2,
  AlertTriangle, X, Plus, MapPin, Clock, Globe, ChevronDown, FileText, Linkedin
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- TYPES ---
interface Job {
  id: string; 
  title: string;
  company_name: string;
  location: string;
  employment_type: string;
  source: string;
  is_direct: boolean;
  created_at: string;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  created_at: string;
  match_score: number;
}

interface RecruiterData {
  id: number;
  name: string;
  company_name: string;
  official_email: string;
  verification_status: string;
  linkedin_url?: string; // Added field
  job_count: number;
  created_at: string;
}

interface Stats {
  total_users: number;
  total_recruiters: number;
  total_jobs: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  
  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'users' | 'recruiters'>('overview');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Job Post State
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobFormData, setJobFormData] = useState({
    title: "",
    company_name: "",
    location: "",
    employment_type: "", 
    description: "",
    apply_link: ""
  });
  
  // Data
  const [stats, setStats] = useState<Stats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [recruiters, setRecruiters] = useState<RecruiterData[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, jobsRes, usersRes, recruitersRes] = await Promise.all([
        fetch('http://localhost:8000/admin/stats'),
        fetch('http://localhost:8000/admin/jobs'),
        fetch('http://localhost:8000/admin/users'),
        fetch('http://localhost:8000/admin/recruiters')
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (jobsRes.ok) setJobs(await jobsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (recruitersRes.ok) setRecruiters(await recruitersRes.json());
      
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- ACTIONS ---

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobFormData.employment_type) return toast.error("Please select employment type");
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:8000/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobFormData),
      });

      if (res.ok) {
        toast.success("Job posted successfully");
        setIsJobModalOpen(false);
        setJobFormData({ title: "", company_name: "", location: "", employment_type: "", description: "", apply_link: "" });
        fetchData();
      } else {
        toast.error("Failed to post job");
      }
    } catch (error) {
      toast.error("Server error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async (type: 'jobs' | 'users' | 'recruiters', id: string | number) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`http://localhost:8000/admin/${type}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Deleted successfully");
        fetchData();
      }
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const executeRecruiterStatus = async (id: number, status: 'verified' | 'rejected') => {
    const toastId = toast.loading("Updating status...");
    try {
        const res = await fetch(`http://localhost:8000/admin/recruiters/${id}/verify`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            toast.success(`Recruiter ${status}`, { id: toastId });
            fetchData();
        } else {
            throw new Error("Failed");
        }
    } catch (error) {
        toast.error("Update failed", { id: toastId });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/admin/login');
  };

  // --- FILTERING ---
  const filteredJobs = jobs.filter(j => j.title.toLowerCase().includes(searchTerm.toLowerCase()) || j.company_name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredRecruiters = recruiters.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.company_name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading && !stats) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600 h-10 w-10" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      <Toaster position="top-right" />

      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full z-[110] flex flex-col shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-500/30"><ShieldAlert size={20}/></div>
            <div>
                <span className="font-bold text-lg block leading-none">TruthHire</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Admin Panel</span>
            </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
            <SidebarItem icon={<LayoutDashboard size={18}/>} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <SidebarItem icon={<Briefcase size={18}/>} label="Jobs Database" active={activeTab === 'jobs'} onClick={() => setActiveTab('jobs')} />
            <SidebarItem icon={<Users size={18}/>} label="Candidates" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
            <SidebarItem icon={<Building2 size={18}/>} label="Recruiters" active={activeTab === 'recruiters'} onClick={() => setActiveTab('recruiters')} />
        </nav>

        <div className="p-4 border-t border-slate-100">
            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <LogOut size={18} /> Logout
            </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="ml-64 flex-1 p-8 overflow-y-auto">
        
        <header className="flex justify-between items-center mb-8 sticky top-0 bg-slate-50/95 backdrop-blur-sm py-4 z-[100] border-b border-slate-200 -mx-8 px-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 capitalize">{activeTab}</h1>
                <p className="text-slate-500 text-sm mt-1">Platform administration and data control.</p>
            </div>
            
            <div className="flex items-center gap-4">
                {activeTab === 'jobs' && (
                  <button 
                    onClick={() => setIsJobModalOpen(true)} // Corrected Trigger
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-500/20"
                  >
                    <Plus size={18} /> Post Manual Job
                  </button>
                )}
                {activeTab !== 'overview' && (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder={`Search ${activeTab}...`} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none w-64 bg-white transition-all shadow-sm"
                        />
                    </div>
                )}
            </div>
        </header>

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && stats && (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Total Candidates" value={stats.total_users} icon={<Users size={24}/>} color="bg-blue-50 text-blue-600 border-blue-100" />
                    <StatCard title="Total Recruiters" value={stats.total_recruiters} icon={<Building2 size={24}/>} color="bg-purple-50 text-purple-600 border-purple-100" />
                    <StatCard title="Active Jobs" value={stats.total_jobs} icon={<Briefcase size={24}/>} color="bg-green-50 text-green-600 border-green-100" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock size={18} className="text-blue-500"/> Recent Jobs</h3>
                        <div className="space-y-3">
                            {jobs.slice(0, 5).map(job => (
                                <div key={job.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors">
                                    <div><p className="font-medium text-sm text-slate-900">{job.title}</p><p className="text-xs text-slate-500">{job.company_name}</p></div>
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold">{new Date(job.created_at).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><ShieldAlert size={18} className="text-amber-500"/> Pending Verification</h3>
                        <div className="space-y-3">
                            {recruiters.filter(r => r.verification_status === 'pending').slice(0, 5).map(r => (
                                <div key={r.id} className="flex justify-between items-center p-3 bg-amber-50 border border-amber-100 rounded-lg">
                                    <div><p className="font-bold text-sm text-amber-900">{r.name}</p><p className="text-xs text-amber-700">{r.company_name}</p></div>
                                    <button onClick={() => setActiveTab('recruiters')} className="text-xs bg-white text-amber-600 border border-amber-200 px-3 py-1 rounded hover:bg-amber-50 font-medium">Review</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* 2. JOBS TAB */}
        {activeTab === 'jobs' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm animate-in fade-in">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b">
                        <tr>
                            <th className="px-6 py-4">Title</th>
                            <th className="px-6 py-4">Company</th>
                            <th className="px-6 py-4">Source</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredJobs.map(job => (
                            <tr key={job.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium">{job.title}</td>
                                <td className="px-6 py-4 text-slate-600">{job.company_name}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full border ${job.is_direct ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                        {job.source}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => executeDelete('jobs', job.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={18}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* 3. CANDIDATES TAB */}
        {activeTab === 'users' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm animate-in fade-in">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Candidate Name</th>
                            <th className="px-6 py-4">Email Address</th>
                            <th className="px-6 py-4">Avg Match Score</th>
                            <th className="px-6 py-4">Joined On</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                                <td className="px-6 py-4 text-slate-600 text-sm">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`font-bold text-sm ${user.match_score >= 70 ? 'text-green-600' : 'text-amber-600'}`}>
                                        {user.match_score > 0 ? `${user.match_score}%` : 'N/A'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500 text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => executeDelete('users', user.id)} className="text-slate-400 hover:text-red-600 p-2 rounded-lg transition-all"><Trash2 size={18}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* 4. RECRUITERS TAB (UPDATED WITH LINKEDIN & VERIFICATION) */}
        {activeTab === 'recruiters' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm animate-in fade-in">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Recruiter Name</th>
                            <th className="px-6 py-4">Company</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Moderation</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredRecruiters.map(r => (
                            <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-900 text-sm">{r.name}</div>
                                    <div className="text-[10px] text-slate-400">{r.official_email}</div>
                                    {/* LINKEDIN DISPLAY */}
                                    {r.linkedin_url && (
                                        <a href={r.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1 font-medium bg-blue-50 px-2 py-0.5 rounded">
                                            <Linkedin size={10} /> View Profile
                                        </a>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-slate-600 text-sm font-bold">{r.company_name}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                        r.verification_status === 'verified' ? 'bg-green-50 text-green-700 border-green-100' : 
                                        r.verification_status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-700 border-red-100'
                                    }`}>
                                        {r.verification_status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        {r.verification_status === 'pending' && (
                                            <>
                                                <button onClick={() => executeRecruiterStatus(r.id, 'verified')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all" title="Approve"><CheckCircle size={18}/></button>
                                                <button onClick={() => executeRecruiterStatus(r.id, 'rejected')} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Reject"><XCircle size={18}/></button>
                                            </>
                                        )}
                                        <button onClick={() => executeDelete('recruiters', r.id)} className="p-2 text-slate-400 hover:text-red-600 transition-all"><Trash2 size={18}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

      </main>

      {/* --- MANUAL JOB MODAL (RECRUITER DESIGN STYLE) --- */}
      {isJobModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in zoom-in-95">
          <div className="bg-[#111827] rounded-[2rem] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col border border-white/10">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white"><Briefcase size={20}/></div>
                <div>
                   <h2 className="text-xl font-bold text-white leading-tight">Post Manual Job</h2>
                   <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-0.5">TruthHire Admin Node</p>
                </div>
              </div>
              <button onClick={() => setIsJobModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition text-gray-400 hover:text-white"><X size={20}/></button>
            </div>
            
            <form onSubmit={handlePostJob} className="p-8 space-y-6 overflow-y-auto max-h-[80vh]">
              {/* Form Content same as before... omitted for brevity as logic is same */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Job Title *</label>
                  <input type="text" required value={jobFormData.title} onChange={(e) => setJobFormData({...jobFormData, title: e.target.value})} className="w-full bg-[#030712] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none transition placeholder:text-gray-700" placeholder="Ex: Lead Product Designer" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Company Name *</label>
                  <input type="text" required value={jobFormData.company_name} onChange={(e) => setJobFormData({...jobFormData, company_name: e.target.value})} className="w-full bg-[#030712] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none transition placeholder:text-gray-700" placeholder="Ex: TruthHire Inc" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Work Location *</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-3.5 text-gray-600"/>
                    <input type="text" required value={jobFormData.location} onChange={(e) => setJobFormData({...jobFormData, location: e.target.value})} className="w-full bg-[#030712] border border-white/10 rounded-xl p-3 pl-10 text-sm text-white outline-none focus:border-blue-500 transition placeholder:text-gray-700" placeholder="Pune / Remote" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Employment Type</label>
                  <div className="relative group">
                    <select value={jobFormData.employment_type} onChange={(e) => setJobFormData({...jobFormData, employment_type: e.target.value})} className={`w-full bg-[#030712] border border-white/10 rounded-xl p-3 text-sm appearance-none outline-none focus:border-blue-500 transition cursor-pointer ${!jobFormData.employment_type ? 'text-gray-600' : 'text-white'}`}>
                      <option value="" disabled>Select Type</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-3.5 text-gray-600 pointer-events-none group-focus-within:text-blue-500 transition-colors"/>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Apply Link / Official Email</label>
                <input type="text" value={jobFormData.apply_link} onChange={(e) => setJobFormData({...jobFormData, apply_link: e.target.value})} className="w-full bg-[#030712] border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-500 transition placeholder:text-gray-700" placeholder="https://careers.google.com or careers@co.in" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Job Description *</label>
                <textarea required rows={5} value={jobFormData.description} onChange={(e) => setJobFormData({...jobFormData, description: e.target.value})} className="w-full bg-[#030712] border border-white/10 rounded-xl p-4 text-sm text-white outline-none focus:border-blue-500 transition-all resize-none leading-relaxed placeholder:text-gray-700" placeholder="Paste full JD content here for AI indexing..." />
              </div>

              <div className="pt-4">
                <button type="submit" disabled={isSubmitting} className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-xl">
                   {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <><Globe size={20}/> Publish Manual Posting</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SHARED COMPONENTS ---

function SidebarItem({ icon, label, active, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                ${active 
                    ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'}
            `}
        >
            <div className={active ? "text-blue-600" : "text-slate-400"}>
                {icon}
            </div>
            {label}
        </button>
    );
}

function StatCard({ title, value, icon, color }: any) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className={`p-4 rounded-xl ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{title}</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">{value}</h3>
            </div>
        </div>
    );
}
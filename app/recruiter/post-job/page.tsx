"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Briefcase, FileText, Target, X, Plus, 
  Loader2, DollarSign, Eye, EyeOff, ChevronDown, 
  Sparkles, MapPin, Laptop, Globe, CheckCircle2, Shield, AlertTriangle
} from "lucide-react";

// --- REUSABLE COMPONENTS (Consistent Design) ---
const SectionHeader = ({ icon: Icon, title, action }: any) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-white/5 pb-4 gap-4 sm:gap-0">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
        <Icon size={16} />
      </div>
      <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
    </div>
    {action && <div className="w-full sm:w-auto">{action}</div>}
  </div>
);

const Label = ({ children, required }: any) => (
  <label className="block text-xs font-semibold text-gray-400 mb-1.5 ml-0.5">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const InputField = ({ icon: Icon, ...props }: any) => (
  <div className="relative group">
    {Icon && (
      <Icon
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors pointer-events-none"
      />
    )}
    <input
      {...props}
      className={`w-full bg-[#0A0A0A] border border-white/10 rounded-lg ${
        Icon ? "pl-10" : "px-4"
      } py-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition placeholder:text-gray-600`}
    />
  </div>
);

const SelectField = ({ icon: Icon, options, value, onChange, placeholder }: any) => (
  <div className="relative group">
    {Icon && (
      <Icon
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10 pointer-events-none"
      />
    )}
    <select
      value={value}
      onChange={onChange}
      className={`w-full bg-[#0A0A0A] border border-white/10 rounded-lg ${
        Icon ? "pl-10" : "px-4"
      } pr-10 py-2.5 text-sm appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition cursor-pointer ${
        value === "" ? "text-gray-600" : "text-white"
      }`}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    <ChevronDown
      size={16}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"
    />
  </div>
);

const TextAreaField = (props: any) => (
  <textarea
    {...props}
    className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition resize-none placeholder:text-gray-600 leading-relaxed"
  />
);

export default function PostJobPage() {
  const router = useRouter();
  const [recruiterId, setRecruiterId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState(""); 
  const [posting, setPosting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  // --- MODAL STATES ---
  const [modalType, setModalType] = useState<'none' | 'loading_ai' | 'success_post' | 'error'>('none');
  const [modalMessage, setModalMessage] = useState("");
  const [trustScore, setTrustScore] = useState(0);

  const [formData, setFormData] = useState({
    title: "",
    employment_type: "", 
    location_type: "",    
    location: "",
    salary_min: "",
    salary_max: "",
    currency: "INR",
    salary_frequency: "Monthly",
    hide_salary: false,
    equity: false,
    about_role: "",
    responsibilities: "",
    requirements: "",
    benefits: "",
    skills_required: [] as string[],
    experience_level: "",
  });

  // Fetch Recruiter Data on Mount
  useEffect(() => {
    const id = localStorage.getItem("recruiter_id");
    const token = localStorage.getItem("recruiter_token");
    
    if (!id || !token) {
        router.push("/recruiter/login");
        return;
    }
    setRecruiterId(id);

    // Fetch Recruiter Profile to get Company Name for AI
    fetch("${process.env.NEXT_PUBLIC_API_URL}/recruiters/me", {
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        if (data.company_name) setCompanyName(data.company_name);
    })
    .catch(err => console.error("Failed to fetch recruiter info", err));

  }, []);

  // --- AI GENERATION LOGIC ---
  const handleAiGenerate = async () => {
    // Validation
    if (!formData.title || !formData.experience_level || !formData.location_type || !formData.employment_type) {
      setModalMessage("Please fill Title, Experience, Work Mode & Type first.");
      setModalType('error');
      return;
    }

    setModalType('loading_ai'); // Show AI Loading Modal

    try {
      const res = await fetch("${process.env.NEXT_PUBLIC_API_URL}/admin/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          company: companyName || "Our Company", 
          experience: formData.experience_level,
          work_mode: formData.location_type,
          employment_type: formData.employment_type,
          skills: formData.skills_required.join(", ") 
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({
          ...prev,
          about_role: data.about_role || prev.about_role,
          responsibilities: data.responsibilities || prev.responsibilities,
          requirements: data.requirements || prev.requirements,
          benefits: data.benefits || prev.benefits,
        }));
        setModalType('none'); // Close modal on success
      } else {
        setModalMessage("Failed to generate content.");
        setModalType('error');
      }
    } catch {
      setModalMessage("AI Service Error.");
      setModalType('error');
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills_required.includes(skillInput.trim())) {
      setFormData({ ...formData, skills_required: [...formData.skills_required, skillInput.trim()] });
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills_required: formData.skills_required.filter(s => s !== skill) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosting(true);
    
    // Using AI loading modal for posting as well, but contextually aware
    // Ideally create a separate "Analyzing" state if desired, but reusing Loading AI style is fine
    // Or just rely on the button spinner + a final success modal.
    
    // Let's rely on button spinner for the *action*, and only show Modal on Success/Error.
    
    const description = `About the Role:\n${formData.about_role}\n\nResponsibilities:\n${formData.responsibilities}\n\nRequirements:\n${formData.requirements}\n\nBenefits:\n${formData.benefits}`;

    try {
      const token = localStorage.getItem("recruiter_token");
      if (!token) {
        setModalMessage("Please login first.");
        setModalType('error');
        router.push("/recruiter/login");
        return;
      }

      const response = await fetch("${process.env.NEXT_PUBLIC_API_URL}/recruiters/post-job", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          employment_type: formData.employment_type,
          location_type: formData.location_type,
          location: formData.location,
          salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
          salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
          currency: formData.currency,
          salary_frequency: formData.salary_frequency,
          equity: formData.equity,
          description: description,
          skills_required: formData.skills_required.join(", "),
          experience_level: formData.experience_level,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setTrustScore(data.trust_score);
        setModalType('success_post'); // Show Success Modal
        setTimeout(() => router.push("/recruiter/dashboard"), 2000);
      } else {
        setModalMessage(data.detail || "Job blocked by AI Trust Engine");
        setModalType('error');
      }
    } catch (err) {
      setModalMessage("Connection error.");
      setModalType('error');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30">
      
      {/* --- HEADER --- */}
      <header className="fixed top-0 left-0 right-0 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/5 z-50 h-14 md:h-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          <button
            onClick={() => router.push("/recruiter/dashboard")}
            className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-400 hover:text-white transition group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          <div className="text-xs md:text-sm font-bold text-gray-600 uppercase tracking-widest">
            New Job Posting
          </div>
        </div>
      </header>

      <main className="pt-20 md:pt-24 pb-20 px-4 md:px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- LEFT FORM (8 Cols) --- */}
          <div className="lg:col-span-8 space-y-6">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Post a Job</h1>
              <p className="text-sm text-gray-500">
                Reach verified candidates with AI-powered matching.
              </p>
            </div>

            <form id="job-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* 1. BASIC DETAILS */}
              <div className="bg-[#111] border border-white/5 rounded-xl p-5 md:p-6 shadow-sm">
                <SectionHeader icon={Briefcase} title="Basic Details" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="col-span-full md:col-span-1">
                    <Label required>Job Title</Label>
                    <InputField 
                      placeholder="e.g. Senior React Developer" 
                      value={formData.title} 
                      onChange={(e: any) => setFormData({ ...formData, title: e.target.value })} 
                    />
                  </div>
                  <div>
                    <Label required>Location</Label>
                    <InputField 
                      icon={MapPin}
                      placeholder="e.g. Pune, India" 
                      value={formData.location} 
                      onChange={(e: any) => setFormData({ ...formData, location: e.target.value })} 
                    />
                  </div>
                  <div>
                    <Label required>Work Mode</Label>
                    <SelectField 
                      icon={Laptop}
                      placeholder="Select Mode"
                      value={formData.location_type}
                      onChange={(e: any) => setFormData({ ...formData, location_type: e.target.value })}
                      options={[
                        { label: "On-site", value: "On-site" },
                        { label: "Remote", value: "Remote" },
                        { label: "Hybrid", value: "Hybrid" },
                      ]}
                    />
                  </div>
                  <div>
                    <Label required>Employment Type</Label>
                    <SelectField 
                      placeholder="Select Type"
                      value={formData.employment_type}
                      onChange={(e: any) => setFormData({ ...formData, employment_type: e.target.value })}
                      options={[
                        { label: "Full-time", value: "Full-time" },
                        { label: "Part-time", value: "Part-time" },
                        { label: "Contract", value: "Contract" },
                        { label: "Internship", value: "Internship" },
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* 2. SKILLS & COMPENSATION */}
              <div className="bg-[#111] border border-white/5 rounded-xl p-5 md:p-6 shadow-sm">
                <SectionHeader icon={Target} title="Skills & Compensation" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                    <div className="col-span-full">
                      <Label required>Experience Level</Label>
                      <SelectField 
                        placeholder="Select Level"
                        value={formData.experience_level}
                        onChange={(e: any) => setFormData({ ...formData, experience_level: e.target.value })}
                        options={[
                          { label: "Fresher (0-1y)", value: "0-1 years" },
                          { label: "Junior (1-3y)", value: "1-3 years" },
                          { label: "Mid-level (3-5y)", value: "3-5 years" },
                          { label: "Senior (5+y)", value: "5-10 years" },
                        ]}
                      />
                    </div>

                    <div className="col-span-full">
                      <div className="flex items-center justify-between mb-2">
                        <Label>Compensation Package</Label>
                        <button 
                            type="button" 
                            onClick={() => setFormData({...formData, hide_salary: !formData.hide_salary})}
                            className={`text-xs flex items-center gap-1.5 ${formData.hide_salary ? 'text-red-400' : 'text-green-400'}`}
                        >
                            {formData.hide_salary ? <EyeOff size={12}/> : <Eye size={12}/>}
                            {formData.hide_salary ? "Hidden from public" : "Visible"}
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-3 bg-[#0A0A0A] p-3 rounded-xl border border-white/10">
                         {/* Currency */}
                         <div className="col-span-4 sm:col-span-1">
                            <select 
                                value={formData.currency}
                                onChange={(e) => setFormData({...formData, currency: e.target.value})}
                                className="w-full bg-transparent text-sm text-gray-300 outline-none h-full py-2 cursor-pointer"
                            >
                                <option value="INR">INR (₹)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                            </select>
                         </div>

                         {/* Min */}
                         <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-white/10 pl-0 sm:pl-3 pt-2 sm:pt-0">
                            <input 
                                type="number" 
                                placeholder="Min" 
                                value={formData.salary_min}
                                onChange={(e) => setFormData({...formData, salary_min: e.target.value})}
                                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
                            />
                         </div>

                         {/* Max */}
                         <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-white/10 pl-0 sm:pl-3 pt-2 sm:pt-0">
                            <input 
                                type="number" 
                                placeholder="Max" 
                                value={formData.salary_max}
                                onChange={(e) => setFormData({...formData, salary_max: e.target.value})}
                                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
                            />
                         </div>

                         {/* Frequency */}
                         <div className="col-span-4 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-white/10 pl-0 sm:pl-3 pt-2 sm:pt-0">
                            <select 
                                value={formData.salary_frequency}
                                onChange={(e) => setFormData({...formData, salary_frequency: e.target.value})}
                                className="w-full bg-transparent text-xs text-gray-400 outline-none h-full py-2 cursor-pointer"
                            >
                                <option value="Monthly">/ Month</option>
                                <option value="Yearly">/ Year (LPA)</option>
                            </select>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3 ml-1">
                        <input type="checkbox" checked={formData.equity} onChange={(e) => setFormData({ ...formData, equity: e.target.checked })} className="w-4 h-4 accent-blue-600 rounded cursor-pointer bg-transparent border-gray-600" id="equity" />
                        <label htmlFor="equity" className="text-xs text-gray-400 cursor-pointer select-none">Includes equity / stock options</label>
                      </div>
                    </div>
                </div>

                {/* Skills Input */}
                <div>
                  <Label required>Required Skills</Label>
                  <p className="text-[10px] text-gray-500 mb-2">Add skills to improve AI matching accuracy. (Press Enter to add)</p>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition placeholder:text-gray-600"
                      placeholder="e.g. React, Node.js"
                    />
                    <button type="button" onClick={addSkill} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition">
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[40px]">
                    {formData.skills_required.map((skill) => (
                      <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-400">
                        {skill} 
                        <button type="button" onClick={() => removeSkill(skill)} className="hover:text-white transition"><X size={12} /></button>
                      </span>
                    ))}
                    {formData.skills_required.length === 0 && <span className="text-xs text-gray-600 italic py-1">No skills added yet.</span>}
                  </div>
                </div>
              </div>

              {/* 3. JOB CONTENT (AI ENABLED) */}
              <div className="bg-[#111] border border-white/5 rounded-xl p-5 md:p-6 shadow-sm">
                <SectionHeader 
                  icon={FileText} 
                  title="Job Content" 
                  action={
                    <button
                        type="button"
                        onClick={handleAiGenerate}
                        disabled={generating || !formData.title}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        AI Auto-Fill
                    </button>
                  }
                />

                <div className="space-y-5">
                  <div>
                    <Label required>About the Role</Label>
                    <TextAreaField 
                      rows={3} 
                      placeholder="Brief overview of the role and company culture..."
                      value={formData.about_role}
                      onChange={(e: any) => setFormData({ ...formData, about_role: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label required>Responsibilities</Label>
                    <TextAreaField 
                      rows={5} 
                      placeholder="Key tasks and duties..."
                      value={formData.responsibilities}
                      onChange={(e: any) => setFormData({ ...formData, responsibilities: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label required>Requirements</Label>
                    <TextAreaField 
                      rows={5} 
                      placeholder="Technical and soft skills needed..."
                      value={formData.requirements}
                      onChange={(e: any) => setFormData({ ...formData, requirements: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Benefits</Label>
                    <TextAreaField 
                      rows={3} 
                      placeholder="Perks, insurance, etc..."
                      value={formData.benefits}
                      onChange={(e: any) => setFormData({ ...formData, benefits: e.target.value })}
                    />
                  </div>
                </div>
              </div>

            </form>
          </div>

          {/* --- RIGHT SIDEBAR (4 Cols) --- */}
          <div className="lg:col-span-4 space-y-6 h-fit lg:sticky lg:top-24">
            
            {/* Action Card */}
            <div className="bg-[#111] border border-white/10 rounded-xl p-6 shadow-xl">
              <h3 className="font-bold text-white mb-4">Publishing Actions</h3>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                Your job will be reviewed by our AI Trust Engine. High trust scores (&gt;75%) go live immediately.
              </p>

              <div className="space-y-3">
                <button
                  type="submit"
                  form="job-form"
                  disabled={posting}
                  className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 text-sm"
                >
                  {posting ? <Loader2 className="animate-spin" size={16} /> : "Publish Job"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/recruiter/dashboard")}
                  className="w-full py-3 text-xs font-bold text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition"
                >
                  Discard Draft
                </button>
              </div>
            </div>

            {/* AI Tips */}
            <div className="bg-[#111] border border-white/5 rounded-xl p-5">
               <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                 <Sparkles size={12}/> Pro Tips
               </h4>
               <ul className="space-y-3">
                  <li className="text-xs text-gray-400 leading-relaxed">• Adding salary range boosts visibility by 40%.</li>
                  <li className="text-xs text-gray-400 leading-relaxed">• Use the AI Auto-Fill to generate structured content instantly.</li>
                  <li className="text-xs text-gray-400 leading-relaxed">• Add at least 5 specific skills for better candidate matching.</li>
               </ul>
            </div>

          </div>
        </div>
      </main>

      {/* --- MODALS --- */}

      {/* 1. LOADING MODAL (AI Generation) */}
      {modalType === 'loading_ai' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#131316] border border-white/10 rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-pulse"></div>
                <Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-pulse" />
                <h3 className="text-lg font-bold text-white mb-2">AI is Writing...</h3>
                <p className="text-sm text-gray-400">Crafting a professional job description tailored to your title and requirements.</p>
            </div>
        </div>
      )}

      {/* 2. SUCCESS MODAL (Job Posted) */}
      {modalType === 'success_post' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#131316] border border-green-500/20 rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl relative">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Job Posted Successfully!</h3>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Trust Score</p>
                    <p className="text-3xl font-black text-green-400">{trustScore}/100</p>
                </div>
                <p className="text-sm text-gray-400 mb-6">Redirecting to your dashboard...</p>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-full animate-[loading_2s_ease-in-out]"></div>
                </div>
            </div>
        </div>
      )}

      {/* 3. ERROR MODAL */}
      {modalType === 'error' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#131316] border border-red-500/20 rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl">
                <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                    <AlertTriangle className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Action Required</h3>
                <p className="text-sm text-gray-400 mb-6">{modalMessage}</p>
                <button 
                    onClick={() => setModalType('none')}
                    className="w-full bg-[#27272a] hover:bg-[#3f3f46] text-white font-bold py-3 rounded-xl transition-all text-sm border border-white/10"
                >
                    Dismiss
                </button>
            </div>
        </div>
      )}

    </div>
  );
}
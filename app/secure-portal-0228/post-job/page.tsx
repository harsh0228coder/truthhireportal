"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  FileText,
  Target,
  X,
  Loader2,
  Gift,
  DollarSign,
  ChevronDown,
  MapPin,
  Globe,
  Sparkles,
  Laptop,
  Eye,
  EyeOff,
  CheckCircle2
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// --- REUSABLE COMPONENTS ---
const SectionHeader = ({ icon: Icon, title, action }: any) => (
  <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
        <Icon size={16} />
      </div>
      <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
    </div>
    {action && <div>{action}</div>}
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

export default function AdminPostJobPage() {
  const router = useRouter();
  const [posting, setPosting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    company_name: "",
    location: "",
    location_type: "",
    employment_type: "",
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
    apply_link: "",
  });

  const handleAiGenerate = async () => {
    // Validation: Check if all necessary fields are filled
    if (!formData.title || !formData.company_name || !formData.experience_level || !formData.location_type || !formData.employment_type) {
      toast.error("Please select Title, Company, Experience, Work Mode & Type first.");
      return;
    }

    setGenerating(true);
    const toastId = toast.loading("AI is crafting a professional JD...");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/generate-description`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          company: formData.company_name,
          experience: formData.experience_level,
          // --- PASSING NEW FIELDS ---
          work_mode: formData.location_type,      // e.g., "Remote"
          employment_type: formData.employment_type // e.g., "Full-time"
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
        toast.success("Professional content generated!", { id: toastId });
      } else {
        toast.error("Failed to generate content", { id: toastId });
      }
    } catch {
      toast.error("AI Service Error", { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills_required.includes(skillInput.trim())) {
      setFormData({ ...formData, skills_required: [...formData.skills_required, skillInput.trim()] });
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills_required: formData.skills_required.filter((s) => s !== skill) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employment_type || !formData.experience_level || !formData.location_type) {
      return toast.error("Please select all required dropdown options");
    }
    setPosting(true);
    const toastId = toast.loading("Publishing job...");

    const fullDescription = `About the Role:\n${formData.about_role}\n\nResponsibilities:\n${formData.responsibilities}\n\nRequirements:\n${formData.requirements}\n\nBenefits:\n${formData.benefits}`;
    const formattedSkills = formData.skills_required.join(", ");

    const payload = {
      ...formData,
      description: fullDescription,
      skills_required: formattedSkills,
      salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
      salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Job posted successfully!", { id: toastId });
        setTimeout(() => router.push("/admin/dashboard"), 1500);
      } else {
        const errorData = await res.json();
        const msg = typeof errorData.detail === "string" ? errorData.detail : "Failed to post";
        toast.error(msg, { id: toastId });
      }
    } catch {
      toast.error("Server connection error", { id: toastId });
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30">
      <Toaster position="top-right" />

      {/* --- HEADER --- */}
      <header className="fixed top-0 left-0 right-0 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/5 z-50 h-14">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          <div className="text-xs font-bold text-gray-600 uppercase tracking-widest">
            New Job Entry
          </div>
        </div>
      </header>

      <main className="pt-24 pb-20 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- LEFT FORM (8 Cols) --- */}
          <div className="lg:col-span-8 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Post a Job</h1>
              <p className="text-sm text-gray-500">
                Create a verified job listing for the TruthHire database.
              </p>
            </div>

            <form id="admin-job-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* 1. BASIC DETAILS */}
              <div className="bg-[#111] border border-white/5 rounded-xl p-6 shadow-sm">
                <SectionHeader icon={Briefcase} title="Basic Details" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label required>Job Title</Label>
                    <InputField 
                      placeholder="e.g. Senior React Developer" 
                      value={formData.title} 
                      onChange={(e: any) => setFormData({ ...formData, title: e.target.value })} 
                    />
                  </div>
                  <div>
                    <Label required>Company Name</Label>
                    <InputField 
                      placeholder="e.g. Google" 
                      value={formData.company_name} 
                      onChange={(e: any) => setFormData({ ...formData, company_name: e.target.value })} 
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

              {/* 2. SKILLS & COMPENSATION (RESTORED SALARY SECTION) */}
              <div className="bg-[#111] border border-white/5 rounded-xl p-6 shadow-sm">
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

                   {/* --- RESTORED SALARY SECTION --- */}
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
                         <div className="col-span-1">
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
                         <div className="col-span-1 border-l border-white/10 pl-3">
                            <input 
                                type="number" 
                                placeholder="Min" 
                                value={formData.salary_min}
                                onChange={(e) => setFormData({...formData, salary_min: e.target.value})}
                                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
                            />
                         </div>

                         {/* Max */}
                         <div className="col-span-1 border-l border-white/10 pl-3">
                            <input 
                                type="number" 
                                placeholder="Max" 
                                value={formData.salary_max}
                                onChange={(e) => setFormData({...formData, salary_max: e.target.value})}
                                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
                            />
                         </div>

                         {/* Frequency */}
                         <div className="col-span-1 border-l border-white/10 pl-3">
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
                   </div>
                </div>

                {/* Skills Input */}
                <div>
                  <Label required>Required Skills</Label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition placeholder:text-gray-600"
                      placeholder="Type a skill and press Enter (e.g. React)"
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

              {/* 3. JOB DESCRIPTION (AI) */}
              <div className="bg-[#111] border border-white/5 rounded-xl p-6 shadow-sm">
                <SectionHeader 
                  icon={FileText} 
                  title="Job Content" 
                  action={
                    <button
                        type="button"
                        onClick={handleAiGenerate}
                        disabled={generating || !formData.title}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      placeholder="Brief overview of the role..."
                      value={formData.about_role}
                      onChange={(e: any) => setFormData({ ...formData, about_role: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label required>Responsibilities</Label>
                    <TextAreaField 
                      rows={5} 
                      placeholder="Task 1..."
                      value={formData.responsibilities}
                      onChange={(e: any) => setFormData({ ...formData, responsibilities: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label required>Requirements</Label>
                    <TextAreaField 
                      rows={5} 
                      placeholder="Skill 1..."
                      value={formData.requirements}
                      onChange={(e: any) => setFormData({ ...formData, requirements: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Benefits</Label>
                    <TextAreaField 
                      rows={3} 
                      placeholder="Health Insurance..."
                      value={formData.benefits}
                      onChange={(e: any) => setFormData({ ...formData, benefits: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* 4. APPLY LINK */}
              <div className="bg-[#111] border border-white/5 rounded-xl p-6 shadow-sm">
                <SectionHeader icon={Globe} title="Application" />
                <Label>External Application Link / Email</Label>
                <InputField 
                  icon={Globe}
                  placeholder="https://careers.google.com/jobs/123 or hr@company.com" 
                  value={formData.apply_link} 
                  onChange={(e: any) => setFormData({ ...formData, apply_link: e.target.value })} 
                />
              </div>

            </form>
          </div>

          {/* --- RIGHT SIDEBAR (4 Cols) --- */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Action Card */}
            <div className="bg-[#111] border border-white/10 rounded-xl p-6 shadow-xl sticky top-20">
              <h3 className="font-bold text-white mb-4">Publishing Actions</h3>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                Jobs posted by admins are automatically marked as <span className="text-blue-400 font-bold">Verified</span>. Ensure all details are accurate before publishing.
              </p>

              <div className="space-y-3">
                <button
                  type="submit"
                  form="admin-job-form"
                  disabled={posting}
                  className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 text-sm"
                >
                  {posting ? <Loader2 className="animate-spin" size={16} /> : "Publish Live Job"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/admin/dashboard")}
                  className="w-full py-3 text-xs font-bold text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition"
                >
                  Discard Draft
                </button>
              </div>
            </div>

            {/* Status Checklist */}
            <div className="bg-[#111] border border-white/5 rounded-xl p-5">
               <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Completion Status</h4>
               <div className="space-y-3">
                  <StatusItem label="Basic Info" completed={!!formData.title && !!formData.company_name} />
                  <StatusItem label="Job Description" completed={formData.about_role.length > 20} />
                  <StatusItem label="Requirements" completed={formData.requirements.length > 20} />
                  <StatusItem label="Skills Added" completed={formData.skills_required.length > 0} />
               </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

// Simple Helper for Status Checklist
const StatusItem = ({ label, completed }: { label: string; completed: boolean }) => (
  <div className="flex items-center justify-between text-xs">
    <span className={completed ? "text-white" : "text-gray-500"}>{label}</span>
    {completed ? (
      <CheckCircle2 size={14} className="text-green-500" />
    ) : (
      <div className="w-3.5 h-3.5 rounded-full border border-gray-700" />
    )}
  </div>
);
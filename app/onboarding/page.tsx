"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  User, Briefcase, BookOpen, Code, FileText, CheckCircle, 
  ArrowRight, ArrowLeft, Loader2, X, Plus, Check, ChevronDown 
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// --- CSS FOR HIDING SCROLLBARS ---
const noScrollStyle = `
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

// --- DATASETS ---
const POPULAR_SKILLS = [
  "React", "Node.js", "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "Swift", "Kotlin",
  "HTML", "CSS", "Tailwind CSS", "Bootstrap", "SQL", "NoSQL", "MongoDB", "PostgreSQL", "AWS", "Azure", "Google Cloud",
  "Docker", "Kubernetes", "Git", "Machine Learning", "Data Analysis", "Figma", "UI/UX Design", "Product Management",
  "Communication", "Leadership", "Sales", "Marketing", "SEO", "Content Writing", "Excel", "Power BI"
];

const POPULAR_DEGREES = [
  "Bachelor of Technology (B.Tech)", "Bachelor of Engineering (B.E)", "Bachelor of Science (B.Sc)", "Bachelor of Arts (B.A)",
  "Bachelor of Commerce (B.Com)", "Bachelor of Computer Applications (BCA)", "Master of Technology (M.Tech)", 
  "Master of Science (M.S)", "Master of Business Administration (MBA)", "Master of Computer Applications (MCA)", 
  "PhD", "Diploma", "Associate Degree", "High School"
];

const POPULAR_JOB_TITLES = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "Data Scientist",
  "Product Manager", "UI/UX Designer", "DevOps Engineer", "QA Engineer", "Business Analyst", "Marketing Manager",
  "Sales Associate", "Human Resources Manager", "Content Writer", "Graphic Designer", "Project Manager", 
  "Mobile App Developer", "System Administrator", "Accountant", "Consultant", "Intern"
];

const POPULAR_FIELDS = [
  "Computer Science", "Information Technology", "Electronics & Communication", "Mechanical Engineering", "Civil Engineering",
  "Business Administration", "Marketing", "Finance", "Economics", "Psychology", "Design", "Arts", "Data Science", "Artificial Intelligence"
];

// --- COMPONENTS ---

const InputGroup = ({ label, value, onChange, placeholder, type = "text", error, required }: any) => (
  <div className="mb-5 relative">
    <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 flex justify-between">
      <span>{label} {required && <span className="text-red-500">*</span>}</span>
      {error && <span className="text-red-400 normal-case">{error}</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-[#0A0A0A] border rounded-lg px-4 py-3 text-white outline-none transition placeholder:text-gray-600
        ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}
      `}
      placeholder={placeholder}
    />
  </div>
);

// --- AUTO SUGGESTION INPUT ---
const AutoSuggestionInput = ({ label, value, onChange, options, placeholder, error, required }: any) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(val);
        if (val.length > 0) {
            const filtered = options.filter((opt: string) => 
                opt.toLowerCase().includes(val.toLowerCase())
            ).slice(0, 8);
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleSelect = (val: string) => {
        onChange(val);
        setShowSuggestions(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="mb-5 relative" ref={containerRef}>
            <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 flex justify-between">
                <span>{label} {required && <span className="text-red-500">*</span>}</span>
                {error && <span className="text-red-400 normal-case">{error}</span>}
            </label>
            <div className="relative">
                <input
                    type="text"
                    value={value || ""}
                    onChange={handleInputChange}
                    onFocus={() => value && setShowSuggestions(true)}
                    className={`w-full bg-[#0A0A0A] border rounded-lg px-4 py-3 text-white outline-none transition placeholder:text-gray-600
                        ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}
                    `}
                    placeholder={placeholder}
                />
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#151515] border border-white/10 rounded-xl shadow-2xl z-[60] overflow-hidden max-h-48 overflow-y-auto no-scrollbar">
                        {suggestions.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSelect(item)}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors border-b border-white/5 last:border-0"
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const CustomSelect = ({ label, value, onChange, options, placeholder = "Select", error }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="mb-5 relative" ref={dropdownRef}>
      <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 flex justify-between">
        <span>{label}</span>
        {error && <span className="text-red-400 normal-case">{error}</span>}
      </label>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-[#0A0A0A] border rounded-lg px-4 py-3 text-sm transition-all
          ${error ? 'border-red-500/50' : isOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-white/10 hover:border-white/20'}
        `}
      >
        <span className={value ? "text-white" : "text-gray-500"}>{value || placeholder}</span>
        <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden max-h-56 overflow-y-auto no-scrollbar">
          {options.map((option: string) => (
            <button
              key={option}
              onClick={() => { onChange(option); setIsOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-blue-600 hover:text-white flex justify-between group transition-colors border-b border-white/5 last:border-0"
            >
              {option}
              {value === option && <Check size={14} className="text-white" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- SKILL SELECTOR ---
const SkillSelector = ({ value = [], onChange }: any) => {
    const [inputValue, setInputValue] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        if (val.length > 0) {
            const filtered = POPULAR_SKILLS.filter(
                skill => skill.toLowerCase().includes(val.toLowerCase()) && !value.includes(skill)
            );
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    const addSkill = (skill: string) => {
        if (!value.includes(skill)) {
            onChange([...value, skill]);
        }
        setInputValue("");
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    const removeSkill = (skillToRemove: string) => {
        onChange(value.filter((skill: string) => skill !== skillToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && inputValue) {
            e.preventDefault();
            addSkill(inputValue.trim()); 
        } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
            removeSkill(value[value.length - 1]);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="mb-6 relative" ref={containerRef}>
            <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">
                Skills & Expertise
            </label>
            
            <div 
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-3 flex flex-wrap gap-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all min-h-[60px]"
                onClick={() => inputRef.current?.focus()}
            >
                {value.map((skill: string) => (
                    <span key={skill} className="flex items-center gap-1.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 px-3 py-1.5 rounded-lg text-sm font-medium animate-in zoom-in-95 duration-200">
                        {skill}
                        <button onClick={(e) => { e.stopPropagation(); removeSkill(skill); }} className="hover:text-white transition-colors p-0.5">
                            <X size={14} />
                        </button>
                    </span>
                ))}
                
                <div className="flex-1 min-w-[120px] relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => inputValue && setShowSuggestions(true)}
                        placeholder={value.length === 0 ? "Type a skill (e.g. React, Python)..." : "Add more..."}
                        className="w-full bg-transparent text-white outline-none placeholder:text-gray-600 h-full py-1.5"
                    />
                </div>
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#151515] border border-white/10 rounded-xl shadow-2xl z-[60] overflow-hidden max-h-60 overflow-y-auto no-scrollbar">
                    {suggestions.map((skill) => (
                        <button
                            key={skill}
                            onClick={() => addSkill(skill)}
                            className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-between group border-b border-white/5 last:border-0"
                        >
                            {skill}
                            <Plus size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    ))}
                </div>
            )}
            
            {showSuggestions && inputValue && suggestions.length === 0 && (
                 <div className="absolute top-full left-0 right-0 mt-2 bg-[#151515] border border-white/10 rounded-xl shadow-2xl z-50 p-3 text-center">
                    <button onClick={() => addSkill(inputValue)} className="text-sm text-blue-400 font-bold hover:underline">
                        Add "{inputValue}" as new skill
                    </button>
                 </div>
            )}
        </div>
    );
};

export default function OnboardingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', headline: '', phone: '', location: '',
    school: '', degree: '', fieldOfStudy: '', graduationYear: '',
    jobTitle: '', company: '', startYear: '', endYear: '', description: '',
    skills: [] as string[],
    summary: ''
  });

  const STEPS = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'education', label: 'Education', icon: BookOpen },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'skills', label: 'Skills', icon: Code },
    { id: 'summary', label: 'Summary', icon: FileText }
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
        router.push('/login');
    } else {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => setUserId(data.id))
            .catch(() => router.push('/login'));
    }
  }, [router]);

  const validateStep = (stepIndex: number) => {
    const newErrors: any = {};
    if (stepIndex === 0) {
        if (!formData.firstName) newErrors.firstName = "Required";
        if (!formData.lastName) newErrors.lastName = "Required";
        if (!formData.headline) newErrors.headline = "Required";
        if (!formData.location) newErrors.location = "Required";
    }
    if (stepIndex === 1) {
        if (!formData.school) newErrors.school = "Required";
        if (!formData.degree) newErrors.degree = "Required";
        if (!formData.graduationYear) newErrors.graduationYear = "Required";
    }
    
    // --- FIX: Strict Validation for Experience ---
    // If the user entered ANY info for experience, force them to complete required fields.
    // They can only skip if ALL fields are empty.
    if (stepIndex === 2) {
        const hasSomeExp = formData.jobTitle || formData.company || formData.startYear || formData.description;
        if (hasSomeExp) {
            if (!formData.jobTitle) newErrors.jobTitle = "Required";
            if (!formData.company) newErrors.company = "Required";
            if (!formData.startYear) newErrors.startYear = "Required";
        }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleSubmit();
        }
    } else {
        toast.error("Please complete the required fields");
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!userId) return;
    setLoading(true);

    const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        headline: formData.headline,
        phone: formData.phone,
        location: formData.location,
        bio: formData.summary,
        skills: formData.skills,
        education: [{
            school: formData.school,
            degree: formData.degree,
            field_of_study: formData.fieldOfStudy || "", 
            graduation_year: formData.graduationYear
        }],
        // Fix: Use 'role', 'start_date', 'end_date' to match Profile Page schema
        experiences: formData.jobTitle ? [{
            role: formData.jobTitle,      // Use 'role'
            company: formData.company,
            start_date: formData.startYear, // Use 'start_date'
            end_date: formData.endYear,     // Use 'end_date'
            description: formData.description,
            is_current: formData.endYear === "Present"
        }] : []
    };

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/profile`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            toast.success("Profile Setup Complete!");
            router.push('/dashboard');
        } else {
            const err = await res.json();
            toast.error(err.detail || "Failed to save profile");
        }
    } catch (e) {
        toast.error("Network error occurred");
    } finally {
        setLoading(false);
    }
  };

  const updateForm = (key: string, value: any) => {
      setFormData(prev => ({ ...prev, [key]: value }));
      if (errors[key]) setErrors((prev: any) => ({ ...prev, [key]: null }));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center pt-10 px-4">
      <Toaster position="top-center" />
      <style>{noScrollStyle}</style>
      
      {/* HEADER */}
      <div className="w-full max-w-3xl text-center mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Welcome to TruthHire
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">Let's set up your professional profile in minutes.</p>
      </div>

      {/* STEPPER */}
      <div className="w-full max-w-3xl mb-12">
        <div className="flex justify-between items-center relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/10 -z-10 rounded-full"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 -z-10 rounded-full transition-all duration-500" style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}></div>
            
            {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                    <div key={step.id} className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)] scale-110' : isCompleted ? 'bg-blue-900 text-blue-200' : 'bg-[#1a1a1a] text-gray-500 border border-white/10'}`}>
                            {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                        </div>
                        <span className={`text-[10px] sm:text-xs font-medium ${isActive ? 'text-white' : 'text-gray-500'}`}>{step.label}</span>
                    </div>
                );
            })}
        </div>
      </div>

      {/* FORM CARD */}
      <div className="w-full max-w-2xl bg-[#111] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-visible mb-8">
        
        {/* STEP 1: BASIC INFO */}
        {currentStep === 0 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><User className="text-blue-500"/> Personal Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputGroup label="First Name" value={formData.firstName} onChange={(v: string) => updateForm('firstName', v)} required error={errors.firstName} />
                    <InputGroup label="Last Name" value={formData.lastName} onChange={(v: string) => updateForm('lastName', v)} required error={errors.lastName} />
                </div>
                <InputGroup label="Headline" value={formData.headline} onChange={(v: string) => updateForm('headline', v)} placeholder="e.g. Senior Frontend Developer" required error={errors.headline} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputGroup label="Phone" value={formData.phone} onChange={(v: string) => updateForm('phone', v)} placeholder="+91 9876543210" />
                    <InputGroup label="Location" value={formData.location} onChange={(v: string) => updateForm('location', v)} placeholder="City, Country" required error={errors.location} />
                </div>
            </div>
        )}

        {/* STEP 2: EDUCATION */}
        {currentStep === 1 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><BookOpen className="text-blue-500"/> Highest Education</h2>
                <InputGroup label="School / University" value={formData.school} onChange={(v: string) => updateForm('school', v)} required error={errors.school} />
                
                {/* Auto Suggest for Degree */}
                <AutoSuggestionInput 
                    label="Degree" 
                    value={formData.degree} 
                    onChange={(v: string) => updateForm('degree', v)} 
                    options={POPULAR_DEGREES}
                    placeholder="e.g. B.Tech" 
                    required 
                    error={errors.degree} 
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Auto Suggest for Field */}
                    <AutoSuggestionInput 
                        label="Field of Study" 
                        value={formData.fieldOfStudy} 
                        onChange={(v: string) => updateForm('fieldOfStudy', v)} 
                        options={POPULAR_FIELDS}
                        placeholder="e.g. Computer Science" 
                    />
                    <CustomSelect 
                        label="Graduation Year" 
                        value={formData.graduationYear} 
                        onChange={(v: string) => updateForm('graduationYear', v)} 
                        options={Array.from({length: 40}, (_, i) => (new Date().getFullYear() + 5 - i).toString())}
                        required 
                        error={errors.graduationYear}
                    />
                </div>
            </div>
        )}

        {/* STEP 3: EXPERIENCE (Optional) */}
        {currentStep === 2 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Briefcase className="text-blue-500"/> Most Recent Experience <span className="text-xs text-gray-500 font-normal ml-2">(Optional)</span></h2>
                
                {/* Auto Suggest for Job Title */}
                <AutoSuggestionInput 
                    label="Job Title" 
                    value={formData.jobTitle} 
                    onChange={(v: string) => updateForm('jobTitle', v)} 
                    options={POPULAR_JOB_TITLES}
                    placeholder="e.g. Software Engineer" 
                    required={!!(formData.company || formData.startYear)} // Dynamic Required Logic
                    error={errors.jobTitle}
                />
                
                <InputGroup label="Company" value={formData.company} onChange={(v: string) => updateForm('company', v)} required={!!(formData.jobTitle || formData.startYear)} error={errors.company} />
                <div className="grid grid-cols-2 gap-4">
                    <CustomSelect 
                        label="Start Year" 
                        value={formData.startYear} 
                        onChange={(v: string) => updateForm('startYear', v)} 
                        options={Array.from({length: 30}, (_, i) => (new Date().getFullYear() - i).toString())}
                        required={!!(formData.jobTitle || formData.company)} 
                        error={errors.startYear}
                    />
                    <CustomSelect 
                        label="End Year" 
                        value={formData.endYear} 
                        onChange={(v: string) => updateForm('endYear', v)} 
                        options={["Present", ...Array.from({length: 30}, (_, i) => (new Date().getFullYear() - i).toString())]}
                    />
                </div>
                <div className="mb-5">
                    <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Description</label>
                    <textarea 
                        rows={3} 
                        value={formData.description}
                        onChange={(e) => updateForm('description', e.target.value)}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 transition placeholder:text-gray-600 resize-none"
                        placeholder="Briefly describe your role..."
                    />
                </div>
            </div>
        )}

        {/* STEP 4: SKILLS */}
        {currentStep === 3 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Code className="text-blue-500"/> Skills & Expertise</h2>
                <SkillSelector 
                    value={formData.skills} 
                    onChange={(newSkills: string[]) => updateForm('skills', newSkills)} 
                />
            </div>
        )}

        {/* STEP 5: SUMMARY */}
        {currentStep === 4 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><FileText className="text-blue-500"/> Professional Summary</h2>
                <div className="mb-5">
                    <textarea 
                        rows={6} 
                        value={formData.summary}
                        onChange={(e) => updateForm('summary', e.target.value)}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 transition placeholder:text-gray-600 resize-none"
                        placeholder="Write a short bio about yourself, your achievements, and what you're looking for..."
                    />
                    <p className="text-xs text-gray-500 mt-2 text-right">{formData.summary.length}/500 characters</p>
                </div>
            </div>
        )}

        {/* FOOTER ACTIONS */}
        <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
            <button 
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`px-6 py-2.5 rounded-xl font-medium transition ${currentStep === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 hover:bg-white/5'}`}
            >
                Back
            </button>
            <button 
                onClick={handleNext}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
            >
                {loading ? <Loader2 className="animate-spin" size={18} /> : (currentStep === STEPS.length - 1 ? 'Finish & Save' : 'Continue')}
                {!loading && currentStep !== STEPS.length - 1 && <ArrowRight size={18} />}
            </button>
        </div>

      </div>
    </div>
  );
}
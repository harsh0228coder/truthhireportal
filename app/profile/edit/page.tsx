"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  User,
  Briefcase,
  Building2,
  Zap,
  Github,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Camera,
  Loader2,
  X,
  GraduationCap,
  Calendar,
  Code,
  ChevronDown,
  Check,
  Square,
  CheckSquare,
  Search,
  Wallet,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// --- CSS ---
const noScrollStyle = `
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

// ✅ NEW: INDIAN STATES & CITIES DATASET
const INDIAN_LOCATIONS: Record<string, string[]> = {
  Maharashtra: [
    "Mumbai",
    "Pune",
    "Nagpur",
    "Nashik",
    "Aurangabad",
    "Thane",
    "Solapur",
    "Amravati",
    "Kolhapur",
  ],
  Karnataka: [
    "Bangalore",
    "Mysore",
    "Hubli",
    "Mangalore",
    "Belgaum",
    "Gulbarga",
    "Davangere",
    "Shimoga",
  ],
  Delhi: [
    "New Delhi",
    "Delhi",
    "Noida",
    "Gurgaon (Gurugram)",
    "Ghaziabad",
    "Faridabad",
  ],
  Telangana: [
    "Hyderabad",
    "Warangal",
    "Nizamabad",
    "Karimnagar",
    "Khammam",
    "Ramagundam",
  ],
  "Tamil Nadu": [
    "Chennai",
    "Coimbatore",
    "Madurai",
    "Tiruchirappalli",
    "Salem",
    "Tirunelveli",
    "Erode",
    "Vellore",
  ],
  "Uttar Pradesh": [
    "Lucknow",
    "Kanpur",
    "Varanasi",
    "Agra",
    "Meerut",
    "Allahabad (Prayagraj)",
    "Bareilly",
    "Aligarh",
    "Moradabad",
    "Noida",
  ],
  Gujarat: [
    "Ahmedabad",
    "Surat",
    "Vadodara",
    "Rajkot",
    "Bhavnagar",
    "Jamnagar",
    "Gandhinagar",
    "Junagadh",
  ],
  "West Bengal": [
    "Kolkata",
    "Howrah",
    "Durgapur",
    "Asansol",
    "Siliguri",
    "Bardhaman",
  ],
  Rajasthan: [
    "Jaipur",
    "Jodhpur",
    "Kota",
    "Bikaner",
    "Ajmer",
    "Udaipur",
    "Bhilwara",
    "Alwar",
  ],
  "Madhya Pradesh": [
    "Indore",
    "Bhopal",
    "Jabalpur",
    "Gwalior",
    "Ujjain",
    "Sagar",
    "Dewas",
    "Satna",
  ],
  Bihar: [
    "Patna",
    "Gaya",
    "Bhagalpur",
    "Muzaffarpur",
    "Purnia",
    "Darbhanga",
    "Bihar Sharif",
  ],
  Punjab: [
    "Ludhiana",
    "Amritsar",
    "Jalandhar",
    "Patiala",
    "Bathinda",
    "Mohali",
    "Pathankot",
  ],
  Haryana: [
    "Gurgaon",
    "Faridabad",
    "Panipat",
    "Ambala",
    "Yamunanagar",
    "Rohtak",
    "Hisar",
    "Karnal",
  ],
  "Andhra Pradesh": [
    "Visakhapatnam",
    "Vijayawada",
    "Guntur",
    "Nellore",
    "Kurnool",
    "Rajahmundry",
    "Tirupati",
  ],
  Kerala: [
    "Thiruvananthapuram",
    "Kochi",
    "Kozhikode",
    "Thrissur",
    "Kollam",
    "Palakkad",
    "Alappuzha",
  ],
  Assam: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia"],
  Odisha: [
    "Bhubaneswar",
    "Cuttack",
    "Rourkela",
    "Berhampur",
    "Sambalpur",
    "Puri",
    "Balasore",
  ],
  Jharkhand: [
    "Ranchi",
    "Jamshedpur",
    "Dhanbad",
    "Bokaro",
    "Deoghar",
    "Hazaribagh",
  ],
  Chhattisgarh: [
    "Raipur",
    "Bhilai",
    "Bilaspur",
    "Korba",
    "Durg",
    "Rajnandgaon",
  ],
  Uttarakhand: [
    "Dehradun",
    "Haridwar",
    "Roorkee",
    "Haldwani",
    "Rudrapur",
    "Kashipur",
  ],
  "Himachal Pradesh": [
    "Shimla",
    "Dharamshala",
    "Mandi",
    "Solan",
    "Baddi",
    "Kullu",
  ],
  Goa: ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"],
  "Jammu & Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla"],
  Chandigarh: ["Chandigarh"],
  Pondicherry: ["Pondicherry"],
};

// --- DATASETS ---
const POPULAR_SKILLS = [
  "React",
  "Node.js",
  "Python",
  "JavaScript",
  "TypeScript",
  "Java",
  "C++",
  "C#",
  "Go",
  "Rust",
  "Swift",
  "Kotlin",
  "HTML",
  "CSS",
  "Tailwind CSS",
  "Bootstrap",
  "Sass",
  "GraphQL",
  "REST API",
  "SQL",
  "NoSQL",
  "MongoDB",
  "PostgreSQL",
  "AWS",
  "Azure",
  "Google Cloud",
  "Docker",
  "Kubernetes",
  "Jenkins",
  "CI/CD",
  "Git",
  "GitHub",
  "GitLab",
  "Machine Learning",
  "Deep Learning",
  "Data Analysis",
  "Data Science",
  "Pandas",
  "NumPy",
  "TensorFlow",
  "PyTorch",
  "Figma",
  "Adobe XD",
  "UI/UX Design",
  "Product Management",
  "Agile",
  "Scrum",
  "Jira",
  "Project Management",
  "Communication",
  "Leadership",
  "Teamwork",
  "Problem Solving",
  "Critical Thinking",
  "Time Management",
  "Sales",
  "Marketing",
  "SEO",
  "Content Writing",
  "Social Media Marketing",
  "Email Marketing",
  "Finance",
  "Accounting",
  "Excel",
  "Power BI",
  "Tableau",
  "Blockchain",
  "Cybersecurity",
  "Networking",
];

const POPULAR_JOB_TITLES = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Scientist",
  "Product Manager",
  "UI/UX Designer",
  "DevOps Engineer",
  "QA Engineer",
  "Business Analyst",
  "Marketing Manager",
  "Sales Associate",
  "Human Resources Manager",
  "Content Writer",
  "Graphic Designer",
  "Project Manager",
  "Mobile App Developer",
  "System Administrator",
  "Accountant",
  "Consultant",
  "Intern",
];

const POPULAR_DEGREES = [
  "Bachelor of Technology (B.Tech)",
  "Bachelor of Engineering (B.E)",
  "Bachelor of Science (B.Sc)",
  "Bachelor of Arts (B.A)",
  "Bachelor of Commerce (B.Com)",
  "Bachelor of Computer Applications (BCA)",
  "Master of Technology (M.Tech)",
  "Master of Science (M.S)",
  "Master of Business Administration (MBA)",
  "Master of Computer Applications (MCA)",
  "PhD",
  "Diploma",
  "Associate Degree",
  "High School",
];

const POPULAR_FIELDS = [
  "Computer Science",
  "Information Technology",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Business Administration",
  "Marketing",
  "Finance",
  "Economics",
  "Psychology",
  "Design",
  "Arts",
  "Data Science",
  "Artificial Intelligence",
];

const years = Array.from({ length: 50 }, (_, i) =>
  (new Date().getFullYear() - i).toString(),
);
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// --- UTILITY ---
const getErrorMessage = (data: any) => {
  try {
    if (!data) return "Unknown error occurred";
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail))
      return data.detail[0]?.msg || "Invalid input data";
    if (data.message) return data.message;
    return "Operation failed.";
  } catch (e) {
    return "An unexpected error occurred.";
  }
};

const safeParse = (data: any, fallback: any = []) => {
  if (!data) return fallback;
  if (Array.isArray(data)) return data;
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return fallback;
    }
  }
  return fallback;
};

// --- COMPONENTS ---

const InputGroup = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
  error,
  required,
}: any) => (
  <div className={`mb-5 ${className}`}>
    <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 flex justify-between">
      <span>
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {error && <span className="text-red-400 normal-case">{error}</span>}
    </label>
    <input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-[#0A0A0A] border rounded-lg px-4 py-3 text-white outline-none transition placeholder:text-gray-600
        ${error ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"}
      `}
      placeholder={placeholder}
    />
  </div>
);

// --- AUTO SUGGESTION INPUT ---
const AutoSuggestionInput = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  required,
}: any) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val); // Allow free text input
    if (val.length > 0) {
      const filtered = options
        .filter((opt: string) => opt.toLowerCase().includes(val.toLowerCase()))
        .slice(0, 8); // Limit suggestions to 8
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
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="mb-5 relative" ref={containerRef}>
      <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 flex justify-between">
        <span>
          {label} {required && <span className="text-red-500">*</span>}
        </span>
        {error && <span className="text-red-400 normal-case">{error}</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value || ""}
          onChange={handleInputChange}
          onFocus={() => value && setShowSuggestions(true)}
          className={`w-full bg-[#0A0A0A] border rounded-lg px-4 py-3 text-white outline-none transition placeholder:text-gray-600
                        ${error ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"}
                    `}
          placeholder={placeholder}
        />
        {/* Suggestions Dropdown */}
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

const CustomSelect = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select",
  error,
  disabled = false,
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="mb-5 relative" ref={dropdownRef}>
      {label && (
        <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 flex justify-between">
          <span>{label}</span>
          {error && <span className="text-red-400 normal-case">{error}</span>}
        </label>
      )}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-[#0A0A0A] border rounded-lg px-4 py-3 text-sm transition-all
          ${error ? "border-red-500/50" : isOpen ? "border-blue-500 ring-1 ring-blue-500" : "border-white/10 hover:border-white/20"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <span className={value ? "text-white" : "text-gray-500"}>
          {value || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* High Z-Index to Prevent Going Under */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden max-h-56 overflow-y-auto no-scrollbar">
          {options.map((option: string) => (
            <button
              key={option}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
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

const MonthYearPicker = ({ label, value, onChange, error, disabled }: any) => {
  const [selMonth, selYear] = value ? value.split(" ") : ["", ""];

  const handleUpdate = (m: string, y: string) => {
    if (m && y) onChange(`${m} ${y}`);
    else if (y) onChange(`${m || months[0]} ${y}`);
    else onChange("");
  };

  return (
    <div className="mb-5">
      <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 flex justify-between">
        <span>{label}</span>
        {error && <span className="text-red-400 normal-case">{error}</span>}
      </label>
      <div className="grid grid-cols-2 gap-2">
        <CustomSelect
          value={selMonth}
          onChange={(m: string) => handleUpdate(m, selYear)}
          options={months}
          placeholder="Month"
          disabled={disabled}
          error={error}
        />
        <CustomSelect
          value={selYear}
          onChange={(y: string) => handleUpdate(selMonth, y)}
          options={years}
          placeholder="Year"
          disabled={disabled}
          error={error}
        />
      </div>
    </div>
  );
};

const TextAreaGroup = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  error,
}: any) => (
  <div className="mb-5">
    <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 flex justify-between">
      <span>{label}</span>
      {error && <span className="text-red-400 normal-case">{error}</span>}
    </label>
    <textarea
      rows={rows}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-[#0A0A0A] border rounded-lg px-4 py-3 text-white outline-none transition placeholder:text-gray-600 resize-none
        ${error ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"}
      `}
      placeholder={placeholder}
    />
  </div>
);

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
        (skill) =>
          skill.toLowerCase().includes(val.toLowerCase()) &&
          !value.includes(skill),
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
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
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
          <span
            key={skill}
            className="flex items-center gap-1.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 px-3 py-1.5 rounded-lg text-sm font-medium animate-in zoom-in-95 duration-200"
          >
            {skill}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeSkill(skill);
              }}
              className="hover:text-white transition-colors p-0.5"
            >
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
            placeholder={
              value.length === 0
                ? "Type a skill (e.g. React, Python)..."
                : "Add more..."
            }
            className="w-full bg-transparent text-white outline-none placeholder:text-gray-600 h-full py-1.5"
          />
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#151515] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto no-scrollbar">
          {suggestions.map((skill) => (
            <button
              key={skill}
              onClick={() => addSkill(skill)}
              className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-between group border-b border-white/5 last:border-0"
            >
              {skill}
              <Plus
                size={14}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </button>
          ))}
        </div>
      )}

      {showSuggestions && inputValue && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#151515] border border-white/10 rounded-xl shadow-2xl z-50 p-3 text-center">
          <button
            onClick={() => addSkill(inputValue)}
            className="text-sm text-blue-400 font-bold hover:underline"
          >
            Add "{inputValue}" as new skill
          </button>
        </div>
      )}
    </div>
  );
};

// --- MODAL ---
const EditModal = ({
  isOpen,
  onClose,
  title,
  children,
  onSave,
  saving,
}: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#111] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-white/5">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto no-scrollbar flex-1">
          {children}
        </div>
        <div className="p-6 border-t border-white/5 bg-[#151515] rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 size={16} className="animate-spin" />} Save
            Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default function EditProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("general");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const [experiences, setExperiences] = useState<any[]>([]);
  const [educations, setEducations] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  const [modalType, setModalType] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/candidate/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();

        // ✅ NEW LOGIC: Parse "City, State" back into components
        let parsedState = "";
        let parsedCity = "";

        if (data.location && data.location.includes(",")) {
          const parts = data.location.split(",").map((s: string) => s.trim());
          // Since we save as "City, State", the last part is State
          if (parts.length >= 2) {
            parsedCity = parts[0];
            parsedState = parts[1];
          }
        } else {
          // Fallback for old data or single strings
          parsedCity = data.location || "";
        }

        setUser({ ...data, state: parsedState, city: parsedCity });
        setExperiences(safeParse(data.experiences));
        setProjects(data.projects || []);

        let eduList = safeParse(data.education);
        if (eduList.length === 0 && (data.college || data.degree)) {
          eduList = [
            {
              school: data.college,
              degree: data.degree,
              year: data.batch_year,
              field: "",
            },
          ];
        }
        setEducations(eduList);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  // --- SAVE HANDLERS ---
  const handleSaveProfile = async (payload: any) => {
    setSaving(true);

    // --- SANITIZE PAYLOAD: Empty strings -> null ---
    const sanitizedPayload = Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [
        key,
        value === "" ? null : value,
      ]),
    );

    // --- SMART URL PREFIXER ---
    ["github_url", "linkedin_url", "portfolio_url"].forEach((key) => {
      if (
        sanitizedPayload[key] &&
        sanitizedPayload[key].toString().trim() !== "" &&
        !sanitizedPayload[key].toString().startsWith("http")
      ) {
        sanitizedPayload[key] = `https://${sanitizedPayload[key]}`;
      }
    });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(sanitizedPayload),
        },
      );

      const data = await res.json();

      if (res.ok) {
        toast.success("Profile updated successfully");
        setUser((prev: any) => ({ ...prev, ...sanitizedPayload }));
      } else {
        toast.error(getErrorMessage(data));
      }
    } catch {
      toast.error("Network connection error");
    } finally {
      setSaving(false);
    }
  };

  // --- VALIDATION LOGIC ---
  const validateGeneral = () => {
    const newErrors: any = {};
    if (!user.name) newErrors.name = "Required";
    if (!user.phone) newErrors.phone = "Required";
    if (!user.location) newErrors.location = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateExperience = (item: any) => {
    const newErrors: any = {};
    if (!item.role) newErrors.role = "Required";
    if (!item.company) newErrors.company = "Required";
    if (!item.start_date) newErrors.start_date = "Required";
    if (!item.is_current && !item.end_date) newErrors.end_date = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEducation = (item: any) => {
    const newErrors: any = {};
    if (!item.school) newErrors.school = "Required";
    if (!item.degree) newErrors.degree = "Required";
    if (!item.year) newErrors.year = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateProject = (item: any) => {
    const newErrors: any = {};
    if (!item.title) newErrors.title = "Required";
    if (!item.description) newErrors.description = "Required (Short Summary)";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveGeneral = () => {
    const newErrors: any = {};
    if (!user.name) newErrors.name = "Required";
    if (!user.phone) newErrors.phone = "Required";
    if (!user.state) newErrors.state = "Required"; // ✅ Check State
    if (!user.city) newErrors.city = "Required"; // ✅ Check City

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill required fields");
      return;
    }

    // ✅ Combine back to "City, State"
    const combinedLocation = `${user.city}, ${user.state}`;

    handleSaveProfile({
      name: user.name,
      phone: user.phone,
      headline: user.headline,
      location: combinedLocation, // Sending as single string
      bio: user.bio,
      total_experience: user.total_experience,
      notice_period: user.notice_period,
      current_salary: user.current_salary,
      expected_salary: user.expected_salary,
    });
  };

  const saveExperience = async () => {
    if (!validateExperience(editingItem)) return;

    const itemToSave = {
      ...editingItem,
      end_date: editingItem.is_current ? "Present" : editingItem.end_date,
    };

    const newList = [...experiences];
    if (editingItem.index !== undefined) {
      newList[editingItem.index] = itemToSave;
    } else {
      newList.push(itemToSave);
    }
    setExperiences(newList);
    await handleSaveProfile({ experiences: newList });
    setModalType(null);
  };

  const deleteExperience = async (index: number) => {
    const newList = experiences.filter((_, i) => i !== index);
    setExperiences(newList);
    await handleSaveProfile({ experiences: newList });
  };

  const saveEducation = async () => {
    if (!validateEducation(editingItem)) return;

    const newList = [...educations];
    if (editingItem.index !== undefined) {
      newList[editingItem.index] = editingItem;
    } else {
      newList.push(editingItem);
    }
    setEducations(newList);
    await handleSaveProfile({ education: newList });
    setModalType(null);
  };

  const deleteEducation = async (index: number) => {
    const newList = educations.filter((_, i) => i !== index);
    setEducations(newList);
    await handleSaveProfile({ education: newList });
  };

  const saveProject = async () => {
    if (!validateProject(editingItem)) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const isEdit = !!editingItem.id;
      const url = isEdit
        ? `${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}/projects/${editingItem.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}/projects`;

      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingItem),
      });

      const data = await res.json();

      if (res.ok) {
        const savedProject = data;
        let newProjects = [...projects];
        if (isEdit) {
          newProjects = newProjects.map((p) =>
            p.id === savedProject.id ? savedProject : p,
          );
        } else {
          newProjects.push(savedProject);
        }
        setProjects(newProjects);
        setModalType(null);
        toast.success("Project saved");
      } else {
        toast.error(getErrorMessage(data));
      }
    } catch {
      toast.error("Error saving project");
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}/projects/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setProjects(projects.filter((p) => p.id !== id));
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    }
  };

  if (loading || !user) return <LoadingSpinner />;

  const TABS = [
    { id: "general", label: "General", icon: User },
    { id: "experience", label: "Experience", icon: Briefcase },
    { id: "projects", label: "Projects", icon: Code },
    { id: "education", label: "Education", icon: Building2 },
    { id: "skills", label: "Skills", icon: Zap },
    { id: "socials", label: "Socials", icon: Github },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30">
      <Toaster position="top-center" />
      <style>{noScrollStyle}</style>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#050505] to-[#050505] pointer-events-none -z-10"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center gap-4 mb-10">
          <Link
            href="/profile"
            className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition"
          >
            <ArrowLeft size={20} className="text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Edit Profile</h1>
            <p className="text-gray-400 text-sm">
              Update your personal details and resume.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
          {/* SIDEBAR */}
          <div className="md:col-span-1 flex md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 no-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setErrors({});
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm whitespace-nowrap flex-shrink-0 md:w-full ${
                  activeTab === tab.id
                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
          </div>

          {/* MAIN CONTENT */}
          <div className="md:col-span-3">
            {/* GENERAL TAB */}
            {activeTab === "general" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white border-b border-white/5 pb-2">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputGroup
                      label="Full Name"
                      value={user.name}
                      onChange={(v: string) => setUser({ ...user, name: v })}
                      required
                      error={errors.name}
                    />
                    <InputGroup
                      label="Phone"
                      value={user.phone}
                      onChange={(v: string) => setUser({ ...user, phone: v })}
                      required
                      error={errors.phone}
                    />
                  </div>
                  <InputGroup
                    label="Headline"
                    value={user.headline}
                    onChange={(v: string) => setUser({ ...user, headline: v })}
                  />

                  {/* ✅ REPLACED SINGLE INPUT WITH STATE & CITY DROPDOWNS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AutoSuggestionInput
                      label="State"
                      value={user.state}
                      onChange={(v: string) =>
                        setUser({ ...user, state: v, city: "" })
                      } // Clear city on state change
                      options={Object.keys(INDIAN_LOCATIONS)}
                      placeholder="Select State"
                      required
                      error={errors.state}
                    />
                    <AutoSuggestionInput
                      label="City"
                      value={user.city}
                      onChange={(v: string) => setUser({ ...user, city: v })}
                      options={
                        user.state ? INDIAN_LOCATIONS[user.state] || [] : []
                      }
                      placeholder={
                        user.state ? "Select City" : "Select State first"
                      }
                      required
                      error={errors.city}
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-bold text-white border-b border-white/5 pb-2 flex items-center gap-2">
                    <Wallet size={18} className="text-green-500" /> Career &
                    Compensation
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputGroup
                      label="Total Experience (Years)"
                      value={user.total_experience}
                      onChange={(v: string) =>
                        setUser({ ...user, total_experience: v })
                      }
                      type="number"
                    />
                    <CustomSelect
                      label="Notice Period"
                      value={user.notice_period}
                      onChange={(v: string) =>
                        setUser({ ...user, notice_period: v })
                      }
                      options={[
                        "Immediate",
                        "15 Days",
                        "1 Month",
                        "2 Months",
                        "3 Months",
                        "Serving Notice Period",
                      ]}
                    />
                    <InputGroup
                      label="Current CTC"
                      value={user.current_salary}
                      onChange={(v: string) =>
                        setUser({ ...user, current_salary: v })
                      }
                    />
                    <InputGroup
                      label="Expected CTC"
                      value={user.expected_salary}
                      onChange={(v: string) =>
                        setUser({ ...user, expected_salary: v })
                      }
                    />
                  </div>
                </div>

                <TextAreaGroup
                  label="About"
                  value={user.bio}
                  onChange={(v: string) => setUser({ ...user, bio: v })}
                />

                <div className="flex justify-end pt-4">
                  <button
                    onClick={saveGeneral}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving && <Loader2 size={18} className="animate-spin" />}{" "}
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* EXPERIENCE TAB */}
            {activeTab === "experience" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <h3 className="text-lg font-bold text-white">Work History</h3>
                  <button
                    onClick={() => {
                      setEditingItem({
                        role: "",
                        company: "",
                        start_date: "",
                        end_date: "",
                        description: "",
                        is_current: false,
                      });
                      setErrors({});
                      setModalType("experience");
                    }}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg text-sm text-white transition"
                  >
                    <Plus size={16} /> Add New
                  </button>
                </div>
                {experiences.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                    <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500">No experience added yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {experiences.map((exp, idx) => (
                      <div
                        key={idx}
                        className="bg-[#111] border border-white/5 p-5 rounded-xl flex justify-between items-start group hover:border-white/20 transition-all"
                      >
                        <div>
                          {/* --- FIX: Display both keys to handle legacy data --- */}
                          <h4 className="font-bold text-white text-lg">
                            {exp.role || exp.job_title}
                          </h4>
                          <p className="text-blue-400 text-sm mb-1">
                            {exp.company}
                          </p>
                          <p className="text-xs text-gray-500 mb-3">
                            {exp.start_date} - {exp.end_date}
                          </p>
                          <p className="text-sm text-gray-400 line-clamp-2">
                            {exp.description}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {/* --- FIX: Map job_title to role when editing --- */}
                          <button
                            onClick={() => {
                              setEditingItem({
                                ...exp,
                                role: exp.role || exp.job_title,
                                index: idx,
                                is_current: exp.end_date === "Present",
                              });
                              setErrors({});
                              setModalType("experience");
                            }}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
                          >
                            <Zap size={16} />
                          </button>
                          <button
                            onClick={() => deleteExperience(idx)}
                            className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* EDUCATION TAB */}
            {activeTab === "education" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <h3 className="text-lg font-bold text-white">
                    Education History
                  </h3>
                  <button
                    onClick={() => {
                      setEditingItem({
                        school: "",
                        degree: "",
                        field: "",
                        year: "",
                        grade: "",
                      });
                      setErrors({});
                      setModalType("education");
                    }}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg text-sm text-white transition"
                  >
                    <Plus size={16} /> Add New
                  </button>
                </div>
                {educations.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                    <GraduationCap className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500">No education details added.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {educations.map((edu, idx) => (
                      <div
                        key={idx}
                        className="bg-[#111] border border-white/5 p-5 rounded-xl flex justify-between items-start group hover:border-white/20 transition-all"
                      >
                        <div>
                          <h4 className="font-bold text-white text-lg">
                            {edu.school}
                          </h4>
                          <p className="text-blue-400 text-sm mb-1">
                            {edu.degree} {edu.field ? `• ${edu.field}` : ""}
                          </p>
                          <p className="text-xs text-gray-500">
                            {edu.year} {edu.grade && `• Grade: ${edu.grade}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingItem({ ...edu, index: idx });
                              setErrors({});
                              setModalType("education");
                            }}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
                          >
                            <Zap size={16} />
                          </button>
                          <button
                            onClick={() => deleteEducation(idx)}
                            className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PROJECTS TAB */}
            {activeTab === "projects" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <h3 className="text-lg font-bold text-white">Projects</h3>
                  <button
                    onClick={() => {
                      setEditingItem({
                        title: "",
                        description: "",
                        tech_stack: "",
                        live_link: "",
                        github_link: "",
                      });
                      setErrors({});
                      setModalType("project");
                    }}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg text-sm text-white transition"
                  >
                    <Plus size={16} /> Add New
                  </button>
                </div>
                {projects.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                    <Code className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500">No projects added yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projects.map((proj, idx) => (
                      <div
                        key={idx}
                        className="bg-[#111] border border-white/5 p-5 rounded-xl flex justify-between items-start group hover:border-white/20 transition-all"
                      >
                        <div>
                          <h4 className="font-bold text-white text-lg">
                            {proj.title}
                          </h4>
                          <div className="flex flex-wrap gap-2 my-2">
                            {proj.tech_stack
                              ?.split(",")
                              .map((t: string, i: number) => (
                                <span
                                  key={i}
                                  className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-1 rounded border border-blue-500/20"
                                >
                                  {t.trim()}
                                </span>
                              ))}
                          </div>
                          <p className="text-sm text-gray-400 line-clamp-2">
                            {proj.description}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(proj);
                              setErrors({});
                              setModalType("project");
                            }}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
                          >
                            <Zap size={16} />
                          </button>
                          <button
                            onClick={() => deleteProject(proj.id)}
                            className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SKILLS TAB */}
            {activeTab === "skills" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="bg-[#111] border border-white/10 p-6 rounded-xl">
                  <SkillSelector
                    value={safeParse(user.skills)}
                    onChange={(newSkills: string[]) =>
                      setUser({ ...user, skills: newSkills })
                    }
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => handleSaveProfile({ skills: user.skills })}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving && <Loader2 size={18} className="animate-spin" />}{" "}
                    Save Skills
                  </button>
                </div>
              </div>
            )}

            {/* SOCIALS TAB */}
            {activeTab === "socials" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-lg font-bold text-white border-b border-white/5 pb-2">
                  Social Links
                </h3>
                <div className="bg-[#111] border border-white/10 p-6 rounded-xl space-y-4">
                  <div className="flex items-center gap-4">
                    <Github className="text-white shrink-0" size={24} />
                    <div className="flex-1">
                      <InputGroup
                        label="GitHub URL"
                        value={user.github_url}
                        onChange={(v: string) =>
                          setUser({ ...user, github_url: v })
                        }
                        className="mb-0"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-6 flex justify-center shrink-0">
                      <span className="font-bold text-blue-500 text-xl">
                        in
                      </span>
                    </div>
                    <div className="flex-1">
                      <InputGroup
                        label="LinkedIn URL"
                        value={user.linkedin_url}
                        onChange={(v: string) =>
                          setUser({ ...user, linkedin_url: v })
                        }
                        className="mb-0"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-6 flex justify-center shrink-0">
                      <span className="font-bold text-purple-500 text-xl">
                        W
                      </span>
                    </div>
                    <div className="flex-1">
                      <InputGroup
                        label="Portfolio / Website"
                        value={user.portfolio_url}
                        onChange={(v: string) =>
                          setUser({ ...user, portfolio_url: v })
                        }
                        className="mb-0"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() =>
                      handleSaveProfile({
                        github_url: user.github_url,
                        linkedin_url: user.linkedin_url,
                        portfolio_url: user.portfolio_url,
                      })
                    }
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving && <Loader2 size={18} className="animate-spin" />}{" "}
                    Save Socials
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      {modalType === "experience" && (
        <EditModal
          isOpen={true}
          onClose={() => setModalType(null)}
          title={
            editingItem.index !== undefined
              ? "Edit Experience"
              : "Add Experience"
          }
          onSave={saveExperience}
          saving={saving}
        >
          {/* AUTO-SUGGEST FOR JOB TITLE */}
          <AutoSuggestionInput
            label="Job Title"
            value={editingItem.role}
            onChange={(v: string) =>
              setEditingItem({ ...editingItem, role: v })
            }
            options={POPULAR_JOB_TITLES}
            placeholder="e.g. Senior Software Engineer"
            required
            error={errors.role}
          />
          <InputGroup
            label="Company"
            value={editingItem.company}
            onChange={(v: string) =>
              setEditingItem({ ...editingItem, company: v })
            }
            required
            error={errors.company}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MonthYearPicker
              label="Start Date"
              value={editingItem.start_date}
              onChange={(v: string) =>
                setEditingItem({ ...editingItem, start_date: v })
              }
              error={errors.start_date}
            />
            <MonthYearPicker
              label="End Date"
              value={editingItem.end_date}
              onChange={(v: string) =>
                setEditingItem({ ...editingItem, end_date: v })
              }
              disabled={editingItem.is_current}
              error={errors.end_date}
            />
          </div>
          <div className="flex items-center gap-2 mb-5">
            <button
              onClick={() =>
                setEditingItem({
                  ...editingItem,
                  is_current: !editingItem.is_current,
                })
              }
              className={`flex items-center gap-2 text-sm ${editingItem.is_current ? "text-blue-400" : "text-gray-400"}`}
            >
              {editingItem.is_current ? (
                <CheckSquare size={18} />
              ) : (
                <Square size={18} />
              )}
              Currently working here
            </button>
          </div>
          <TextAreaGroup
            label="Description"
            value={editingItem.description}
            onChange={(v: string) =>
              setEditingItem({ ...editingItem, description: v })
            }
          />
        </EditModal>
      )}

      {modalType === "education" && (
        <EditModal
          isOpen={true}
          onClose={() => setModalType(null)}
          title={
            editingItem.index !== undefined ? "Edit Education" : "Add Education"
          }
          onSave={saveEducation}
          saving={saving}
        >
          <InputGroup
            label="School / University"
            value={editingItem.school}
            onChange={(v: string) =>
              setEditingItem({ ...editingItem, school: v })
            }
            required
            error={errors.school}
          />

          {/* AUTO-SUGGEST FOR DEGREE */}
          <AutoSuggestionInput
            label="Degree"
            value={editingItem.degree}
            onChange={(v: string) =>
              setEditingItem({ ...editingItem, degree: v })
            }
            options={POPULAR_DEGREES}
            placeholder="e.g. B.Tech"
            required
            error={errors.degree}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* AUTO-SUGGEST FOR FIELD OF STUDY */}
            <AutoSuggestionInput
              label="Field of Study"
              value={editingItem.field}
              onChange={(v: string) =>
                setEditingItem({ ...editingItem, field: v })
              }
              options={POPULAR_FIELDS}
              placeholder="e.g. Computer Science"
            />
            <CustomSelect
              label="Graduation Year"
              value={editingItem.year}
              onChange={(v: string) =>
                setEditingItem({ ...editingItem, year: v })
              }
              options={years}
              error={errors.year}
            />
          </div>
          <InputGroup
            label="Grade / CGPA"
            value={editingItem.grade}
            onChange={(v: string) =>
              setEditingItem({ ...editingItem, grade: v })
            }
          />
        </EditModal>
      )}

      {modalType === "project" && (
        <EditModal
          isOpen={true}
          onClose={() => setModalType(null)}
          title={editingItem.id ? "Edit Project" : "Add Project"}
          onSave={saveProject}
          saving={saving}
        >
          <InputGroup
            label="Project Title"
            value={editingItem.title}
            onChange={(v: string) =>
              setEditingItem({ ...editingItem, title: v })
            }
            required
            error={errors.title}
          />
          <InputGroup
            label="Tech Stack (Comma Separated)"
            value={editingItem.tech_stack}
            onChange={(v: string) =>
              setEditingItem({ ...editingItem, tech_stack: v })
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputGroup
              label="Live URL"
              value={editingItem.live_link}
              onChange={(v: string) =>
                setEditingItem({ ...editingItem, live_link: v })
              }
            />
            <InputGroup
              label="GitHub URL"
              value={editingItem.github_link}
              onChange={(v: string) =>
                setEditingItem({ ...editingItem, github_link: v })
              }
            />
          </div>
          <TextAreaGroup
            label="Description"
            value={editingItem.description}
            onChange={(v: string) =>
              setEditingItem({ ...editingItem, description: v })
            }
            required
            error={errors.description}
          />
        </EditModal>
      )}
    </div>
  );
}

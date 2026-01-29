'use client';

import { useState, useEffect, useRef } from 'react';
// FIX: Added 'Plus' to the imports
import { X, Search, Plus } from 'lucide-react';

// A mock list of common skills for auto-suggestion. 
const COMMON_SKILLS = [
  "React.js", "Node.js", "Python", "Java", "SQL", "JavaScript", 
  "TypeScript", "HTML", "CSS", "AWS", "Docker", "Kubernetes",
  "Communication", "Teamwork", "Project Management", "Agile",
  "C++", "C#", "Go", "Rust", "Flutter", "React Native",
  "Figma", "Adobe XD", "UI/UX Design", "Machine Learning",
  "Data Analysis", "Excel", "Power BI", "Tableau", "Sales",
  "Marketing", "SEO", "Content Writing", "Public Speaking"
];

interface SkillSelectorProps {
  initialSkills: string[];
  onChange: (skills: string[]) => void;
}

export default function SkillSelector({ initialSkills, onChange }: SkillSelectorProps) {
  const [skills, setSkills] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      const parsedSkills = Array.isArray(initialSkills) ? initialSkills : [];
      setSkills(parsedSkills);
      setInitialized(true);
    }
  }, [initialSkills, initialized]);

  // Filter suggestions based on input
  useEffect(() => {
    if (input.trim().length > 0) {
      const filtered = COMMON_SKILLS.filter(
        s => s.toLowerCase().includes(input.toLowerCase()) && !skills.includes(s)
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [input, skills]);

  const addSkill = (skill: string) => {
    if (skill && !skills.includes(skill)) {
      const newSkills = [...skills, skill];
      setSkills(newSkills);
      onChange(newSkills);
      setInput('');
      setSuggestions([]);
      inputRef.current?.focus();
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const newSkills = skills.filter(s => s !== skillToRemove);
    setSkills(newSkills);
    onChange(newSkills);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (input.trim()) {
        addSkill(input.trim());
      }
    } else if (e.key === 'Backspace' && input === '' && skills.length > 0) {
      e.preventDefault();
      const newSkills = skills.slice(0, -1);
      setSkills(newSkills);
      onChange(newSkills);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-2">
        <h3 className="text-lg font-bold text-white">Key Skills</h3>
        <p className="text-xs text-gray-400">
          Recruiters look for specific skills. Add them here to appear in searches.
        </p>
      </div>

      <div 
        className={`
          flex flex-wrap gap-2 p-3 rounded-xl border transition-all cursor-text
          ${isFocused 
            ? 'bg-black/40 border-electric ring-1 ring-electric/50 shadow-[0_0_15px_rgba(79,14,237,0.15)]' 
            : 'bg-black/30 border-white/10 hover:border-white/20'
          }
        `}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Render Chips */}
        {skills.map((skill) => (
          <span 
            key={skill} 
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-white text-black animate-in fade-in zoom-in duration-200"
          >
            {skill}
            <button 
              onClick={(e) => { e.stopPropagation(); removeSkill(skill); }}
              className="p-0.5 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
            >
              <X size={14} />
            </button>
          </span>
        ))}

        {/* Input Field */}
        <div className="relative flex-1 min-w-[120px]">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={skills.length === 0 ? "Type a skill (e.g. Java, Sales)..." : ""}
            className="w-full bg-transparent text-white placeholder:text-gray-600 outline-none h-8"
          />
          
          {/* Suggestions Dropdown */}
          {isFocused && suggestions.length > 0 && (
            <div className="absolute top-full left-0 mt-2 w-full min-w-[200px] bg-charcoal border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden">
              <div className="max-h-48 overflow-y-auto custom-scrollbar">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addSkill(suggestion);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Search size={12} className="text-gray-500" />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Popular Suggestions (Quick Add) */}
      <div className="mt-4">
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Suggested for you</p>
        <div className="flex flex-wrap gap-2">
          {['Communication', 'Leadership', 'Problem Solving'].filter(s => !skills.includes(s)).map(s => (
             <button 
               key={s} 
               onClick={() => addSkill(s)}
               className="text-xs border border-white/10 px-3 py-1 rounded-full text-gray-400 hover:text-white hover:border-electric transition flex items-center gap-1"
             >
               <Plus size={12} /> {s}
             </button>
          ))}
        </div>
      </div>
    </div>
  );
}
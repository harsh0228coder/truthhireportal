'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation'; 
import JobCard from '@/components/JobCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchJobs } from '@/lib/api';
import { Job } from '@/types';
import { 
  MapPin, Search, X, ChevronDown, Filter, 
  Clock, Briefcase, DollarSign, Layers, Globe, SlidersHorizontal, LayoutGrid, Check, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

// --- 1. SMART CATEGORIZATION LOGIC ---
const getDepartment = (title: string): string => {
  if (!title) return 'Other';

  const t = title.toLowerCase().replace(/[\(\)\/\-\.,&|]/g, ' ');

  if (
    t.includes('hr ') || t.includes('human res') || t.includes('recruit') || 
    t.includes('talent') || t.includes('people') || t.includes('admin') ||
    t.includes('operations')
  ) return 'HR & Admin';

  if (
    t.includes('sales') || t.includes('business dev') || t.includes('bde') || 
    t.includes('sdr') || t.includes('account exec') || t.includes('account man') || 
    t.includes('client growth') || t.includes('revenue')
  ) return 'Sales';

  if (
    t.includes('design') || t.includes('ui') || t.includes('ux') || 
    t.includes('creative') || t.includes('art ') || t.includes('graphic') ||
    t.includes('visual')
  ) return 'Design';

  if (
    t.includes('engineer') || t.includes('developer') || t.includes('dev') || 
    t.includes('stack') || t.includes('data') || t.includes('qa ') || 
    t.includes('tech') || t.includes('software') || t.includes('web') ||
    t.includes('android') || t.includes('ios') || t.includes('cloud')
  ) return 'Engineering';

  if (
    t.includes('product') || t.includes('manager') || t.includes('owner') ||
    t.includes('scrum')
  ) return 'Product';

  if (
    t.includes('market') || t.includes('social') || t.includes('seo') || 
    t.includes('content') || t.includes('brand') || t.includes('media')
  ) return 'Marketing';

  if (
    t.includes('finance') || t.includes('accountant') || t.includes('audit') || 
    t.includes('tax') || t.includes('ca ')
  ) return 'Finance';

  if (
    t.includes('support') || t.includes('customer') || t.includes('client') ||
    t.includes('help')
  ) return 'Support';

  return 'Other';
};

function JobsPageContent() {
  const searchParams = useSearchParams(); 
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState<number[]>([]);
  
  // --- SEARCH & FILTERS STATES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState(''); 
  const [sortBy, setSortBy] = useState('relevant');
  
  // --- SUGGESTION STATES ---
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedExpLevels, setSelectedExpLevels] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]); 
  
  const [datePosted, setDatePosted] = useState('all'); 
  const [minSalary, setMinSalary] = useState(0);

  // UI States
  const [activeModal, setActiveModal] = useState<'none' | 'location' | 'department'>('none'); 
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState(''); 
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  
  const locationRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 9;

  const jobTypeOptions = ["Internship", "Remote", "Hybrid", "Work From Office"];
  const experienceOptions = ["Fresher", "Mid-Senior Level", "Director", "Executive"];

  // --- INITIALIZE FILTERS FROM URL ---
  useEffect(() => {
    const qParam = searchParams.get('q');
    if (qParam) setSearchQuery(qParam);

    const deptParam = searchParams.get('department');
    if (deptParam) setSelectedDepartments([deptParam]);

    const typeParam = searchParams.get('type');
    if (typeParam) setSelectedJobTypes([typeParam]);
  }, [searchParams]);

  // --- CLICK OUTSIDE HANDLER ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) setIsLocationDropdownOpen(false);
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) setIsSortOpen(false);
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) setShowSuggestions(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- FETCH JOBS & SAVED STATUS ---
  useEffect(() => {
    const loadData = async () => {
        try {
            // 1. Fetch All Jobs
            const jobsData = await fetchJobs();
            setJobs(jobsData);
            setFilteredJobs(jobsData);
            setLoading(false);

            // 2. Fetch Saved Jobs (If User Logged In)
            const token = localStorage.getItem('token');
            if (token) {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/saved-ids`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const ids = await res.json();
                    // Ensure IDs are numbers to match comparison later
                    setSavedJobs(ids.map((id: any) => Number(id)));
                }
            }
        } catch (error) {
            console.error("Error loading data:", error);
            setLoading(false);
        }
    };
    loadData();
  }, []);

  // --- DERIVED DATA ---
  const locationCounts = jobs.reduce((acc, job) => {
    const loc = job.location || "Unknown";
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedLocations = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]).map(([city]) => city);

  const departmentCounts = jobs.reduce((acc, job) => {
    const dept = getDepartment(job.title || "");
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedDepartments = Object.entries(departmentCounts).sort((a, b) => b[1] - a[1]).map(([d]) => d);

  const getModalData = () => {
      const source = activeModal === 'location' ? sortedLocations : sortedDepartments;
      return source.filter(item => item.toLowerCase().includes(modalSearch.toLowerCase()));
  };

  // --- SEARCH & SUGGESTION LOGIC ---
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);

      if (value.length > 1) {
          const uniqueSuggestions = new Set<string>();
          const lowerValue = value.toLowerCase();

          jobs.forEach(job => {
              if (job.title?.toLowerCase().includes(lowerValue)) uniqueSuggestions.add(job.title);
              if (job.company_name?.toLowerCase().includes(lowerValue)) uniqueSuggestions.add(job.company_name);
          });

          setSuggestions(Array.from(uniqueSuggestions).slice(0, 6)); 
          setShowSuggestions(true);
      } else {
          setShowSuggestions(false);
      }
  };

  const handleSuggestionClick = (suggestion: string) => {
      setSearchQuery(suggestion);
      setShowSuggestions(false);
  };

  // --- FILTERING LOGIC ---
  useEffect(() => {
    let result = [...jobs];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(job => job.title?.toLowerCase().includes(q) || job.company_name?.toLowerCase().includes(q));
    }

    if (locationFilter.trim()) {
      result = result.filter(job => job.location?.toLowerCase().includes(locationFilter.toLowerCase()));
    }

    if (selectedLocations.length > 0) {
        result = result.filter(job => selectedLocations.includes(job.location));
    }

    if (selectedDepartments.length > 0) {
        result = result.filter(job => {
            const jobDept = getDepartment(job.title || "");
            return selectedDepartments.includes(jobDept);
        });
    }

    if (selectedJobTypes.length > 0) {
      result = result.filter(job => {
        if (!job.employment_type) return false;
        const type = job.employment_type.toLowerCase();
        return selectedJobTypes.some(t => type.includes(t.toLowerCase()));
      });
    }

    if (selectedExpLevels.length > 0) {
        result = result.filter(job => {
             if (!job.experience_level) return false;
             const jobLevel = job.experience_level.toLowerCase().replace(/[^a-z]/g, '');
             return selectedExpLevels.some(filterLevel => {
                 const normalizedFilter = filterLevel.toLowerCase().replace(/[^a-z]/g, '');
                 return jobLevel.includes(normalizedFilter) || normalizedFilter.includes(jobLevel);
             });
        });
    }

    if (datePosted !== 'all') {
        const now = new Date();
        result = result.filter(job => {
            if (!job.created_at) return false;
            const jobDate = new Date(job.created_at);
            const diffHours = (now.getTime() - jobDate.getTime()) / (1000 * 60 * 60);
            if (datePosted === '24h') return diffHours <= 24;
            if (datePosted === '7d') return diffHours <= 24 * 7;
            if (datePosted === '30d') return diffHours <= 24 * 30;
            return true;
        });
    }

    if (minSalary > 0) {
        result = result.filter(job => (job.salary_max || 0) >= minSalary * 100000);
    }

    if (sortBy === 'recent') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFilteredJobs(result);
    if(!loading && searchQuery === '') setCurrentPage(1);
  }, [searchQuery, locationFilter, selectedLocations, selectedDepartments, selectedJobTypes, selectedExpLevels, datePosted, minSalary, sortBy, jobs, loading]);

  const toggleSelection = (list: string[], setList: Function, value: string) => {
    setList(list.includes(value) ? list.filter(t => t !== value) : [...list, value]);
  };

  // --- SAVE JOB HANDLER (FIXED) ---
  const handleSaveJob = async (jobIdInput: number | string) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        router.push('/login'); 
        return;
    }

    // Ensure we are working with a Number for the state array
    const jobId = Number(jobIdInput); 
    const isCurrentlySaved = savedJobs.includes(jobId);
    
    // 1. Optimistic Update (Instant UI feedback)
    setSavedJobs(prev => isCurrentlySaved ? prev.filter(id => id !== jobId) : [...prev, jobId]);

    try {
        // 2. Call API
        const endpoint = isCurrentlySaved ? 'unsave' : 'save';
        const method = isCurrentlySaved ? 'DELETE' : 'POST';
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${jobId}/${endpoint}`, {
            method: method,
            headers: { 
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error("Failed to save/unsave");
        }
        
        toast.success(isCurrentlySaved ? "Job removed from saved" : "Job saved successfully");

    } catch (error) {
        console.error(error);
        // Revert UI if API fails
        setSavedJobs(prev => isCurrentlySaved ? [...prev, jobId] : prev.filter(id => id !== jobId));
        toast.error("Failed to update saved jobs");
    }
  };

  const clearAllFilters = () => {
      setSearchQuery('');
      setLocationFilter('');
      setSelectedJobTypes([]);
      setSelectedExpLevels([]);
      setSelectedLocations([]);
      setSelectedDepartments([]);
      setDatePosted('all');
      setMinSalary(0);
  };

  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <LoadingSpinner />;

  const FilterContent = () => (
    <div className="space-y-8">
        {/* Date Posted */}
        <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><Clock size={12} /> Date Posted</h4>
            <div className="space-y-2">
            {[ { label: 'Any time', value: 'all' }, { label: 'Past 24 hours', value: '24h' }, { label: 'Past week', value: '7d' }, { label: 'Past month', value: '30d' } ]
            .map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${datePosted === opt.value ? 'border-electric' : 'border-white/20 group-hover:border-white/40'}`}>
                        {datePosted === opt.value && <div className="w-2 h-2 bg-electric rounded-full" />}
                    </div>
                    <input type="radio" name="datePosted" className="hidden" checked={datePosted === opt.value} onChange={() => setDatePosted(opt.value)} />
                    <span className={`text-sm ${datePosted === opt.value ? 'text-white font-medium' : 'text-gray-400 group-hover:text-gray-300'}`}>{opt.label}</span>
                </label>
            ))}
            </div>
        </div>
        <div className="h-px bg-white/5 w-full"></div>
        {/* Salary */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><DollarSign size={12} /> Min Salary (LPA)</h4>
            <span className="text-xs text-electric font-bold">{minSalary > 0 ? `₹${minSalary}L+` : 'Any'}</span>
            </div>
            <input type="range" min="0" max="50" step="1" value={minSalary} onChange={(e) => setMinSalary(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-electric hover:accent-blue-400 focus:outline-none" />
            <div className="flex justify-between text-[10px] text-gray-500"><span>0L</span><span>50L+</span></div>
        </div>
        <div className="h-px bg-white/5 w-full"></div>
        {/* DEPARTMENT FILTER */}
        <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><LayoutGrid size={12} /> Department</h4>
            <div className="space-y-2">
            {sortedDepartments.slice(0, 5).map((dept) => (
                <label key={dept} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedDepartments.includes(dept) ? 'bg-electric border-electric' : 'bg-[#1a1a1a] border-white/20 group-hover:border-white/40'}`}>
                    {selectedDepartments.includes(dept) && <Check size={10} className="text-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={selectedDepartments.includes(dept)} onChange={() => toggleSelection(selectedDepartments, setSelectedDepartments, dept)} />
                <span className={`text-sm ${selectedDepartments.includes(dept) ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>
                    {dept} <span className="text-xs text-gray-600">({departmentCounts[dept]})</span>
                </span>
                </label>
            ))}
            {sortedDepartments.length > 5 && (
                <button onClick={() => { setActiveModal('department'); setModalSearch(''); }} className="text-xs font-bold text-electric hover:underline mt-2 block">+ View All Departments</button>
            )}
            </div>
        </div>
        <div className="h-px bg-white/5 w-full"></div>
        {/* Location */}
        <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><Globe size={12} /> Location</h4>
            <div className="space-y-2">
            {sortedLocations.slice(0, 5).map((loc) => (
                <label key={loc} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedLocations.includes(loc) ? 'bg-electric border-electric' : 'bg-[#1a1a1a] border-white/20 group-hover:border-white/40'}`}>
                    {selectedLocations.includes(loc) && <Check size={10} className="text-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={selectedLocations.includes(loc)} onChange={() => toggleSelection(selectedLocations, setSelectedLocations, loc)} />
                <span className={`text-sm ${selectedLocations.includes(loc) ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>
                    {loc} <span className="text-xs text-gray-600">({locationCounts[loc]})</span>
                </span>
                </label>
            ))}
            {sortedLocations.length > 5 && (
                <button onClick={() => { setActiveModal('location'); setModalSearch(''); }} className="text-xs font-bold text-electric hover:underline mt-2 block">+ View All Locations</button>
            )}
            </div>
        </div>
        <div className="h-px bg-white/5 w-full"></div>
        {/* Job Type */}
        <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><Briefcase size={12} /> Work Mode</h4>
            <div className="space-y-2">
            {jobTypeOptions.map((type) => (
                <label key={type} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedJobTypes.includes(type) ? 'bg-electric border-electric' : 'bg-[#1a1a1a] border-white/20 group-hover:border-white/40'}`}>
                    {selectedJobTypes.includes(type) && <Check size={10} className="text-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={selectedJobTypes.includes(type)} onChange={() => toggleSelection(selectedJobTypes, setSelectedJobTypes, type)} />
                <span className={`text-sm ${selectedJobTypes.includes(type) ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>{type}</span>
                </label>
            ))}
            </div>
        </div>
        <div className="h-px bg-white/5 w-full"></div>
        {/* Experience */}
        <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><Layers size={12} /> Experience</h4>
            <div className="space-y-2">
            {experienceOptions.map((level) => (
                <label key={level} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedExpLevels.includes(level) ? 'bg-electric border-electric' : 'bg-[#1a1a1a] border-white/20 group-hover:border-white/40'}`}>
                    {selectedExpLevels.includes(level) && <Check size={10} className="text-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={selectedExpLevels.includes(level)} onChange={() => toggleSelection(selectedExpLevels, setSelectedExpLevels, level)} />
                <span className={`text-sm ${selectedExpLevels.includes(level) ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>{level}</span>
                </label>
            ))}
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 selection:bg-electric/30">
      
      {/* HEADER */}
      <div className="relative pt-20 pb-12 overflow-visible border-b border-white/5 z-40">
        <div className="absolute inset-0 overflow-hidden -z-10">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-electric/10 rounded-full blur-[120px] pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-4 md:mb-6">
            Find your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-blue-400">next chapter</span>
          </h1>
          
          {/* SEARCH BAR */}
          <div className="bg-[#111]/80 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl shadow-black/50 flex flex-col md:flex-row items-stretch gap-3 md:gap-10 max-w-4xl mx-auto relative z-50">
            {/* 🟢 MODIFIED SEARCH INPUT CONTAINER */}
            <div className="flex-1 w-full flex items-center bg-transparent px-4 h-12 md:h-14 group border-b border-white/10 md:border-b-0 relative" ref={searchContainerRef}>
              <Search className="h-5 w-5 text-gray-500 group-focus-within:text-electric transition-colors mb-4 mt-3" />
              <input 
                type="text" 
                placeholder="Job title, company, or keywords..." 
                value={searchQuery} 
                onChange={handleSearchChange} 
                className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-white placeholder-gray-500 ml-3 mb-4 mt-3 h-full text-base" 
              />
              {searchQuery && <button onClick={() => { setSearchQuery(''); setShowSuggestions(false); }}><X className="h-4 w-4 text-gray-500 hover:text-white" /></button>}

              {/* 🟢 AUTO-SUGGESTION DROPDOWN */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-4 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[70] animate-in fade-in zoom-in-95 duration-100">
                    <div className="py-2">
                        <div className="px-4 py-2 text-[10px] uppercase font-bold text-gray-500 tracking-wider">Suggestions</div>
                        {suggestions.map((suggestion, index) => (
                            <button 
                                key={index} 
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-electric flex items-center gap-3 transition-colors group"
                            >
                                <Search size={14} className="text-gray-600 group-hover:text-electric" />
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
              )}
            </div>
            
            <div className="hidden md:block w-px h-8 bg-white/10 self-center"></div>
            
            <div className="flex-1 w-full relative h-12 md:h-14 group" ref={locationRef}>
              <button onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)} className="w-full h-full flex items-center bg-transparent px-4 focus:outline-none">
                <MapPin className={`h-5 w-5 mr-3 transition-colors ${isLocationDropdownOpen ? 'text-electric' : 'text-gray-500 group-hover:text-gray-300'}`} />
                <span className={`text-base truncate ${locationFilter ? 'text-white' : 'text-gray-500'}`}>{locationFilter || "Any Location"}</span>
                <ChevronDown className={`h-4 w-4 text-gray-500 absolute right-4 transition-transform duration-200 ${isLocationDropdownOpen ? 'rotate-180 text-electric' : ''}`} />
              </button>
              {isLocationDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-150">
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    <button onClick={() => { setLocationFilter(''); setIsLocationDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-400 hover:bg-white/5 hover:text-white border-b border-white/5 flex items-center justify-between">
                      Any Location {locationFilter === '' && <Check size={14} className="text-electric"/>}
                    </button>
                    {sortedLocations.map((loc) => (
                      <button key={loc} onClick={() => { setLocationFilter(loc); setIsLocationDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center justify-between">
                        {loc} {locationFilter === loc && <Check size={14} className="text-electric"/>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button className="inline-flex h-12 px-8 mt-1 bg-white text-black hover:bg-gray-200 rounded-lg font-semibold text-base items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-blue-500/30 hover:scale-105">Search</button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* SIDEBAR FILTERS */}
          <aside className="lg:w-72 flex-shrink-0 hidden lg:block">
            <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-2xl h-fit">
              <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#161616]">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Filter className="h-4 w-4 text-electric" /> All Filters
                </h3>
                <button onClick={clearAllFilters} className="text-[11px] font-bold text-gray-500 hover:text-white uppercase tracking-wider transition-colors">
                  Reset
                </button>
              </div>
              <div className="p-5">
                <FilterContent />
              </div>
            </div>
          </aside>

          {/* RESULTS FEED */}
          <main className="flex-1 relative z-0">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 relative z-30">
              <h2 className="text-xl font-bold text-white">
                {filteredJobs.length} <span className="text-gray-500 font-normal text-base">Jobs found</span>
              </h2>
              
              <div className="flex items-center gap-3">
                <button onClick={() => setIsMobileFilterOpen(true)} className="lg:hidden flex items-center gap-2 bg-[#111] border border-white/10 text-sm text-white px-4 py-2 rounded-xl hover:bg-white/5 transition-colors">
                    <SlidersHorizontal size={14} /> Filters
                </button>

                <div className="relative group z-30" ref={sortRef}>
                  <button onClick={() => setIsSortOpen(!isSortOpen)} className="flex items-center gap-2 bg-[#111] border border-white/10 text-sm text-white pl-4 pr-3 py-2 rounded-xl hover:border-white/30 transition-colors focus:outline-none">
                    {sortBy === 'relevant' ? 'Relevant' : 'Most Recent'}
                    <ChevronDown size={14} className={`text-gray-500 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isSortOpen && (
                    <div className="absolute right-0 top-full mt-2 w-40 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 z-50">
                        <button onClick={() => { setSortBy('relevant'); setIsSortOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center justify-between">
                            Relevant {sortBy === 'relevant' && <Check size={14} className="text-electric"/>}
                        </button>
                        <button onClick={() => { setSortBy('recent'); setIsSortOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center justify-between">
                            Most Recent {sortBy === 'recent' && <Check size={14} className="text-electric"/>}
                        </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* JOB GRID */}
            {filteredJobs.length > 0 ? (
              <div className="space-y-4 relative z-0">
                {currentJobs.map((job) => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onSave={handleSaveJob} 
                    isSaved={savedJobs.includes(Number(job.id))} // STRICT TYPE CHECK FIX
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-[#111]/50 rounded-2xl border border-white/5 border-dashed">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6"><Search className="h-8 w-8 text-gray-600" /></div>
                <h3 className="text-xl font-bold text-white">No jobs found</h3>
                <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto mb-8">We couldn't find any jobs matching your filters. Try widening your search or clearing filters.</p>
                <button onClick={clearAllFilters} className="text-electric font-bold hover:text-white transition-colors flex items-center gap-2 mx-auto"><X className="w-4 h-4" /> Clear all filters</button>
              </div>
            )}

            {/* Pagination */}
            {!loading && filteredJobs.length > jobsPerPage && (
              <div className="mt-12 flex justify-center items-center gap-2">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors">Previous</button>
                <div className="flex gap-1 bg-[#111] p-1 rounded-lg border border-white/10 hidden sm:flex">
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return <button key={page} onClick={() => handlePageChange(page)} className={`w-9 h-9 rounded-md text-sm font-bold transition-all ${currentPage === page ? 'bg-electric text-white shadow-lg shadow-blue-900/50' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>{page}</button>;
                    } else if (page === currentPage - 2 || page === currentPage + 2) { return <span key={page} className="w-9 h-9 flex items-center justify-center text-gray-600">.</span>; }
                    return null;
                  })}
                </div>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors">Next</button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* GENERIC MODAL */}
      {activeModal !== 'none' && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-[#111] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#161616]">
                    <h3 className="text-lg font-bold text-white">
                        Select {activeModal === 'location' ? 'Location' : 'Department'}
                    </h3>
                    <button onClick={() => setActiveModal('none')} className="text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
                </div>
                <div className="p-4 border-b border-white/5">
                    <div className="flex items-center bg-[#0a0a0a] border border-white/10 rounded-lg px-4 h-12 focus-within:border-electric transition-colors">
                        <Search className="h-5 w-5 text-gray-500" />
                        <input type="text" placeholder={`Search ${activeModal}...`} value={modalSearch} onChange={(e) => setModalSearch(e.target.value)} className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-white ml-3 text-sm" />
                    </div>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {getModalData().length > 0 ? (
                            getModalData().map((item) => (
                                <label key={item} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-white/5 transition-colors">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0 
                                        ${(activeModal === 'location' ? selectedLocations.includes(item) : selectedDepartments.includes(item)) ? 'bg-electric border-electric' : 'bg-[#1a1a1a] border-white/20 group-hover:border-white/40'}`}>
                                        {(activeModal === 'location' ? selectedLocations.includes(item) : selectedDepartments.includes(item)) && <Check size={12} className="text-white" />}
                                    </div>
                                    <input type="checkbox" className="hidden" 
                                        checked={activeModal === 'location' ? selectedLocations.includes(item) : selectedDepartments.includes(item)} 
                                        onChange={() => activeModal === 'location' ? toggleSelection(selectedLocations, setSelectedLocations, item) : toggleSelection(selectedDepartments, setSelectedDepartments, item)} 
                                    />
                                    <span className={`text-sm ${(activeModal === 'location' ? selectedLocations.includes(item) : selectedDepartments.includes(item)) ? 'text-white font-medium' : 'text-gray-400 group-hover:text-gray-300'}`}>
                                        {item} <span className="text-xs text-gray-600">({(activeModal === 'location' ? locationCounts : departmentCounts)[item]})</span>
                                    </span>
                                </label>
                            ))
                        ) : <div className="col-span-3 text-center py-10 text-gray-500 text-sm">No results match &quot;{modalSearch}&quot;</div>}
                    </div>
                </div>
                <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-[#161616]">
                    <button onClick={() => setActiveModal('none')} className="px-5 py-2.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-sm font-bold transition-colors">Cancel</button>
                    <button onClick={() => setActiveModal('none')} className="px-6 py-2.5 rounded-lg bg-electric hover:bg-blue-600 text-white text-sm font-bold transition-colors shadow-lg shadow-blue-900/20">Apply</button>
                </div>
            </div>
        </div>
      )}

      {/* MOBILE FILTER DRAWER */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fadeIn" onClick={() => setIsMobileFilterOpen(false)}></div>
            <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-[#111] border-l border-white/10 shadow-2xl flex flex-col animate-slideInRight">
                <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#161616]">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <Filter className="h-4 w-4 text-electric" /> Filters
                    </h3>
                    <button onClick={() => setIsMobileFilterOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    <FilterContent />
                </div>
                <div className="p-5 border-t border-white/10 bg-[#161616] flex gap-3">
                    <button onClick={clearAllFilters} className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-bold hover:text-white">Reset</button>
                    <button onClick={() => setIsMobileFilterOpen(false)} className="flex-1 py-3 rounded-xl bg-electric text-white font-bold hover:bg-blue-600 shadow-lg shadow-blue-900/20">Apply</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

// Suspense wrapper for production build safety
export default function JobsPage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
    }>
        <JobsPageContent />
    </Suspense>
  );
}
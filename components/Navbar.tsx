'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import { 
  Shield, Menu, X, User, LogOut, LayoutDashboard, 
  Sparkles, Search, ChevronDown, TrendingUp
} from 'lucide-react';

// --- ⚡ 50+ MOCK POPULAR SEARCHES (INSTANT) ---
const POPULAR_SEARCHES = [
  // Roles
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "DevOps Engineer", "Data Scientist", "Product Manager", "UI/UX Designer",
  "QA Engineer", "Business Analyst", "Project Manager", "Mobile Developer",
  "Android Developer", "iOS Developer", "Cloud Architect", "Cybersecurity Analyst",
  "Network Engineer", "Systems Administrator", "Database Administrator",
  "Machine Learning Engineer", "AI Researcher", "Game Developer", "Blockchain Developer",
  "Embedded Systems Engineer", "Site Reliability Engineer", "Technical Writer",
  "Sales Engineer", "Marketing Manager", "Content Writer", "Graphic Designer",
  "HR Manager", "Recruiter", "Accountant", "Financial Analyst",
  
  // Technologies & Skills
  "React", "Node.js", "Python", "Java", "C++", "Go", "Rust", "AWS", "Docker", 
  "Kubernetes", "TypeScript", "Next.js", "Django", "Spring Boot", "SQL",
  
  // Types & Locations
  "Remote", "Hybrid", "On-site", "Internship", "Contract", "Freelance", 
  "Startup", "MNC", "Bangalore", "Mumbai", "Pune", "Hyderabad", "Delhi", "Chennai"
];

// --- SEARCH BAR COMPONENT ---
function SearchBar({ mobile = false, onSearch }: { mobile?: boolean, onSearch?: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Note: We REMOVED the useEffect that syncs 'query' with 'searchParams'
  // This ensures the search bar stays empty after navigation.

  // Handle Outside Click to Close Suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- INSTANT FILTERING LOGIC ---
  useEffect(() => {
    if (query.trim().length > 0) {
      const lowerQuery = query.toLowerCase();
      
      // Filter list based on input (Limit to 6 results for speed/UI)
      const filtered = POPULAR_SEARCHES.filter(item => 
        item.toLowerCase().includes(lowerQuery)
      ).slice(0, 6);
      
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const handleSubmit = (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    
    const targetQuery = typeof e === 'string' ? e : query;
    
    if (targetQuery.trim()) {
      // 1. Navigate to jobs page
      router.push(`/jobs?q=${encodeURIComponent(targetQuery)}`);
      
      // 2. Clear the search bar and close suggestions
      setQuery(''); 
      setShowSuggestions(false);
      
      if (onSearch) onSearch();
    } else {
        router.push('/jobs'); 
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${mobile ? 'mb-6' : 'max-w-sm'}`}>
      <form onSubmit={handleSubmit} className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input 
            type="text"
            placeholder="Search jobs, skills, companies..."
            className="w-full bg-[#111] border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim().length > 0 && setShowSuggestions(true)}
            autoComplete="off"
        />
      </form>

      {/* SUGGESTIONS DROPDOWN */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-white/5">
            <div className="py-1">
                {suggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            // Don't setQuery here, passing directly to handleSubmit handles the clear logic better
                            handleSubmit(suggestion);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors group"
                    >
                        <TrendingUp size={14} className="text-gray-600 group-hover:text-blue-400 transition-colors" />
                        <span dangerouslySetInnerHTML={{
                            __html: suggestion.replace(new RegExp(`(${query})`, 'gi'), '<span class="text-white font-bold">$1</span>')
                        }} />
                    </button>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}

// --- MAIN NAVBAR COMPONENT ---
export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  
  // --- STATE ---
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'student' | 'recruiter' | null>(null);
  const [userName, setUserName] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  // --- EFFECTS ---

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileOpen]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const name = localStorage.getItem('user_name');
    const role = localStorage.getItem('user_role') as 'student' | 'recruiter' || 'student'; 

    if (token) {
        setIsLoggedIn(true);
        setUserName(name || 'User');
        setUserRole(role);
    } else {
        setIsLoggedIn(false);
        setUserRole(null);
    }
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsProfileOpen(false);
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) setIsToolsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- ACTIONS ---
  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUserRole(null);
    setIsProfileOpen(false);
    setIsMobileOpen(false);
    router.push('/login');
  };

  // --- RENDER ---
  if (pathname?.includes('/recruiter/dashboard') || pathname?.startsWith('/secure-portal-0228')) return null;

  return (
    <nav 
      className={`fixed top-0 w-full z-[100] transition-all duration-300 border-b h-20 ${
        isScrolled || isMobileOpen
          ? 'bg-[#09090b] border-white/10 shadow-lg' 
          : 'bg-transparent border-transparent'
      }`}
    >
      <div className="w-full h-full px-6 lg:px-10 flex items-center justify-between gap-4">
        
        {/* 1. LOGO */}
        <Link href="/" onClick={() => setIsMobileOpen(false)} className="flex items-center gap-2 group shrink-0 z-[102]">
          <div className="bg-blue-600/10 p-2 rounded-lg group-hover:bg-blue-600/20 transition-colors">
            <Shield className="w-6 h-6 text-blue-500" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            TruthHire<span className="text-blue-500">.</span>
          </span>
        </Link>

        {/* 2. CENTER: SEARCH & NAV (Desktop) */}
        <div className="hidden lg:flex items-center flex-1 justify-center max-w-4xl gap-8">
          
          {/* Desktop Search */}
          {userRole !== 'recruiter' && (
             <Suspense fallback={<div className="w-full max-w-sm h-10 bg-[#111] rounded-full" />}>
                <SearchBar />
             </Suspense>
          )}

          {/* Core Links */}
          <div className="flex items-center gap-6 text-sm font-medium text-gray-400">
            {userRole !== 'recruiter' && (
                <NavLink href="/jobs" active={pathname === '/jobs'}>Jobs</NavLink>
            )}
            
            {userRole !== 'recruiter' && (
                <div className="relative" ref={toolsRef}>
                <button 
                    onClick={() => setIsToolsOpen(!isToolsOpen)}
                    className={`flex items-center gap-1 hover:text-white transition-colors ${pathname?.includes('/tools') ? 'text-white' : ''}`}
                >
                    Tools <ChevronDown className={`w-3 h-3 transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isToolsOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1 animate-in fade-in zoom-in-95 duration-200">
                    <DropdownItem href="/tools/check-chances" icon={<Sparkles className="w-4 h-4 text-purple-400" />}>
                        Check My Chances
                        <span className="block text-[10px] text-gray-500 font-normal">AI Resume Gap Analysis</span>
                    </DropdownItem>
                    </div>
                )}
                </div>
            )}

            {isLoggedIn && userRole !== 'recruiter' && (
                <NavLink href="/career-guide" active={pathname === '/career-guide'}>Career Guide</NavLink>
            )}
            
            {userRole !== 'recruiter' && (
                <NavLink href="/about-us" active={pathname === '/about-us'}>About Us</NavLink>
            )}
          </div>
        </div>

        {/* 3. RIGHT SIDE: AUTH & ACTIONS */}
        <div className="hidden lg:flex items-center gap-4 shrink-0 text-sm font-normal">
          {!isLoggedIn ? (
            <>
              <NavLink href="/employers" active={pathname === '/employers'}>For Recruiters</NavLink>
              <div className="h-4 w-px bg-white/10"></div>
              <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-all">
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="bg-white text-black hover:bg-gray-200 px-6 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105 shadow-lg hover:shadow-blue-500/30 flex items-center gap-2"
              >
                Get Started
              </Link>
            </>
          ) : (
            <>
              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-white/10 bg-[#111] hover:bg-[#1a1a1a] transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                      <p className="text-white font-medium text-sm truncate">{userName}</p>
                      <p className="text-xs text-gray-500 capitalize">{userRole}</p>
                    </div>
                    
                    {userRole === 'recruiter' ? (
                        <DropdownItem href="/recruiter/dashboard" icon={<LayoutDashboard className="w-4 h-4" />}>Dashboard</DropdownItem>
                    ) : (
                        <>
                            <DropdownItem href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />}>Dashboard</DropdownItem>
                            <DropdownItem href="/profile" icon={<User className="w-4 h-4" />}>My Profile</DropdownItem>
                        </>
                    )}
                    
                    <div className="h-px bg-white/5 my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 4. MOBILE HAMBURGER (Animated) */}
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="lg:hidden text-gray-300 hover:text-white p-2 relative z-[102]"
        >
          <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
            <span className={`block w-6 h-0.5 bg-current transition-all duration-300 ${isMobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-6 h-0.5 bg-current transition-all duration-300 ${isMobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-6 h-0.5 bg-current transition-all duration-300 ${isMobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
      </div>

      {/* 5. MOBILE MENU OVERLAY */}
      <div 
        className={`lg:hidden fixed inset-0 top-0 z-[100] transition-transform duration-300 ease-in-out ${
            isMobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="absolute inset-0 bg-[#09090b]"></div>
        <div className="h-20 w-full relative z-10"></div>

        <div className="relative z-10 h-[calc(100dvh-80px)] overflow-y-auto px-6 pb-10">
            
            {/* Mobile Search */}
            {userRole !== 'recruiter' && (
                <div className="pt-4">
                    <Suspense fallback={<div className="h-10 w-full bg-[#111] rounded-lg" />}>
                        <SearchBar mobile onSearch={() => setIsMobileOpen(false)} />
                    </Suspense>
                </div>
            )}

            <div className="space-y-1">
                {userRole !== 'recruiter' && (
                    <>
                        <MobileLink href="/jobs" onClick={() => setIsMobileOpen(false)}>Jobs</MobileLink>
                        
                        {isLoggedIn && (
                            <MobileLink href="/career-guide" onClick={() => setIsMobileOpen(false)}>Career Guide</MobileLink>
                        )}

                        <MobileLink href="/about-us" onClick={() => setIsMobileOpen(false)}>About Us</MobileLink>
                        
                        <div className="pt-4 pb-2">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest px-4 mb-2">Tools</p>
                            <MobileLink href="/tools/check-chances" onClick={() => setIsMobileOpen(false)} icon={<Sparkles className="w-4 h-4 text-electric"/>}>
                                Check My Chances
                            </MobileLink>
                        </div>
                    </>
                )}
            </div>

            <div className="border-t border-white/10 mt-6 pt-6">
                {!isLoggedIn ? (
                    <div className="flex flex-col gap-3">
                        <Link href="/login" onClick={() => setIsMobileOpen(false)} className="w-full py-3 text-center rounded-lg border border-white/10 text-white font-medium">Sign In</Link>
                        <Link href="/signup" onClick={() => setIsMobileOpen(false)} className="w-full py-3 text-center rounded-lg bg-white text-black font-bold shadow-lg">Get Started</Link>
                        <Link href="/employers" onClick={() => setIsMobileOpen(false)} className="w-full py-3 text-center text-sm text-gray-500">For Employers</Link>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <MobileLink href={userRole === 'recruiter' ? "/recruiter/dashboard" : "/dashboard"} onClick={() => setIsMobileOpen(false)} icon={<LayoutDashboard className="w-4 h-4"/>}>Dashboard</MobileLink>
                        {userRole !== 'recruiter' && (
                            <MobileLink href="/profile" onClick={() => setIsMobileOpen(false)} icon={<User className="w-4 h-4"/>}>My Profile</MobileLink>
                        )}
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 bg-red-500/5 rounded-lg font-medium mt-2">
                            <LogOut className="w-5 h-5" /> Sign Out
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </nav>
  );
}

// --- SUB-COMPONENTS ---

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className={`transition-colors hover:text-white ${active ? 'text-white font-semibold' : 'text-gray-400'}`}
    >
      {children}
    </Link>
  );
}

function DropdownItem({ href, icon, children }: { href: string; icon: any; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors group">
      <div className="text-gray-500 group-hover:text-white transition-colors">{icon}</div>
      <div>{children}</div>
    </Link>
  );
}

function MobileLink({ href, onClick, icon, children }: any) {
    return (
        <Link 
            href={href} 
            onClick={onClick} 
            className="flex items-center gap-3 w-full px-4 py-3 text-lg font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
        >
            {icon && icon}
            {children}
        </Link>
    )
}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
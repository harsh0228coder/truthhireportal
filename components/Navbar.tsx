'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { 
  User, LogOut, LayoutDashboard, 
  Sparkles, ChevronDown, Pencil 
} from 'lucide-react';
import Logo from '@/components/Logo';
import { setAuthToken } from '@/lib/api'; 

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

  // --- ACTIONS: SECURE LOGOUT ---
  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include", 
      });
    } catch (error) {
      console.error("Logout request failed", error);
    } finally {
      setAuthToken(null);
      localStorage.clear();
      setIsLoggedIn(false);
      setUserRole(null);
      setIsProfileOpen(false);
      setIsMobileOpen(false);
      
      window.dispatchEvent(new Event("auth-change"));
      router.push('/login');
    }
  };

  // --- RENDER ---
  if (pathname?.includes('/recruiter/dashboard') || pathname?.startsWith('/secure-portal-0228')) return null;

  return (
    <>
      {/* 🟢 HIDDEN SVG LIQUID GLASS FILTER */}
      <svg className="hidden absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="truthhire-liquid-glass" x="-20%" y="-20%" width="160%" height="140%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.015 0.015" numOctaves="3" seed="5" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" result="displacement" />
            <feGaussianBlur in="displacement" stdDeviation="8" result="blur" />
            <feBlend mode="normal" in="SourceGraphic" in2="blur" result="blend" />
          </filter>
        </defs>
      </svg>

      {/* 🟢 FLOATING, ROUNDED NAVBAR (Updated Theme Colors) */}
      <nav 
        className={`fixed z-[100] transition-all duration-500 ease-out flex items-center justify-between px-5 lg:px-8 h-16 left-1/2 -translate-x-1/2
          ${isScrolled 
            ? 'top-4 w-[calc(100%-2rem)] max-w-6xl rounded-full bg-[#131316]/70 border border-blue-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.5)] shadow-[inset_0_1px_1px_rgba(59,130,246,0.15)]' 
            : 'top-4 md:top-6 w-[calc(100%-2rem)] max-w-7xl rounded-full bg-[#09090b]/50 border border-blue-500/10'
          }
        `}
        style={{
          backdropFilter: 'url(#truthhire-liquid-glass) blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* 1. LOGO */}
        <Link href="/" onClick={() => setIsMobileOpen(false)} className="flex items-center shrink-0 transition-transform duration-300 hover:scale-105 mt-2" aria-label="TruthHire home">
          <div className="block lg:hidden flex items-center">
            <Logo variant="stacked" size={28} href={null} priority={true} />
          </div>
          <div className="hidden lg:block flex items-center">
            <Logo variant="stacked" size={36} href={null} priority={true} />
          </div>
        </Link>

        {/* 2. CENTER: NAV LINKS (Desktop) */}
        <div className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-8 text-[16px] font-medium text-gray-400">
            {userRole !== 'recruiter' && (
                <NavLink href="/jobs" active={pathname === '/jobs'}>Jobs</NavLink>
            )}
            
            {userRole !== 'recruiter' && (
                <div className="relative" ref={toolsRef}>
                <button 
                    onClick={() => setIsToolsOpen(!isToolsOpen)}
                    className={`flex items-center gap-1.5 hover:text-white transition-colors ${pathname?.includes('/tools') ? 'text-white' : ''}`}
                >
                    Tools <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isToolsOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-56 bg-[#131316]/95 backdrop-blur-xl border border-blue-500/20 rounded-2xl shadow-2xl overflow-hidden p-1.5 animate-in fade-in zoom-in-95 duration-200">
                      <DropdownItem href="/tools/check-chances" onClick={() => setIsToolsOpen(false)} icon={<Sparkles className="w-4 h-4 text-purple-400" />}>
                          Check My Chances
                          <span className="block text-[11px] text-gray-500 font-normal mt-0.5">AI Resume Gap Analysis</span>
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
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          {!isLoggedIn ? (
            <>
              <Link href="/employers" className="text-[16px] font-medium text-gray-400 hover:text-white transition-colors">
                For Employers
              </Link>
              <div className="h-4 w-px bg-white/10 mx-1"></div>
              <Link href="/login" className="text-[15px] font-medium text-gray-300 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="bg-white text-black hover:bg-gray-200 px-5 py-2 rounded-full text-[15px] font-bold transition-all hover:scale-105 shadow-lg shadow-white/10"
              >
                Get Started
              </Link>
            </>
          ) : (
            <>
              {/* Profile Dropdown (Redesigned matching Glassdoor layout) */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white/10 bg-[#1a1a1a]/50 hover:bg-[#27272a]/50 hover:border-white/20 transition-all shadow-sm"
                >
                  <User className="w-5 h-5 text-gray-300" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-4 w-[340px] bg-[#131316]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    
                    {/* Header Profile Section */}
                    <div className="p-5 flex gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 shrink-0 rounded-full border border-white/10 bg-[#1a1a1a] flex items-center justify-center text-white text-lg font-medium">
                        {userName ? userName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <Link href="/profile" onClick={() => setIsProfileOpen(false)} className="text-white font-bold text-[15px] uppercase tracking-wide underline underline-offset-4 decoration-white/30 hover:decoration-white transition-colors leading-tight line-clamp-2">
                            {userName || "USER NAME"}
                          </Link>
                          <Link href="/profile/edit" onClick={() => setIsProfileOpen(false)} className="text-gray-400 hover:text-white shrink-0 mt-0.5">
                            <Pencil className="w-4 h-4" />
                          </Link>
                        </div>
                        
                        <p className="text-[13px] text-blue-400 mt-2 truncate hover:underline cursor-pointer">
                          {userRole === 'recruiter' ? 'Recruiter at Tech Inc.' : 'Software Developer'}
                        </p>
                        <p className="text-[12px] text-gray-400 mt-0.5 underline decoration-gray-500/50 hover:decoration-gray-400 cursor-pointer w-max">
                          Pune
                        </p>
                        
                        <Link href="/profile/edit" onClick={() => setIsProfileOpen(false)} className="mt-2.5 inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 cursor-pointer hover:bg-blue-500/20 transition-colors">
                          Review
                        </Link>
                      </div>
                    </div>

                    <div className="h-px bg-white/10 w-full"></div>

                    {/* Menu Items structured like reference */}
                    <div className="flex flex-col py-2">
                      
                      <DropdownMenuLink href="/profile/edit" text="CV and experience" tag="Review" onClick={() => setIsProfileOpen(false)} />
                      <DropdownMenuLink href={userRole === 'recruiter' ? "/recruiter/dashboard" : "/dashboard"} text="Job activity" onClick={() => setIsProfileOpen(false)} />
                      
                      
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-between px-5 py-2.5 text-[14px] text-gray-300 hover:bg-white/5 hover:text-white transition-colors group"
                      >
                        <span>Sign out</span>
                        <LogOut className="w-[18px] h-[18px] text-gray-500 group-hover:text-white transition-colors" />
                      </button>

                    </div>
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
          <div className="w-5 h-5 flex flex-col justify-center gap-[5px]">
            <span className={`block w-5 h-[2px] bg-current rounded-full transition-all duration-300 ${isMobileOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
            <span className={`block w-5 h-[2px] bg-current rounded-full transition-all duration-300 ${isMobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-[2px] bg-current rounded-full transition-all duration-300 ${isMobileOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
          </div>
        </button>
      </nav>

      {/* 🟢 REDESIGNED MOBILE MENU OVERLAY (Updated Theme Colors) */}
      <div 
        className={`lg:hidden fixed inset-0 z-[90] transition-all duration-500 ease-in-out ${
            isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Dark blurred background drop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)}></div>
        
        {/* Sleek Slide-Down Glass Panel */}
        <div className={`absolute top-2 inset-x-2 bg-[#131316]/90 backdrop-blur-3xl border border-blue-500/20 rounded-[2rem] p-5 pt-24 pb-8 transition-transform duration-500 ease-[0.32,0.72,0,1] shadow-2xl ${
            isMobileOpen ? 'translate-y-0' : '-translate-y-[120%]'
        }`}>
            <div className="space-y-2">
                {userRole !== 'recruiter' && (
                    <>
                        <MobileLink href="/jobs" onClick={() => setIsMobileOpen(false)}>Jobs</MobileLink>
                        
                        {isLoggedIn && (
                            <MobileLink href="/career-guide" onClick={() => setIsMobileOpen(false)}>Career Guide</MobileLink>
                        )}

                        <MobileLink href="/about-us" onClick={() => setIsMobileOpen(false)}>About Us</MobileLink>
                        
                        <div className="pt-4 pb-2">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-2">Tools</p>
                            <MobileLink href="/tools/check-chances" onClick={() => setIsMobileOpen(false)} icon={<Sparkles className="w-4 h-4 text-purple-400"/>}>
                                Check My Chances
                            </MobileLink>
                        </div>
                    </>
                )}
            </div>

            <div className="border-t border-white/10 mt-6 pt-6">
                {!isLoggedIn ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-3">
                            <Link href="/login" onClick={() => setIsMobileOpen(false)} className="flex-1 py-3.5 text-center rounded-2xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors text-sm">Sign In</Link>
                            <Link href="/signup" onClick={() => setIsMobileOpen(false)} className="flex-1 py-3.5 text-center rounded-2xl bg-white text-black font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all text-sm">Get Started</Link>
                        </div>
                        <Link href="/employers" onClick={() => setIsMobileOpen(false)} className="w-full text-center text-[13px] text-gray-500 hover:text-white transition-colors">For Employers</Link>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <MobileLink href={userRole === 'recruiter' ? "/recruiter/dashboard" : "/dashboard"} onClick={() => setIsMobileOpen(false)} icon={<LayoutDashboard className="w-4 h-4"/>}>Dashboard</MobileLink>
                        {userRole !== 'recruiter' && (
                            <MobileLink href="/profile" onClick={() => setIsMobileOpen(false)} icon={<User className="w-4 h-4"/>}>My Profile</MobileLink>
                        )}
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-4 text-red-400 bg-red-500/5 border border-red-500/10 rounded-2xl font-medium mt-4 transition-colors">
                            <LogOut className="w-5 h-5" /> Sign Out
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </>
  );
}

// --- SUB-COMPONENTS ---

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className={`transition-colors hover:text-white ${active ? 'text-white font-semibold drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'text-gray-400'}`}
    >
      {children}
    </Link>
  );
}

// Retained for Tools Dropdown
function DropdownItem({ href, icon, children, onClick }: { href: string; icon: any; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-3 px-3 py-2.5 text-[13px] text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors group">
      <div className="text-gray-500 group-hover:text-white transition-colors">{icon}</div>
      <div>{children}</div>
    </Link>
  );
}

// Component for the layout of the Profile Dropdown
function DropdownMenuLink({ href, text, tag, onClick }: { href: string; text: string; tag?: string; onClick?: () => void }) {
    return (
      <Link href={href} onClick={onClick} className="flex items-center gap-3 px-5 py-2.5 text-[14px] text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
        <span>{text}</span>
        {tag && (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {tag}
          </span>
        )}
      </Link>
    );
}

// 🟢 REDESIGNED MOBILE LINK CARDS
function MobileLink({ href, onClick, icon, children }: any) {
    return (
        <Link 
            href={href} 
            onClick={onClick} 
            className="flex items-center gap-3.5 w-full px-5 py-4 text-[15px] font-semibold text-gray-300 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 rounded-2xl transition-all active:scale-[0.98]"
        >
            {icon && <span className="text-gray-400">{icon}</span>}
            {children}
        </Link>
    )
}
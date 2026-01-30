'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Shield, Mail, Phone, MapPin, Linkedin, Twitter, 
  Instagram, Facebook, Youtube, ArrowRight, Loader2, Check 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Footer() {
  const pathname = usePathname();
  
  // --- STATE FOR NEWSLETTER ---
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  // --- HIDE FOOTER ON DASHBOARD/ADMIN PAGES ---
  if (
      pathname?.includes('/recruiter/dashboard') || 
      pathname === '/recruiter/signup' ||
      pathname?.startsWith('/admin')
  ) {
    return null;
  }

  // --- NEWSLETTER LOGIC ---
  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) {
      toast.error("Please enter a valid email");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/waitlist/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email, 
          category: "Newsletter" // Matches your backend WaitlistRequest
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSubscribed(true);
        toast.success(data.message || "Subscribed successfully!");
        setEmail('');
      } else {
        toast.error(data.detail || "Subscription failed");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-[#050505] border-t border-white/10 text-gray-400 font-sans relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-blue-600/50 to-transparent opacity-50" />

      {/* 1. MAIN LINKS SECTION */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Brand Column (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-blue-600/10 p-2 rounded-lg group-hover:bg-blue-600/20 transition-colors">
                <Shield className="text-blue-500 w-6 h-6" />
              </div>
              <span className="text-xl md:text-2xl font-bold text-white tracking-tight">
                TruthHire<span className="text-blue-500">.</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm">
              India's first AI-powered job verification platform. We eliminate ghost jobs and connect verified talent with real opportunities using advanced <span className="text-white font-medium">Resume Gap Analysis.</span>
            </p>
            <div className="flex gap-3">
              {[Linkedin, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links Grouping (8 Cols total for remaining) */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
            {/* Column 2: Candidates */}
            <div className="space-y-6">
              <h4 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                STUDENTS
              </h4>
              <ul className="space-y-4 text-sm">
                <li><FooterLink href="/jobs">Browse Jobs</FooterLink></li>
                <li><FooterLink href="/tools/check-chances">AI Match Check</FooterLink></li>
                <li><FooterLink href="/profile">My Profile</FooterLink></li>
                <li><FooterLink href="/career-guide">Career Guide</FooterLink></li>
              </ul>
            </div>

            {/* Column 3: Employers */}
            <div className="space-y-6">
              <h4 className="text-white font-bold text-sm uppercase tracking-widest">Employers</h4>
              <ul className="space-y-4 text-sm">
                <li><FooterLink href="/recruiter/register">Post a Job</FooterLink></li>
                <li><FooterLink href="/recruiter/dashboard">Recruiter Portal</FooterLink></li>
                <li><FooterLink href="/about-us">Hiring Solutions</FooterLink></li>
                <li><FooterLink href="/employers">Success Stories</FooterLink></li>
              </ul>
            </div>

            {/* Column 4: Contact/Company */}
            <div className="col-span-2 md:col-span-1 space-y-6 mt-4 md:mt-0">
              <h4 className="text-white font-bold text-sm uppercase tracking-widest">Connect</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin className="text-blue-500 shrink-0" size={16} />
                  <span className="text-xs leading-tight">Tech Park, Hinjewadi Phase 1, Pune, MH 411057</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="text-blue-500 shrink-0" size={16} />
                  <a href="mailto:hrtruthhire@gmail.com" className="hover:text-white transition-colors">support@truthhire.in</a>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="text-blue-500 shrink-0" size={16} />
                  <a href="tel:+918999521153" className="hover:text-white transition-colors">+91 89995 21153</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BOTTOM NEWSLETTER BAR (FUNCTIONAL NOW) */}
      <div className="bg-[#0A0A0A] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="text-white font-bold">Never miss a verified opportunity</h3>
            <p className="text-xs text-gray-500">Join 5,000+ candidates receiving weekly AI career insights.</p>
          </div>
          
          <div className="flex w-full md:w-auto gap-2">
            {!subscribed ? (
              <>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com" 
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none flex-1 md:w-64 transition-all placeholder:text-gray-600" 
                />
                <button 
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="bg-white text-black hover:bg-gray-200 px-6 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 whitespace-nowrap active:scale-95 disabled:opacity-70 disabled:scale-100"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <>Join <ArrowRight size={16} /></>}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-6 py-2.5 rounded-xl border border-green-500/20 w-full md:w-auto justify-center">
                <Check size={16} />
                <span className="text-sm font-medium">You're on the list!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. LEGAL & TRADEMARK */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-5 text-[12px] font-medium uppercase tracking-widest text-gray-600">
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            <a href="#" className="hover:text-white transition-colors text-red-500/80">Report Fraud</a>
          </div>
          
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} TRUTHHIRE INC.</span>
            <span className="h-3 w-px bg-white/10 hidden md:block" />
            <span className="flex items-center gap-1.5">
              MADE WITH <span className="text-red-500 animate-pulse text-sm">❤</span> IN INDIA
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Helper component
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className="text-gray-400 hover:text-white transition-all hover:translate-x-1 inline-block duration-200"
    >
      {children}
    </Link>
  );
}
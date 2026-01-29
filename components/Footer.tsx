'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Shield, Mail, Phone, MapPin, Linkedin, Twitter, 
  Instagram, Facebook, Youtube, ArrowRight, Sparkles 
} from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  // --- HIDE FOOTER ON DASHBOARD/ADMIN PAGES (Consistency with Navbar) ---
  if (
      pathname?.includes('/recruiter/dashboard') || 
      pathname === '/recruiter/signup' ||
      pathname?.startsWith('/admin')
  ) {
    return null;
  }

  return (
    <footer className="bg-[#050505] border-t border-white/10 text-gray-400 font-sans relative overflow-hidden">
      {/* Subtle Background Glow to match Navbar/Dashboard aesthetic */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-electric/50 to-transparent opacity-50" />

      {/* 1. MAIN LINKS SECTION */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Brand Column (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-electric/10 p-2 rounded-lg group-hover:bg-electric/20 transition-colors">
                <Shield className="text-electric w-6 h-6" />
              </div>
              <span className="text-xl md:text-2xl font-bold text-white tracking-tight">
                TruthHire<span className="text-electric">.</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm">
              India's first AI-powered job verification platform. We eliminate ghost jobs and connect verified talent with real opportunities using advanced <span className="text-white font-medium">Resume Gap Analysis.</span>
            </p>
            <div className="flex gap-3">
              {[Linkedin, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-electric hover:text-white hover:border-electric transition-all duration-300">
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
                  <MapPin className="text-electric shrink-0" size={16} />
                  <span className="text-xs leading-tight">Tech Park, Hinjewadi Phase 1, Pune, MH 411057</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="text-electric shrink-0" size={16} />
                  <a href="mailto:support@truthhire.in" className="hover:text-white transition-colors">support@truthhire.in</a>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="text-electric shrink-0" size={16} />
                  <a href="tel:+919876543210" className="hover:text-white transition-colors">+91 98765 43210</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BOTTOM NEWSLETTER BAR (Restyled to match UI) */}
      <div className="bg-[#0A0A0A] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="text-white font-bold">Never miss a verified opportunity</h3>
            <p className="text-xs text-gray-500">Join 5,000+ candidates receiving weekly AI career insights.</p>
          </div>
          <div className="flex w-full md:w-auto gap-2">
            <input 
              type="email" 
              placeholder="name@email.com" 
              className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-electric outline-none flex-1 md:w-64 transition-all" 
            />
            <button className="bg-white text-black hover:bg-gray-200 px-6 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 whitespace-nowrap active:scale-95">
              Join <ArrowRight size={16} />
            </button>
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

// Helper component for Footer links to maintain consistency
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
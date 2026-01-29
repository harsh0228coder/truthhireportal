'use client';

import { usePathname } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // --- CONFIGURATION ---
  // These are the ONLY pages where we hide the Navbar and Footer
  const isAuthOrAdmin = 
    pathname?.startsWith('/admin') || 
    pathname === '/login' || 
    pathname === '/signup' || 
    pathname === '/onboarding' ||
    pathname === '/recruiter/register' ||
    pathname === '/recruiter/login' ||
    pathname === '/recruiter/dashboard' ||
    pathname === '/recruiter/post-job' ||
    pathname?.startsWith('/sign-in') ||
    pathname?.startsWith('/sign-up');

  return (
    <>
      {/* 1. Show Navbar on all pages except Auth/Admin */}
      {!isAuthOrAdmin && <Navbar />}

      {/* 2. Main Content Area - Add pt-20 only when navbar is visible */}
      <div className={!isAuthOrAdmin ? 'pt-20' : ''}>
        {children}
      </div>

      {/* 3. Show Footer on all pages except Auth/Admin */}
      {!isAuthOrAdmin && <Footer />}
    </>
  );
}
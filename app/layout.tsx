import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout"; 
import { GoogleOAuthProvider } from '@react-oauth/google';

// Font Configuration
const suisse = localFont({
  src: './fonts/SuisseIntl-Regular.woff2', 
  variable: '--font-suisse', 
  display: 'swap',
});

// 🟢 UPDATED METADATA (No Images)
export const metadata: Metadata = {
  metadataBase: new URL('https://truthhire.in'),
  title: {
    template: "%s | TruthHire - Verified Jobs", 
    default: "TruthHire - Verified Jobs & AI Resume Scorer",
  },
  description: "India's first verified job portal. Stop applying to ghost jobs. Check your resume match score instantly with TruthHire AI and get hired faster.",
  keywords: [
    "TruthHire", 
    "Job Portal India", 
    "Verified Jobs", 
    "AI Resume Checker", 
    "No Ghost Jobs", 
    "Hiring 2025", 
    "Resume Score", 
    "Tech Jobs Pune"
  ],
  authors: [{ name: "TruthHire Team" }],
  creator: "TruthHire",
  publisher: "TruthHire",
  
  // 1. Google Search Console Verification (PASTE YOUR CODE HERE)
  verification: {
    google: "PASTE_YOUR_GOOGLE_VERIFICATION_CODE_HERE",
  },

  // 2. Robots (Tell Google to index this page)
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // 3. OpenGraph (Text Only)
  openGraph: {
    title: "TruthHire - Stop Applying to Ghost Jobs",
    description: "Find 100% verified jobs and check your resume match score instantly.",
    url: 'https://truthhire.in',
    siteName: 'TruthHire',
    locale: 'en_US',
    type: 'website',
  },

  // 4. Twitter Card (Text Only)
  twitter: {
    card: 'summary', // Changed to 'summary' since there is no large image
    title: 'TruthHire - Verified Jobs Only',
    description: 'The AI-powered job portal that eliminates ghost jobs.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head><meta name="google-site-verification" content="NaVcQ_QtSTzQEq5WAOyz0kPgZBR7G19lSHLt_gkFyeU"/></head>
      <body className={`${suisse.variable} font-sans bg-[#050505] text-white antialiased`}>
        <GoogleOAuthProvider clientId="156178217038-72bv7qfb4o2an9b0o8qdsbq5uekecnu9.apps.googleusercontent.com">
          
          {/* ClientLayout handles Navbar/Footer logic */}
          <ClientLayout>
            {children}
          </ClientLayout>

        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
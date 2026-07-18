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

// 🟢 UPDATED METADATA — with brand icons & social preview image
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

  // 🟢 FAVICON + APP ICONS
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/brand/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/brand/favicon-16.png", type: "image/png", sizes: "16x16" },
      { url: "/brand/truthhire-icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/brand/truthhire-icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/brand/apple-touch-icon.png", sizes: "180x180" },
    ],
    shortcut: "/favicon.ico",
  },
  
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

  // 3. OpenGraph (with logo card)
  openGraph: {
    title: "TruthHire - Stop Applying to Ghost Jobs",
    description: "Find 100% verified jobs and check your resume match score instantly.",
    url: 'https://truthhire.in',
    siteName: 'TruthHire',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/brand/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TruthHire — AI Powered Job Platform',
      },
    ],
  },

  // 4. Twitter Card (large image)
  twitter: {
    card: 'summary_large_image',
    title: 'TruthHire - Verified Jobs Only',
    description: 'The AI-powered job portal that eliminates ghost jobs.',
    images: ['/brand/og-image.png'],
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
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

// 🟢 UPDATED METADATA WITH TEMPLATE
export const metadata: Metadata = {
  title: {
    template: "%s - TruthHire", // %s is automatically replaced by child page titles
    default: "TruthHire - AI-Powered Job Verification Platform", // Default if a page has no title
  },
  description: "The AI-powered job portal that eliminates ghost jobs and verifies recruiters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
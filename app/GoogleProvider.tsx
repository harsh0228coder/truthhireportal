// app/GoogleProvider.tsx
"use client";

import { GoogleOAuthProvider } from '@react-oauth/google';

export default function GoogleProvider({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId="156178217038-72bv7qfb4o2an9b0o8qdsbq5uekecnu9.apps.googleusercontent.com">
      {children}
    </GoogleOAuthProvider>
  );
}
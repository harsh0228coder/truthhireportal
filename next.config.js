/** @type {import('next').NextConfig} */
const nextConfig = {
  // If you had other config options (like images), keep them here.
  // For example:
  // images: { domains: ['lh3.googleusercontent.com'] }, 

  async headers() {
    return [
      {
        // Apply these headers to ALL routes in your application
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups", // ✅ FIX: Allows Google Login popup to communicate back
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
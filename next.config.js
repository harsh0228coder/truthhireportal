/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore Type Errors (Grammar checks)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ignore Linting Errors (Style checks)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
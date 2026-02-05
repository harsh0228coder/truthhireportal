import { MetadataRoute } from 'next';

// This function generates the sitemap.xml automatically
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://truthhire.in'; // Your domain
  const apiUrl = 'https://truthhire-api.onrender.com'; // Your backend

  // 1. Define your Static Pages (The main pages of your site)
  const staticRoutes = [
    '',             // Homepage
    '/jobs',        // Job Listing Page
    '/about',       // About Us
    '/login',       // Student Login
    '/signup',      // Student Signup
    '/recruiters',  // Recruiter Landing Page
    '/recruiters/login',
    '/recruiters/register',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8, // Homepage is priority 1
  }));

  // 2. Fetch Dynamic Job Pages (So Google finds every single job)
  let jobRoutes: MetadataRoute.Sitemap = [];
  
  try {
    // Fetch top 1000 active jobs from your backend
    const response = await fetch(`${apiUrl}/jobs?limit=1000`);
    if (response.ok) {
      const jobs = await response.json();
      
      jobRoutes = jobs.map((job: any) => ({
        url: `${baseUrl}/jobs/${job.id}`,
        lastModified: new Date(job.created_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.6, // Individual jobs are slightly lower priority than main pages
      }));
    }
  } catch (error) {
    console.error("⚠️ Failed to fetch jobs for sitemap. Using static routes only.");
  }

  // 3. Combine and Return
  return [...staticRoutes, ...jobRoutes];
}
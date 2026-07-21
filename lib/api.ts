const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

/* ===========================
   🔐 SECURE AUTH INTERCEPTOR
=========================== */

let inMemoryToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Triggers all waiting API requests once the token is refreshed
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// Pauses API requests while a refresh is happening
const addRefreshSubscriber = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

// Memory Storage (More secure than localStorage against XSS)
export const setAuthToken = (token: string | null) => {
  inMemoryToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("token", token); // Fallback for hard-refreshes
    } else {
      localStorage.removeItem("token");
    }
  }
};

export const getAuthToken = () => {
  if (inMemoryToken) return inMemoryToken;
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

/**
 * Smart Fetch Wrapper: Automatically appends Access Token and catches 401s 
 * to perform invisible Token Rotation via the HttpOnly cookie.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: "include", // 🟢 CRITICAL: Tells the browser to send the HttpOnly Cookie
  };

  let response = await fetch(url, fetchOptions);

  // 🟢 CATCH 401 UNAUTHORIZED (TOKEN EXPIRED)
  if (response.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        // Attempt to get a new 15-minute token using the 30-day HttpOnly cookie
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setAuthToken(data.access_token);
          onRefreshed(data.access_token);
        } else {
          // Cookie expired or session revoked by user/admin. Force logout.
          setAuthToken(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem("user_id");
            localStorage.removeItem("user_name");
            window.dispatchEvent(new Event("auth-change"));
            window.location.href = "/login";
          }
          throw new Error("Session expired. Please log in again.");
        }
      } catch (error) {
        isRefreshing = false;
        throw error;
      } finally {
        isRefreshing = false;
      }
    }

    // Pause the failed request and retry it once the new token arrives
    return new Promise<Response>((resolve, reject) => {
      addRefreshSubscriber((newToken) => {
        headers.set("Authorization", `Bearer ${newToken}`);
        fetch(url, { ...fetchOptions, headers }).then(resolve).catch(reject);
      });
    });
  }

  return response;
}

/* ===========================
   JOBS
=========================== */

export async function fetchJobs() {
  const response = await apiFetch(`/jobs`);
  if (!response.ok) throw new Error("Failed to fetch jobs");
  return response.json();
}

export async function analyzeGap(resumeText: string, jobDescription: string) {
  const response = await apiFetch(`/analyze-gap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resume_text: resumeText,
      job_description: jobDescription,
    }),
  });
  if (!response.ok) throw new Error("Failed to analyze");
  return response.json();
}

export async function parseResume(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiFetch(`/parse-resume`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error("Failed to parse resume");
  return response.json();
}

/* ===========================
     USER / PROFILE CRUD
=========================== */

export async function getUser(userId: string) {
  const res = await apiFetch(`/users/${userId}`);
  if (!res.ok) throw new Error("Failed to load user");
  return res.json();
}

export async function updateBasicInfo(userId: string, data: any) {
  return apiFetch(`/users/${userId}/basic-info`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateEducation(userId: string, data: any) {
  return apiFetch(`/users/${userId}/education`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateSocialLinks(userId: string, data: any) {
  return apiFetch(`/users/${userId}/social-links`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updatePreferences(userId: string, data: any) {
  return apiFetch(`/users/${userId}/preferences`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function uploadResume(userId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetch(`/users/${userId}/resume`, {
    method: "POST",
    body: formData,
  });
}

export async function updateFullProfile(userId: string, data: any) {
  return apiFetch(`/users/${userId}/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

/* ===========================
     PROJECT CRUD
=========================== */

export async function addProject(userId: string, data: any) {
  return apiFetch(`/users/${userId}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateProject(userId: string, projectId: number, data: any) {
  return apiFetch(`/users/${userId}/projects/${projectId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteProject(projectId: number) {
  return apiFetch(`/projects/${projectId}`, {
    method: "DELETE",
  });
}

/* ===========================
     ACHIEVEMENT CRUD
=========================== */

export async function addAchievement(userId: string, data: any) {
  return apiFetch(`/users/${userId}/achievements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateAchievement(
  userId: string,
  achievementId: number,
  data: any
) {
  return apiFetch(`/users/${userId}/achievements/${achievementId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteAchievement(achievementId: number) {
  return apiFetch(`/achievements/${achievementId}`, {
    method: "DELETE",
  });
}

/* ===========================
     CERTIFICATION CRUD
=========================== */

export async function addCertification(userId: string, data: any) {
  return apiFetch(`/users/${userId}/certifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateCertification(
  userId: string,
  certId: number,
  data: any
) {
  return apiFetch(`/users/${userId}/certifications/${certId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteCertification(certId: number) {
  return apiFetch(`/certifications/${certId}`, {
    method: "DELETE",
  });
}
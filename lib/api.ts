const API_URL = process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL}`;

/* ===========================
   JOBS (Already in your file)
=========================== */

export async function fetchJobs() {
  const response = await fetch(`${API_URL}/jobs`);
  if (!response.ok) throw new Error("Failed to fetch jobs");
  return response.json();
}

export async function analyzeGap(resumeText: string, jobDescription: string) {
  const response = await fetch(`${API_URL}/analyze-gap`, {
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
  const response = await fetch(`${API_URL}/parse-resume`, {
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
  const res = await fetch(`${API_URL}/users/${userId}`);
  if (!res.ok) throw new Error("Failed to load user");
  return res.json();
}

export async function updateBasicInfo(userId: string, data: any) {
  return fetch(`${API_URL}/users/${userId}/basic-info`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateEducation(userId: string, data: any) {
  return fetch(`${API_URL}/users/${userId}/education`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateSocialLinks(userId: string, data: any) {
  return fetch(`${API_URL}/users/${userId}/social-links`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updatePreferences(userId: string, data: any) {
  return fetch(`${API_URL}/users/${userId}/preferences`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function uploadResume(userId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return fetch(`${API_URL}/users/${userId}/resume`, {
    method: "POST",
    body: formData,
  });
}

export async function updateFullProfile(userId: string, data: any) {
  return fetch(`${API_URL}/users/${userId}/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

/* ===========================
     PROJECT CRUD
=========================== */

export async function addProject(userId: string, data: any) {
  return fetch(`${API_URL}/users/${userId}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateProject(userId: string, projectId: number, data: any) {
  return fetch(`${API_URL}/users/${userId}/projects/${projectId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteProject(projectId: number) {
  return fetch(`${API_URL}/projects/${projectId}`, {
    method: "DELETE",
  });
}

/* ===========================
     ACHIEVEMENT CRUD
=========================== */

export async function addAchievement(userId: string, data: any) {
  return fetch(`${API_URL}/users/${userId}/achievements`, {
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
  return fetch(`${API_URL}/users/${userId}/achievements/${achievementId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteAchievement(achievementId: number) {
  return fetch(`${API_URL}/achievements/${achievementId}`, {
    method: "DELETE",
  });
}

/* ===========================
     CERTIFICATION CRUD
=========================== */

export async function addCertification(userId: string, data: any) {
  return fetch(`${API_URL}/users/${userId}/certifications`, {
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
  return fetch(`${API_URL}/users/${userId}/certifications/${certId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteCertification(certId: number) {
  return fetch(`${API_URL}/certifications/${certId}`, {
    method: "DELETE",
  });
}

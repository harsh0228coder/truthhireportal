const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function checkBackendStatus(): Promise<{ isOnline: boolean; message: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${API_URL}/jobs`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return { isOnline: true, message: 'Backend is running' };
    } else {
      return { isOnline: false, message: `Backend returned error: ${response.status}` };
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { isOnline: false, message: 'Backend is not responding (timeout)' };
    } else if (error.message.includes('fetch')) {
      return { isOnline: false, message: 'Cannot connect to backend server' };
    } else {
      return { isOnline: false, message: `Backend error: ${error.message}` };
    }
  }
}

export async function getUserResume(userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/users/${userId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: 'User not found' };
      }
      return { success: false, error: `Server error: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getResumeText(userId: string): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/resume-text`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: 'Resume not found. Please upload your resume first.' };
      }
      return { success: false, error: `Server error: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, text: data.text };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
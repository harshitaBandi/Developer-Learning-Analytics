/**
 * API utility for making requests to the backend
 * Supports both Next.js API routes and FastAPI backend
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function apiFetch<T>(endpoint: string): Promise<T> {
  const url = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint;
  const res = await fetch(url);
  
  if (!res.ok) {
    throw new Error(`API request failed: ${res.statusText}`);
  }
  
  return res.json();
}


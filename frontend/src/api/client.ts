import type { UploadResponse, AIStoryReport, ChatMessage, ChatResponse } from '../types';

const getApiBase = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');

  // When running locally in browser, use relative paths to route through Vite proxy seamlessly
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return '';
    }
  }
  return 'https://datafect.onrender.com';
};

export const API_BASE = getApiBase();

/**
 * Resilient fetch wrapper with clear diagnostic error reporting.
 */
async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  try {
    return await fetch(url, {
      credentials: 'include',
      ...options,
    });
  } catch (err: any) {
    if (err.name === 'TypeError' || err.message?.toLowerCase().includes('fetch') || err.message?.toLowerCase().includes('network')) {
      throw new Error(
        `Unable to reach the analysis service. Please check your network connection and try again.`
      );
    }
    throw err;
  }
}

/**
 * Initializes or refreshes the zero-trust session handshake.
 * Automatically receives and stores the httpOnly JWT cookie.
 */
export async function initSession(): Promise<any> {
  try {
    const res = await apiFetch('/api/auth/session', {
      method: 'GET',
    });
    if (res.ok) return res.json();
  } catch (e) {
    console.warn('Zero-trust session handshake deferred:', e);
  }
  return null;
}

export async function checkHealth(): Promise<{ status: string; version: string; gemini_enabled: boolean }> {
  const res = await apiFetch('/api/health');
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.statusText}`);
  }
  return res.json();
}

export async function uploadFile(file: File, targetCol?: string): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const endpoint = targetCol
    ? `/api/upload?target_col=${encodeURIComponent(targetCol)}`
    : `/api/upload`;

  const res = await apiFetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = `Upload failed with status ${res.status}`;
    try {
      const parsed = JSON.parse(errorText);
      errorMessage = parsed.detail || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

export async function generateStory(summary: any): Promise<AIStoryReport> {
  const res = await apiFetch('/api/narrate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(summary),
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = `Narrative generation failed: ${res.statusText}`;
    try {
      const parsed = JSON.parse(errorText);
      errorMessage = parsed.detail || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

export async function chatWithData(
  history: ChatMessage[],
  message: string,
  analysisSummary: any,
  sessionId?: string | null
): Promise<ChatResponse> {
  const res = await apiFetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      history,
      message,
      analysis_summary: analysisSummary,
      session_id: sessionId || undefined,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = `Chat failed: ${res.statusText}`;
    try {
      const parsed = JSON.parse(errorText);
      errorMessage = parsed.detail || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

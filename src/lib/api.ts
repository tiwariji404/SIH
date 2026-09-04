const BASE_URL = 'http://localhost:8000';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('token');
    window.dispatchEvent(new CustomEvent('auth:expired'));
    throw new Error('UNAUTHORIZED');
  }
  if (res.status === 403) throw new Error('FORBIDDEN');
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const d = await res.json(); msg = d.detail || msg; } catch {}
    throw new Error(msg);
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

function formRequest<T>(path: string, body: URLSearchParams): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: body.toString() })
    .then(async res => {
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const d = await res.json(); msg = d.detail || msg; } catch {}
        throw new Error(msg);
      }
      return res.json();
    });
}

// ─── AUTH ───────────────────────────────────────────────────────────────
export const api = {
  auth: {
    login: (username: string, password: string) => {
      const body = new URLSearchParams({ username, password });
      return formRequest<{ access_token: string; token_type: string }>('/api/v1/auth/login', body);
    },
    me: () => request<any>('/api/v1/users/me'),
  },
  cameras: {
    list: () => request<any[]>('/api/v1/cameras'),
    get: (id: string) => request<any>(`/api/v1/cameras/${id}`),
    create: (data: any) => request<any>('/api/v1/cameras', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/api/v1/cameras/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/api/v1/cameras/${id}`, { method: 'DELETE' }),
  },
  zones: {
    list: () => request<any[]>('/api/v1/zones'),
    create: (data: any) => request<any>('/api/v1/zones', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/api/v1/zones/${id}`, { method: 'DELETE' }),
  },
  alerts: {
    list: () => request<any[]>('/api/v1/alerts/'),
    events: () => request<any[]>('/api/v1/alerts/events'),
    acknowledge: (id: string) => request<any>(`/api/v1/alerts/${id}/acknowledge`, { method: 'PUT' }),
    investigate: (id: string) => request<any>(`/api/v1/alerts/${id}/investigate`, { method: 'PUT' }),
    resolve: (id: string) => request<any>(`/api/v1/alerts/${id}/resolve`, { method: 'PUT' }),
  },
  analytics: {
    stats: () => request<any>('/api/v1/analytics/stats'),
    health: () => request<any>('/api/v1/analytics/health'),
    vehicles: () => request<any[]>('/api/v1/analytics/vehicles'),
    auditLogs: () => request<any[]>('/api/v1/analytics/audit-logs'),
    incidents: () => request<any[]>('/api/v1/analytics/incidents'),
    evidence: () => request<any[]>('/api/v1/analytics/evidence'),
    verifyEvidence: (id: string) => request<any>(`/api/v1/analytics/evidence/${id}/verify`),
    faces: () => request<any[]>('/api/v1/analytics/faces'),
    tracks: () => request<any[]>('/api/v1/analytics/tracks'),
    watchlist: () => request<any[]>('/api/v1/analytics/watchlist'),
    addWatchlist: (data: any) => request<any>('/api/v1/analytics/watchlist', { method: 'POST', body: JSON.stringify(data) }),
    uploadWatchlistPhoto: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const token = getToken();
        return fetch(`${BASE_URL}/api/v1/analytics/watchlist/upload`, {
            method: 'POST',
            body: formData,
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }).then(async res => {
            if (!res.ok) {
                let msg = `HTTP ${res.status}`;
                try { const d = await res.json(); msg = d.detail || msg; } catch {}
                throw new Error(msg);
            }
            return res.json();
        });
    },
    deleteWatchlist: (id: string) => request<any>(`/api/v1/analytics/watchlist/${id}`, { method: 'DELETE' }),
  },
  health: () => request<any>('/health'),
};

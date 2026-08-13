import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/api';

export type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  phoneVerified?: boolean;
  location?: string;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const { method, body, auth = true } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = await AsyncStorage.getItem('token');
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: method || (body ? 'POST' : 'GET'),
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && auth) {
      await AsyncStorage.multiRemove(['token', 'user']);
    }
    throw new ApiError(data.message || `Request failed (${res.status})`, res.status);
  }

  return data as T;
}

export const api = {
  auth: {
    login: (data: { email: string; password: string }) =>
      request<{ token: string; user: User }>('/auth/login', { body: data, auth: false }),
    register: (data: { name: string; email: string; password: string; role: string }) =>
      request<{ token: string; user: User }>('/auth/register', { body: data, auth: false }),
    me: () => request<{ user: User }>('/auth/me'),
  },

  dashboard: () =>
    request<{
      upcomingAppointment: any;
      activeQueue: any;
      queueStatus: any;
      unreadNotifications: any[];
      unreadCount: number;
      nearbyBusinesses: any[];
    }>('/customer/dashboard'),

  nearby: () =>
    request<{ businesses: any[] }>('/customer/explore'),

  business: (id: string) => request<{ business: any; liveQueue: any }>(`/customer/public/${id}`),

  appointments: {
    create: (data: { business: string; service: string; date: string; timeSlot: string }) =>
      request('/appointments', { body: data }),
    getAll: () => request<{ appointments: any[] }>('/appointments'),
  },

  queue: {
    my: () => request<{ queues: any[] }>('/queue/my'),
    status: (id: string) => request<{ queue: any; peopleAhead: number; currentToken: number | null }>(`/queue/${id}/status`),
    leave: (id: string) => request(`/queue/${id}/leave`, { method: 'PUT' }),
  },

  notifications: {
    getAll: () => request<{ notifications: any[]; unreadCount: number }>('/notifications'),
    markRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),
  },

  profile: {
    update: (data: { name?: string; phone?: string }) =>
      request<{ user: User }>('/customer/profile', { method: 'PUT', body: data }),
  },

  push: {
    register: (token: string, platform: 'expo' | 'web') =>
      request('/notifications/push-token', { body: { token, platform, deviceName: 'Mobile app' } }),
    unregister: (token: string) =>
      request('/notifications/push-token', { method: 'DELETE', body: { token } }),
  },
};

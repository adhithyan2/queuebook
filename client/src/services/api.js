import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  getMe: () => API.get('/auth/me'),
};

export const appointmentAPI = {
  create: (data) => API.post('/appointments', data),
  getAll: () => API.get('/appointments'),
  getById: (id) => API.get(`/appointments/${id}`),
  cancel: (id) => API.put(`/appointments/${id}/cancel`),
};

export const queueAPI = {
  join: (data) => API.post('/queue', data),
  getMyQueue: () => API.get('/queue/my'),
  getStatus: (id) => API.get(`/queue/${id}/status`),
  leave: (id) => API.put(`/queue/${id}/leave`),
};

export const customerAPI = {
  getDashboard: () => API.get('/customer/dashboard'),
  getNearby: (params) => API.get('/customer/nearby', { params }),
  getReviews: (businessId) => API.get(`/customer/reviews/${businessId}`),
  updateProfile: (data) => API.put('/customer/profile', data),
};

export const businessAPI = {
  getDashboard: () => API.get('/business/dashboard'),
  getProfile: () => API.get('/business/profile'),
  createOrUpdateProfile: (data) => API.put('/business/profile', data),
  getAnalytics: () => API.get('/business/analytics'),
  callNext: () => API.post('/business/queue/call-next'),
  skipCustomer: (id) => API.put(`/business/queue/${id}/skip`),
  completeAppointment: (id) => API.put(`/business/queue/${id}/complete`),
  addWalkIn: (data) => API.post('/business/queue/walkin', data),
};

export const notificationAPI = {
  getAll: () => API.get('/notifications'),
  markRead: (id) => API.put(`/notifications/${id}/read`),
  markAllRead: () => API.put('/notifications/read-all'),
};

export const adminAPI = {
  getUsers: () => API.get('/admin/users'),
  getBusinesses: () => API.get('/admin/businesses'),
  getReports: () => API.get('/admin/reports'),
};

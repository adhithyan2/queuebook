import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.PROD ? '/api' : 'http://localhost:5000/api',
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
  sendOtp: (phone) => API.post('/auth/send-otp', { phone }),
  verifyPhone: (otp) => API.post('/auth/verify-phone', { otp }),
};

export const appointmentAPI = {
  create: (data) => API.post('/appointments', data),
  getAll: () => API.get('/appointments'),
  getById: (id) => API.get(`/appointments/${id}`),
  cancel: (id) => API.put(`/appointments/${id}/cancel`),
  reschedule: (id, data) => API.put(`/appointments/${id}/reschedule`, data),
  checkIn: (id) => API.put(`/appointments/${id}/checkin`),
  getPayment: (id) => API.get(`/appointments/${id}/payment`),
  pay: (id, data) => API.post(`/appointments/${id}/payment`, data),
};

export const queueAPI = {
  join: (data) => API.post('/queue', data),
  getMyQueue: () => API.get('/queue/my'),
  getStatus: (id) => API.get(`/queue/${id}/status`),
  leave: (id) => API.put(`/queue/${id}/leave`),
  getScan: (id) => API.get(`/queue/${id}/scan`),
};

export const customerAPI = {
  getDashboard: () => API.get('/customer/dashboard'),
  getNearby: (params) => API.get('/customer/nearby', { params }),
  getExplore: (params) => API.get('/customer/explore', { params }),
  compareServices: (params) => API.get('/customer/compare', { params }),
  getReviews: (businessId) => API.get(`/customer/reviews/${businessId}`),
  getBusinessPublic: (businessId) => API.get(`/customer/public/${businessId}`),
  getCrowdAnalytics: (businessId) => API.get(`/customer/business/${businessId}/crowd-analytics`),
  getBestTimes: (businessId) => API.get(`/customer/business/${businessId}/best-times`),
  getExpectedQueue: (businessId, params) => API.get(`/customer/business/${businessId}/expected-queue`, { params }),
  getSlots: (params) => API.get('/customer/slots', { params }),
  verifyQueueToken: (queueId) => API.get(`/customer/verify/${queueId}`),
  updateProfile: (data) => API.put('/customer/profile', data),
};

export const businessAPI = {
  getDashboard: () => API.get('/business/dashboard'),
  getProfile: () => API.get('/business/profile'),
  createOrUpdateProfile: (data) => API.put('/business/profile', data),
  getAnalytics: () => API.get('/business/analytics'),
  getCrowdAnalytics: () => API.get('/business/analytics/crowd'),
  callNext: () => API.post('/business/queue/call-next'),
  skipCustomer: (id) => API.put(`/business/queue/${id}/skip`),
  completeAppointment: (id, data = {}) => API.put(`/business/queue/${id}/complete`, data),
  verifyAppointmentPayment: (appointmentId, data) => API.put(`/business/appointments/${appointmentId}/payment/verify`, data),
  checkInAppointment: (appointmentId) => API.put(`/business/appointments/${appointmentId}/checkin`),
  markNoShow: (appointmentId) => API.put(`/business/appointments/${appointmentId}/no-show`),
  addWalkIn: (data) => API.post('/business/queue/walkin', data),
  addService: (data) => API.post('/business/services', data),
  updateService: (id, data) => API.put(`/business/services/${id}`, data),
  deleteService: (id) => API.delete(`/business/services/${id}`),
  addStaff: (data) => API.post('/business/staff', data),
  updateStaff: (id, data) => API.put(`/business/staff/${id}`, data),
  deleteStaff: (id) => API.delete(`/business/staff/${id}`),
};

export const smartArrivalAPI = {
  getRecommendation: (params) => API.get('/smart-arrival/recommendation', { params }),
};

export const notificationAPI = {
  getAll: () => API.get('/notifications'),
  getMessageLogs: () => API.get('/notifications/logs'),
  markRead: (id) => API.put(`/notifications/${id}/read`),
  markAllRead: () => API.put('/notifications/read-all'),
};

export const adminAPI = {
  getUsers: () => API.get('/admin/users'),
  getBusinesses: () => API.get('/admin/businesses'),
  getReports: () => API.get('/admin/reports'),
  setApproval: (id, status) => API.put(`/admin/businesses/${id}/approval`, { status }),
};

export const uploadAPI = {
  uploadImage: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return API.post('/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  deleteImage: (url) => API.post('/uploads/delete', { url }),
};

// Resolve a possibly-relative upload URL (e.g. "/uploads/abc.jpg") against the API origin.
export const imageUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  const origin = String(API.defaults.baseURL || '').replace(/\/api$/, '');
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const COLORS = {
  primary: '#4F46E5',
  secondary: '#6366F1',
  accent: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
};

export const API_URL = import.meta.env.VITE_API_URL || '/api';

export const SERVICES = [
  { id: 'hospitals', name: 'Hospitals', icon: 'FaHospital', color: '#EF4444' },
  { id: 'clinics', name: 'Dental Clinics', icon: 'FaTooth', color: '#8B5CF6' },
  { id: 'salons', name: 'Salons', icon: 'FaCut', color: '#EC4899' },
  { id: 'restaurants', name: 'Restaurants', icon: 'FaUtensils', color: '#F59E0B' },
  { id: 'offices', name: 'Government Offices', icon: 'FaLandmark', color: '#10B981' },
  { id: 'laboratories', name: 'Laboratories', icon: 'FaFlask', color: '#3B82F6' },
];

export const QUEUE_STATUS = {
  WAITING: 'waiting',
  CALLED: 'called',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
  CANCELLED: 'cancelled',
};

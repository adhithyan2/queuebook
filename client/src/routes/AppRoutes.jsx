import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CustomerLayout from '../layouts/CustomerLayout';
import BusinessLayout from '../layouts/BusinessLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import AuthLayout from '../layouts/AuthLayout';
import LandingPage from '../pages/Landing/LandingPage';
import LoginPage from '../pages/Login/LoginPage';
import RegisterPage from '../pages/Register/RegisterPage';
import AdminPage from '../pages/Admin/AdminPage';
import NotFoundPage from '../pages/NotFound/NotFoundPage';
import CustomerDashboardPage from '../pages/Customer/DashboardPage';
import CustomerAppointmentsPage from '../pages/Customer/AppointmentsPage';
import CustomerQueuePage from '../pages/Customer/QueuePage';
import CustomerNearbyPage from '../pages/Customer/NearbyPage';
import CustomerBookPage from '../pages/Customer/BookPage';
import CustomerNotificationsPage from '../pages/Customer/NotificationsPage';
import CustomerProfilePage from '../pages/Customer/ProfilePage';
import BusinessDashboardPage from '../pages/Business/DashboardPage';
import BusinessQueuePage from '../pages/Business/QueuePage';
import BusinessAnalyticsPage from '../pages/Business/AnalyticsPage';
import BusinessReviewsPage from '../pages/Business/ReviewsPage';
import BusinessProfilePage from '../pages/Business/ProfilePage';

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  const effectiveRole = user.role === 'user' ? 'customer' : user.role;
  if (roles && !roles.includes(effectiveRole)) {
    const redirectPath = effectiveRole === 'business' ? '/business/dashboard' : '/customer/dashboard';
    return <Navigate to={redirectPath} />;
  }
  return children;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <LandingPage />;
  const role = user.role === 'user' ? 'customer' : user.role;
  if (role === 'business') return <Navigate to="/business/dashboard" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/customer/dashboard" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Customer Routes */}
      <Route element={<ProtectedRoute roles={['customer']}><CustomerLayout /></ProtectedRoute>}>
        <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
        <Route path="/customer/appointments" element={<CustomerAppointmentsPage />} />
        <Route path="/customer/queue" element={<CustomerQueuePage />} />
        <Route path="/customer/nearby" element={<CustomerNearbyPage />} />
        <Route path="/customer/book/:businessId" element={<CustomerBookPage />} />
        <Route path="/customer/notifications" element={<CustomerNotificationsPage />} />
        <Route path="/customer/profile" element={<CustomerProfilePage />} />
      </Route>

      {/* Business Routes */}
      <Route element={<ProtectedRoute roles={['business']}><BusinessLayout /></ProtectedRoute>}>
        <Route path="/business/dashboard" element={<BusinessDashboardPage />} />
        <Route path="/business/queue" element={<BusinessQueuePage />} />
        <Route path="/business/analytics" element={<BusinessAnalyticsPage />} />
        <Route path="/business/reviews" element={<BusinessReviewsPage />} />
        <Route path="/business/profile" element={<BusinessProfilePage />} />
      </Route>

      {/* Admin Route */}
      <Route element={<ProtectedRoute roles={['admin']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

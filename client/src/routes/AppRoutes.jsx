import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CustomerLayout = lazy(() => import('../layouts/CustomerLayout'));
const BusinessLayout = lazy(() => import('../layouts/BusinessLayout'));
const DashboardLayout = lazy(() => import('../layouts/DashboardLayout'));
const AuthLayout = lazy(() => import('../layouts/AuthLayout'));
const LandingPage = lazy(() => import('../pages/Landing/LandingPage'));
const LoginPage = lazy(() => import('../pages/Login/LoginPage'));
const RegisterPage = lazy(() => import('../pages/Register/RegisterPage'));
const AdminPage = lazy(() => import('../pages/Admin/AdminPage'));
const NotFoundPage = lazy(() => import('../pages/NotFound/NotFoundPage'));
const CustomerDashboardPage = lazy(() => import('../pages/Customer/DashboardPage'));
const CustomerAppointmentsPage = lazy(() => import('../pages/Customer/AppointmentsPage'));
const CustomerQueuePage = lazy(() => import('../pages/Customer/QueuePage'));
const CustomerNearbyPage = lazy(() => import('../pages/Customer/NearbyPage'));
const CustomerBookPage = lazy(() => import('../pages/Customer/BookPage'));
const CustomerNotificationsPage = lazy(() => import('../pages/Customer/NotificationsPage'));
const CustomerProfilePage = lazy(() => import('../pages/Customer/ProfilePage'));
const BusinessDashboardPage = lazy(() => import('../pages/Business/DashboardPage'));
const BusinessQueuePage = lazy(() => import('../pages/Business/QueuePage'));
const BusinessAnalyticsPage = lazy(() => import('../pages/Business/AnalyticsPage'));
const BusinessReviewsPage = lazy(() => import('../pages/Business/ReviewsPage'));
const BusinessProfilePage = lazy(() => import('../pages/Business/ProfilePage'));

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
    <Suspense fallback={<LoadingSpinner />}>
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
    </Suspense>
  );
}

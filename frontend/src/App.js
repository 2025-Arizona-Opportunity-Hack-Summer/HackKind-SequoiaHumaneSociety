import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authService } from './services/authService';
import { API_BASE_URL } from './config/api';

// Pages
import LandingPage from "./pages/LandingPage";
import Questionnaire from "./pages/Questionnaire";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AdopterDashboard from './pages/AdopterDashboard';
import MatchResultsPage from './pages/MatchResultsPage';
import NotFoundPage from "./pages/NotFoundPage";

// Components
import LoadingSpinner from './components/common/LoadingSpinner';

// Auth context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Protected route component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Store the attempted URL for redirecting after login
    const redirectTo = location.pathname + (location.search || '');
    console.log('Storing redirect URL:', redirectTo);
    return <Navigate to="/login" state={{ from: { pathname: redirectTo } }} replace />;
  }

  // Check if user has the required role if specified
  if (requiredRole) {
    const userRole = user?.role?.toLowerCase();
    if (userRole !== requiredRole.toLowerCase()) {
      console.warn(`User role ${userRole} does not have access to this route. Required role: ${requiredRole}`);
      // Redirect to dashboard or admin based on user role
      const redirectTo = userRole === 'admin' ? '/admin' : '/dashboard';
      return <Navigate to={redirectTo} replace />;
    }
  }

  return children;
};

// Public route component (only for non-authenticated users)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // If user is authenticated, redirect based on role
  if (isAuthenticated && user) {
    // Get the intended path or default based on role
    let redirectTo = location.state?.from?.pathname;
    
    // If no intended path, redirect based on role
    if (!redirectTo || redirectTo === '/login' || redirectTo === '/') {
      redirectTo = user.role?.toLowerCase() === 'admin' ? '/admin/dashboard' : '/dashboard';
    }
    
    console.log('Redirecting authenticated user to:', redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

function AppContent() {
  const { initializeAuth } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const init = async () => {
      try {
        await initializeAuth();
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    init();
  }, [initializeAuth]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Auth routes (only for non-authenticated users) */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      
      <Route path="/signup" element={
        <PublicRoute>
          <Signup />
        </PublicRoute>
      } />
      
      <Route path="/questionnaire" element={
        <ProtectedRoute>
          <Questionnaire />
        </ProtectedRoute>
      } />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AdopterDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/dashboard" element={
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      
      {/* Redirect old /admin to /admin/dashboard */}
      <Route path="/admin" element={
        <Navigate to="/admin/dashboard" replace />
      } />
      
      <Route path="/match-results" element={
        <ProtectedRoute>
          <MatchResultsPage />
        </ProtectedRoute>
      } />
      
      {/* Catch-all route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
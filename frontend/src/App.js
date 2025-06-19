import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';

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
import Navbar from './components/Navbar';

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
      redirectTo = user.role?.toLowerCase() === 'admin' ? '/admin' : '/dashboard';
    }
    
    console.log('Redirecting authenticated user to:', redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

// Layout component that includes Navbar and applies base styles
const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-primary-white text-primary-charcoal font-sans">
      <Navbar />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
      {/* Footer can be added here */}
    </div>
  );
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
      {/* Auth routes (only for non-authenticated users) - No Navbar */}
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
      
      {/* All other routes with Navbar */}
      <Route path="/" element={<Layout />}>
        <Route index element={<LandingPage />} />
        
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
        
        <Route path="/match-results" element={
          <ProtectedRoute>
            <MatchResultsPage />
          </ProtectedRoute>
        } />
        
        {/* Redirect old /admin to /admin/dashboard */}
        <Route path="/admin" element={
          <Navigate to="/admin/dashboard" replace />
        } />
        
        {/* Catch-all route */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
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
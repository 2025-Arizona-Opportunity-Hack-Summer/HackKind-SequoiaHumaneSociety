import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';

import LandingPage from "./pages/LandingPage";
import Questionnaire from "./pages/Questionnaire";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AdopterDashboard from './pages/AdopterDashboard';
import MatchResultsPage from './pages/MatchResultsPage';
import NotFoundPage from "./pages/NotFoundPage";

import LoadingSpinner from './components/common/LoadingSpinner';
import Navbar from './components/Navbar';

import { AuthProvider, useAuth } from './contexts/AuthContext';

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
    const redirectTo = location.pathname + (location.search || '');

    return <Navigate to="/login" state={{ from: { pathname: redirectTo } }} replace />;
  }

  if (requiredRole) {
    const userRole = user?.role?.toLowerCase();
    if (userRole !== requiredRole.toLowerCase()) {

      const redirectTo = userRole === 'admin' ? '/admin' : '/dashboard';
      return <Navigate to={redirectTo} replace />;
    }
  }

  return children;
};

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

  if (isAuthenticated && user) {
    let redirectTo = location.state?.from?.pathname;
    
    if (!redirectTo || redirectTo === '/login' || redirectTo === '/') {
      redirectTo = user.role?.toLowerCase() === 'admin' ? '/admin' : '/dashboard';
    }
    

    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

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

  useEffect(() => {
    const init = async () => {
      try {
        await initializeAuth();
      } catch (error) {
        // Error initializing auth
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
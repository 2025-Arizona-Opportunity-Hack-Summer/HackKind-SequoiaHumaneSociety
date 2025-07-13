import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LandingPage from "./pages/LandingPage";
import Questionnaire from "./pages/Questionnaire";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AdopterDashboard from './pages/AdopterDashboard';
import MatchResultsPage from './pages/MatchResultsPage';
import PetsPage from './pages/PetsPage';
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
      
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pets" element={<PetsPage />} />
      </Route>
      
      <Route element={<Layout />}>
        <Route path="/questionnaire" element={
          <ProtectedRoute>
            <Questionnaire />
          </ProtectedRoute>
        } />
        
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
        
        <Route path="/admin" element={
          <Navigate to="/admin/dashboard" replace />
        } />
      </Route>
      
      <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
    </Routes>
  );
}

function App() {
  useEffect(() => {
    window.toast = toast;
    return () => {
      delete window.toast;
    };
  }, []);

  return (
    <Router>
      <AuthProvider>
        <ToastContainer
          position="top-center"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
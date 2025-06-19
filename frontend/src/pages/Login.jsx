import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log('Attempting login with:', formData);
      const response = await login(formData);
      
      if (!response.user) {
        throw new Error('No user data received in login response');
      }
      
      // Get the user role from the response
      const userRole = response.user.role?.toLowerCase() || 'adopter';
      console.log('Login successful, user role:', userRole, 'Full response:', response);
      
      // Redirect based on user role
      const redirectPath = (() => {
        // If there's a stored redirect path and it's not the login page, use it
        if (location.state?.from?.pathname && 
            location.state.from.pathname !== '/login' &&
            !location.state.from.pathname.startsWith('/auth')) {
          return location.state.from.pathname;
        }
        // Otherwise, redirect based on role
        if (userRole === 'admin') {
          return '/admin/dashboard';
        }
        return '/dashboard';
      })();
      
      console.log('Redirecting to:', redirectPath);
      navigate(redirectPath, { replace: true });
      
    } catch (err) {
      console.error('Login error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
      });
      
      // Set more detailed error message
      const errorMessage = err.response?.data?.detail || 
                         err.response?.data?.message || 
                         err.message || 
                         'Login failed. Please check your credentials and try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-primary-white to-primary-blush/20 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-charcoal mb-2 font-heading">Welcome Back</h1>
          <p className="text-primary-medium-gray">Sign in to continue to PetMatch</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg border border-primary-light-gray/50">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-primary-charcoal mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input w-full"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-primary-charcoal">Password</label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-primary-red hover:text-opacity-80 transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input w-full"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary py-3 px-6 text-base font-medium rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </>
            ) : 'Sign In'}
          </button>

          <div className="mt-6 text-center text-sm">
            <span className="text-primary-medium-gray">Don't have an account? </span>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="font-medium text-primary-red hover:text-opacity-80 transition-colors focus:outline-none"
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
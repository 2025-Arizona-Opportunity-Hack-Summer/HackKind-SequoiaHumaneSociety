import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  
  // Debug logging
  console.log('Navbar - User:', user);
  console.log('Navbar - isAuthenticated:', isAuthenticated);
  if (user) {
    console.log('Navbar - User role:', user.role);
    console.log('Navbar - Is admin:', user.role?.toLowerCase() === 'admin');
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-primary-light-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-primary-red font-heading">
            PetMatch
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to={user?.role?.toLowerCase() === 'admin' ? "/admin" : "/dashboard"}
                  className="text-gray-700 hover:text-primary-red px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  My Account
                </Link>
                {user?.role?.toLowerCase() !== 'admin' && (
                  <Link
                    to="/match-results"
                    className="text-gray-700 hover:text-primary-red px-3 py-2 text-sm font-medium transition-colors duration-200"
                  >
                    Matches
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-primary-red px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  Log Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="btn btn-outline px-6 py-2 rounded-xl text-sm font-medium hover:shadow-md transition-all duration-200"
              >
                Log In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

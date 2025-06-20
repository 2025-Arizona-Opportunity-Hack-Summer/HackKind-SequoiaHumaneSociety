import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Navigation for non-authenticated users
const GuestNav = () => (
  <>
    <Link
      to="/pets"
      className="text-gray-700 hover:text-primary-red px-3 py-2 text-sm font-medium transition-colors duration-200"
    >
      Pets
    </Link>
    <Link
      to="/login"
      className="btn btn-outline px-6 py-2 rounded-xl text-sm font-medium hover:shadow-md transition-all duration-200"
    >
      Log In
    </Link>
  </>
);

// Navigation for authenticated admin users
const AdminNav = ({ onLogout }) => (
  <>
    <Link
      to="/admin"
      className="text-gray-700 hover:text-primary-red px-3 py-2 text-sm font-medium transition-colors duration-200"
    >
      My Account
    </Link>
    <button
      onClick={onLogout}
      className="text-gray-700 hover:text-primary-red px-3 py-2 text-sm font-medium transition-colors duration-200"
    >
      Log Out
    </button>
  </>
);

// Navigation for authenticated non-admin users
const UserNav = ({ onLogout }) => (
  <>
    <Link
      to="/dashboard"
      className="text-gray-700 hover:text-primary-red px-3 py-2 text-sm font-medium transition-colors duration-200"
    >
      My Account
    </Link>
    <Link
      to="/pets"
      className="text-gray-700 hover:text-primary-red px-3 py-2 text-sm font-medium transition-colors duration-200"
    >
      Pets
    </Link>
    <Link
      to="/match-results"
      className="text-gray-700 hover:text-primary-red px-3 py-2 text-sm font-medium transition-colors duration-200"
    >
      Matches
    </Link>
    <button
      onClick={onLogout}
      className="text-gray-700 hover:text-primary-red px-3 py-2 text-sm font-medium transition-colors duration-200"
    >
      Log Out
    </button>
  </>
);

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
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
            {!isAuthenticated ? (
              <GuestNav />
            ) : user?.role?.toLowerCase() === 'admin' ? (
              <AdminNav onLogout={handleLogout} />
            ) : (
              <UserNav onLogout={handleLogout} />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

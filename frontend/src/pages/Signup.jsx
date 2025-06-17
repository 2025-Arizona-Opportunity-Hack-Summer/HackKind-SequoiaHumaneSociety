import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "../services/authService";

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showWelcome, setShowWelcome] = useState(location.state?.showWelcome || false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isValidPhone = (phone) => {
    const digitsOnly = phone.replace(/\D/g, "");
    return digitsOnly.length === 10;
  };

  const isValidEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validation
    if (!formData.full_name.trim()) {
      setError("Name cannot be empty.");
      setIsLoading(false);
      return;
    }

    if (!isValidEmail(formData.email)) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    if (!isValidPhone(formData.phone_number)) {
      setError("Please enter a valid 10-digit U.S. phone number.");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Signup data:", formData);
      
      // Check for saved preferences before registration
      const savedPreferences = sessionStorage.getItem('tempPreferences');
      let redirectState = {
        from: { pathname: '/dashboard' },
        refreshMatches: false,
        showWelcome: true
      };
      
      if (savedPreferences) {
        try {
          const prefs = JSON.parse(savedPreferences);
          console.log('Found saved preferences:', prefs);
          redirectState = {
            from: prefs.from || { pathname: '/dashboard' },
            refreshMatches: prefs.refreshMatches || false,
            showWelcome: true
          };
        } catch (err) {
          console.error('Error parsing saved preferences:', err);
        }
      }
      
      // Send registration data to backend
      await authService.register({
        ...formData,
        role: "Adopter"  // Must match backend enum: 'Adopter' or 'Admin'
      });
      
      console.log('Registration successful, logging in...');
      
      // After successful registration, log the user in
      await authService.login({
        email: formData.email,
        password: formData.password
      });
      
      // If we have saved preferences, save them to the user's account
      if (savedPreferences) {
        try {
          const { preferences } = JSON.parse(savedPreferences);
          console.log('Saving preferences to account...', preferences);
          
          // Save the preferences to the user's account
          const { preferencesService } = await import('../services/preferencesService');
          await preferencesService.savePreferences(preferences);
          
          // Clear the temp preferences
          sessionStorage.removeItem('tempPreferences');
          console.log('Preferences saved successfully');
          
          // Redirect to matches with refresh flag
          navigate('/matches', { 
            replace: true,
            state: { 
              ...redirectState,
              refreshMatches: true,
              message: 'Your preferences have been saved! Here are your pet matches.'
            }
          });
          return; // Important: Return here to prevent double navigation
        } catch (err) {
          console.error('Error saving preferences:', err);
          // Continue to default redirect if there's an error
          setError('Account created, but there was an error saving your preferences.');
        }
      }
      
      // Default redirect if no saved preferences or error occurred
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      console.log('Redirecting to:', redirectTo);
      
      navigate(redirectTo, { 
        replace: true,
        state: {
          ...redirectState,
          from: location.state?.from || { pathname: '/dashboard' },
          showWelcome: true,
          message: location.state?.message || 'Welcome to your dashboard!'
        }
      });
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-gray-50 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Create Your Account</h2>

        <label className="block mb-2 font-medium">Name</label>
        <input
          type="text"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          className="w-full p-2 mb-4 border rounded"
          required
        />

        <label className="block mb-2 font-medium">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 mb-4 border rounded"
          required
        />

        <label className="block mb-2 font-medium">Phone Number</label>
        <input
          type="tel"
          name="phone_number"
          placeholder="e.g., 555-123-4567"
          value={formData.phone_number}
          onChange={handleChange}
          className="w-full p-2 mb-4 border rounded"
          required
        />

        <label className="block mb-2 font-medium">Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full p-2 mb-6 border rounded"
          required
        />

        {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}

        <button
          type="submit"
          className={`w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Sign Up and See Matches'}
        </button>
      </form>
    </div>
  );
}

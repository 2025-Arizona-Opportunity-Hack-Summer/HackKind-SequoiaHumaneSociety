import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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
      
      // After login, navigate to the questionnaire
      console.log('Login successful, navigating to questionnaire...');
      navigate('/questionnaire', { replace: true });

    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-primary-white to-primary-blush/20 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-charcoal mb-2 font-heading">Create Your Account</h1>
          <p className="text-primary-medium-gray">Join PetMatch to find your perfect pet companion</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg border border-primary-light-gray/50">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-primary-charcoal mb-2">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="input w-full"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-charcoal mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input w-full"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-primary-charcoal">Phone Number</label>
                <span className="text-xs text-primary-medium-gray">10-digit US number</span>
              </div>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="(123) 456-7890"
                className="input w-full"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-primary-charcoal">Password</label>
                <span className="text-xs text-primary-medium-gray">At least 8 characters</span>
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
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary py-3 px-6 text-base font-medium rounded-xl hover:shadow-lg transition-all duration-200 mt-6 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </>
            ) : 'Create Account'}
          </button>

          <div className="mt-6 text-center text-sm">
            <span className="text-primary-medium-gray">Already have an account? </span>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="font-medium text-primary-red hover:text-opacity-80 transition-colors focus:outline-none"
            >
              Log in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

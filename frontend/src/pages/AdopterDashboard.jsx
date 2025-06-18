import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { preferencesService } from "../services/preferencesService";
import api from "../services/api";

export default function AdopterDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [visitRequests, setVisitRequests] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [trainingTraits, setTrainingTraits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch visit requests, preferences, and training traits in parallel
        const [visitsRes, prefsData, traitsRes] = await Promise.all([
          api.get("/visit-requests/my"),
          preferencesService.getMyPreferences(),
          preferencesService.getTrainingTraits()
        ]);
        
        // If we got an empty object from getMyPreferences, it means no preferences exist yet
        const hasPreferences = prefsData && Object.keys(prefsData).length > 0;
        
        setVisitRequests(visitsRes.data || []);
        setPreferences(hasPreferences ? prefsData : null);
        setTrainingTraits(traitsRes || []);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        if (err.response) {
          console.error('Response data:', err.response.data);
          console.error('Status:', err.response.status);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Dashboard</h1>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-70 flex items-center gap-2"
        >
          {isLoggingOut ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Logging out...
            </>
          ) : (
            'Logout'
          )}
        </button>
      </div>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Your Visit Requests</h2>
        {visitRequests.length === 0 ? (
          <p>No visit requests yet.</p>
        ) : (
          <ul className="bg-white rounded shadow p-4 divide-y">
            {visitRequests.map((visit) => (
              <li key={visit.id} className="py-2">
                <p className="font-medium">Pet: {visit.petName}</p>
                <p>Date: {new Date(visit.requested_at).toLocaleDateString()}</p>
                <p>Status: <span className="font-semibold">{visit.status}</span></p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">Your Preferences</h2>
          <button 
            onClick={() => navigate('/questionnaire')}
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
          >
            Edit Preferences
          </button>
        </div>
        {preferences ? (
          <div className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700">Pet Type</h3>
              <p className="text-gray-900">{preferences.pet_type || 'Not specified'}</p>
              
              <h3 className="font-medium text-gray-700 mt-4">Preferred Age</h3>
              <p className="text-gray-900">{preferences.preferred_age || 'Any'}</p>
              
              <h3 className="font-medium text-gray-700 mt-4">Preferred Sex</h3>
              <p className="text-gray-900">{preferences.preferred_sex || 'Any'}</p>
              
              <h3 className="font-medium text-gray-700 mt-4">Size</h3>
              <p className="text-gray-900">{preferences.preferred_size || 'Any'}</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700">Activity Level</h3>
              <p className="text-gray-900">{preferences.activity_level || 'Not specified'}</p>
              
              <h3 className="font-medium text-gray-700 mt-4">Hair Length</h3>
              <p className="text-gray-900">{preferences.hair_length || 'Any'}</p>
              
              <h3 className="font-medium text-gray-700 mt-4">Special Needs</h3>
              <p className="text-gray-900">{preferences.special_needs || 'None'}</p>
              
              <h3 className="font-medium text-gray-700 mt-4">Experience with Pets</h3>
              <p className="text-gray-900">{preferences.ownership_experience || 'Not specified'}</p>
              
              {trainingTraits.length > 0 && (
                <>
                  <h3 className="font-medium text-gray-700 mt-4">Training Requirements</h3>
                  <div className="flex flex-wrap gap-2">
                    {trainingTraits.map((trait, index) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {trait.trait || trait}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  You haven't set your pet preferences yet.  
                  <button 
                    onClick={() => navigate('/questionnaire')}
                    className="font-medium text-yellow-700 hover:text-yellow-600 underline"
                  >
                    Complete the questionnaire
                  </button> to get personalized pet recommendations.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
} 

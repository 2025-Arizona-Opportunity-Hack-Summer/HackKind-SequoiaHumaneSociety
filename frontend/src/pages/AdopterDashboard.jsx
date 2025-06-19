import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { preferencesService } from "../services/preferencesService";
import api from "../services/api";

export default function AdopterDashboard() {
  const navigate = useNavigate();
  const [visitRequests, setVisitRequests] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [trainingTraits, setTrainingTraits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [visitsRes, prefsData, traitsRes] = await Promise.all([
          api.get("/visit-requests/my"),
          preferencesService.getMyPreferences(),
          preferencesService.getTrainingTraits()
        ]);
        
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
    <div className="min-h-screen p-6 bg-light-gray">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Your Dashboard</h1>
      </div>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Your Visit Requests</h2>
        {visitRequests.length === 0 ? (
          <p>No visit requests yet.</p>
        ) : (
          <ul className="bg-white rounded-lg shadow-md p-6 divide-y divide-light-gray">
            {visitRequests.map((visit) => (
              <li key={visit.id} className="py-2">
                <p className="font-medium">Pet: {visit.pet?.name || 'Pet name not available'}</p>
                <p>Date: {new Date(visit.requested_at).toLocaleDateString()}</p>
                <p>Status: <span className={`font-semibold ${
                  visit.status === 'Pending' ? 'text-yellow-600' :
                  visit.status === 'Confirmed' ? 'text-green-600' :
                  'text-red-600'
                }`}>{visit.status}</span></p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8 bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Preferences</h2>
          <button 
            onClick={() => navigate('/questionnaire')}
            className="text-sm bg-primary-red text-white px-4 py-2 rounded-md hover:bg-primary-red-dark transition-colors"
          >
            Edit Preferences
          </button>
        </div>
        {preferences ? (
          <div className="p-4 border border-light-gray rounded-lg hover:shadow-md transition-shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-500 text-sm">Pet Type</h3>
                  <p className="text-gray-900">{preferences.preferred_species || 'Not specified'}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-500 text-sm">Preferred Age</h3>
                  <p className="text-gray-900">{preferences.preferred_age || 'Any'}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-500 text-sm">Preferred Sex</h3>
                  <p className="text-gray-900">{preferences.preferred_sex || 'Any'}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-500 text-sm">Size</h3>
                  <p className="text-gray-900">{preferences.preferred_size || 'Any'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-500 text-sm">Activity Level</h3>
                  <p className="text-gray-900">{preferences.preferred_energy_level || 'Not specified'}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-500 text-sm">Hair Length</h3>
                  <p className="text-gray-900">{preferences.preferred_hair_length || 'Any'}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-500 text-sm">Special Needs</h3>
                  <p className="text-gray-900">{preferences.accepts_special_needs ? 'Yes' : 'No'}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-500 text-sm">Experience with Pets</h3>
                  <p className="text-gray-900">{preferences.ownership_experience || 'Not specified'}</p>
                </div>
                
                {trainingTraits.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-500 text-sm mb-2">Training Requirements</h3>
                    <div className="flex flex-wrap gap-2">
                      {trainingTraits.map((trait, index) => (
                        <span 
                          key={index} 
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent-blush text-primary-red"
                        >
                          {trait.trait || trait}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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

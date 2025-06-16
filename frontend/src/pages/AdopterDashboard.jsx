import { useEffect, useState } from "react";
import axios from "axios";

export default function AdopterDashboard() {
  const [visitRequests, setVisitRequests] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const visitsRes = await axios.get("/api/visit-requests/me");
        const prefsRes = await axios.get("/api/preferences/me");
        setVisitRequests(visitsRes.data);
        setPreferences(prefsRes.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Your Dashboard</h1>

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

      <section>
        <h2 className="text-xl font-semibold mb-2">Your Preferences</h2>
        {preferences ? (
          <div className="bg-white rounded shadow p-4">
            <p>Pet Type: {preferences.petType}</p>
            <p>Size: {preferences.size}</p>
            <p>Activity Level: {preferences.activity}</p>
            <p>Preferred Age: {preferences.age}</p>
            <p>Hair Length: {preferences.hairLength}</p>
            <p>Special Needs: {preferences.specialNeeds}</p>
            {/* Add more preferences as needed */}
          </div>
        ) : (
          <p>No preferences set. Complete the questionnaire to see matches.</p>
        )}
      </section>
    </div>
  );
} 

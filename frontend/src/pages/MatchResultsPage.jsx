import { useState } from "react";
import { petsMockData } from "../mock/petsMockData";

export default function MatchResultsPage() {
  const [selectedPet, setSelectedPet] = useState(null);
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [requestedVisits, setRequestedVisits] = useState([]);

  const handleSubmitRequest = () => {
    if (visitDate && visitTime) {
      alert(`Requested a visit with ${selectedPet.name} on ${visitDate} at ${visitTime}`);
      setRequestedVisits((prev) => [...prev, selectedPet.id]);
      setSelectedPet(null);
      setVisitDate("");
      setVisitTime("");
    } else {
      alert("Please select both a date and time.");
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <h1 className="text-3xl font-bold text-center mb-8">Your Match Results</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {petsMockData.map((pet) => (
          <div
            key={pet.id}
            className="bg-gray-100 p-4 rounded-lg shadow-md flex flex-col items-center"
          >
            <img
              src={pet.image_url}
              alt={pet.name}
              className="w-full h-48 object-cover rounded"
            />
            <h2 className="text-xl font-bold mt-4">{pet.name}</h2>
            <div className="flex flex-wrap justify-center gap-2 text-sm mt-2">
              {[pet.species, pet.breed, pet.age_group, pet.sex, pet.size, pet.energy_level,
                pet.experience_level, pet.hair_length,
                pet.allergy_friendly ? "Allergy-friendly" : null,
                pet.special_needs ? "Special needs" : null,
                pet.kid_friendly ? "Kid-friendly" : null,
                pet.pet_friendly ? "Pet-friendly" : null,
              ]
                .filter(Boolean)
                .map((trait, idx) => (
                  <span
                    key={idx}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                  >
                    {trait}
                  </span>
                ))}
            </div>
            <p className="text-gray-700 mt-3 text-center">{pet.shelter_notes}</p>
            {requestedVisits.includes(pet.id) ? (
              <button
                disabled
                className="mt-5 w-full bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed"
              >
                Visit Already Requested
              </button>
            ) : (
              <button
                onClick={() => setSelectedPet(pet)}
                className="mt-5 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Request Visit
              </button>
            )}
          </div>
        ))}
      </div>

      {selectedPet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Select Visit Date & Time</h2>
            <label className="block mb-2 font-medium">Date</label>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="w-full mb-4 p-2 border rounded"
            />
            <label className="block mb-2 font-medium">Time</label>
            <input
              type="time"
              value={visitTime}
              onChange={(e) => setVisitTime(e.target.value)}
              className="w-full mb-4 p-2 border rounded"
            />
            <div className="flex justify-between">
              <button
                onClick={() => setSelectedPet(null)}
                className="text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRequest}
                className="bg-green-600 text-white font-semibold px-6 py-2 rounded hover:bg-green-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

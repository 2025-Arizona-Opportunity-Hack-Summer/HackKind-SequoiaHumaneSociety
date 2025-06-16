import { useState } from "react";

export default function QuestionnaireStep2({ onNext, onBack, formData, setFormData }) {
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (!formData.currentPets || !formData.experience) {
      setError("Please answer all required questions.");
      return;
    }
    setError("");
    onNext();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
      <div className="w-full max-w-xl bg-gray-50 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Pet Experience – Step 2 of 4</h2>

        <label className="block mb-2 font-medium">
          3. Do you currently own any pets?
        </label>
        <select
          name="currentPets"
          value={formData.currentPets || ""}
          onChange={handleChange}
          className="w-full mb-4 p-2 border rounded"
        >
          <option value="">Select</option>
          <option value="none">None</option>
          <option value="dog">Dog(s)</option>
          <option value="cat">Cat(s)</option>
          <option value="both">Both dog(s) and cat(s)</option>
        </select>

        <label className="block mb-2 font-medium">
          4. What is your previous pet ownership experience?
        </label>
        <select
          name="experience"
          value={formData.experience || ""}
          onChange={handleChange}
          className="w-full mb-6 p-2 border rounded"
        >
          <option value="">Select</option>
          <option value="first-time">First-time</option>
          <option value="had-pets">Had pets before</option>
          <option value="current">Currently have pets</option>
        </select>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
          >
            ← Back
          </button>
          <button
            onClick={handleNext}
            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded hover:bg-blue-700"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

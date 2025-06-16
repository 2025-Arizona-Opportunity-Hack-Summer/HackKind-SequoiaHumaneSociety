import { useState } from "react";

export default function QuestionnaireStep3({ onNext, onBack, formData, setFormData }) {
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    const { gender, size, activity, age } = formData;
    if (!gender || !size || !activity || !age) {
      setError("Please answer all required questions.");
      return;
    }
    setError("");
    onNext();
  };

  const isDog = formData.petType === "dog";
  const isCat = formData.petType === "cat";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
      <div className="w-full max-w-xl bg-gray-50 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Pet Preferences – Step 3 of 4</h2>

        <label className="block mb-2 font-medium">5. Preferred gender?</label>
        <select
          name="gender"
          value={formData.gender || ""}
          onChange={handleChange}
          className="w-full mb-4 p-2 border rounded"
        >
          <option value="">No preference</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
        </select>

        <label className="block mb-2 font-medium">6. Preferred size?</label>
        <select
          name="size"
          value={formData.size || ""}
          onChange={handleChange}
          className="w-full mb-4 p-2 border rounded"
        >
          <option value="">No preference</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="xl">Extra large</option>
        </select>

        <label className="block mb-2 font-medium">7. Preferred activity level?</label>
        <select
          name="activity"
          value={formData.activity || ""}
          onChange={handleChange}
          className="w-full mb-4 p-2 border rounded"
        >
          <option value="">No preference</option>
          <option value="lap">Lap pet</option>
          <option value="calm">Calm</option>
          <option value="moderate">Moderately active</option>
          <option value="active">Very active</option>
        </select>

        <label className="block mb-2 font-medium">8. Preferred age?</label>
        <select
          name="age"
          value={formData.age || ""}
          onChange={handleChange}
          className="w-full mb-6 p-2 border rounded"
        >
          <option value="">No preference</option>
          {isDog && <option value="puppy">Puppy</option>}
          {isCat && <option value="kitten">Kitten</option>}
          <option value="young">Young</option>
          <option value="adult">Adult</option>
          <option value="senior">Senior</option>
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

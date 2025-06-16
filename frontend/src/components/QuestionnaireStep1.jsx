import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function QuestionnaireStep1({ onNext, formData, setFormData }) {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (!formData.petType || !formData.whoFor) {
      setError("Please answer all required questions.");
      return;
    }

    if (formData.whoFor === "family" && !formData.hasChildren) {
      setError("Please indicate if there are children in the home.");
      return;
    }

    setError("");
    onNext();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
      <div className="w-full max-w-xl bg-gray-50 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">About You – Step 1 of 4</h2>

        <label className="block mb-2 font-medium">
          1. What type of pet do you want to adopt?
        </label>
        <select
          name="petType"
          value={formData.petType || ""}
          onChange={handleChange}
          className="w-full mb-4 p-2 border rounded"
        >
          <option value="">Select</option>
          <option value="dog">Dog</option>
          <option value="cat">Cat</option>
        </select>

        <label className="block mb-2 font-medium">
          2. Who is this pet for?
        </label>
        <select
          name="whoFor"
          value={formData.whoFor || ""}
          onChange={handleChange}
          className="w-full mb-4 p-2 border rounded"
        >
          <option value="">Select</option>
          <option value="myself">Myself</option>
          <option value="family">My Family</option>
        </select>

        {formData.whoFor === "family" && (
          <>
            <label className="block mb-2 font-medium">
              Are there children in the home?
            </label>
            <select
              name="hasChildren"
              value={formData.hasChildren || ""}
              onChange={handleChange}
              className="w-full mb-4 p-2 border rounded"
            >
              <option value="">Select</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </>
        )}

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="flex justify-end">
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

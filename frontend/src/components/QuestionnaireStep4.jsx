import { useState } from "react";

export default function QuestionnaireStep4({ onSubmit, onBack, formData, setFormData }) {
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (["houseTrained", "allergyFriendly", "litterTrained"].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        traits: {
          ...(prev.traits || {}),
          [name]: checked,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = () => {
    if (!formData.hairLength || !formData.specialNeeds) {
      setError("Please answer all required questions.");
      return;
    }
    setError("");
    onSubmit();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
      <div className="w-full max-w-xl bg-gray-50 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Traits & Needs – Step 4 of 4</h2>

        <label className="block mb-2 font-medium">8. Preferred hair length?</label>
        <select
          name="hairLength"
          value={formData.hairLength || ""}
          onChange={handleChange}
          className="w-full mb-4 p-2 border rounded"
        >
          <option value="">No preference</option>
          <option value="short">Short</option>
          <option value="medium">Medium</option>
          <option value="long">Long</option>
        </select>

        <label className="block mb-2 font-medium">9. Required traits (select any):</label>
        <div className="flex flex-col gap-2 mb-4 pl-2">
          <label>
            <input
              type="checkbox"
              name="houseTrained"
              checked={formData.traits?.houseTrained || false}
              onChange={handleChange}
            />{" "}
            House-trained
          </label>
          <label>
            <input
              type="checkbox"
              name="allergyFriendly"
              checked={formData.traits?.allergyFriendly || false}
              onChange={handleChange}
            />{" "}
            Allergy-friendly
          </label>
          <label>
            <input
              type="checkbox"
              name="litterTrained"
              checked={formData.traits?.litterTrained || false}
              onChange={handleChange}
            />{" "}
            Litter-trained
          </label>
        </div>

        <label className="block mb-2 font-medium">
          10. Are you open to adopting a pet with special needs?
        </label>
        <select
          name="specialNeeds"
          value={formData.specialNeeds || ""}
          onChange={handleChange}
          className="w-full mb-6 p-2 border rounded"
        >
          <option value="">Select</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
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
            type="button"
            onClick={handleSubmit}
            className="bg-green-600 text-white font-semibold px-6 py-2 rounded hover:bg-green-700"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

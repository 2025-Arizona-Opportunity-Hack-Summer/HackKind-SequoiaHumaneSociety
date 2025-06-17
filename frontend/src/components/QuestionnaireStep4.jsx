import { useState } from "react";

export default function QuestionnaireStep4({ onSubmit, onBack, formData, setFormData, isSubmitting }) {
  const [error, setError] = useState("");
  const [localIsSubmitting, setLocalIsSubmitting] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || localIsSubmitting) return;
    
    if (!formData.hairLength || !formData.specialNeeds) {
      setError("Please answer all required questions.");
      return;
    }
    
    setError("");
    setLocalIsSubmitting(true);
    
    try {
      await onSubmit();
    } finally {
      setLocalIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || localIsSubmitting;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Traits & Needs – Step 4 of 4</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              8. Preferred hair length? <span className="text-red-500">*</span>
            </label>
            <select
              name="hairLength"
              value={formData.hairLength || ""}
              onChange={handleChange}
              disabled={isLoading}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              required
            >
              <option value="">No preference</option>
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              9. Required traits (select any):
            </label>
            <div className="space-y-2 pl-2">
              {[
                { name: 'houseTrained', label: 'House-trained' },
                { name: 'allergyFriendly', label: 'Allergy-friendly' },
                { name: 'litterTrained', label: 'Litter-trained' }
              ].map(({ name, label }) => (
                <label key={name} className="flex items-center">
                  <input
                    type="checkbox"
                    name={name}
                    checked={formData.traits?.[name] || false}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              10. Are you open to adopting a pet with special needs? <span className="text-red-500">*</span>
            </label>
            <select
              name="specialNeeds"
              value={formData.specialNeeds || ""}
              onChange={handleChange}
              disabled={isLoading}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              required
            >
              <option value="">Select an option</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : 'Submit'}
          </button>
        </div>
      </div>
    </form>
  );
}

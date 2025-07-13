import React, { useState, useEffect } from 'react';

const VisitModal = ({
  isOpen,
  onClose,
  onSubmit,
  visit = null,
  pets = [],
  isProcessing = false,
  error = null
}) => {
  const [formData, setFormData] = useState({
    pet_id: '',
    requested_at: '',
    status: 'pending approval'
  });

  useEffect(() => {
    if (visit) {
      const requestedDate = new Date(visit.requested_at);
      const localDate = new Date(requestedDate.getTime() - (requestedDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      
      setFormData({
        pet_id: visit.pet_id || '',
        requested_at: localDate,
        status: visit.status || 'pending approval'
      });
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setMinutes(0, 0, 0);
      const localDate = new Date(tomorrow.getTime() - (tomorrow.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      
      setFormData({
        pet_id: pets.length > 0 ? pets[0].id : '',
        requested_at: localDate,
        status: 'pending approval'
      });
    }
  }, [visit, pets]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      requested_at: new Date(formData.requested_at).toISOString()
    };
    
    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {visit ? 'Update Visit Request' : 'Schedule New Visit'}
                  </h3>
                  
                  {error && (
                    <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                      <p>{error}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                      <label htmlFor="pet_id" className="block text-sm font-medium text-gray-700">
                        Pet *
                      </label>
                      <select
                        id="pet_id"
                        name="pet_id"
                        required
                        value={formData.pet_id}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-red focus:border-primary-red sm:text-sm"
                        disabled={!!visit}
                      >
                        <option value="">Select a pet</option>
                        {pets.map((pet) => (
                          <option key={pet.id} value={pet.id}>
                            {pet.name} ({pet.species})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="sm:col-span-6">
                      <label htmlFor="requested_at" className="block text-sm font-medium text-gray-700">
                        Requested Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        name="requested_at"
                        id="requested_at"
                        required
                        value={formData.requested_at}
                        onChange={handleChange}
                        min={new Date().toISOString().slice(0, 16)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-red focus:border-primary-red sm:text-sm"
                      />
                    </div>
                    
                    <div className="sm:col-span-6">
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-red focus:border-primary-red sm:text-sm"
                      >
                        <option value="pending approval">Pending Approval</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    

                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-red text-base font-medium text-white hover:bg-primary-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-red sm:ml-3 sm:w-auto sm:text-sm ${
                  isProcessing ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isProcessing ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-red sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VisitModal;

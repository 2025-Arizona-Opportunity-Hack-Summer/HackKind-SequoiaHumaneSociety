import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 10; hour < 16; hour++) {
    slots.push({
      value: `${hour.toString().padStart(2, '0')}:00`,
      label: `${hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`
    });
    slots.push({
      value: `${hour.toString().padStart(2, '0')}:30`,
      label: `${hour}:30 ${hour >= 12 ? 'PM' : 'AM'}`
    });
  }
  return slots;
};

const getAvailableDates = () => {
  const dates = [];
  const today = new Date();
  
  for (let i = 1; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      dates.push(date);
    }
  }
  return dates;
};

const VisitRequestModal = ({ 
  isOpen = true, 
  onClose, 
  pet, 
  onSuccess,
  showSignUpPrompt = false
}) => {
  const navigate = useNavigate();
  const timeSlots = generateTimeSlots();
  const availableDates = getAvailableDates();
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = () => {
    // Close the modal and navigate to signup page
    onClose();
    navigate('/signup', { state: { from: '/pets' } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!visitDate || !visitTime) {
      setError('Please select both date and time');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // TODO: Implement the actual visit request submission
      // await scheduleVisit(pet.id, { date: visitDate, time: visitTime });
      onSuccess();
    } catch (err) {
      setError('Failed to schedule visit. Please try again.');
      console.error('Error scheduling visit:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Function to render pet details
  const renderPetDetails = () => {
    if (!pet) return null;
    
    // Safely access pet properties with fallbacks based on backend data structure
    const { 
      name = 'Unknown',
      description = 'No description available.',
      breed = 'Unknown',
      age_group = 'Unknown',
      sex = 'Unknown',
      size = 'Unknown',
      image_url = '',  // Changed from primary_photo_url to match PetCard
      images = [],
      species = 'Unknown',
      energy_level = 'Unknown',
      hair_length = 'Unknown',
      experience_level = 'Unknown'
    } = pet;

    // Use image_url first, then first image from images array, then fallback
    const petImage = image_url || (images?.[0]?.url) || 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';

    return (
      <div className="mt-4">
        <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden rounded-lg">
          {petImage ? (
            <img 
              src={petImage} 
              alt={name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-400">No photo available</span>
            </div>
          )}
        </div>
        <div className="mt-4">
          <h4 className="text-xl font-bold text-gray-900">Meet {name}!</h4>
          <div className="mt-2 text-gray-600">
            <p className="text-base">{description}</p>
          </div>
          
          <div className="mt-6 grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-500">Species</p>
              <p className="text-sm font-medium text-gray-900 capitalize">{species}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Breed</p>
              <p className="text-sm font-medium text-gray-900">{breed}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Age</p>
              <p className="text-sm font-medium text-gray-900">{age_group}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Sex</p>
              <p className="text-sm font-medium text-gray-900 capitalize">{sex}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Size</p>
              <p className="text-sm font-medium text-gray-900">{size}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Energy Level</p>
              <p className="text-sm font-medium text-gray-900">{energy_level}</p>
            </div>
            {hair_length && hair_length !== 'Unknown' && (
              <div>
                <p className="text-sm font-medium text-gray-500">Coat</p>
                <p className="text-sm font-medium text-gray-900">{hair_length}</p>
              </div>
            )}
            {experience_level && experience_level !== 'Unknown' && (
              <div>
                <p className="text-sm font-medium text-gray-500">Experience Level</p>
                <p className="text-sm font-medium text-gray-900">{experience_level}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        />

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-6 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-2xl leading-6 font-bold text-gray-900" id="modal-title">
                  Meet {pet?.name}!
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {showSignUpPrompt 
                    ? 'Sign up to schedule a visit with this pet' 
                    : 'Schedule a visit to meet your potential new companion'}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Pet Details Section */}
            {renderPetDetails()}

            {/* Visit Scheduling Section - Only shown for authenticated users */}
            {!showSignUpPrompt ? (
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Select a date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="block w-full pl-3 pr-10 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-xl shadow-sm"
                      disabled={isLoading}
                      required
                    >
                      <option value="">Choose a date</option>
                      {availableDates.map((date) => {
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        return (
                          <option 
                            key={date.toISOString()} 
                            value={format(date, 'yyyy-MM-dd')}
                            disabled={isWeekend}
                            className={isWeekend ? 'bg-gray-100 text-gray-400' : ''}
                          >
                            {format(date, 'EEEE, MMMM d, yyyy')}
                          </option>
                        );
                      })}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Select a time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="time"
                      value={visitTime}
                      onChange={(e) => setVisitTime(e.target.value)}
                      className="block w-full pl-3 pr-10 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-xl shadow-sm"
                      disabled={isLoading || !visitDate}
                      required
                    >
                      <option value="">Choose a time</option>
                      {timeSlots.map((slot) => (
                        <option key={slot.value} value={slot.value}>
                          {slot.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="mt-2 bg-red-50 p-4 rounded-xl">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">What to expect</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>• Please arrive 5 minutes before your scheduled time</p>
                        <p>• Bring a valid ID</p>
                        <p>• Plan to spend about 30 minutes with us</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 sm:mt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isLoading ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                  >
                    {isLoading ? 'Scheduling...' : 'Schedule Visit'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 mb-4">
                  Sign up or log in to schedule a visit with {pet?.name}.
                </p>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleSignUp}
                    className="flex-1 justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Sign up
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/login', { state: { from: '/pets' } })}
                    className="flex-1 justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Log in
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitRequestModal;

// src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { petService } from '../services/petService';
import api from '../services/api';

const ENUMS = {
  species: ["Dog", "Cat"],
  sex: ["Male", "Female"],
  age_group: [ "Puppy", "Kitten", "Young", "Adult", "Senior"],
  size: ["Small", "Medium", "Large", "ExtraLarge"],
  energy_level: ["Lap Pet", "Calm", "Moderate", "Very Active"],
  experience_level: ["Beginner", "Intermediate", "Advanced"],
  hair_length: ["Short", "Medium", "Long"],
  status: ["Available", "Pending", "Adopted"],
};

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };
  const [pets, setPets] = useState([]);
  const [visits, setVisits] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    age_group: "",
    sex: "",
    size: "",
    energy_level: "",
    experience_level: "",
    hair_length: "",
    allergy_friendly: false,
    special_needs: false,
    kid_friendly: false,
    pet_friendly: false,
    shelter_notes: "",
    image: null,
    status: "Available",
  });
  const [editId, setEditId] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Fetch pets and visit requests when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch pets
        const petsData = await petService.getPets(0, 100); // Fetch first 100 pets
        setPets(petsData.items || petsData); // Handle both paginated and non-paginated responses
        
        // Fetch visit requests using admin endpoint
        const response = await api.get('/admin/visit-requests');
        console.log('Visit requests response:', response.data);
        setVisits(response.data || []);
        
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, type, value, checked, files } = e.target;
    
    if (type === 'file' && files && files[0]) {
      const file = files[0];
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setFormData(prev => ({ ...prev, [name]: file }));
    } else {
      const newValue = type === 'checkbox' ? checked : value;
      setFormData(prev => ({ ...prev, [name]: newValue }));
    }
  };

  const isFormValid = () => {
    const requiredFields = [
      "name", "species", "breed", "age_group", "sex", "size",
      "energy_level", "experience_level", "hair_length", "shelter_notes", "status"
    ];
    return requiredFields.every((field) => formData[field] !== "") && (formData.image || editId !== null);
  };

  const handleAddPet = async () => {
    if (!isFormValid()) {
      alert("Please fill out all fields and upload an image.");
      return;
    }

    try {
      setIsLoading(true);
      
      // Create a copy of form data with only the fields we want to send
      const petData = {
        name: formData.name,
        age_group: formData.age_group,
        sex: formData.sex,
        species: formData.species,
        size: formData.size || null,
        energy_level: formData.energy_level || null,
        experience_level: formData.experience_level || null,
        hair_length: formData.hair_length || null,
        breed: formData.breed || null,
        allergy_friendly: formData.allergy_friendly || false,
        special_needs: formData.special_needs || false,
        kid_friendly: formData.kid_friendly || false,
        pet_friendly: formData.pet_friendly || false,
        shelter_notes: formData.shelter_notes || null,
        status: formData.status || 'Available'
      };
      
      // Remove any undefined or empty string values
      Object.keys(petData).forEach(key => {
        if (petData[key] === '' || petData[key] === undefined) {
          petData[key] = null;
        }
      });
      
      console.log('Prepared pet data:', JSON.stringify(petData, null, 2));

      console.log('Sending pet data:', petData);
      
      let response;
      if (editId !== null) {
        // Update existing pet
        console.log(`Updating pet with ID: ${editId}`);
        try {
          // First update the pet data
          response = await api.put(`/pets/${editId}`, petData);
          console.log('Update response:', response);
          
          // Then handle the image upload if a new image was selected
          if (formData.image) {
            console.log('Uploading new image...');
            const imageFormData = new FormData();
            imageFormData.append('file', formData.image);
            
            await api.post(
              `/pets/${editId}/upload-photo`,
              imageFormData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              }
            );
            console.log('Image upload successful');
          }
        } catch (updateError) {
          console.error('Update error:', updateError);
          throw updateError;
        }
      } else {
        // Create new pet
        console.log('Creating new pet');
        try {
          // First create the pet
          console.log('Creating pet with data:', petData);
          try {
            response = await api.post('/pets', petData);
            console.log('Create response:', response);
          } catch (createError) {
            console.error('Error creating pet:', createError);
            console.error('Response data:', createError.response?.data);
            throw createError;
          }
          
          // Then upload the image if provided
          if (formData.image) {
            console.log('Uploading image for new pet...');
            const imageFormData = new FormData();
            imageFormData.append('file', formData.image);
            
            await api.post(
              `/pets/${response.data.id}/upload-photo`,
              imageFormData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              }
            );
            console.log('Image upload successful');
          }
        } catch (createError) {
          console.error('Create error:', createError);
          throw createError;
        }
      }

      // Refresh the pets list
      const data = await petService.getPets(0, 100);
      setPets(data.items || data);
      
      // Reset form
      setFormData({
        name: "",
        species: "",
        breed: "",
        age_group: "",
        sex: "",
        size: "",
        energy_level: "",
        experience_level: "",
        hair_length: "",
        allergy_friendly: false,
        special_needs: false,
        kid_friendly: false,
        pet_friendly: false,
        shelter_notes: "",
        image: null,
        status: "Available",
        existingImageUrl: null
      });
      setEditId(null);
      
    } catch (err) {
      console.error('Failed to save pet:', err);
      
      let errorMessage = 'Failed to save pet. Please try again.';
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        console.error('Response headers:', err.response.headers);
        
        if (err.response.data && typeof err.response.data === 'object') {
          // Handle validation errors or other structured error responses
          if (err.response.data.detail) {
            errorMessage = err.response.data.detail;
          } else if (err.response.data.message) {
            errorMessage = err.response.data.message;
          } else if (typeof err.response.data === 'string') {
            errorMessage = err.response.data;
          } else {
            errorMessage = JSON.stringify(err.response.data, null, 2);
          }
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', err.message);
        errorMessage = `Error: ${err.message}`;
      }
      
      alert(`Failed to save pet: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPet = (pet) => {
    setFormData({
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      age_group: pet.age_group,
      sex: pet.sex,
      size: pet.size,
      energy_level: pet.energy_level,
      experience_level: pet.experience_level,
      hair_length: pet.hair_length,
      allergy_friendly: pet.allergy_friendly || false,
      special_needs: pet.special_needs || false,
      kid_friendly: pet.kid_friendly || false,
      pet_friendly: pet.pet_friendly || false,
      shelter_notes: pet.shelter_notes || "",
      status: pet.status || "Available",
      image: null,
      // Store the existing image URL for reference
      existingImageUrl: pet.image_url
    });
    setEditId(pet.id);
    // Scroll to the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePet = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pet?')) return;
    
    try {
      setIsLoading(true);
      // Assuming the API endpoint is /api/pets/:id
      await api.delete(`/pets/${id}`);
      // Refresh the pets list
      const data = await petService.getPets(0, 100);
      setPets(data.items || data);
      
      // Reset form if editing the deleted pet
      if (editId === id) {
        setEditId(null);
        setFormData({
          name: "",
          species: "",
          breed: "",
          age_group: "",
          sex: "",
          size: "",
          energy_level: "",
          experience_level: "",
          hair_length: "",
          allergy_friendly: false,
          special_needs: false,
          kid_friendly: false,
          pet_friendly: false,
          shelter_notes: "",
          image: null,
          status: "Available",
          existingImageUrl: null
        });
      }
    } catch (err) {
      console.error('Failed to delete pet:', err);
      alert('Failed to delete pet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateVisitStatus = async (id, newStatus) => {
    try {
      // Call the API to update the visit request status using PUT
      // The backend expects the status to be embedded in the request body
      await api.put(`/admin/visit-requests/${id}/status`, { status: newStatus });
      
      // Update the local state to reflect the change
      setVisits(prevVisits => 
        prevVisits.map(visit => 
          visit.id === id ? { ...visit, status: newStatus } : visit
        )
      );
      
      // Show success message
      alert(`Visit request status updated to ${newStatus} successfully!`);
      
    } catch (err) {
      console.error(`Failed to update visit request status to ${newStatus}:`, err);
      alert(`Failed to update visit request status. Please try again.`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-70 flex items-center gap-2"
        >
          {isLoggingOut ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Logging out...
            </>
          ) : (
            'Logout'
          )}
        </button>
      </div>

      {/* Pet Management */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Manage Pets</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input name="name" placeholder="Name" value={formData.name} onChange={handleInputChange} className="p-2 border rounded" />
          <select name="species" value={formData.species} onChange={handleInputChange} className="p-2 border rounded">
            <option value="">Select Species</option>
            {ENUMS.species.map((v) => <option key={v}>{v}</option>)}
          </select>
          <input name="breed" placeholder="Breed" value={formData.breed} onChange={handleInputChange} className="p-2 border rounded" />
          <select name="age_group" value={formData.age_group} onChange={handleInputChange} className="p-2 border rounded">
            <option value="">Select Age Group</option>
            {ENUMS.age_group.map((v) => <option key={v}>{v}</option>)}
          </select>
          <select name="sex" value={formData.sex} onChange={handleInputChange} className="p-2 border rounded">
            <option value="">Select Sex</option>
            {ENUMS.sex.map((v) => <option key={v}>{v}</option>)}
          </select>
          <select name="size" value={formData.size} onChange={handleInputChange} className="p-2 border rounded">
            <option value="">Select Size</option>
            {ENUMS.size.map((v) => <option key={v}>{v}</option>)}
          </select>
          <select name="energy_level" value={formData.energy_level} onChange={handleInputChange} className="p-2 border rounded">
            <option value="">Select Energy Level</option>
            {ENUMS.energy_level.map((v) => <option key={v}>{v}</option>)}
          </select>
          <select name="experience_level" value={formData.experience_level} onChange={handleInputChange} className="p-2 border rounded">
            <option value="">Select Experience Level This Pet Requires</option>
            {ENUMS.experience_level.map((v) => <option key={v}>{v}</option>)}
          </select>
          <select name="hair_length" value={formData.hair_length} onChange={handleInputChange} className="p-2 border rounded">
            <option value="">Select Hair Length</option>
            {ENUMS.hair_length.map((v) => <option key={v}>{v}</option>)}
          </select>
          <textarea name="shelter_notes" placeholder="Shelter Notes" value={formData.shelter_notes} onChange={handleInputChange} className="p-2 border rounded col-span-2" />
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Pet Image</label>
            <input 
              type="file" 
              name="image" 
              accept="image/*"
              onChange={handleInputChange} 
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {imagePreview || formData.existingImageUrl ? (
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-1">Preview:</p>
                <img 
                  src={imagePreview || `http://localhost:8000${formData.existingImageUrl}`} 
                  alt="Preview" 
                  className="h-32 w-32 object-cover rounded"
                />
              </div>
            ) : null}
          </div>

          <label><input type="checkbox" name="allergy_friendly" checked={formData.allergy_friendly} onChange={handleInputChange} /> Allergy Friendly</label>
          <label><input type="checkbox" name="special_needs" checked={formData.special_needs} onChange={handleInputChange} /> Special Needs</label>
          <label><input type="checkbox" name="kid_friendly" checked={formData.kid_friendly} onChange={handleInputChange} /> Kid Friendly</label>
          <label><input type="checkbox" name="pet_friendly" checked={formData.pet_friendly} onChange={handleInputChange} /> Pet Friendly</label>
          <select name="status" value={formData.status} onChange={handleInputChange} className="p-2 border rounded">
            {ENUMS.status.map((v) => <option key={v}>{v}</option>)}
          </select>
        </div>
        <div className="mt-4">
          <button 
            onClick={handleAddPet} 
            disabled={isLoading}
            className={`px-4 py-2 rounded text-white font-medium ${
              isLoading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : editId !== null ? (
              'Update Pet'
            ) : (
              'Add Pet'
            )}
          </button>
          {editId !== null && (
            <button 
              type="button"
              onClick={() => {
                setEditId(null);
                setFormData({
                  name: "",
                  species: "",
                  breed: "",
                  age_group: "",
                  sex: "",
                  size: "",
                  energy_level: "",
                  experience_level: "",
                  hair_length: "",
                  allergy_friendly: false,
                  special_needs: false,
                  kid_friendly: false,
                  pet_friendly: false,
                  shelter_notes: "",
                  image: null,
                  status: "Available",
                  existingImageUrl: null
                });
                setImagePreview(null);
              }}
              className="ml-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            <p>{error}</p>
          </div>
        ) : pets.length === 0 ? (
          <p className="text-gray-600">No pets found. Add your first pet!</p>
        ) : (
          <ul className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pets.map((pet) => (
              <li key={pet.id} className="border p-4 rounded shadow">
                {pet.image_url ? (
                  <img 
                    src={pet.image_url.startsWith('data:') ? pet.image_url : `http://localhost:8000${pet.image_url}`} 
                    alt={pet.name} 
                    className="w-full h-48 object-cover rounded mb-2" 
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500 rounded mb-2">
                    No image available
                  </div>
                )}
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold">{pet.name}</span>
                  <span className="text-sm italic">{pet.status}</span>
                </div>
                <div className="flex justify-between">
                  <button 
                    onClick={() => handleEditPet(pet)} 
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeletePet(pet.id)} 
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Visit Requests */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Visit Requests</h2>
        {visits.length === 0 ? (
          <p className="text-gray-600">No visit requests found.</p>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pet
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requester
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visits.map((visit) => {
                  const requestedDate = new Date(visit.requested_at);
                  const formattedDate = requestedDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  
                  return (
                    <tr key={visit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {visit.pet_image_url && (
                            <div className="flex-shrink-0 h-10 w-10">
                              <img 
                                className="h-10 w-10 rounded-full object-cover" 
                                src={visit.pet_image_url.startsWith('http') ? visit.pet_image_url : `http://localhost:8000${visit.pet_image_url}`} 
                                alt={visit.pet_name}
                              />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{visit.pet_name}</div>
                            <div className="text-sm text-gray-500">{visit.pet_breed}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{visit.user_name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{visit.user_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formattedDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={visit.status}
                          onChange={(e) => handleUpdateVisitStatus(visit.id, e.target.value)}
                          className={`px-2 py-1 text-xs font-semibold rounded-md border ${
                            visit.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                            visit.status === 'Confirmed' ? 'bg-green-100 text-green-800 border-green-300' :
                            'bg-red-100 text-red-800 border-red-300'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            // Show visit request details in a modal or expandable section
                            alert(`Visit Request Details:\n\n` +
                              `Pet: ${visit.pet_name}\n` +
                              `Requester: ${visit.user_name || 'N/A'}\n` +
                              `Email: ${visit.user_email}\n` +
                              `Requested: ${new Date(visit.requested_at).toLocaleString()}\n` +
                              `Status: ${visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}`);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
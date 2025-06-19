import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { petService } from '../services/petService';
import api from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

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
  const [visits, setVisits] = useState([]);
  const [pets, setPets] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const petsData = await petService.getPets(0, 100); 
        setPets(petsData.items || petsData); 
        
        const response = await api.get('/admin/visit-requests');
        console.log('Visit requests response:', response.data);
        
        if (response.data && response.data.length > 0) {
          console.log('First visit data:', response.data[0]);
          console.log('First visit pet data:', response.data[0].pet);
          console.log('First visit pet ID:', response.data[0].pet?.id);
          console.log('First visit pet photo URL:', response.data[0].pet?.photo_url);
          
          const petId = response.data[0].pet?.id;
          if (petId) {
            console.log('Constructed image URL:', `http://localhost:8000/api/pets/${petId}/photo`);
          }
        }
        
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
        status: formData.status || 'Available',
        ...(editId !== null && !formData.image && formData.existingImageUrl && { image_url: formData.existingImageUrl })
      };
      
      Object.keys(petData).forEach(key => {
        if (petData[key] === '' || petData[key] === undefined) {
          petData[key] = null;
        }
      });
      
      console.log('Prepared pet data:', JSON.stringify(petData, null, 2));

      console.log('Sending pet data:', petData);
      
      let response;
      if (editId !== null) {
        console.log(`Updating pet with ID: ${editId}`);
        try {
          response = await api.put(`/pets/${editId}`, petData);
          console.log('Update response:', response);
          
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
        console.log('Creating new pet');
        try {
          console.log('Creating pet with data:', petData);
          try {
            response = await api.post('/pets', petData);
            console.log('Create response:', response);
          } catch (createError) {
            console.error('Error creating pet:', createError);
            console.error('Response data:', createError.response?.data);
            throw createError;
          }
          
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

      const data = await petService.getPets(0, 100);
      setPets(data.items || data);
      
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
      alert('Failed to save pet. Please try again.');
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
      existingImageUrl: pet.image_url
    });
    setEditId(pet.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePet = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pet?')) return;
    
    try {
      setIsLoading(true);
      await api.delete(`/pets/${id}`);
      const data = await petService.getPets(0, 100);
      setPets(data.items || data);
      
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

  const handleViewDetails = (visit) => {
    setSelectedVisit(visit);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVisit(null);
  };

  const handleUpdateVisitStatus = async (id, newStatus) => {
    try {
      const loadingToast = toast.loading('Updating status...');
      
      await api.put(`/admin/visit-requests/${id}/status`, { status: newStatus });
      
      setVisits(prevVisits => 
        prevVisits.map(visit => 
          visit.id === id ? { ...visit, status: newStatus } : visit
        )
      );
      
      toast.dismiss(loadingToast);
      toast.success(`Status updated to ${newStatus}`, {
        style: {
          background: newStatus === 'Pending' ? '#FEF3C7' : 
                    newStatus === 'Confirmed' ? '#D1FAE5' : '#FEE2E2',
          color: newStatus === 'Pending' ? '#92400E' : 
                newStatus === 'Confirmed' ? '#065F46' : '#991B1B',
          border: `1px solid ${
            newStatus === 'Pending' ? '#F59E0B' : 
            newStatus === 'Confirmed' ? '#10B981' : '#EF4444'
          }`,
        },
        iconTheme: {
          primary: newStatus === 'Pending' ? '#F59E0B' : 
                  newStatus === 'Confirmed' ? '#10B981' : '#EF4444',
          secondary: 'white',
        },
      });
    } catch (err) {
      console.error(`Failed to update visit request status to ${newStatus}:`, err);
      toast.dismiss();
      toast.error(`Failed to update status: ${err.response?.data?.detail || 'Please try again'}`);
    }
  };

  const getImageUrl = (url, petId) => {
    if (!url && !petId) return null;
    
    if (petId) {
      return `http://localhost:8000/api/pets/${petId}/photo`;
    }
    
    if (url) {
      if (url.startsWith('http') || url.startsWith('data:')) {
        return url;
      }
      const cleanUrl = url.startsWith('/') ? url : `/${url}`;
      return `http://localhost:8000${cleanUrl}`;
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '8px',
            fontSize: '14px',
            maxWidth: '500px',
            padding: '12px 16px',
          },
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
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
                  file:bg-accent-blush file:text-primary-red
                  hover:file:bg-accent-blush/80"
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
                ? 'bg-primary-red/70 cursor-not-allowed' 
                : 'bg-primary-red hover:bg-primary-red-dark'
            } transition-colors`}
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
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-red"></div>
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
                <div className="relative">
                  {pet.id ? (
                    <>
                      <img 
                        src={getImageUrl(null, pet.id)} 
                        alt={pet.name} 
                        className="w-full h-48 object-cover rounded mb-2"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallback = e.target.nextElementSibling;
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden w-full h-48 bg-light-gray flex items-center justify-center text-medium-gray rounded mb-2">
                        No image available
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-48 bg-light-gray flex items-center justify-center text-medium-gray rounded mb-2">
                      No image available
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold">{pet.name}</span>
                  <span className="text-sm italic">{pet.status}</span>
                </div>
                <div className="flex justify-between">
                  <button 
                    onClick={() => handleEditPet(pet)} 
                    className="text-primary-red hover:text-primary-red-dark"
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
                  console.log('Visit object:', visit);
                  
                  const requestedDate = new Date(visit.requested_at);
                  const formattedDate = requestedDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  
                  const petName = visit.pet?.name || 'Unknown Pet';
                  const petBreed = visit.pet?.breed || 'Unknown Breed';
                  const userName = visit.user?.full_name || 'N/A';
                  const userEmail = visit.user?.email || 'No email';
                  
                  return (
                    <tr key={visit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img 
                              className="h-10 w-10 rounded-full object-cover" 
                              src={getImageUrl(null, visit.pet?.id)} 
                              alt={petName}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden h-10 w-10 rounded-full bg-light-gray flex items-center justify-center text-medium-gray text-xs">
                              No Image
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{petName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{userName}</div>
                        <div className="text-sm text-gray-500">{userEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formattedDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={visit.status}
                          onChange={(e) => handleUpdateVisitStatus(visit.id, e.target.value)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md border w-32 appearance-none pr-8 ${
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
                          onClick={() => handleViewDetails(visit)}
                          className="text-primary-red hover:text-primary-red-dark"
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

          {/* Visit Details Modal */}
          {isModalOpen && selectedVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium text-gray-900">Visit Request Details</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mt-6 space-y-4">
                <div className="border-b pb-4">
                  <h4 className="text-sm font-medium text-gray-500">Pet Information</h4>
                  <div className="mt-2 flex items-center">
                  <img 
                      src={getImageUrl(null, selectedVisit.pet?.id)}
                      alt={selectedVisit.pet?.name || 'Pet'} 
                      className="h-16 w-16 rounded-full object-cover mr-4"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = e.target.nextElementSibling;
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs mr-4">
                      No Image
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">{selectedVisit.pet?.name || 'Unknown Pet'}</p>
                    </div>
                  </div>
                </div>

                <div className="border-b pb-4">
                  <h4 className="text-sm font-medium text-gray-500">Requester Information</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-gray-900">{selectedVisit.user?.full_name || 'N/A'}</p>
                    <p className="text-gray-600">{selectedVisit.user?.email || 'No email'}</p>
                    {selectedVisit.user?.phone_number && (
                      <p className="text-gray-600">{selectedVisit.user.phone_number}</p>
                    )}
                  </div>
                </div>

                <div className="border-b pb-4">
                  <h4 className="text-sm font-medium text-gray-500">Visit Details</h4>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Requested</p>
                      <p className="text-gray-900">
                        {new Date(selectedVisit.requested_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedVisit.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedVisit.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedVisit.status}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedVisit.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Additional Notes</h4>
                    <p className="mt-2 text-gray-700 whitespace-pre-line">{selectedVisit.notes}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
          )}
        </div>
      </div>
    </div>
  );
}
// src/pages/AdminDashboard.jsx
import { useEffect, useState } from "react";

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

  useEffect(() => {
    setPets([]);
    setVisits([]);
  }, []);

  const handleInputChange = (e) => {
    const { name, type, value, checked, files } = e.target;
    const newValue = type === "checkbox" ? checked : files ? files[0] : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const isFormValid = () => {
    const requiredFields = [
      "name", "species", "breed", "age_group", "sex", "size",
      "energy_level", "experience_level", "hair_length", "shelter_notes", "status"
    ];
    return requiredFields.every((field) => formData[field] !== "") && (formData.image || editId !== null);
  };

  const handleAddPet = () => {
    if (!isFormValid()) {
      alert("Please fill out all fields and upload an image.");
      return;
    }

    if (editId !== null) {
      setPets((prev) =>
        prev.map((p) =>
          p.id === editId
            ? {
                ...formData,
                id: editId,
                imageUrl: formData.image ? URL.createObjectURL(formData.image) : p.imageUrl,
              }
            : p
        )
      );
      setEditId(null);
    } else {
      const newPet = {
        ...formData,
        id: Date.now(),
        imageUrl: URL.createObjectURL(formData.image),
      };
      setPets((prev) => [...prev, newPet]);
    }

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
    });
  };

  const handleDeletePet = (id) => {
    setPets((prev) => prev.filter((p) => p.id !== id));
  };

  const handleEditPet = (pet) => {
    setEditId(pet.id);
    setFormData({
      ...pet,
      image: null,
    });
  };

  const handleApproveVisit = (id) => {
    setVisits((prev) => prev.map((v) => (v.id === id ? { ...v, status: "Approved" } : v)));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

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
          <input type="file" name="image" onChange={handleInputChange} className="p-2 col-span-2" />

          <label><input type="checkbox" name="allergy_friendly" checked={formData.allergy_friendly} onChange={handleInputChange} /> Allergy Friendly</label>
          <label><input type="checkbox" name="special_needs" checked={formData.special_needs} onChange={handleInputChange} /> Special Needs</label>
          <label><input type="checkbox" name="kid_friendly" checked={formData.kid_friendly} onChange={handleInputChange} /> Kid Friendly</label>
          <label><input type="checkbox" name="pet_friendly" checked={formData.pet_friendly} onChange={handleInputChange} /> Pet Friendly</label>
          <select name="status" value={formData.status} onChange={handleInputChange} className="p-2 border rounded">
            {ENUMS.status.map((v) => <option key={v}>{v}</option>)}
          </select>
        </div>
        <button onClick={handleAddPet} className="bg-blue-600 text-white px-4 py-2 rounded">{editId !== null ? "Update Pet" : "Add Pet"}</button>

        <ul className="mt-6 grid grid-cols-2 gap-4">
          {pets.map((pet) => (
            <li key={pet.id} className="border p-4 rounded shadow">
              <img src={pet.imageUrl} alt={pet.name} className="w-full h-48 object-cover rounded mb-2" />
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold">{pet.name}</span>
                <span className="text-sm italic">{pet.status}</span>
              </div>
              <div className="flex justify-between">
                <button onClick={() => handleEditPet(pet)} className="text-blue-600">Edit</button>
                <button onClick={() => handleDeletePet(pet.id)} className="text-red-600">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Visit Requests */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Visit Requests</h2>
        {visits.length === 0 ? (
          <p>No visit requests yet.</p>
        ) : (
          <ul>
            {visits.map((visit) => (
              <li key={visit.id} className="mb-2 flex justify-between">
                <span>{visit.adopterName} requested to visit {visit.petName} on {visit.date} — Status: {visit.status}</span>
                {visit.status !== "Approved" && (
                  <button onClick={() => handleApproveVisit(visit.id)} className="text-green-600">Approve</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
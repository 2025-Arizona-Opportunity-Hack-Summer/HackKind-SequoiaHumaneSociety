import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../common/DataTable';
import PetItem from './PetItem';
import PetBulkActions from './PetBulkActions';

const PetList = ({
  pets = [],
  onDelete,
  onEdit,
  onBulkAction,
  isLoading = false,
  className = ''
}) => {
  const [selectedPets, setSelectedPets] = useState(new Set());
  const navigate = useNavigate();

  const toggleSelectAll = () => {
    if (selectedPets.size === pets.length) {
      setSelectedPets(new Set());
    } else {
      setSelectedPets(new Set(pets.map(pet => pet.id)));
    }
  };

  const toggleSelectPet = (petId, isSelected) => {
    const newSelection = new Set(selectedPets);
    if (isSelected) {
      newSelection.add(petId);
    } else {
      newSelection.delete(petId);
    }
    setSelectedPets(newSelection);
  };

  const handleBulkAction = async (action) => {
    if (onBulkAction) {
      await onBulkAction(Array.from(selectedPets), action);
      setSelectedPets(new Set());
    }
  };

  const columns = [
    { header: 'Pet', className: '' },
    { header: 'Details', className: '' },
    { header: 'Status', className: '' },
    { 
      header: (
        <input
          type="checkbox"
          checked={selectedPets.size > 0 && selectedPets.size === pets.length}
          onChange={toggleSelectAll}
          className="h-4 w-4 text-primary-red focus:ring-primary-red border-gray-300 rounded"
        />
      ),
      className: 'w-4'
    },
    { header: 'Actions', className: 'text-right' }
  ];

  return (
    <div className={className}>
      <PetBulkActions 
        selectedCount={selectedPets.size}
        onBulkAction={handleBulkAction}
      />
      
      <DataTable
        columns={columns}
        data={pets}
        isLoading={isLoading}
        emptyMessage="No pets found. Add your first pet!"
        renderRow={(pet) => (
          <PetItem
            key={pet.id}
            pet={pet}
            isSelected={selectedPets.has(pet.id)}
            onSelect={toggleSelectPet}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      />
    </div>
  );
};

export default PetList;

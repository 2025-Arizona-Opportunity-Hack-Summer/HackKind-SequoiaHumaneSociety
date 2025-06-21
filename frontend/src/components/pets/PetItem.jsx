import React from 'react';
import StatusBadge from '../common/StatusBadge';
import ActionButtons from '../common/ActionButtons';

const PetItem = ({
  pet,
  isSelected = false,
  onSelect = () => {},
  onEdit = null,
  onDelete = null,
  showCheckbox = true
}) => {
  const createdDate = pet.created_at ? new Date(pet.created_at) : new Date();
  const formattedDate = createdDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getImageUrl = (image, id) => {
    // If we have a direct image URL, return it
    if (image) return image;
    
    // If pet has an image_url, use it
    if (pet.image_url) return pet.image_url;
    
    // Fallback to placeholder based on pet species
    return `https://source.unsplash.com/featured/200x200/?${pet.species?.toLowerCase() || 'pet'},animal&id=${id}`;
  };

  return (
    <>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <img 
              className="h-10 w-10 rounded-full object-cover" 
              src={getImageUrl(pet.image, pet.id)} 
              alt={pet.name}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling?.classList.remove('hidden');
              }}
              loading="lazy"
            />
            <div className="hidden h-10 w-10 rounded-full bg-light-gray flex items-center justify-center text-medium-gray text-xs">
              No Image
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{pet.name}</div>
            <div className="text-sm text-gray-500">{pet.species}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">Added {formattedDate}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={pet.status} />
      </td>
      {showCheckbox && (
        <td className="px-6 py-4 whitespace-nowrap">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(pet.id, !isSelected)}
            className="h-4 w-4 text-primary-red focus:ring-primary-red border-gray-300 rounded"
          />
        </td>
      )}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <ActionButtons
          onEdit={onEdit ? () => onEdit(pet) : null}
          onDelete={onDelete ? () => onDelete(pet.id) : null}
        />
      </td>
    </>
  );
};

export default PetItem;

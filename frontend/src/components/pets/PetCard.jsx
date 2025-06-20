import { useState } from 'react';
import { FaEnvelope, FaWhatsapp, FaLink, FaComment } from 'react-icons/fa';

const getBadgeColor = (label, value) => {
  if (typeof value === 'boolean') {
    return value 
      ? 'bg-green-50 text-green-700 border-green-100' 
      : 'bg-red-50 text-red-700 border-red-100';
  }
  
  const colorMap = {
    species: 'bg-purple-50 text-purple-700 border-purple-100',
    breed: 'bg-blue-50 text-blue-700 border-blue-100',
    age: 'bg-amber-50 text-amber-700 border-amber-100',
    age_group: 'bg-amber-50 text-amber-700 border-amber-100',
    energy: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
    energy_level: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
    coat: 'bg-teal-50 text-teal-700 border-teal-100',
    hair_length: 'bg-teal-50 text-teal-700 border-teal-100',
    'exp level': 'bg-indigo-50 text-indigo-700 border-indigo-100',
    experience_level: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    sex: 'bg-pink-50 text-pink-700 border-pink-100',
    size: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    training: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    training_traits: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    default: 'bg-gray-50 text-gray-700 border-gray-100'
  };
  
  return colorMap[label.toLowerCase()] || colorMap.default;
};

const SocialShare = ({ pet }) => {
  const petUrl = `${window.location.origin}/pets/${pet.id}`;
  const shareText = `Check out ${pet.name || 'this adorable pet'} at Sequoia Humane Society!`;
  const shareImage = pet.primary_photo_url;

  const copyToClipboard = async (e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    try {
      await navigator.clipboard.writeText(petUrl);
    } catch (err) {
      console.error('Failed to copy link: ', err);
    }
  };

  const shareOnPlatform = (platform, e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    e.preventDefault();  // Prevent any default behavior
    
    let url = '';
    
    switch(platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${petUrl}`)}`;
        window.open(url, '_blank', 'width=600,height=400');
        break;
      case 'email':
        const subject = `Check out ${pet.name || 'this pet'} for adoption!`;
        const body = `${shareText}\n\n${petUrl}`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        break;
      case 'sms':
        const smsBody = `${shareText} ${petUrl}`;
        window.location.href = `sms:?&body=${encodeURIComponent(smsBody)}`;
        break;
      default:
        return;
    }
  };

  // Check if device is mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return (
    <div className="flex items-center justify-center space-x-2 mt-3 pt-3 border-t border-gray-100">
      <button 
        onClick={(e) => shareOnPlatform('whatsapp', e)}
        className="p-2 rounded-full hover:bg-red-100 text-red-500 transition-colors"
        aria-label="Share on WhatsApp"
      >
        <FaWhatsapp size={18} />
      </button>
      {isMobile && (
        <button 
          onClick={(e) => shareOnPlatform('sms', e)}
          className="p-2 rounded-full hover:bg-red-100 text-red-500 transition-colors"
          aria-label="Share via SMS"
        >
          <FaComment size={18} />
        </button>
      )}
      <button 
        onClick={(e) => shareOnPlatform('email', e)}
        className="p-2 rounded-full hover:bg-red-100 text-red-500 transition-colors"
        aria-label="Share via Email"
      >
        <FaEnvelope size={18} />
      </button>
      <button 
        onClick={copyToClipboard}
        className="p-2 rounded-full hover:bg-red-100 text-red-500 transition-colors"
        aria-label="Copy link to clipboard"
      >
        <FaLink size={16} />
      </button>
    </div>
  );
};

const PetCard = ({ pet, onSelect, isSelected, isRequested }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  
  const renderBadge = (label, value, customColor) => {
    if (value === undefined || value === null || value === '') return null;
    
    let icon = null;
    let displayValue = typeof value === 'boolean' ? '' : value;
    
    if (typeof value === 'boolean') {
      if (value) {
        icon = (
          <svg className="w-3 h-3 ml-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        );
      } else {
        icon = (
          <svg className="w-3 h-3 ml-1 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      }
    }
    
    const colorClass = customColor || getBadgeColor(label, value);
    
    return (
      <span 
        key={`${label}-${value}`}
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${colorClass} mr-2 mb-2`}
      >
        <span className="font-semibold">{label}</span>{displayValue && ': ' + displayValue} {icon}
      </span>
    );
  };
  
  const generatePrimaryBadges = () => {
    const primaryBadges = [
      { label: 'Species', value: pet.species },
      { label: 'Breed', value: pet.breed },
      { label: 'Age', value: pet.age_group },
      { label: 'Sex', value: pet.sex },
      { label: 'Size', value: pet.size },
      { label: 'Energy', value: pet.energy_level },
      { label: 'Coat', value: pet.hair_length },
      { label: 'Exp Level', value: pet.experience_level }
    ];
    
    return primaryBadges
      .filter(badge => badge.value !== undefined && badge.value !== null && badge.value !== '')
      .map(({ label, value, color }) => renderBadge(label, value, color));
  };

  const generateAdditionalBadges = () => {
    const booleanBadges = [
      { label: 'Allergy Friendly', value: pet.allergy_friendly },
      { label: 'Kid Friendly', value: pet.kid_friendly },
      { label: 'Pet Friendly', value: pet.pet_friendly },
      { label: 'Special Needs', value: pet.special_needs }
    ].filter(badge => badge.value !== undefined);

    const trainingBadges = pet.training_traits?.map(trait => ({
      label: trait.replace(/([A-Z])/g, ' $1').trim(),
      value: true,
      color: 'bg-green-50 text-green-700 border-green-100'
    })) || [];
    
    const allAdditionalBadges = [
      ...booleanBadges,
      ...trainingBadges
    ];
    
    return allAdditionalBadges.map(({ label, value, color }) => 
      renderBadge(label, value, color)
    );
  };
  
  const hasAdditionalBadges = 
    (pet.allergy_friendly !== undefined ||
     pet.kid_friendly !== undefined ||
     pet.pet_friendly !== undefined ||
     pet.special_needs !== undefined ||
     (pet.training_traits && pet.training_traits.length > 0));
  
  return (
    <div 
      className={`relative bg-white rounded-xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1 ${
        isSelected 
          ? 'ring-2 ring-red-500 shadow-lg' 
          : 'border border-gray-100 hover:shadow-lg hover:border-gray-200'
      } ${isRequested ? 'opacity-80' : 'hover:opacity-95'}`}
      onClick={() => onSelect(pet)}
      style={{
        boxShadow: isSelected ? '0 10px 25px -5px rgba(99, 102, 241, 0.1), 0 10px 10px -5px rgba(99, 102, 241, 0.04)' : 'none'
      }}
    >
      {isRequested && (
        <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full z-10 flex items-center shadow-md">
          <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Visit Scheduled
        </div>
      )}
      
      <div className="relative h-56 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse"></div>
        )}
        {pet.image_url ? (
          <img 
            src={pet.image_url} 
            alt={pet.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
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
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800 group-hover:text-red-600 transition-colors">
              {pet.name}
            </h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <span className="capitalize">{pet.species}</span>
              {pet.breed && (
                <>
                  <span className="mx-1.5">•</span>
                  <span>{pet.breed}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {pet.special_needs && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                Special Needs
              </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {generatePrimaryBadges()}
        </div>
        
        {hasAdditionalBadges && (
          <>
            <div className={`overflow-hidden transition-all duration-300 ${showMoreInfo ? 'max-h-96' : 'max-h-0'}`}>
              <div className="flex flex-wrap gap-2 mb-3">
                {generateAdditionalBadges()}
              </div>
            </div>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowMoreInfo(!showMoreInfo);
              }}
              className="text-xs font-medium text-red-600 hover:text-red-800 flex items-center"
            >
              {showMoreInfo ? 'Show less' : 'Show more'}
              <svg 
                className={`w-3 h-3 ml-1 transition-transform duration-200 ${showMoreInfo ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </>
        )}
        
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            {pet.shelter_notes || 'No additional notes available for this pet.'}
          </p>
          <SocialShare pet={pet} />
        </div>
      </div>
    </div>
  );
};

export default PetCard;

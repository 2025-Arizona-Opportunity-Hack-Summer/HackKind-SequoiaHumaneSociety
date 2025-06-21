import React, { useState } from 'react';
import ConfirmationModal from '../common/ConfirmationModal';

const PetBulkActions = ({
  selectedCount,
  onBulkAction,
  className = ''
}) => {
  const [showModal, setShowModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleActionSelect = (e) => {
    const action = e.target.value;
    if (action) {
      setBulkAction(action);
      setShowModal(true);
    }
  };

  const handleConfirm = async () => {
    if (!bulkAction) return;
    
    setIsProcessing(true);
    try {
      await onBulkAction(bulkAction);
    } finally {
      setIsProcessing(false);
      setShowModal(false);
      setBulkAction('');
    }
  };

  if (selectedCount === 0) return null;

  const actionMessages = {
    'delete': {
      title: 'Delete Selected Pets',
      message: `Are you sure you want to delete ${selectedCount} selected pet(s)? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger'
    },
    'available': {
      title: 'Update Status',
      message: `Mark ${selectedCount} selected pet(s) as Available?`,
      confirmText: 'Update Status',
      variant: 'primary'
    },
    'adopted': {
      title: 'Update Status',
      message: `Mark ${selectedCount} selected pet(s) as Adopted?`,
      confirmText: 'Update Status',
      variant: 'primary'
    },
    'pending': {
      title: 'Update Status',
      message: `Mark ${selectedCount} selected pet(s) as Pending?`,
      confirmText: 'Update Status',
      variant: 'primary'
    }
  };

  const currentAction = actionMessages[bulkAction] || {
    title: 'Confirm Action',
    message: `Are you sure you want to perform this action on ${selectedCount} selected pet(s)?`,
    confirmText: 'Confirm',
    variant: 'primary'
  };

  return (
    <div className={`flex items-center space-x-4 mb-4 ${className}`}>
      <div className="text-sm text-gray-600">
        {selectedCount} pet{selectedCount !== 1 ? 's' : ''} selected
      </div>
      <div className="relative">
        <select
          value=""
          onChange={handleActionSelect}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-red focus:border-primary-red sm:text-sm rounded-md"
        >
          <option value="">Bulk Actions</option>
          <option value="available">Mark as Available</option>
          <option value="adopted">Mark as Adopted</option>
          <option value="pending">Mark as Pending</option>
          <option value="delete">Delete Selected</option>
        </select>
      </div>

      <ConfirmationModal
        isOpen={showModal}
        onClose={() => !isProcessing && setShowModal(false)}
        onConfirm={handleConfirm}
        title={currentAction.title}
        message={currentAction.message}
        confirmText={currentAction.confirmText}
        isProcessing={isProcessing}
        confirmButtonVariant={currentAction.variant}
      />
    </div>
  );
};

export default PetBulkActions;

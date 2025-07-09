import React, { useState } from 'react';
import { visitService } from '../../services/visitService';
import ConfirmationModal from '../common/ConfirmationModal';
import { toast } from 'react-toastify';

const VisitBulkActions = ({
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
      if (bulkAction === 'delete') {
        await onBulkAction('delete');
      } else {
        // Handle status updates
        const result = await onBulkAction(bulkAction);
        if (result && result.success) {
          toast.success(`Successfully updated ${result.results.length} visit(s)`);
        } else if (result) {
          const failedCount = result.results.filter(r => !r.success).length;
          if (failedCount > 0) {
            toast.warning(`Failed to update ${failedCount} visit(s)`);
          }
        }
      }
    } catch (error) {
      toast.error('An error occurred while processing your request');
    } finally {
      setIsProcessing(false);
      setShowModal(false);
      setBulkAction('');
    }
  };

  if (selectedCount === 0) return null;

  const actionMessages = {
    'delete': {
      title: 'Delete Selected Visits',
      message: `Are you sure you want to delete ${selectedCount} selected visit request(s)? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
      isStatusUpdate: false
    },
    'confirmed': {
      title: 'Confirm Visits',
      message: `Mark ${selectedCount} selected visit request(s) as Confirmed?`,
      confirmText: 'Confirm',
      variant: 'primary',
      isStatusUpdate: true
    },
    'cancelled': {
      title: 'Cancel Visits',
      message: `Mark ${selectedCount} selected visit request(s) as Cancelled?`,
      confirmText: 'Cancel Visits',
      variant: 'danger',
      isStatusUpdate: true
    },
    'pending': {
      title: 'Reset to Pending',
      message: `Mark ${selectedCount} selected visit request(s) as Pending?`,
      confirmText: 'Update Status',
      variant: 'primary',
      isStatusUpdate: true
    }
  };

  const currentAction = actionMessages[bulkAction] || {
    title: 'Confirm Action',
    message: `Are you sure you want to perform this action on ${selectedCount} selected visit request(s)?`,
    confirmText: 'Confirm',
    variant: 'primary'
  };

  return (
    <div className={`flex items-center space-x-4 mb-4 ${className}`}>
      <div className="text-sm text-gray-600">
        {selectedCount} request{selectedCount !== 1 ? 's' : ''} selected
      </div>
      <div className="relative">
        <select
          value=""
          onChange={handleActionSelect}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-red focus:border-primary-red sm:text-sm rounded-md"
          disabled={isProcessing}
        >
          <option value="">Bulk Actions</option>
          <option value="confirmed">Mark as Confirmed</option>
          <option value="cancelled">Mark as Cancelled</option>
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

export default VisitBulkActions;

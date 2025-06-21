import React from 'react';

const ActionButtons = ({ 
  onEdit, 
  onDelete, 
  editLabel = 'Edit', 
  deleteLabel = 'Delete',
  className = ''
}) => {
  return (
    <div className={`flex justify-end space-x-6 ${className}`}>
      {onEdit && (
        <button
          onClick={onEdit}
          className="text-primary-red hover:text-primary-red-dark px-2"
        >
          {editLabel}
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-800 px-2"
        >
          {deleteLabel}
        </button>
      )}
    </div>
  );
};

export default ActionButtons;

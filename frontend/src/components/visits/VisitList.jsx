import React, { useState } from 'react';
import DataTable from '../common/DataTable';
import VisitItem from './VisitItem';
import VisitBulkActions from './VisitBulkActions';

const VisitList = ({
  visits = [],
  onEdit,
  onDelete,
  onBulkAction,
  onStatusUpdate,
  isLoading = false,
  className = ''
}) => {
  const [selectedVisits, setSelectedVisits] = useState(new Set());

  const toggleSelectAll = () => {
    if (selectedVisits.size === visits.length) {
      setSelectedVisits(new Set());
    } else {
      const allVisitIds = visits.map(visit => visit._id || visit.id);
      setSelectedVisits(new Set(allVisitIds));
    }
  };

  const toggleSelectVisit = (visitId, isSelected) => {
    const newSelection = new Set(selectedVisits);
    if (isSelected) {
      newSelection.add(visitId);
    } else {
      newSelection.delete(visitId);
    }
    setSelectedVisits(newSelection);
    
    // Log the current selection for debugging
    console.log('Selected visits:', Array.from(newSelection));
  };

  const handleBulkAction = async (action) => {
    if (!onBulkAction || selectedVisits.size === 0) {
      console.log('No action or no items selected');
      return;
    }
    
    try {
      console.log(`Executing bulk action '${action}' on visits:`, Array.from(selectedVisits));
      await onBulkAction(Array.from(selectedVisits), action);
      setSelectedVisits(new Set());
    } catch (error) {
      console.error('Error in bulk action:', error);
    }
  };

  const columns = [
    { header: 'Pet', className: 'w-1/5 min-w-[200px]' },
    { header: 'Requester', className: 'w-2/5 min-w-[250px]' },
    { header: 'Requested Date', className: 'w-1/5 min-w-[200px]' },
    { header: 'Status', className: 'w-[100px]' },
    { 
      header: (
        <input
          type="checkbox"
          checked={selectedVisits.size > 0 && selectedVisits.size === visits.length}
          onChange={toggleSelectAll}
          className="h-4 w-4 text-primary-red focus:ring-primary-red border-gray-300 rounded"
        />
      ),
      className: 'w-12 px-2'
    },
    { header: 'Actions', className: 'w-[100px] text-right' }
  ];

  return (
    <div className={className}>
      <VisitBulkActions 
        selectedCount={selectedVisits.size}
        onBulkAction={handleBulkAction}
      />
      
      <DataTable
        columns={columns}
        data={visits}
        isLoading={isLoading}
        emptyMessage="No visit requests found."
        renderRow={(visit) => (
          <VisitItem
            key={visit._id || visit.id}
            visit={visit}
            isSelected={selectedVisits.has(visit._id || visit.id)}
            onSelect={toggleSelectVisit}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusUpdate={onStatusUpdate}
          />
        )}
      />
    </div>
  );
};

export default VisitList;

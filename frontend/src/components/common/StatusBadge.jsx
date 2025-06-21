import React from 'react';

const statusColors = {
  'available': 'bg-green-100 text-green-800',
  'adopted': 'bg-purple-100 text-purple-800',
  'pending': 'bg-yellow-100 text-yellow-800',
  'adoption pending': 'bg-yellow-100 text-yellow-800',
  'adoption approved': 'bg-green-100 text-green-800',
  'adoption rejected': 'bg-red-100 text-red-800',
  'adoption in progress': 'bg-blue-100 text-blue-800',
  'confirmed': 'bg-green-100 text-green-800',
  'cancelled': 'bg-red-100 text-red-800',
  'pending approval': 'bg-yellow-100 text-yellow-800',
  'default': 'bg-gray-100 text-gray-800'
};

const StatusBadge = ({ status, className = '' }) => {
  const statusKey = status?.toLowerCase() || 'default';
  const colorClass = statusColors[statusKey] || statusColors['default'];
  
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}
    >
      {status || 'Unknown'}
    </span>
  );
};

export default StatusBadge;

import React from 'react';
import PropTypes from 'prop-types';

/**
 * LoadingSpinner component that shows a loading animation
 * @param {Object} props - Component props
 * @param {string} [props.size='medium'] - Size of the spinner (small, medium, large)
 * @param {string} [props.color='text-blue-600'] - Tailwind color class for the spinner
 * @param {string} [props.className=''] - Additional CSS classes
 * @returns {JSX.Element} Loading spinner component
 */
const LoadingSpinner = ({ size = 'medium', color = 'text-blue-600', className = '' }) => {
  const sizeClasses = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-2',
    large: 'h-12 w-12 border-4',
  };

  return (
    <div className={`inline-block ${className}`} role="status">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} ${color} border-t-transparent`}
        aria-hidden="true"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  color: PropTypes.string,
  className: PropTypes.string,
};

export default LoadingSpinner;

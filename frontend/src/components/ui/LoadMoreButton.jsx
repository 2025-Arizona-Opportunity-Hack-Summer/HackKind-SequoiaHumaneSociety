import PropTypes from 'prop-types';

const LoadMoreButton = ({ 
  onClick, 
  isLoading, 
  hasMore, 
  loadingText = 'Loading...',
  buttonText = 'Load More',
  className = '' 
}) => {
  if (!hasMore) return null;

  return (
    <div className={`mt-10 text-center ${className}`}>
      <button
        onClick={onClick}
        disabled={isLoading}
        className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
          isLoading ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'
        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {loadingText}
          </>
        ) : (
          buttonText
        )}
      </button>
    </div>
  );
};

LoadMoreButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  hasMore: PropTypes.bool.isRequired,
  loadingText: PropTypes.string,
  buttonText: PropTypes.string,
  className: PropTypes.string
};

export default LoadMoreButton;

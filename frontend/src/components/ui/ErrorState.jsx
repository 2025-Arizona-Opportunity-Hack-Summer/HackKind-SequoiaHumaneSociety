import PropTypes from 'prop-types';

const ErrorState = ({ 
  error, 
  onRetry, 
  actionLabel = 'Try Again',
  actionHref,
  className = '' 
}) => {
  return (
    <div className={`text-center p-8 max-w-2xl mx-auto bg-white rounded-lg shadow ${className}`}>
      <div className="text-red-500 mb-6 text-lg">{error}</div>
      {actionHref ? (
        <a 
          href={actionHref}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          {actionLabel}
        </a>
      ) : (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

ErrorState.propTypes = {
  error: PropTypes.string.isRequired,
  onRetry: PropTypes.func,
  actionLabel: PropTypes.string,
  actionHref: PropTypes.string,
  className: PropTypes.string
};

export default ErrorState;

import PropTypes from 'prop-types';

const MatchResultsHeader = ({ title, subtitle, className = '' }) => {
  return (
    <div className={`text-center mb-12 ${className}`}>
      <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
          {subtitle}
        </p>
      )}
    </div>
  );
};

MatchResultsHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  className: PropTypes.string
};

export default MatchResultsHeader;

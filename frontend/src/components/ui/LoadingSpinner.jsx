const LoadingSpinner = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} border-t-4 border-b-4 border-red-500`}
      ></div>
    </div>
  );
};

export default LoadingSpinner;

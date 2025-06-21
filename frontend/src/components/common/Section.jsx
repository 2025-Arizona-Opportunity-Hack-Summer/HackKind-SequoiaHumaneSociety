import React from 'react';

const Section = ({
  title,
  children,
  actions,
  className = '',
  titleClassName = '',
  contentClassName = ''
}) => {
  return (
    <div className={`bg-white shadow rounded-lg p-6 mb-8 ${className}`}>
      <div className="border-b border-gray-200 pb-5 mb-6">
        <div className="flex items-center justify-between flex-wrap sm:flex-nowrap">
          <div className="mt-2">
            <h3 className={`text-lg leading-6 font-medium text-gray-900 ${titleClassName}`}>
              {title}
            </h3>
          </div>
          {actions && (
            <div className="mt-0 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
      <div className={contentClassName}>
        {children}
      </div>
    </div>
  );
};

export default Section;

import React from 'react';

const DataTable = ({
  columns = [],
  data = [],
  renderRow,
  emptyMessage = 'No data available',
  className = '',
  headerClassName = 'bg-gray-50',
  rowClassName = '',
  isLoading = false,
  loadingComponent = <LoadingSpinner />
}) => {
  if (isLoading) {
    return loadingComponent;
  }

  if (data.length === 0) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <p className="text-gray-600 text-center">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shadow border-b border-gray-200 sm:rounded-lg overflow-hidden">
      <div className="w-full">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className={headerClassName}>
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''} whitespace-nowrap`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, rowIndex) => (
              <tr key={item.id || rowIndex} className={typeof rowClassName === 'function' ? rowClassName(item) : rowClassName}>
                {renderRow(item, rowIndex)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-red"></div>
  </div>
);

export default DataTable;

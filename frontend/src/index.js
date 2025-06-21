import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import './index.css';
import App from './App';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl w-full">
        <h2 className="text-xl font-bold text-red-800 mb-2">Something went wrong</h2>
        <pre className="text-red-700 bg-red-100 p-4 rounded overflow-auto text-sm mb-4">
          {error.message}
        </pre>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
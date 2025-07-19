import React from 'react';

function ErrorMessage({ message, onRetry }) {
  return (
    <div className="bg-red-100 text-red-700 p-4 rounded mb-4 flex flex-col items-center">
      <span>{message}</span>
      {onRetry && (
        <button className="mt-2 bg-red-500 text-white px-4 py-2 rounded" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export default ErrorMessage; 
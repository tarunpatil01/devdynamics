import React, { useEffect } from 'react';

const Toast = ({ message, type = 'info', onClose, timeout = 3000 }) => {
  if (!message) return null;
  const color = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500';

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, timeout);
    return () => clearTimeout(timer);
  }, [message, onClose, timeout]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-2 rounded text-white shadow-lg ${color}`}
      role="alert"
      aria-live="assertive"
      tabIndex={0}
      style={{
        minWidth: '220px',
        opacity: 1,
        animation: 'fadeIn 0.4s',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        transition: 'opacity 0.3s',
      }}
    >
      <span className="mr-2 align-middle">{message}</span>
      <button
        className="ml-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-white rounded"
        onClick={onClose}
        aria-label="Close notification"
        tabIndex={0}
        style={{ fontSize: '1.25rem', lineHeight: '1', padding: '0 0.5rem' }}
      >×</button>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Toast;

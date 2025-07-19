import { useState } from 'react';

export default function useToast(timeout = 3000) {
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'info' }), timeout);
  };

  const closeToast = () => setToast({ message: '', type: 'info' });

  return { toast, showToast, closeToast };
}

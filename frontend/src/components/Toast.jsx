import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toastData, setToastData] = useState({ visible: false, message: '' });
  const timerRef = useRef(null);

  const showToast = useCallback((message, duration = 1800) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToastData({ visible: true, message });
    timerRef.current = setTimeout(() => {
      setToastData({ visible: false, message: '' });
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ toast: showToast }}>
      {children}
      <div id="toast" className={toastData.visible ? 'show' : ''}>
        {toastData.message}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

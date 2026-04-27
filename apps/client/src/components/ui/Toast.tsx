import { useEffect } from 'react';

interface ToastProps {
  kind: 'info' | 'warn' | 'error';
  message: string;
  onClose: () => void;
}

const COLORS = {
  info: 'bg-green-600 border-green-400',
  warn: 'bg-yellow-600 border-yellow-400',
  error: 'bg-red-700 border-red-400',
};

export default function Toast({ kind, message, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div
        className={`${COLORS[kind]} border-2 text-white font-body font-bold
                    px-6 py-3 rounded-2xl shadow-2xl cursor-pointer animate-fade-in`}
        onClick={onClose}
      >
        {message}
      </div>
    </div>
  );
}

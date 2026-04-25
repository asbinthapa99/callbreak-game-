import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -40, opacity: 0 }}
        className={`${COLORS[kind]} border-2 text-white font-body font-bold
                    px-6 py-3 rounded-2xl shadow-2xl cursor-pointer`}
        onClick={onClose}
      >
        {message}
      </motion.div>
    </div>
  );
}

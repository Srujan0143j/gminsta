import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, children, title }) => {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal content */}
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-premium-darkCard border border-neutral-100 dark:border-premium-darkBorder shadow-2xl z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-premium-darkBorder px-6 py-4">
              <h3 className="font-semibold text-lg text-neutral-800 dark:text-neutral-100">
                {title || ''}
              </h3>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 hover:bg-neutral-100 dark:hover:bg-premium-darkBorder text-neutral-500 dark:text-neutral-400 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-premium-darkBorder">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;

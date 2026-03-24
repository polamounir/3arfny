'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  variant = 'info',
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md glass-card border border-white/10 p-0 overflow-hidden"
          >
            {/* Header Accent */}
            <div className={`h-1.5 w-full ${variant === 'danger' ? 'bg-red-500' : 'bg-neon-blue'}`} />
            
            <div className="p-8">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl shrink-0 ${variant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-neon-blue/10 text-neon-blue'}`}>
                  {variant === 'danger' ? <AlertTriangle size={24} /> : <Info size={24} />}
                </div>
                
                <div className="space-y-2 text-right">
                  <h3 className="text-xl font-black text-white">{title}</h3>
                  <p className="text-white/60 leading-relaxed text-sm">
                    {message}
                  </p>
                </div>

                <button 
                  onClick={onClose}
                  className="p-1 text-white/20 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    variant === 'danger' 
                      ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
                      : 'bg-white text-black'
                  }`}
                >
                  {confirmText}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
                >
                  {cancelText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

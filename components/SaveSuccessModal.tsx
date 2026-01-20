import React from 'react';
import { CheckCircle, X, FileText, Calendar } from 'lucide-react';

interface SaveSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  calcNumber: string;
  revision?: string;
  type: string; // e.g. "Machining Cost Sheet"
}

export const SaveSuccessModal: React.FC<SaveSuccessModalProps> = ({ 
  isOpen, 
  onClose, 
  calcNumber, 
  revision = "0", 
  type 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-slate-700 p-6 relative neon-hover transform transition-all scale-100">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-2 shadow-lg shadow-green-500/20">
            <CheckCircle className="w-8 h-8" />
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Saved Successfully!</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{type} has been updated.</p>
          </div>

          <div className="w-full bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-700 flex flex-col gap-3">
             <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Calculation #</span>
                <span className="font-mono font-bold text-slate-800 dark:text-white text-lg">{calcNumber}</span>
             </div>
             <div className="h-px bg-slate-200 dark:bg-slate-700 w-full"></div>
             <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Revision</span>
                <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded text-sm font-bold">
                  {revision}
                </span>
             </div>
             <div className="flex justify-between items-center mt-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                   <Calendar className="w-3 h-3" />
                   {new Date().toLocaleDateString()}
                </span>
             </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold py-3 rounded-xl transition-colors shadow-lg"
          >
            Continue Working
          </button>
        </div>
      </div>
    </div>
  );
};

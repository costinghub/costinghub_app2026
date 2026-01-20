
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { AuthService } from '../services/mockSupabase';

export const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await AuthService.resetPassword(email);
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4 relative">
      {/* Top Left Logo Branding */}
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <div className="flex flex-col justify-center">
          <div className="text-xl font-bold leading-none">
            <span className="text-slate-900 dark:text-white">Costing</span>
            <span className="text-purple-600 dark:text-purple-400">Hub</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-slate-700 mt-12 md:mt-0">
        <Link to="/login" className="flex items-center text-sm text-slate-500 hover:text-primary-600 mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
        </Link>

        <div className="flex justify-center mb-6">
          <div className="bg-orange-100 p-3 rounded-full text-orange-600">
            <KeyRound className="w-8 h-8" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-2">Reset Password</h2>
        
        {!sent ? (
          <>
            <p className="text-center text-slate-500 mb-6">Enter your email to receive reset instructions.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input 
                required type="email" 
                placeholder="name@company.com"
                className="w-full px-4 py-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                onChange={e => setEmail(e.target.value)}
              />
              <button 
                type="submit" 
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg"
              >
                Send Reset Link
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <p className="text-green-600 font-medium mb-4">Check your email!</p>
            <p className="text-slate-500 text-sm">We have sent password recovery instructions to {email}.</p>
          </div>
        )}
      </div>
    </div>
  );
};

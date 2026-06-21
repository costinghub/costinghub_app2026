
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Loader2, Lock, User } from 'lucide-react';
import { AuthService } from '../services/supabaseService';
import { UserRole } from '../types';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { user, mfaRequired } = await AuthService.login(email.trim().toLowerCase(), password);
      
      if (mfaRequired) {
        // Redirect to MFA verification page
        navigate('/mfa');
      } else {
        // Direct access for users without MFA
        if (user.role === UserRole.SUPER_ADMIN) {
          navigate('/super-admin'); 
        } else {
          navigate('/dashboard'); 
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4 relative">
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <div className="flex flex-col justify-center">
          <div className="text-xl font-bold leading-none">
            <span className="text-slate-900 dark:text-white">Costing</span>
            <span className="text-purple-600 dark:text-purple-400">Hub</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-slate-700">
        <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-2 tracking-tight">Welcome Back</h2>
        <p className="text-center text-slate-500 mb-8 text-sm font-medium">Sign in to your account</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-600 text-sm animate-in shake-in duration-200">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
            <div className="relative">
              <input type="email" required placeholder="user@enterprise.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none" />
              <User className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5 ml-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
            </div>
            <div className="relative">
              <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none" />
              <Lock className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-primary-500/20 flex justify-center items-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500 font-medium">
          Need an account? <Link to="/signup" className="text-primary-600 hover:text-primary-700 font-bold ml-1">Join Now</Link>
        </div>
      </div>
    </div>
  );
};

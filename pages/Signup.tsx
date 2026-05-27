
import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertTriangle, Loader2, User, Building2, Mail, Lock, Check, X } from 'lucide-react';
import { AuthService } from '../services/supabaseService';

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', company: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordRequirements = useMemo(() => {
    const p = formData.password;
    return [
      { id: 'length', label: 'At least 8 characters', met: p.length >= 8 },
      { id: 'uppercase', label: 'One uppercase letter', met: /[A-Z]/.test(p) },
      { id: 'lowercase', label: 'One lowercase letter', met: /[a-z]/.test(p) },
      { id: 'number', label: 'One number', met: /[0-9]/.test(p) },
      { id: 'special', label: 'One special character', met: /[^A-Za-z0-9]/.test(p) },
    ];
  }, [formData.password]);

  const isPasswordValid = passwordRequirements.every(r => r.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await AuthService.signup(formData.name, formData.email, formData.company, formData.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again later.');
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

      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-slate-700 mt-12 md:mt-0">
        <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-2 tracking-tight">Create Account</h2>
        <p className="text-center text-slate-500 mb-8 text-sm font-medium">Join the precision cost engine</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-600 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
            <div className="relative">
              <input required type="text" placeholder="John Doe" className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none" onChange={e => setFormData({...formData, name: e.target.value})} />
              <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Organization</label>
            <div className="relative">
              <input required type="text" placeholder="Company Name" className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none" onChange={e => setFormData({...formData, company: e.target.value})} />
              <Building2 className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Work Email</label>
            <div className="relative">
              <input required type="email" placeholder="name@company.com" className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none" onChange={e => setFormData({...formData, email: e.target.value})} />
              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
            <div className="relative">
              <input required type="password" placeholder="Create a password" className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <button type="submit" disabled={loading || !isPasswordValid} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-primary-500/20 flex justify-center items-center gap-2 mt-4 disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-slate-500">
          Already have an account? <Link to="/login" className="text-primary-600 hover:text-primary-700 font-bold ml-1">Log In</Link>
        </div>
      </div>
    </div>
  );
};

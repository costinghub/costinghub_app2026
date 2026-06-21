
import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { localDb } from '../services/localDbService';

// Fix: Declared global mixpanel type to resolve TS errors
declare global {
  interface Window {
    mixpanel: any;
  }
}

interface AuthPageProps {
  successMessage?: string | null;
  setSuccessMessage?: (message: string | null) => void;
  onAuthSuccess?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ successMessage, setSuccessMessage, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(window.location.pathname !== '/signup');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setIsLogin(window.location.pathname !== '/signup');
  }, []);

  const clearMessages = () => {
    if (setSuccessMessage) setSuccessMessage(null);
    setError('');
  }
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearMessages();
    setName(e.target.value);
  };
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearMessages();
    setEmail(e.target.value);
  };
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearMessages();
    setPassword(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    
    setLoading(true);

    try {
      if (isLogin) {
        // Simple local login
        await localDb.auth.signIn(email, password);
        if (onAuthSuccess) onAuthSuccess();
      } else {
        if (!name || name.trim() === '') {
          setError('Please enter your full name.');
          setLoading(false);
          return;
        }
        if (!password || password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        
        await localDb.auth.signUp(email, name.trim(), password);
        if (window.mixpanel) {
          window.mixpanel.track('Signed Up', { method: 'Local' });
        }
        if (onAuthSuccess) onAuthSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    const nextMode = !isLogin;
    setIsLogin(nextMode);
    clearMessages();
    try {
      window.history.pushState({}, '', nextMode ? '/login' : '/signup');
    } catch (e) {}
  };

  return (
    <div className="w-full max-w-md mx-auto py-12 md:py-24 animate-fade-in">
      <Card className="transform transition-all duration-500 hover:shadow-glow-primary hover:scale-[1.01] animate-fade-in-up">
        <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-1 mb-6">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white mb-2 shadow-lg shadow-primary/20">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9Z"/></svg>
                </div>
                <h1 className="text-3xl font-bold tracking-wide text-text-primary">
                    Costing<span className="text-primary font-extrabold ml-1">Hub</span>
                </h1>
                <p className="text-xs text-text-muted font-bold tracking-widest uppercase">All Costs. One Hub.</p>
            </div>
            
            <h2 className="text-xl font-bold text-text-primary mb-2">
                {isLogin ? 'Welcome Back!' : 'Create an Account'}
            </h2>
            <p className="text-text-secondary">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button onClick={toggleAuthMode} className="font-bold text-primary hover:underline focus:outline-none transition-colors">
                    {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
            </p>
        </div>
        
        {successMessage && <p className="text-green-500 text-sm text-center mb-4 animate-fade-in">{successMessage}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="animate-fade-in-up delay-100">
              <Input label="Full Name" type="text" name="name" value={name} onChange={handleNameChange} required disabled={loading}/>
            </div>
          )}
          <div className="animate-fade-in-up delay-200">
              <Input label="Email Address" type="email" name="email" value={email} onChange={handleEmailChange} required disabled={loading}/>
          </div>
          <div className="animate-fade-in-up delay-300 relative">
              <Input label="Password" type="password" name="password" value={password} onChange={handlePasswordChange} required disabled={loading}/>
              {isLogin && (
                 <button 
                    type="button" 
                    onClick={async () => {
                      if (!email) {
                        setError('Please enter your email address first.');
                        return;
                      }
                      setLoading(true);
                      setError(null);
                      try {
                        await localDb.auth.requestPasswordReset(email);
                        setSuccessMessage('Password reset link sent to your email.');
                      } catch (err: any) {
                        setError(err.message || 'Failed to send reset link.');
                      } finally {
                         setLoading(false);
                      }
                    }}
                    className="absolute right-0 top-0 text-xs text-primary hover:underline bg-transparent border-none p-1 cursor-pointer"
                 >
                   Forgot password?
                 </button>
              )}
          </div>
          
          {error && <p className="text-red-500 text-sm text-center pt-2 animate-fade-in">{error}</p>}
          
          <Button type="submit" className="w-full !mt-6 animate-fade-in-up delay-300" disabled={loading}>
            {loading ? (isLogin ? 'Signing In...' : 'Signing Up...') : (isLogin ? 'Sign In' : 'Sign Up')}
          </Button>
        </form>
      </Card>
    </div>
  );
};

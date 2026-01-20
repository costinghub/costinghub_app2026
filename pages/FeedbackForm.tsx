
import React, { useState } from 'react';
import { Send, CheckCircle, MessageSquare, Lightbulb, AlertCircle, HelpCircle } from 'lucide-react';
import { AuthService, DataService } from '../services/mockSupabase';
import { FeedbackSegment, UserFeedback } from '../types';
import { useNavigate } from 'react-router-dom';

export const FeedbackForm: React.FC = () => {
  const user = AuthService.getCurrentUser();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    segment: 'CALCULATOR_FEEDBACK' as FeedbackSegment,
    comments: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.comments.trim()) return;

    setLoading(true);
    const feedback: UserFeedback = {
      id: `fb-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      organizationId: user.organizationId || 'Personal',
      segment: formData.segment,
      comments: formData.comments,
      createdAt: new Date()
    };

    await DataService.saveFeedback(feedback);
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Feedback Submitted!</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
          Thank you for helping us improve CostingHub. Our engineering team will review your {formData.segment === 'FEATURE_REQUIREMENT' ? 'request' : 'feedback'} and update the platform roadmap.
        </p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="mb-10 text-center">
        <div className="inline-flex p-3 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-2xl mb-4">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Share Your Voice</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Help us build the most precise manufacturing cost engine.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="p-8 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
           <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                 <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Full Name</label>
                 <div className="text-sm font-semibold text-slate-800 dark:text-white">{user?.name}</div>
              </div>
              <div className="flex-1">
                 <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Email Address</label>
                 <div className="text-sm font-semibold text-slate-800 dark:text-white">{user?.email}</div>
              </div>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
           <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">What would you like to share?</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <button 
                   type="button"
                   onClick={() => setFormData({...formData, segment: 'CALCULATOR_FEEDBACK'})}
                   className={`p-4 rounded-2xl border-2 flex items-start gap-4 transition-all text-left ${formData.segment === 'CALCULATOR_FEEDBACK' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-100 dark:border-slate-700 hover:border-primary-200'}`}
                 >
                    <div className={`p-2 rounded-lg ${formData.segment === 'CALCULATOR_FEEDBACK' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-slate-500'}`}>
                       <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                       <div className="font-bold text-sm text-slate-800 dark:text-white">General Feedback</div>
                       <p className="text-[11px] text-slate-500 mt-1">Suggestions on existing calculators or platform UI.</p>
                    </div>
                 </button>

                 <button 
                   type="button"
                   onClick={() => setFormData({...formData, segment: 'FEATURE_REQUIREMENT'})}
                   className={`p-4 rounded-2xl border-2 flex items-start gap-4 transition-all text-left ${formData.segment === 'FEATURE_REQUIREMENT' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-100 dark:border-slate-700 hover:border-purple-200'}`}
                 >
                    <div className={`p-2 rounded-lg ${formData.segment === 'FEATURE_REQUIREMENT' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-slate-500'}`}>
                       <Lightbulb className="w-5 h-5" />
                    </div>
                    <div>
                       <div className="font-bold text-sm text-slate-800 dark:text-white">Feature Request</div>
                       <p className="text-[11px] text-slate-500 mt-1">Suggest a new module or specific costing requirement.</p>
                    </div>
                 </button>

                 <button 
                   type="button"
                   onClick={() => setFormData({...formData, segment: 'BUG_REPORT'})}
                   className={`p-4 rounded-2xl border-2 flex items-start gap-4 transition-all text-left ${formData.segment === 'BUG_REPORT' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-100 dark:border-slate-700 hover:border-red-200'}`}
                 >
                    <div className={`p-2 rounded-lg ${formData.segment === 'BUG_REPORT' ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-slate-500'}`}>
                       <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                       <div className="font-bold text-sm text-slate-800 dark:text-white">Report Bug</div>
                       <p className="text-[11px] text-slate-500 mt-1">Encountered an error or a calculation mismatch?</p>
                    </div>
                 </button>

                 <button 
                   type="button"
                   onClick={() => setFormData({...formData, segment: 'OTHER'})}
                   className={`p-4 rounded-2xl border-2 flex items-start gap-4 transition-all text-left ${formData.segment === 'OTHER' ? 'border-slate-500 bg-slate-50 dark:bg-slate-900/20' : 'border-gray-100 dark:border-slate-700 hover:border-slate-300'}`}
                 >
                    <div className={`p-2 rounded-lg ${formData.segment === 'OTHER' ? 'bg-slate-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-slate-500'}`}>
                       <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                       <div className="font-bold text-sm text-slate-800 dark:text-white">Other Support</div>
                       <p className="text-[11px] text-slate-500 mt-1">Pricing queries or account issues.</p>
                    </div>
                 </button>
              </div>
           </div>

           <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Detailed Comments</label>
              <textarea 
                required
                placeholder="Please provide context or steps to reproduce if reporting a bug..."
                value={formData.comments}
                onChange={e => setFormData({...formData, comments: e.target.value})}
                className="w-full h-40 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:bg-slate-900 outline-none transition-all resize-none"
              />
           </div>

           <button 
             type="submit" 
             disabled={loading || !formData.comments.trim()}
             className="w-full bg-slate-900 dark:bg-primary-600 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 dark:hover:bg-primary-700 shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
           >
              {loading ? "Transmitting..." : <><Send className="w-5 h-5" /> Submit Feedback</>}
           </button>
        </form>
      </div>
    </div>
  );
};

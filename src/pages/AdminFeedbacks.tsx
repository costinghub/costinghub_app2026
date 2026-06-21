
import React, { useState, useEffect } from 'react';
import { MessageSquare, Lightbulb, AlertCircle, HelpCircle, User, Building, Calendar, Search, Filter, Trash2 } from 'lucide-react';
import { DataService } from '../services/mockSupabase';
import { UserFeedback, FeedbackSegment } from '../types';

export const AdminFeedbacks: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FeedbackSegment | 'ALL'>('ALL');

  // Load feedbacks asynchronously in useEffect
  useEffect(() => {
    const load = async () => {
        // Added comment: properly await getFeedbacks from DataService
        const data = await DataService.getFeedbacks();
        setFeedbacks([...data].reverse()); // Safely clone and reverse for newest first
    };
    load();
  }, []);

  const filtered = feedbacks.filter(fb => {
    const matchesSearch = fb.comments.toLowerCase().includes(search.toLowerCase()) || 
                          fb.userEmail.toLowerCase().includes(search.toLowerCase()) ||
                          fb.userName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || fb.segment === filter;
    return matchesSearch && matchesFilter;
  });

  const getSegmentIcon = (seg: FeedbackSegment) => {
    switch (seg) {
      case 'CALCULATOR_FEEDBACK': return <MessageSquare className="w-4 h-4 text-primary-500" />;
      case 'FEATURE_REQUIREMENT': return <Lightbulb className="w-4 h-4 text-purple-500" />;
      case 'BUG_REPORT': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <HelpCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  const getSegmentLabel = (seg: FeedbackSegment) => seg.replace('_', ' ');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-8 h-8 text-primary-600" /> Platform Feedback Hub
        </h1>
        <p className="text-slate-500">Monitor and prioritize user requirements and bug reports.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            placeholder="Search feedback content or users..." 
            className="w-full pl-9 pr-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700" 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
           <button onClick={() => setFilter('ALL')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'ALL' ? 'bg-white dark:bg-slate-700 shadow text-primary-600' : 'text-slate-500'}`}>ALL</button>
           <button onClick={() => setFilter('FEATURE_REQUIREMENT')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'FEATURE_REQUIREMENT' ? 'bg-white dark:bg-slate-700 shadow text-purple-600' : 'text-slate-500'}`}>FEATURES</button>
           <button onClick={() => setFilter('BUG_REPORT')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'BUG_REPORT' ? 'bg-white dark:bg-slate-700 shadow text-red-600' : 'text-slate-500'}`}>BUGS</button>
           <button onClick={() => setFilter('CALCULATOR_FEEDBACK')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'CALCULATOR_FEEDBACK' ? 'bg-white dark:bg-slate-700 shadow text-primary-600' : 'text-slate-500'}`}>FEEDBACK</button>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map(fb => (
          <div key={fb.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
             <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-xl bg-opacity-10 dark:bg-opacity-20 flex items-center justify-center ${
                     fb.segment === 'BUG_REPORT' ? 'bg-red-500' : 
                     fb.segment === 'FEATURE_REQUIREMENT' ? 'bg-purple-500' : 'bg-primary-500'
                   }`}>
                      {getSegmentIcon(fb.segment)}
                   </div>
                   <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{getSegmentLabel(fb.segment)}</div>
                      <div className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {fb.userName} <span className="text-xs font-normal text-slate-500">({fb.userEmail})</span>
                      </div>
                   </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-medium">
                   <div className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> {fb.organizationId}</div>
                   <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(fb.createdAt).toLocaleString()}</div>
                </div>
             </div>

             <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl text-sm text-slate-700 dark:text-slate-300 border border-gray-100 dark:border-slate-800 leading-relaxed whitespace-pre-wrap">
                {fb.comments}
             </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-20 text-center bg-gray-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-700">
             <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
             <h3 className="text-lg font-bold text-slate-400">No suggestions found</h3>
             <p className="text-sm text-slate-500 mt-1">Users haven't shared any {filter !== 'ALL' ? filter.replace('_', ' ').toLowerCase() : 'feedback'} yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

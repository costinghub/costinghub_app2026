
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, MessageSquare, Stamp, Clock, User } from 'lucide-react';
import { DataService, AuthService } from '../services/mockSupabase';
import { MachiningCostSheet } from '../types';
import { useNavigate } from 'react-router-dom';

export const ApprovalCenter: React.FC = () => {
  const [pending, setPending] = useState<MachiningCostSheet[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const navigate = useNavigate();

  // Load pending approvals asynchronously in useEffect
  useEffect(() => {
    const load = async () => {
      // Added comment: properly await getMachining from DataService
      const all = await DataService.getMachining();
      setPending(all.filter(s => s.status === 'PENDING_APPROVAL'));
    };
    load();
  }, []);

  const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedId) return;
    const target = pending.find(p => p.id === selectedId);
    if (target) {
      const updated = { ...target, status, approvalComments: comment, updatedAt: new Date() };
      await DataService.saveMachining(updated);
      setPending(prev => prev.filter(p => p.id !== selectedId));
      setSelectedId(null);
      setComment('');
      alert(`Calculation ${status.toLowerCase()} successfully.`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
          <Stamp className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Approval Center</h1>
          <p className="text-slate-500">Review and verify cost engineering calculations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Pending Review ({pending.length})</h3>
          {pending.length === 0 && (
             <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-gray-200">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No pending approvals.</p>
             </div>
          )}
          {pending.map(sheet => (
            <div 
              key={sheet.id}
              onClick={() => setSelectedId(sheet.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedId === sheet.id 
                  ? 'bg-primary-50 border-primary-500 shadow-md dark:bg-primary-900/20' 
                  : 'bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700 hover:border-primary-300'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-slate-800 dark:text-white truncate pr-2">{sheet.partName}</div>
                <div className="text-[10px] font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{sheet.calculationNumber}</div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                 <User className="w-3 h-3" />
                 <span>Requested by: {sheet.requestedBy || 'User'}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Panel */}
        <div className="lg:col-span-2">
           {selectedId ? (
             <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg p-8 animate-in slide-in-from-right-4">
                <div className="flex justify-between items-center mb-8">
                   <h2 className="text-xl font-bold text-slate-800 dark:text-white">Review Request</h2>
                   <button onClick={() => navigate(`/machining/reports?id=${selectedId}`)} className="text-primary-600 hover:underline text-sm flex items-center gap-1"><Eye className="w-4 h-4" /> Open Full Report</button>
                </div>

                <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                   <div className="text-xs font-bold text-slate-400 uppercase mb-2">Approver Comments</div>
                   <textarea 
                     value={comment}
                     onChange={e => setComment(e.target.value)}
                     placeholder="Add instructions, reasons for rejection, or approval notes..."
                     className="w-full h-32 border rounded-lg p-3 dark:bg-slate-800 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 text-sm"
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <button onClick={() => handleAction('REJECTED')} className="flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors"><XCircle className="w-5 h-5" /> Reject Calculation</button>
                   <button onClick={() => handleAction('APPROVED')} className="flex items-center justify-center gap-2 py-4 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-shadow shadow-lg shadow-green-500/20"><CheckCircle className="w-5 h-5" /> Approve & Finalize</button>
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-center p-20 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700">
                <Stamp className="w-16 h-16 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-400">Select a request to review</h3>
                <p className="text-sm text-slate-500 mt-2">All pending machining, casting, and assembly estimates requiring your sign-off will appear here.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

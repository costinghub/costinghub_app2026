
import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Search, FileText, ArrowRight, User } from 'lucide-react';
import { DataService, AuthService, EnterpriseService } from '../services/mockSupabase';
import { MachiningCostSheet } from '../types';
import { useNavigate } from 'react-router-dom';

export const MyRequests: React.FC = () => {
  const [requests, setRequests] = useState<MachiningCostSheet[]>([]);
  const [approverMap, setApproverMap] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();

  // Load user requests and enterprise workflow mapping asynchronously in useEffect
  useEffect(() => {
    if (!user) return;

    const load = async () => {
        // Fetch user's requests
        // Added comment: properly await getMachining from DataService
        const allSheets = await DataService.getMachining();
        const mySheets = allSheets.filter(s => s.requestedBy === user.email && s.status === 'PENDING_APPROVAL');
        setRequests(mySheets);

        // Determine approver for current user
        // Added comment: properly await getCurrentEnterprise from EnterpriseService
        const ent = await EnterpriseService.getCurrentEnterprise();
        if (ent && ent.approvalRules) {
            // Added comment: safely access approvalRules from the awaited enterprise object
            const rule = ent.approvalRules.find(r => r.doerEmail.toLowerCase() === user.email.toLowerCase());
            if (rule) {
                setApproverMap({ [user.email]: rule.approverEmail });
            }
        }
    };
    load();
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
          <Clock className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Waiting for Approval</h1>
          <p className="text-slate-500">Track the status of your cost estimation requests.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        {requests.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 dark:text-white">All Caught Up!</h3>
                <p className="text-slate-500 mt-2">You have no pending approval requests at the moment.</p>
                <button 
                    onClick={() => navigate('/machining/calculator')}
                    className="mt-6 text-primary-600 font-bold hover:underline flex items-center gap-2"
                >
                    Create New Estimate <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        ) : (
            <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-slate-900 text-slate-500 text-xs uppercase tracking-wider">
                    <tr>
                        <th className="p-4">Calculation</th>
                        <th className="p-4">Part Details</th>
                        <th className="p-4">Submitted On</th>
                        <th className="p-4">Assigned Approver</th>
                        <th className="p-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {requests.map(req => (
                        <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                            <td className="p-4">
                                <div className="font-mono font-bold text-slate-700 dark:text-slate-300">{req.calculationNumber}</div>
                                <div className="text-xs text-slate-500 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded w-fit mt-1">Pending</div>
                            </td>
                            <td className="p-4">
                                <div className="font-bold text-slate-800 dark:text-white">{req.partName}</div>
                                <div className="text-xs text-slate-500">{req.partNumber}</div>
                            </td>
                            <td className="p-4 text-sm text-slate-500">
                                {new Date(req.updatedAt).toLocaleDateString()}
                                <div className="text-xs opacity-75">{new Date(req.updatedAt).toLocaleTimeString()}</div>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs">
                                        <User className="w-3 h-3" />
                                    </div>
                                    {approverMap[user?.email || ''] || <span className="italic text-slate-400">Enterprise Admin</span>}
                                </div>
                            </td>
                            <td className="p-4 text-right">
                                <button 
                                    onClick={() => navigate(`/machining/reports?id=${req.id}`)}
                                    className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center justify-end gap-1"
                                >
                                    <FileText className="w-4 h-4" /> View
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
      </div>
    </div>
  );
};

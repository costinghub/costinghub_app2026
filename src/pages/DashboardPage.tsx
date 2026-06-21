import React, { useMemo } from 'react';
import { 
  Calculator, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Eye, 
  MoreVertical,
  Plus,
  Clock,
  ArrowUpRight,
  Archive,
  CheckCircle,
  FileText
} from 'lucide-react';
import type { DashboardPageProps, Calculation } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const DashboardPage: React.FC<DashboardPageProps> = ({ 
  user, 
  calculations, 
  onNavigate, 
  onEdit, 
  onDelete, 
  onViewResults, 
  onUpgrade,
  isSuperAdmin,
  theme,
  activeModule = 'machining'
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'machining' | 'casting' | 'forging'>('all');

  const filteredCalculations = useMemo(() => {
    return calculations.filter(calc => {
      const matchesSearch = 
        calc.inputs.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        calc.inputs.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        calc.inputs.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesModule = filter === 'all' || (calc.calculatorType || 'machining') === filter;
      
      return matchesSearch && matchesModule && !calc.is_hidden;
    });
  }, [calculations, searchTerm, filter]);

  const stats = useMemo(() => {
    const totalCount = filteredCalculations.length;
    const totalValue = filteredCalculations.reduce((sum, c) => sum + (c.results?.totalCost || 0), 0);
    const avgProfit = filteredCalculations.reduce((sum, c) => sum + (c.results?.markupCosts?.profit || 0), 0) / (totalCount || 1);
    
    return { totalCount, totalValue, avgProfit };
  }, [filteredCalculations]);

  return (
    <div className="w-full mx-auto space-y-8 animate-fade-in text-left">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Recent Estimations</h1>
          <p className="text-text-secondary mt-1">Manage and track your manufacturing cost analysis for <span className="font-bold text-primary capitalize">{activeModule}</span>.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => onNavigate('newEstimation')}>
            <Plus className="w-4 h-4 mr-2" />
            New Estimation
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-text-secondary uppercase tracking-wider">Total Recorded</p>
              <h2 className="text-4xl font-black text-text-primary mt-1">{stats.totalCount}</h2>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Calculator className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-emerald-600 font-bold">
            <ArrowUpRight className="w-3 h-3 mr-1" />
            Across all modules
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-text-secondary uppercase tracking-wider">Total Valuation</p>
              <h2 className="text-4xl font-black text-text-primary mt-1">${stats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h2>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600">
              <FileText className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-4 text-xs text-text-muted font-mono uppercase tracking-widest">Aggregate Quote Volume</p>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-text-secondary uppercase tracking-wider">Avg. Profit Margin</p>
              <h2 className="text-4xl font-black text-text-primary mt-1">${stats.avgProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h2>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-600">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-4 text-xs text-text-muted font-mono uppercase tracking-widest">SLA Performance Target</p>
        </Card>
      </div>

      {/* Calculations Table Card */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-border bg-surface/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text"
              placeholder="Search by part name, number, or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-text-muted mr-1" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-background border border-border rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="all">All Modules</option>
              <option value="machining">Machining</option>
              <option value="casting">Casting</option>
              <option value="forging">Forging</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-background/80 text-[11px] font-black uppercase tracking-widest text-text-muted border-b border-border">
                <th className="px-6 py-4">Part / Info</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Cost/Unit</th>
                <th className="px-6 py-4">Total Cost</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCalculations.length > 0 ? (
                filteredCalculations.map((calc) => (
                  <tr key={calc.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-text-primary group-hover:text-primary transition-colors">{calc.inputs.partName}</span>
                        <span className="text-[10px] text-text-muted font-mono">{calc.inputs.partNumber} • {calc.inputs.customerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        calc.status === 'final' 
                          ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                      }`}>
                        {calc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tight bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {calc.calculatorType || 'machining'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm font-bold text-text-primary">
                      ${calc.results?.costPerPart?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm font-bold text-text-primary">
                      ${calc.results?.totalCost?.toLocaleString() || '0.00'}
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-text-muted">
                      {new Date(calc.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => onViewResults(calc)}
                          className="p-2 hover:bg-primary/10 text-text-secondary hover:text-primary rounded-lg transition-all"
                          title="View Detailed Results"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onEdit(calc)}
                          className="p-2 hover:bg-amber-500/10 text-text-secondary hover:text-amber-600 rounded-lg transition-all"
                          title="Edit Estimation"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onDelete(calc.id)}
                          className="p-2 hover:bg-red-500/10 text-text-secondary hover:text-red-600 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full text-text-muted">
                        <Archive className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-text-primary">No Matching Estimations Found</h3>
                      <p className="text-text-secondary text-sm max-w-xs mx-auto">Try adjusting your filters or search terms, or start a fresh estimation from the Launchpad.</p>
                      <Button variant="secondary" className="mt-2" onClick={() => { setSearchTerm(''); setFilter('all'); }}>
                        Clear All Filters
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

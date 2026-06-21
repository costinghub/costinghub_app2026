
import React, { useState, useEffect } from 'react';
import { 
  Globe, Calendar, Plus, Edit2, Copy, Trash2, Search, Filter, 
  DollarSign, Save, Coins, Percent, CheckCircle, AlertTriangle, X, ChevronDown, 
  Settings, Box, Wrench, Cpu 
} from 'lucide-react';
import { DataService } from '../services/mockSupabase';
import { CostProfile, MachiningMaterial, Tool, Machine } from '../types';

export const CostMaster: React.FC = () => {
  const [profiles, setProfiles] = useState<CostProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  
  // Master Data Cache
  const [materials, setMaterials] = useState<MachiningMaterial[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState<'MATERIALS' | 'TOOLS' | 'MACHINES'>('MATERIALS');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'PRICED' | 'UNPRICED'>('ALL');
  
  // Edit Profile State
  const [editingProfile, setEditingProfile] = useState<Partial<CostProfile>>({});

  // Bulk Update State
  const [bulkPercent, setBulkPercent] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, []);

  /**
   * Loads cost profiles and master data asynchronously.
   */
  const loadData = async () => {
    // Added comment: properly await getCostProfiles from DataService
    const loadedProfiles = await DataService.getCostProfiles();
    setProfiles(loadedProfiles);
    
    // Set active profile to default or first available
    if (!activeProfileId && loadedProfiles.length > 0) {
      // Added comment: properly await the result before accessing properties
      const def = loadedProfiles.find(p => p.isDefault) || loadedProfiles[0];
      setActiveProfileId(def.id);
    }

    setMaterials(await DataService.getMaterials());
    setTools(await DataService.getTools());
    setMachines(await DataService.getMachines());
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId);

  // --- Profile Management ---

  const handleSaveProfile = async () => {
    if (!editingProfile.name || !editingProfile.currency) return;
    
    const newProfile: CostProfile = {
      id: editingProfile.id || `cp-${Date.now()}`,
      name: editingProfile.name,
      country: editingProfile.country || 'Global',
      currency: editingProfile.currency,
      period: editingProfile.period || new Date().getFullYear().toString(),
      isDefault: editingProfile.isDefault || false,
      materialCosts: editingProfile.materialCosts || {},
      toolCosts: editingProfile.toolCosts || {},
      machineCosts: editingProfile.machineCosts || {}
    };

    await DataService.saveCostProfile(newProfile);
    loadData();
    setActiveProfileId(newProfile.id);
    setIsProfileModalOpen(false);
    setEditingProfile({});
  };

  /**
   * Deletes a cost region profile.
   */
  const handleDeleteProfile = async (id: string) => {
    if (confirm('Are you sure you want to delete this Cost Region? This cannot be undone.')) {
      // Added comment: properly await deleteCostProfile from DataService
      await DataService.deleteCostProfile(id);
      const remaining = profiles.filter(p => p.id !== id);
      if (activeProfileId === id && remaining.length > 0) setActiveProfileId(remaining[0].id);
      loadData();
    }
  };

  const handleDuplicateProfile = async () => {
    if (!activeProfile) return;
    const copy: CostProfile = {
      ...activeProfile,
      id: `cp-${Date.now()}`,
      name: `${activeProfile.name} (Copy)`,
      period: `${activeProfile.period} Copy`,
      isDefault: false
    };
    await DataService.saveCostProfile(copy);
    loadData();
    setActiveProfileId(copy.id);
  };

  // --- Cost Updates ---

  const updateCost = async (itemId: string, cost: number) => {
    if (!activeProfile) return;
    
    const updatedProfile = { ...activeProfile };
    if (activeTab === 'MATERIALS') updatedProfile.materialCosts[itemId] = cost;
    else if (activeTab === 'TOOLS') updatedProfile.toolCosts[itemId] = cost;
    else updatedProfile.machineCosts[itemId] = cost;

    await DataService.saveCostProfile(updatedProfile);
    setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
  };

  const handleBulkUpdate = async () => {
    if (!activeProfile || bulkPercent === 0) return;
    
    const factor = 1 + (bulkPercent / 100);
    const updatedProfile = { ...activeProfile };
    
    if (activeTab === 'MATERIALS') {
      Object.keys(updatedProfile.materialCosts).forEach(k => {
        updatedProfile.materialCosts[k] = Number((updatedProfile.materialCosts[k] * factor).toFixed(4));
      });
    } else if (activeTab === 'TOOLS') {
      Object.keys(updatedProfile.toolCosts).forEach(k => {
        updatedProfile.toolCosts[k] = Number((updatedProfile.toolCosts[k] * factor).toFixed(2));
      });
    } else {
      Object.keys(updatedProfile.machineCosts).forEach(k => {
        updatedProfile.machineCosts[k] = Number((updatedProfile.machineCosts[k] * factor).toFixed(2));
      });
    }

    await DataService.saveCostProfile(updatedProfile);
    setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
    setIsBulkUpdateOpen(false);
    setBulkPercent(0);
    alert(`Bulk update applied: ${bulkPercent > 0 ? '+' : ''}${bulkPercent}% to ${activeTab.toLowerCase()}`);
  };

  // --- Rendering Helpers ---

  const getFilteredItems = () => {
    let items: any[] = [];
    let costs: Record<string, number> = {};

    if (activeTab === 'MATERIALS') { items = materials; costs = activeProfile?.materialCosts || {}; }
    else if (activeTab === 'TOOLS') { items = tools; costs = activeProfile?.toolCosts || {}; }
    else { items = machines; costs = activeProfile?.machineCosts || {}; }

    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (item.category || item.type || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const price = costs[item.id];
      const matchesFilter = filterType === 'ALL' || 
                            (filterType === 'PRICED' && price !== undefined && price > 0) ||
                            (filterType === 'UNPRICED' && (price === undefined || price === 0));
      
      return matchesSearch && matchesFilter;
    });
  };

  const renderTable = () => {
    const items = getFilteredItems();
    const costs = activeTab === 'MATERIALS' ? activeProfile?.materialCosts : 
                  activeTab === 'TOOLS' ? activeProfile?.toolCosts : activeProfile?.machineCosts;

    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 text-slate-500 text-sm uppercase">
              <tr>
                <th className="p-4 w-1/3">Item Name</th>
                <th className="p-4 w-1/3">Details</th>
                <th className="p-4 w-1/3 text-right">
                  {activeTab === 'MATERIALS' ? 'Rate per Kg' : 
                   activeTab === 'TOOLS' ? 'Unit Cost' : 'Machine Hour Rate'}
                   <span className="ml-1 text-primary-600">({activeProfile?.currency})</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {items.map(item => {
                const cost = costs?.[item.id];
                const isPriced = cost !== undefined && cost > 0;
                
                return (
                  <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 ${!isPriced ? 'opacity-75' : ''}`}>
                    <td className="p-4">
                      <div className="font-medium text-slate-800 dark:text-white flex items-center gap-2">
                        {!isPriced && <div className="w-2 h-2 rounded-full bg-orange-400" title="Unpriced" />}
                        {item.name}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {activeTab === 'MATERIALS' && (item as MachiningMaterial).category}
                      {activeTab === 'TOOLS' && `${(item as Tool).brand} ${(item as Tool).model || ''}`}
                      {activeTab === 'MACHINES' && `${(item as Machine).subType} • ${(item as Machine).powerKw}kW`}
                    </td>
                    <td className="p-4 text-right">
                      <div className="relative inline-block w-32">
                        <span className="absolute left-3 top-1.5 text-slate-400 text-sm">{activeProfile?.currency === 'EUR' ? '€' : activeProfile?.currency === 'INR' ? '₹' : '$'}</span>
                        <input 
                          type="number" 
                          step={activeTab === 'MATERIALS' ? "0.01" : "1"}
                          className={`w-full pl-7 pr-3 py-1.5 border rounded-lg text-right text-sm focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white dark:border-slate-600 ${!isPriced ? 'border-orange-200 bg-orange-50 dark:bg-orange-900/10' : 'border-gray-200'}`}
                          placeholder="0.00"
                          value={cost || ''}
                          onChange={(e) => updateCost(item.id, Number(e.target.value))}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-500">
                    No items found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Coins className="w-8 h-8 text-indigo-600" /> Commercial Cost Master
          </h1>
          <p className="text-slate-500">Manage pricing profiles across regions and periods.</p>
        </div>
        
        {/* Profile Selector */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
           <div className="px-2">
             <label className="block text-[10px] uppercase font-bold text-slate-400">Active Region</label>
             <div className="relative">
                <select 
                  className="appearance-none bg-transparent font-bold text-slate-800 dark:text-white pr-8 focus:outline-none cursor-pointer"
                  value={activeProfileId}
                  onChange={(e) => setActiveProfileId(e.target.value)}
                >
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.period})</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-0 top-1 pointer-events-none" />
             </div>
           </div>
           <div className="w-px h-8 bg-gray-200 dark:bg-slate-700"></div>
           <button 
             onClick={() => { setEditingProfile({}); setIsProfileModalOpen(true); }}
             className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
             title="Manage Regions"
           >
             <Settings className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Main Workspace */}
      {activeProfile ? (
        <>
          {/* Profile Summary Card */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4 flex flex-wrap gap-6 items-center">
             <div className="flex items-center gap-2 text-sm text-indigo-800 dark:text-indigo-200">
               <Globe className="w-4 h-4" />
               <span className="font-medium">{activeProfile.country}</span>
             </div>
             <div className="flex items-center gap-2 text-sm text-indigo-800 dark:text-indigo-200">
               <DollarSign className="w-4 h-4" />
               <span className="font-medium">{activeProfile.currency} Currency</span>
             </div>
             <div className="flex items-center gap-2 text-sm text-indigo-800 dark:text-indigo-200">
               <Calendar className="w-4 h-4" />
               <span className="font-medium">{activeProfile.period}</span>
             </div>
             <div className="flex-1"></div>
             <div className="flex gap-2">
                <button onClick={handleDuplicateProfile} className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium rounded border border-indigo-200 hover:border-indigo-400">
                  <Copy className="w-3 h-3" /> Duplicate
                </button>
                <button onClick={() => { setEditingProfile(activeProfile); setIsProfileModalOpen(true); }} className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium rounded border border-indigo-200 hover:border-indigo-400">
                  <Edit2 className="w-3 h-3" /> Edit Region
                </button>
             </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             {/* Tabs */}
             <div className="flex gap-2 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg self-start">
               <button onClick={() => setActiveTab('MATERIALS')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'MATERIALS' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}>Materials</button>
               <button onClick={() => setActiveTab('TOOLS')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'TOOLS' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}>Tools</button>
               <button onClick={() => setActiveTab('MACHINES')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'MACHINES' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}>Machines</button>
             </div>

             {/* Filters & Bulk */}
             <div className="flex flex-wrap gap-3 items-center">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input 
                    placeholder="Search items..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border rounded-lg text-sm w-48 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                
                <div className="flex border rounded-lg overflow-hidden border-gray-200 dark:border-slate-700">
                   <button onClick={() => setFilterType('ALL')} className={`px-3 py-2 text-xs font-medium ${filterType === 'ALL' ? 'bg-gray-100 dark:bg-slate-700' : 'bg-white dark:bg-slate-800'}`}>All</button>
                   <button onClick={() => setFilterType('PRICED')} className={`px-3 py-2 text-xs font-medium border-l border-r border-gray-200 dark:border-slate-700 ${filterType === 'PRICED' ? 'bg-gray-100 dark:bg-slate-700' : 'bg-white dark:bg-slate-800'}`}>Priced</button>
                   <button onClick={() => setFilterType('UNPRICED')} className={`px-3 py-2 text-xs font-medium ${filterType === 'UNPRICED' ? 'bg-gray-100 dark:bg-slate-700' : 'bg-white dark:bg-slate-800'}`}>Unpriced</button>
                </div>

                <button 
                  onClick={() => setIsBulkUpdateOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                >
                  <Percent className="w-4 h-4" /> Bulk Update
                </button>
             </div>
          </div>

          {/* Content */}
          {renderTable()}

        </>
      ) : (
        <div className="text-center py-20 bg-gray-50 dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
           <Coins className="w-12 h-12 text-slate-300 mx-auto mb-4" />
           <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400">No Cost Regions Found</h3>
           <p className="text-slate-500 mb-6">Create a region profile to start managing your commercial data.</p>
           <button onClick={() => { setEditingProfile({}); setIsProfileModalOpen(true); }} className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700">Create First Region</button>
        </div>
      )}

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-slate-700 p-6">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editingProfile.id ? 'Edit Region' : 'New Cost Region'}</h3>
                <button onClick={() => setIsProfileModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
             </div>
             
             <div className="space-y-4">
                <div>
                   <label className="block text-xs font-medium text-slate-500 mb-1">Region Name</label>
                   <input className="w-full border rounded p-2 dark:bg-slate-700" placeholder="e.g. US Ops 2024" value={editingProfile.name || ''} onChange={e => setEditingProfile({...editingProfile, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Country / Location</label>
                      <input className="w-full border rounded p-2 dark:bg-slate-700" placeholder="e.g. USA" value={editingProfile.country || ''} onChange={e => setEditingProfile({...editingProfile, country: e.target.value})} />
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Period</label>
                      <input className="w-full border rounded p-2 dark:bg-slate-700" placeholder="e.g. Q4 2024" value={editingProfile.period || ''} onChange={e => setEditingProfile({...editingProfile, period: e.target.value})} />
                   </div>
                </div>
                <div>
                   <label className="block text-xs font-medium text-slate-500 mb-1">Currency</label>
                   <select className="w-full border rounded p-2 dark:bg-slate-700" value={editingProfile.currency || 'USD'} onChange={e => setEditingProfile({...editingProfile, currency: e.target.value})}>
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="INR">INR (₹) - Indian Rupee</option>
                      <option value="GBP">GBP (£) - British Pound</option>
                   </select>
                </div>
             </div>

             <div className="flex justify-between mt-8">
                {editingProfile.id ? (
                  <button onClick={() => handleDeleteProfile(editingProfile.id!)} className="text-red-600 text-sm hover:underline">Delete Region</button>
                ) : <div></div>}
                <div className="flex gap-2">
                   <button onClick={() => setIsProfileModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                   <button onClick={handleSaveProfile} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Save Region</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Bulk Update Modal */}
      {isBulkUpdateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm border border-gray-200 dark:border-slate-700 p-6">
             <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Bulk Price Update</h3>
             <p className="text-sm text-slate-500 mb-6">
               Adjust all currently priced {activeTab.toLowerCase()} in <strong>{activeProfile?.name}</strong>.
             </p>
             
             <div className="mb-6">
                <label className="block text-xs font-medium text-slate-500 mb-1">Percentage Adjustment (+/-)</label>
                <div className="flex items-center">
                   <input 
                     type="number" 
                     className="flex-1 border rounded-l-lg p-2 dark:bg-slate-700 text-right" 
                     placeholder="0"
                     value={bulkPercent}
                     onChange={e => setBulkPercent(Number(e.target.value))}
                   />
                   <div className="bg-gray-100 dark:bg-slate-700 border-y border-r rounded-r-lg px-3 py-2 text-slate-500">%</div>
                </div>
                <p className="text-xs text-orange-500 mt-2">Example: Enter 5 for a 5% increase, or -10 for a 10% decrease.</p>
             </div>

             <div className="flex justify-end gap-2">
                <button onClick={() => setIsBulkUpdateOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                <button onClick={handleBulkUpdate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Apply Update</button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

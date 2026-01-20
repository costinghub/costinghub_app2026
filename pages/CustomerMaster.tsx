
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Save } from 'lucide-react';
import { DataService } from '../services/mockSupabase';
import { Customer } from '../types';

export const CustomerMaster: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState<Customer>({ id: '', name: '', location: '', currency: 'USD' });

  useEffect(() => {
    const fetchCustomers = async () => {
        const data = await DataService.getCustomers();
        setCustomers(data || []);
    };
    fetchCustomers();
  }, []);

  const handleSave = async () => {
    const toSave = { ...current, id: current.id || `cust-${Date.now()}` };
    try {
        await DataService.saveCustomer(toSave);
        const data = await DataService.getCustomers();
        setCustomers(data || []);
        setIsEditing(false);
        setCurrent({ id: '', name: '', location: '', currency: 'USD' });
    } catch (err) {
        console.error("Failed to save customer", err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Customer Master</h1>
          <p className="text-slate-500">Manage customer details and currencies.</p>
        </div>
        <button 
          onClick={() => { setIsEditing(true); setCurrent({ id: '', name: '', location: '', currency: 'USD' }); }}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {isEditing && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg mb-6">
          <h3 className="font-bold mb-4 dark:text-white">{current.id ? 'Edit' : 'New'} Customer</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input placeholder="Customer Name" className="border p-2 rounded dark:bg-slate-700 dark:text-white" value={current.name} onChange={e => setCurrent({...current, name: e.target.value})} />
            <input placeholder="Location" className="border p-2 rounded dark:bg-slate-700 dark:text-white" value={current.location} onChange={e => setCurrent({...current, location: e.target.value})} />
            <select className="border p-2 rounded dark:bg-slate-700 dark:text-white" value={current.currency} onChange={e => setCurrent({...current, currency: e.target.value})}>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-500 hover:bg-gray-100 rounded">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">Save</button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 dark:bg-slate-900 text-slate-500 text-sm uppercase">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Location</th>
              <th className="p-4">Currency</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {customers.map(cust => (
              <tr key={cust.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                <td className="p-4 font-medium dark:text-white">{cust.name}</td>
                <td className="p-4 text-slate-500">{cust.location}</td>
                <td className="p-4 text-slate-500">{cust.currency}</td>
                <td className="p-4 text-right">
                  <button onClick={() => { setCurrent(cust); setIsEditing(true); }} className="text-primary-600 hover:text-primary-800">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">No customers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import type { Machine } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { MACHINE_TYPES, ADDITIONAL_AXIS_OPTIONS, DEFAULT_MACHINE_NAMES } from '../constants';
import { suggestMachine } from '../services/geminiService';

interface MachineFormProps {
  machine: Machine | null;
  onSave: (machine: Machine) => void;
  onCancel: () => void;
  isSuperAdmin: boolean;
}

const BLANK_MACHINE: Omit<Machine, 'id' | 'created_at' | 'user_id' | 'hourlyRate'> = {
  name: '',
  brand: '',
  model: '',
  machineType: 'CNC Mill',
  xAxis: 0,
  yAxis: 0,
  zAxis: 0,
  powerKw: 0,
  additionalAxis: 'None',
};

export const MachineForm: React.FC<MachineFormProps> = ({ machine, onSave, onCancel, isSuperAdmin }) => {
  const [formData, setFormData] = useState<Omit<Machine, 'id' | 'created_at' | 'user_id' | 'hourlyRate'>>(() => machine ? { ...machine } : BLANK_MACHINE);
  const [suggestionPrompt, setSuggestionPrompt] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState('');

  const isDefault = useMemo(() => machine ? DEFAULT_MACHINE_NAMES.has(machine.name) : false, [machine]);

  useEffect(() => {
    setFormData(machine ? { ...machine } : BLANK_MACHINE);
  }, [machine]);

  useEffect(() => {
    // Do not auto-generate name if it's a default item being edited by an admin
    if (isSuperAdmin && isDefault) return;

    const newName = `${formData.brand} ${formData.model}`.trim();
    if (newName) {
        setFormData(prev => ({...prev, name: newName}));
    }
  }, [formData.brand, formData.model, isSuperAdmin, isDefault]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const type = (e.target as HTMLInputElement).type;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? (parseFloat(value) || 0) : value }));
  };

  const handleSuggestion = async () => {
    if (!suggestionPrompt) return;
    setIsSuggesting(true);
    setSuggestionError('');
    try {
        const suggestion = await suggestMachine(suggestionPrompt);
        setFormData(prev => ({ ...prev, ...suggestion }));
    } catch (error) {
        console.error('Gemini suggestion failed:', error);
        setSuggestionError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
        setIsSuggesting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const machineToSave: Machine = {
        id: machine?.id || new Date().toISOString() + Math.random(),
        hourlyRate: machine?.hourlyRate || 0, // Preserve existing rate, or default for new
        ...formData,
    };
    onSave(machineToSave);
  };

  return (
    <Card className="w-full">
        <h2 className="text-2xl font-bold text-primary mb-6">{machine ? 'Edit Machine' : 'Add New Machine'}</h2>
        
        <div className="mb-6 p-4 border border-dashed border-primary/50 rounded-lg bg-primary/5">
            <h3 className="text-lg font-semibold text-primary mb-2">Suggest with AI</h3>
            <p className="text-sm text-text-secondary mb-3">Describe a machine, and let AI fill in the typical specifications for you.</p>
            <textarea
                value={suggestionPrompt}
                onChange={(e) => setSuggestionPrompt(e.target.value)}
                placeholder="e.g., 'a common 3-axis CNC mill like a Haas VF-2' or 'a large horizontal boring mill'"
                className="block w-full px-3 py-2 border rounded-md focus:outline-none sm:text-sm bg-background/50 text-text-input border-border placeholder-text-muted focus:ring-primary focus:border-primary"
                rows={2}
                disabled={isSuggesting}
            />
            <div className="mt-3 flex items-center justify-end">
                {suggestionError && <p className="text-sm text-red-500 mr-4">{suggestionError}</p>}
                <Button type="button" onClick={handleSuggestion} disabled={isSuggesting || !suggestionPrompt}>
                    {isSuggesting ? 'Suggesting...' : 'Suggest'}
                </Button>
            </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                label="Brand" 
                name="brand" 
                value={formData.brand} 
                onChange={handleInputChange} 
                required 
                disabled={isSuperAdmin && isDefault}
                title={isSuperAdmin && isDefault ? "Brand/Model cannot be changed for default items to maintain data integrity." : ""}
                />
                <Input 
                label="Model" 
                name="model" 
                value={formData.model} 
                onChange={handleInputChange} 
                required 
                disabled={isSuperAdmin && isDefault}
                title={isSuperAdmin && isDefault ? "Brand/Model cannot be changed for default items to maintain data integrity." : ""}
                />
            </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Machine Name (Auto-generated)" name="name" value={formData.name} onChange={() => {}} disabled />
            </div>

            <Select label="Machine Type" name="machineType" value={formData.machineType} onChange={handleInputChange}>
            {MACHINE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </Select>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="X-Axis Travel" name="xAxis" type="number" step="any" value={formData.xAxis} onChange={handleInputChange} unit="mm" required />
                <Input label="Y-Axis Travel" name="yAxis" type="number" step="any" value={formData.yAxis} onChange={handleInputChange} unit="mm" required />
                <Input label="Z-Axis Travel" name="zAxis" type="number" step="any" value={formData.zAxis} onChange={handleInputChange} unit="mm" required />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Spindle Power" name="powerKw" type="number" step="any" value={formData.powerKw} onChange={handleInputChange} unit="kW" required />
                <Select label="Additional Axis" name="additionalAxis" value={formData.additionalAxis} onChange={handleInputChange}>
                {ADDITIONAL_AXIS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </Select>
            </div>

            <div className="flex justify-end space-x-4 mt-6 border-t border-border pt-6">
                <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save Machine</Button>
            </div>
        </form>
    </Card>
  );
};

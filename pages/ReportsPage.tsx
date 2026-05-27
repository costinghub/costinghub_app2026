
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import type { User, Calculation, MaterialMasterItem } from '../types';
import { localDb } from '../services/localDbService';

interface ReportsPageProps {
  user: User;
  onEdit: (calculation: Calculation) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ user, onEdit }) => {
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [materials, setMaterials] = useState<MaterialMasterItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [data, matData] = await Promise.all([
            localDb.getAll<Calculation>('calculations'),
            localDb.getAll<MaterialMasterItem>('materials')
        ]);
        
        // Super admins or enterprise admins see all, normal user sees their own
        if (user.role === 'enterprise_admin' || user.email === 'designersworldcbe@gmail.com') {
          setCalculations(data);
        } else {
          setCalculations(data.filter(c => c.user_id === user.id));
        }
        setMaterials(matData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [user]);

  const materialMap = useMemo(() => {
      const map = new Map<string, string>();
      materials.forEach(m => map.set(m.id, m.name));
      return map;
  }, [materials]);

  if (loading) return <div className="p-8">Loading reports...</div>;

  const totalCost = calculations.reduce((sum, c) => sum + (c.results?.totalCost || 0), 0);
  const totalTime = calculations.reduce((sum, c) => sum + (c.results?.totalCuttingTimeMin || 0), 0);

  return (
    <div className="w-full max-w-6xl mx-auto py-8 animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
         <div>
            <h1 className="text-3xl font-bold text-text-primary">Reports & Analytics</h1>
            <p className="text-text-secondary mt-1">Overview of calculation metrics and activities.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="p-6 text-center">
             <h3 className="text-text-secondary text-sm font-semibold uppercase">Total Calculations</h3>
             <p className="text-4xl font-bold text-primary mt-2">{calculations.length}</p>
         </Card>
         <Card className="p-6 text-center">
             <h3 className="text-text-secondary text-sm font-semibold uppercase">Total Cost Estimated</h3>
             <p className="text-4xl font-bold text-primary mt-2">${totalCost.toFixed(2)}</p>
         </Card>
         <Card className="p-6 text-center">
             <h3 className="text-text-secondary text-sm font-semibold uppercase">Total Machining Time</h3>
             <p className="text-4xl font-bold text-primary mt-2">{(totalTime / 60).toFixed(1)} hrs</p>
         </Card>
      </div>

      <Card className="p-6">
         <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Calculations</h3>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-border">
                        <th className="p-2 text-text-secondary font-semibold">Part Name</th>
                        <th className="p-2 text-text-secondary font-semibold">Part No.</th>
                        <th className="p-2 text-text-secondary font-semibold">Customer</th>
                        <th className="p-2 text-text-secondary font-semibold">Unit Cost</th>
                        <th className="p-2 text-text-secondary font-semibold">Batch Vol.</th>
                        <th className="p-2 text-text-secondary font-semibold">Annual Vol.</th>
                        <th className="p-2 text-text-secondary font-semibold">Material</th>
                        <th className="p-2 text-text-secondary font-semibold">Quote No.</th>
                        <th className="p-2 text-text-secondary font-semibold">Rev.</th>
                        <th className="p-2 text-text-secondary font-semibold">Date</th>
                    </tr>
                </thead>
                <tbody>
                    {calculations.slice(0, 10).map(c => (
                        <tr key={c.id} className="border-b border-border/50 hover:bg-background/50 cursor-pointer" onClick={() => onEdit(c)}>
                            <td className="p-2 text-text-primary font-medium">{c.inputs.partName}</td>
                            <td className="p-2 text-text-primary">{c.inputs.partNumber}</td>
                            <td className="p-2 text-text-primary">{c.inputs.customerName}</td>
                            <td className="p-2 text-text-primary">${c.results?.costPerPart?.toFixed(2) || '0.00'}</td>
                            <td className="p-2 text-text-primary">{c.inputs.batchVolume}</td>
                            <td className="p-2 text-text-primary">{c.inputs.annualVolume}</td>
                            <td className="p-2 text-text-primary">{materialMap.get(c.inputs.materialType) || c.inputs.materialType}</td>
                            <td className="p-2 text-text-primary">{c.inputs.calculationNumber}</td>
                            <td className="p-2 text-text-primary">{c.inputs.revision}</td>
                            <td className="p-2 text-text-secondary text-sm">{new Date(c.created_at).toLocaleDateString()}</td>
                        </tr>
                    ))}
                    {calculations.length === 0 && (
                        <tr><td colSpan={4} className="p-4 text-center text-text-muted">No calculations found for reporting.</td></tr>
                    )}
                </tbody>
            </table>
         </div>
      </Card>
    </div>
  );
};

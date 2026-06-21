import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Legend
} from 'recharts';

interface MaterialFlowChartProps {
  rawBilletWeight: number;
  scaleLoss: number;
  flashScrap: number;
  finishedWeight: number;
}

export const MaterialFlowChart: React.FC<MaterialFlowChartProps> = ({
  rawBilletWeight,
  scaleLoss,
  flashScrap,
  finishedWeight
}) => {
  const data = [
    {
      name: 'Billet Input',
      value: rawBilletWeight,
      color: '#94a3b8' // Slate 400
    },
    {
      name: 'Finished Part',
      value: finishedWeight,
      color: '#10b981' // Emerald 500
    },
    {
      name: 'Flash Scrap',
      value: flashScrap,
      color: '#f43f5e' // Rose 500
    },
    {
      name: 'Scale Loss',
      value: scaleLoss,
      color: '#f97316' // Orange 500
    }
  ];

  // Stacked data for a different view (Loss/Scrap/Finished adding up to Raw)
  const stackedData = [
    {
      name: 'Composition',
      Processed: finishedWeight,
      Scrap: flashScrap,
      Scale: scaleLoss
    }
  ];

  return (
    <div className="w-full h-full min-h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="name" 
            fontSize={10} 
            tick={{ fill: '#64748b' }} 
            axisLine={false} 
            tickLine={false}
          />
          <YAxis 
            fontSize={10} 
            tick={{ fill: '#64748b' }} 
            axisLine={false} 
            tickLine={false}
            label={{ value: 'kg', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fill: '#94a3b8' }}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
            contentStyle={{ 
              borderRadius: '8px', 
              border: 'none', 
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '11px',
              fontWeight: 'bold'
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

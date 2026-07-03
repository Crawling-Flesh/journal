import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { eachDayOfInterval, startOfMonth, endOfMonth, format } from 'date-fns';

// Notre légende 100% personnalisée pour forcer l'ordre
const CustomLegend = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', paddingTop: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-journal, #00cc44)', borderRadius: '2px' }}></div>
        <span style={{ color: 'var(--color-journal)', fontSize: '16px' }}>Journal</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-event, #ff3333)', borderRadius: '2px' }}></div>
        <span style={{ color: 'var(--color-event)', fontSize: '16px' }}>Événements</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-bonheur, #ffd700)', borderRadius: '2px' }}></div>
        <span style={{ color: 'var(--color-bonheur)', fontSize: '16px' }}>Bonheurs</span>
      </div>
    </div>
  );
};

export default function ActivityChart({ monthData, currentMonth }) {
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });

  const chartData = days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    
    const journalCount = monthData.journal.filter(j => j.date === dateStr).length;
    const eventCount = monthData.event.filter(e => e.date === dateStr).length;
    
    const bonheursDay = monthData.bonheur.find(b => b.date === dateStr);
    const bonheurCount = bonheursDay && bonheursDay.items ? bonheursDay.items.length : 0;

    return {
      date: format(day, 'dd/MM'),
      Journal: journalCount,
      Événements: eventCount,
      Bonheurs: bonheurCount
    };
  });

  return (
    <div style={{ width: '100%', height: 400, backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', marginTop: '2rem' }}>
      <h3 style={{ color: '#fff', textAlign: 'center', marginBottom: '1rem', marginTop: 0 }}>Volume d'activité</h3>
      
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 30, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          <XAxis dataKey="date" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} tickMargin={10} />
          <YAxis stroke="#888" tickCount={5} tick={{ fill: '#888' }} allowDecimals={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '8px', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
            cursor={{ fill: '#333', opacity: 0.4 }}
          />
          
          {/* On appelle notre légende sur mesure */}
          <Legend content={<CustomLegend />} verticalAlign="bottom" />
          
          <Bar dataKey="Journal" fill="var(--color-journal, #00cc44)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="Événements" fill="var(--color-event, #ff3333)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="Bonheurs" fill="var(--color-bonheur, #ffd700)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { eachDayOfInterval, startOfMonth, endOfMonth, format } from 'date-fns';

const MOODS = {
  'Joie': '#ffd700', 'Colère': '#ff3333', 'Anxiété': '#aa00ff', 
  'Tristesse': '#0088ff', 'Dégoût': '#00cc44', 'Stress': '#ff8800', 
  'Anticipation': '#00e5ff', 'Confiance': '#a6ff00', 'Sérénité': '#e81099'
};
const MOOD_CATEGORIES = Object.keys(MOODS);

export default function MeteoChart({ meteoData, currentMonth }) {
  // 1. Préparation des données pour l'axe X (tous les jours du mois)
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });

  const chartData = days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayData = meteoData.find(m => m.date === dateStr);
    
    const dayObj = {
      date: format(day, 'dd/MM'), // Ce qui s'affiche en bas
    };

    // 2. On insère la valeur de chaque émotion (ou null si le jour est vide)
    MOOD_CATEGORIES.forEach(mood => {
      const dbColumn = mood.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      dayObj[mood] = dayData && dayData[dbColumn] > 0 ? dayData[dbColumn] : null;
    });

    return dayObj;
  });

  return (
    <div style={{ width: '100%', height: 400, backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', marginTop: '2rem' }}>
      <h3 style={{ color: '#fff', textAlign: 'center', marginBottom: '1rem', marginTop: 0 }}>Évolution de la Météo Intérieure</h3>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          
          <XAxis 
            dataKey="date" 
            stroke="#888" 
            tick={{ fill: '#888', fontSize: 12 }} 
            tickMargin={10}
          />
          
          <YAxis 
            stroke="#888" 
            domain={[0, 5]} 
            tickCount={6} 
            tick={{ fill: '#888' }} 
          />
          
          <Tooltip 
            contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '8px', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
          />
          
          <Legend wrapperStyle={{ paddingTop: '20px' }} />

          {/* 3. On génère dynamiquement une ligne par émotion */}
          {MOOD_CATEGORIES.map(mood => (
            <Line 
              key={mood}
              type="monotone" 
              dataKey={mood} 
              stroke={MOODS[mood]} 
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
              connectNulls={false} // Empêche la courbe de plonger à 0 si tu n'as rien encodé un jour
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { eachDayOfInterval, startOfMonth, endOfMonth, format } from 'date-fns';

const MOODS = {
  'Joie': '#ffd700', 'Colère': '#ff3333', 'Anxiété': '#aa00ff', 
  'Tristesse': '#0088ff', 'Dégoût': '#00cc44', 'Stress': '#ff8800', 
  'Anticipation': '#00e5ff', 'Confiance': '#a6ff00', 'Sérénité': '#e81099'
};
const MOOD_CATEGORIES = Object.keys(MOODS);

export default function MeteoChart({ meteoData, currentMonth }) {
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });

  // État pour stocker les émotions qu'on veut masquer
  const [hiddenMoods, setHiddenMoods] = useState([]);

  // Fonction pour basculer l'affichage au clic sur la légende
  const toggleMood = (mood) => {
    setHiddenMoods(prev => 
      prev.includes(mood) 
        ? prev.filter(m => m !== mood) // On le retire (donc on l'affiche)
        : [...prev, mood]              // On l'ajoute (donc on le masque)
    );
  };

  const chartData = days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayData = meteoData.find(m => m.date === dateStr);
    
    const dayObj = {
      date: format(day, 'dd/MM'),
    };

    MOOD_CATEGORIES.forEach(mood => {
      const dbColumn = mood.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      dayObj[mood] = dayData && dayData[dbColumn] > 0 ? dayData[dbColumn] : null;
    });

    return dayObj;
  });

  // Notre légende sur mesure cliquable
  const CustomLegend = ({ payload }) => {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px', paddingTop: '20px', width: '100%' }}>
        {payload.map((entry, index) => {
          const isHidden = hiddenMoods.includes(entry.value);
          return (
            <div 
              key={`item-${index}`} 
              onClick={() => toggleMood(entry.value)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                cursor: 'pointer',
                opacity: isHidden ? 0.3 : 1, // On grise le texte et l'icône si la courbe est masquée
                transition: 'opacity 0.2s ease'
              }}
            >
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: entry.color }}></div>
              <span style={{ color: entry.color, fontSize: '13px' }}>{entry.value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ width: '100%', height: 400, backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', marginTop: '2rem' }}>
      <h3 style={{ color: '#fff', textAlign: 'center', marginBottom: '1rem', marginTop: 0 }}>Évolution de la Météo Intérieure</h3>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 40, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          
          <XAxis dataKey="date" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} tickMargin={10} />
          <YAxis stroke="#888" domain={[0, 5]} tickCount={6} tick={{ fill: '#888' }} />
          
          <Tooltip 
            contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '8px', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
          />
          
          <Legend content={<CustomLegend />} verticalAlign="bottom" align="center" />

          {MOOD_CATEGORIES.map(mood => (
            <Line 
              key={mood}
              type="monotone" 
              dataKey={mood} 
              stroke={MOODS[mood]} 
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
              connectNulls={false} 
              hide={hiddenMoods.includes(mood)} // Cache la ligne si elle est dans la liste
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
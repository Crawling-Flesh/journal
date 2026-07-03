import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

const MOODS = {
  'Joie': '#ffd700', 'Colère': '#ff3333', 'Anxiété': '#aa00ff', 
  'Tristesse': '#0088ff', 'Dégoût': '#00cc44', 'Stress': '#ff8800', 
  'Anticipation': '#00e5ff', 'Confiance': '#a6ff00', 'Sérénité': '#e81099'
};
const MOOD_CATEGORIES = Object.keys(MOODS);

// Tooltip personnalisé pour un affichage propre
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: '#2a2a2a', border: '1px solid #444', padding: '10px', borderRadius: '8px', color: '#fff' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>
          {payload[0].payload.subject} : {payload[0].value} / 10
        </p>
      </div>
    );
  }
  return null;
};

export default function MoodRadarChart({ monthData }) {
  // 1. Isoler les jours où au moins une émotion a été encodée
  const validDays = monthData.meteo.filter(day => {
    return MOOD_CATEGORIES.some(mood => {
      const dbColumn = mood.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return day[dbColumn] > 0;
    });
  });

  const numValidDays = validDays.length;

  // 2. Calculer la moyenne pour chaque émotion
  const radarData = MOOD_CATEGORIES.map(mood => {
    const dbColumn = mood.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    let avg = 0;
    if (numValidDays > 0) {
      const sum = validDays.reduce((acc, day) => acc + (day[dbColumn] || 0), 0);
      avg = parseFloat((sum / numValidDays).toFixed(1));
    }

    return {
      subject: mood,
      valeur: avg,
      fullMark: 10
    };
  });

  return (
    <div style={{ width: '100%', height: 400, backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', marginTop: '2rem' }}>
      <h3 style={{ color: '#fff', textAlign: 'center', marginBottom: '1rem', marginTop: 0 }}>Empreinte émotionnelle du mois</h3>
      
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
          <PolarGrid stroke="#444" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#ccc', fontSize: 13 }} />
          {/* L'axe va de 0 à 10 pour correspondre à ton système de notation */}
          <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#888' }} axisLine={false} />
          
          <Radar 
            name="Moyenne" 
            dataKey="valeur" 
            stroke="var(--color-meteo, #ff3333)" 
            fill="var(--color-meteo, #ff3333)" 
            fillOpacity={0.5} 
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
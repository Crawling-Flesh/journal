import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns'
import { fr } from 'date-fns/locale'
import { supabase } from '../supabase'
import MeteoChart from './MeteoChart'
import ActivityChart from './ActivityChart'
import MoodRadarChart from './MoodRadarChart'

export default function GraphiquesPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  // On remplace meteoData par un objet contenant tout
  const [monthData, setMonthData] = useState({ journal: [], meteo: [], event: [], bonheur: [] })
  const [isLoading, setIsLoading] = useState(true)
  
  const [activeChart, setActiveChart] = useState('line') 

  const displayMonth = format(currentMonth, 'MMMM yyyy', { locale: fr })

  useEffect(() => {
    const fetchChartData = async () => {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const startStr = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
      const endStr = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

      // On récupère tout, comme pour la page Stats
      const [journalRes, meteoRes, eventRes, bonheurRes] = await Promise.all([
        supabase.from('journal').select('date').gte('date', startStr).lte('date', endStr).eq('user_id', user.id),
        supabase.from('meteo').select('*').gte('date', startStr).lte('date', endStr).eq('user_id', user.id),
        supabase.from('evenements').select('date').gte('date', startStr).lte('date', endStr).eq('user_id', user.id),
        supabase.from('bonheurs').select('date, items').gte('date', startStr).lte('date', endStr).eq('user_id', user.id)
      ])

      setMonthData({
        journal: journalRes.data || [],
        meteo: meteoRes.data || [],
        event: eventRes.data || [],
        bonheur: bonheurRes.data || []
      })
      setIsLoading(false)
    }

    fetchChartData()
  }, [currentMonth])

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  // Vérification si au moins un type de donnée existe pour ce mois
  const hasData = monthData.meteo.length > 0 || monthData.journal.length > 0 || monthData.event.length > 0 || monthData.bonheur.length > 0;

  return (
    <div className="stats-page-container">
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>Graphiques</h1>
      </div>

      <header className="month-navigator">
        <button onClick={goToPreviousMonth}>&lt;</button>
        <h2>{displayMonth}</h2>
        <button onClick={goToNextMonth}>&gt;</button>
      </header>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setActiveChart('line')}
          style={{
            padding: '8px 20px', borderRadius: '8px', cursor: 'pointer',
            backgroundColor: activeChart === 'line' ? '#00e5ff' : 'transparent',
            color: activeChart === 'line' ? '#000' : '#fff',
            border: '1px solid #00e5ff', fontWeight: activeChart === 'line' ? 'bold' : 'normal'
          }}
        >
          Courbes de météo
        </button>
        <button
          onClick={() => setActiveChart('bar')}
          style={{
            padding: '8px 20px', borderRadius: '8px', cursor: 'pointer',
            backgroundColor: activeChart === 'bar' ? '#00cc44' : 'transparent',
            color: activeChart === 'bar' ? '#000' : '#fff',
            border: '1px solid #00cc44', fontWeight: activeChart === 'bar' ? 'bold' : 'normal'
          }}
        >
          Activité
        </button>
        <button
          onClick={() => setActiveChart('radar')}
          style={{
            padding: '8px 20px', borderRadius: '8px', cursor: 'pointer',
            backgroundColor: activeChart === 'radar' ? '#ff3333' : 'transparent',
            color: activeChart === 'radar' ? '#000' : '#fff',
            border: '1px solid #ff3333', fontWeight: activeChart === 'radar' ? 'bold' : 'normal'
          }}
        >
          Radar des humeurs
        </button>
      </div>

      {isLoading ? (
        <p style={{ textAlign: 'center', color: '#888', marginTop: '2rem' }}>Chargement des données...</p>
      ) : hasData ? (
        <>
          {activeChart === 'line' && <MeteoChart meteoData={monthData.meteo} currentMonth={currentMonth} />}
          {activeChart === 'bar' && <ActivityChart monthData={monthData} currentMonth={currentMonth} />}
          {activeChart === 'radar' && <MoodRadarChart monthData={monthData} />}
        </>
      ) : (
        <p style={{ textAlign: 'center', color: '#888', marginTop: '2rem' }}>Aucune donnée pour ce mois.</p>
      )}
    </div>
  )
}
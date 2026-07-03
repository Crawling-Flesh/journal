import { useState, useEffect } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isFuture, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { supabase } from '../supabase'
import MonthSelectorModal from './MonthSelectorModal'
import DayDetailsModal from './DayDetailsModal'
import journalIcon from '../assets/journal.png'
import meteoIcon from '../assets/meteo.png'
import eventIcon from '../assets/event.png'
import StatsSummaryModal from './StatsSummaryModal'

const MOODS = {
  'Joie': '#ffd700', 
  'Colère': '#ff3333', 
  'Anxiété': '#aa00ff', 
  'Tristesse': '#0088ff', 
  'Dégoût': '#00cc44', 
  'Stress': '#ff8800', 
  'Anticipation': '#00e5ff', 
  'Confiance': '#a6ff00', 
  'Sérénité': '#e81099'
}
const MOOD_CATEGORIES = Object.keys(MOODS)

export default function StatsPage({ onNavigateToDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isMonthSelectorOpen, setIsMonthSelectorOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState('meteo')
  const [selectedDay, setSelectedDay] = useState(null)
  // NOUVEAU : On stocke toutes les données du mois ici
  const [monthData, setMonthData] = useState({ journal: [], meteo: [], event: [] })
  const [summaryModalType, setSummaryModalType] = useState(null)

  const displayMonth = format(currentMonth, 'MMMM yyyy', { locale: fr })

  const start = startOfMonth(currentMonth)
  const end = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start, end })

  // NOUVEAU : Récupération des données du mois
  useEffect(() => {
    const fetchMonthData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const startStr = format(start, 'yyyy-MM-dd')
      const endStr = format(end, 'yyyy-MM-dd')

      // Requêtes parallèles pour aller vite
      const [journalRes, meteoRes, eventRes] = await Promise.all([
        supabase.from('journal').select('date').gte('date', startStr).lte('date', endStr).eq('user_id', user.id),
        supabase.from('meteo').select('*').gte('date', startStr).lte('date', endStr).eq('user_id', user.id),
        supabase.from('evenements').select('date').gte('date', startStr).lte('date', endStr).eq('user_id', user.id)
      ])

      setMonthData({
        journal: journalRes.data || [],
        meteo: meteoRes.data || [],
        event: eventRes.data || []
      })
    }

    fetchMonthData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]) // Se recharge quand on change de mois

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  return (
    <div className="stats-page-container">
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>Statistiques</h1>
      </div>

      <header className="month-navigator">
        <button onClick={goToPreviousMonth}>&lt;</button>
        <h2 onClick={() => setIsMonthSelectorOpen(true)}>{displayMonth}</h2>
        <button onClick={goToNextMonth}>&gt;</button>
      </header>

      <div className="stats-filters">
        <button 
          className={`filter-btn journal ${activeFilter === 'journal' ? 'active' : ''}`}
          onClick={() => setActiveFilter('journal')}
          style={{ backgroundColor: 'var(--color-journal)' }}
        >
          <div className="custom-icon" style={{ WebkitMaskImage: `url(${journalIcon})`, backgroundColor: '#000' }}></div>
        </button>

        <button 
          className={`filter-btn meteo ${activeFilter === 'meteo' ? 'active' : ''}`}
          onClick={() => setActiveFilter('meteo')}
          style={{ backgroundColor: 'var(--color-meteo)' }}
        >
          <div className="custom-icon" style={{ WebkitMaskImage: `url(${meteoIcon})`, backgroundColor: '#000' }}></div>
        </button>

        <button 
          className={`filter-btn event ${activeFilter === 'event' ? 'active' : ''}`}
          onClick={() => setActiveFilter('event')}
          style={{ backgroundColor: 'var(--color-event)' }}
        >
          <div className="custom-icon" style={{ WebkitMaskImage: `url(${eventIcon})`, backgroundColor: '#000' }}></div>
        </button>
        {/* LA MODALE DE DÉTAILS */}
      {selectedDay && (
        <DayDetailsModal 
          date={selectedDay} 
          onClose={() => setSelectedDay(null)} 
        />
      )}
      </div>

      <div className="calendar-grid">
     {daysInMonth.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd')
          const isFutureDay = isFuture(day) && !isToday(day)
          
          const hasJournal = monthData.journal.some(j => j.date === dayStr)
          const hasEvent = monthData.event.some(e => e.date === dayStr)
          const dayMeteo = monthData.meteo.find(m => m.date === dayStr)

          // Construction dynamique des classes
          let squareClass = 'day-square'
          if (isFutureDay) squareClass += ' is-future'
          else squareClass += ' past-or-present'
          
          if (activeFilter === 'journal' && hasJournal) squareClass += ' has-journal'
          if (activeFilter === 'event' && hasEvent) squareClass += ' has-event'

          return (
            <div 
              key={day.toString()} 
              className={squareClass}
              onClick={() => setSelectedDay(day)}
            >
              {/* Affichage des couleurs Météo en arrière-plan du carré */}
{activeFilter === 'meteo' && dayMeteo && (
  <div className="meteo-stripes-container" style={{ opacity: isFutureDay ? 0.3 : 0.8 }}>
                  {MOOD_CATEGORIES.map(mood => {
                    // On affiche une bande de couleur uniquement si l'émotion a été scorée (> 0)
                    const moodValue = dayMeteo[mood.toLowerCase().replace('é', 'e').replace('è', 'e')] // Correspondance simple pour éviter les soucis d'accents avec la bdd si besoin, sinon on garde la clé exacte si tu as mis les accents en base.
                    
                    // Note : Dans notre table SQL, on avait créé les colonnes en minuscules sans accent (joie, colere, etc.)
                    // Donc on fait la conversion ici :
                    const dbColumn = mood.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    
                    if (dayMeteo[dbColumn] > 0) {
                      return <div key={mood} className="meteo-stripe" style={{ backgroundColor: MOODS[mood] }}></div>
                    }
                    return null
                  })}
                </div>
              )}

              {/* Le numéro du jour (z-index supérieur pour rester lisible par-dessus les couleurs) */}
              <span style={{ zIndex: 2, position: 'relative', textShadow: activeFilter === 'meteo' && dayMeteo ? '0 1px 3px rgba(0,0,0,0.8)' : 'none' }}>
                {format(day, 'd')}
              </span>
            </div>
          )
        })}
      </div>

      {/* BOUTONS DE BILANS */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
        <button 
          onClick={() => setSummaryModalType('month')}
          style={{ padding: '10px 20px', backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid #555', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Stats du mois
        </button>
        <button 
          onClick={() => setSummaryModalType('global')}
          style={{ padding: '10px 20px', backgroundColor: 'transparent', color: '#ddd', border: '1px solid #444', borderRadius: '8px', cursor: 'pointer' }}
        >
          Stats globales
        </button>
      </div>

      {isMonthSelectorOpen && (
        <MonthSelectorModal 
          currentDate={currentMonth}
          onSelect={(newDate) => setCurrentMonth(newDate)}
          onClose={() => setIsMonthSelectorOpen(false)}
          indicators={['journal', 'meteo', 'event']}
        />
      )}

      {/* LA MODALE DE DÉTAILS */}
      {selectedDay && (
        <DayDetailsModal 
          date={selectedDay} 
          onClose={() => setSelectedDay(null)} 
          onGoToDay={() => onNavigateToDate(selectedDay)}
        />
      )}

      {/* LA MODALE DE BILAN */}
      {summaryModalType && (
        <StatsSummaryModal 
          type={summaryModalType}
          currentDate={currentMonth}
          monthData={monthData}
          onClose={() => setSummaryModalType(null)}
        />
      )}
    </div>
  )
}
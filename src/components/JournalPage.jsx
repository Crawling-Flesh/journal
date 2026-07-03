import { useState, useEffect, useRef } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { supabase } from '../supabase'
import MonthSelectorModal from './MonthSelectorModal'

export default function JournalPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [entries, setEntries] = useState([])
  const [isMonthSelectorOpen, setIsMonthSelectorOpen] = useState(false)
  
  const bottomRef = useRef(null)
  const displayMonth = format(currentMonth, 'MMMM yyyy', { locale: fr })

  useEffect(() => {
    const fetchMonthEntries = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

      const { data } = await supabase
        .from('journal')
        .select('*')
        .gte('date', start)
        .lte('date', end)
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .order('created_at', { ascending: true })

      if (data) {
        setEntries(data)
      }
    }

    fetchMonthEntries()
  }, [currentMonth])

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView() 
    }
  }, [entries])

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  return (
    <div className="journal-page-container">
      
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>Journal</h1>
      </div>

      <header className="month-navigator">
        <button onClick={goToPreviousMonth}>&lt;</button>
        <h2 onClick={() => setIsMonthSelectorOpen(true)}>{displayMonth}</h2>
        <button onClick={goToNextMonth}>&gt;</button>
      </header>

      <div className="journal-feed custom-scrollbar">
        {entries.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', marginTop: '3rem' }}>
            Aucune entrée pour ce mois-ci.
          </p>
        ) : (
          entries.map(entry => {
            const dayDate = parseISO(entry.date)
            const timeDate = new Date(entry.created_at)
            
            // --- NOUVEAUTÉ : Vérification de l'écriture en différé ---
            // On extrait juste le composant "jour" de la date de création
            const createdDateString = format(timeDate, 'yyyy-MM-dd')
            // Si le jour de création est strictement supérieur au jour assigné, c'est du différé
            const isRetroactive = createdDateString > entry.date
            
            const formattedDate = `${format(dayDate, "dd MMMM yyyy", { locale: fr })} - ${format(timeDate, "HH'h'mm")}`
            
            return (
              <div key={entry.id}>
                <h4 className="feed-entry-date">
                  {formattedDate}
                  {/* Affichage conditionnel de la mention */}
                  {isRetroactive && (
                    <span style={{ fontSize: '0.85em', fontStyle: 'italic', color: '#888', marginLeft: '10px' }}>
                      (écrit à une date ultérieure)
                    </span>
                  )}
                </h4>
                <p className="feed-entry-text">{entry.texte}</p>
              </div>
            )
          })
        )}
        
        <div ref={bottomRef} style={{ height: '1px' }}></div>
      </div>
{/* MODALE DE SÉLECTION DE MOIS */}
      {isMonthSelectorOpen && (
        <MonthSelectorModal 
          currentDate={currentMonth}
          onSelect={(newDate) => setCurrentMonth(newDate)}
          onClose={() => setIsMonthSelectorOpen(false)}
          indicators={['journal']} 
        />
      )}
    </div>
  )
}
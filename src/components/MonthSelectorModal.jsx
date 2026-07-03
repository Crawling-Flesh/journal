import { useState, useEffect } from 'react'
import { setYear, setMonth } from 'date-fns'
import { supabase } from '../supabase'

export default function MonthSelectorModal({ currentDate, onSelect, onClose, indicators = ['journal'] }) {
  const [tempYear, setTempYear] = useState(currentDate.getFullYear())
  
  // On stocke les mois qui ont des données pour chaque catégorie
  const [monthsData, setMonthsData] = useState({ journal: [], meteo: [], event: [] })

  const months = [
    { name: 'Jan', index: 0 }, { name: 'Fév', index: 1 }, { name: 'Mar', index: 2 },
    { name: 'Avr', index: 3 }, { name: 'Mai', index: 4 }, { name: 'Juin', index: 5 },
    { name: 'Juil', index: 6 }, { name: 'Août', index: 7 }, { name: 'Sept', index: 8 },
    { name: 'Oct', index: 9 }, { name: 'Nov', index: 10 }, { name: 'Déc', index: 11 }
  ]

  useEffect(() => {
    const fetchYearData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const start = `${tempYear}-01-01`
      const end = `${tempYear}-12-31`

      // On prépare les requêtes uniquement pour les indicateurs demandés
      const promises = indicators.map(async (type) => {
        // Le nom de la table pour les événements est "evenements", les autres ont le même nom que le type
        const tableName = type === 'event' ? 'evenements' : type
        
        const { data } = await supabase
          .from(tableName)
          .select('date')
          .gte('date', start)
          .lte('date', end)
          .eq('user_id', user.id)

        if (data) {
          const uniqueMonths = new Set(data.map(item => parseInt(item.date.split('-')[1], 10) - 1))
          return { type, months: Array.from(uniqueMonths) }
        }
        return { type, months: [] }
      })

      // On exécute toutes les requêtes en même temps pour ne pas faire ralentir l'interface
      const results = await Promise.all(promises)
      
      const newData = { journal: [], meteo: [], event: [] }
      results.forEach(res => {
        newData[res.type] = res.months
      })
      
      setMonthsData(newData)
    }

    fetchYearData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempYear]) // On recharge les données uniquement quand l'année change

  const handleMonthClick = (monthIndex) => {
    let newDate = setYear(currentDate, tempYear)
    newDate = setMonth(newDate, monthIndex)
    
    onSelect(newDate)
    onClose()
  }

  const realToday = new Date()

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
      <div className="modal-content month-selector-modal" onClick={(e) => e.stopPropagation()}>
        
        <div className="year-header">
          <button onClick={() => setTempYear(tempYear - 1)}>&lt;</button>
          <span>{tempYear}</span>
          <button onClick={() => setTempYear(tempYear + 1)}>&gt;</button>
        </div>

        <div className="months-grid">
          {months.map((m) => {
            const isActive = tempYear === currentDate.getFullYear() && m.index === currentDate.getMonth()
            const isRealCurrent = tempYear === realToday.getFullYear() && m.index === realToday.getMonth()
            
            // Vérification des données pour ce mois précis
            const hasJournal = indicators.includes('journal') && monthsData.journal.includes(m.index)
            const hasMeteo = indicators.includes('meteo') && monthsData.meteo.includes(m.index)
            const hasEvent = indicators.includes('event') && monthsData.event.includes(m.index)

            let btnClass = "month-btn"
            if (isActive) btnClass += " active"
            if (isRealCurrent && !isActive) btnClass += " real-current"

            return (
              <button key={m.index} className={btnClass} onClick={() => handleMonthClick(m.index)}>
                {m.name}
                
                {/* Conteneur des points dynamiques */}
                <div className="dots-container">
                  {hasJournal && <div className="data-dot" style={{ backgroundColor: 'var(--color-journal)' }}></div>}
                  {hasMeteo && <div className="data-dot" style={{ backgroundColor: 'var(--color-meteo)' }}></div>}
                  {hasEvent && <div className="data-dot" style={{ backgroundColor: 'var(--color-event)' }}></div>}
                </div>
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
          <button onClick={onClose} style={{ padding: '8px 30px', cursor: 'pointer', backgroundColor: 'transparent', border: '1px solid #555', color: 'white', borderRadius: '6px' }}>
            Annuler
          </button>
        </div>

      </div>
    </div>
  )
}
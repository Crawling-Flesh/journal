import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { supabase } from '../supabase'

import journalIcon from '../assets/journal.png'
import meteoIcon from '../assets/meteo.png'
import eventIcon from '../assets/event.png'

const MOODS = {
  'Joie': '#ffd700', 'Colère': '#ff3333', 'Peur': '#aa00ff', 
  'Tristesse': '#0088ff', 'Dégoût': '#00cc44', 'Surprise': '#ff8800', 
  'Anticipation': '#00e5ff', 'Confiance': '#a6ff00', 'Sérénité': '#e81099'
}

export default function DayDetailsModal({ date, onClose, onGoToDay }) {
  const [dayData, setDayData] = useState({ journal: [], meteo: null, events: [] })
  const [isLoading, setIsLoading] = useState(true)
  
  const displayDate = format(date, 'EEEE d MMMM yyyy', { locale: fr })

  useEffect(() => {
    const fetchDayData = async () => {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const dateStr = format(date, 'yyyy-MM-dd')

      // On récupère toutes les données complètes de ce jour précis
      const [journalRes, meteoRes, eventRes] = await Promise.all([
        supabase.from('journal').select('*').eq('date', dateStr).eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('meteo').select('*').eq('date', dateStr).eq('user_id', user.id).single(), // single() car 1 seule météo max par jour
        supabase.from('evenements').select('*').eq('date', dateStr).eq('user_id', user.id).order('created_at', { ascending: true })
      ])

      setDayData({
        journal: journalRes.data || [],
        meteo: meteoRes.data || null,
        events: eventRes.data || []
      })
      setIsLoading(false)
    }

    fetchDayData()
  }, [date])

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
      <div className="modal-content day-details-modal custom-scrollbar" onClick={(e) => e.stopPropagation()}>
        
        <h2 style={{ textTransform: 'capitalize', textAlign: 'center', marginBottom: '2rem', color: '#fff' }}>
          {displayDate}
        </h2>

        {isLoading ? (
          <p style={{ textAlign: 'center', color: '#888' }}>Chargement des données...</p>
        ) : (
          <>
            {/* --- SECTION MÉTÉO --- */}
            {dayData.meteo && (
              <div className="detail-section">
                <div className="detail-section-header" style={{ color: 'var(--color-meteo)' }}>
                  <div className="custom-icon" style={{ WebkitMaskImage: `url(${meteoIcon})`, backgroundColor: 'var(--color-meteo)' }}></div>
                  Météo du jour
                </div>
                <div>
                  {Object.keys(MOODS).map(mood => {
                    const dbColumn = mood.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    const value = dayData.meteo[dbColumn]
                    if (value > 0) {
                      return (
                        <span key={mood} className="mood-badge" style={{ backgroundColor: MOODS[mood] }}>
                          {mood} ({value}/10)
                        </span>
                      )
                    }
                    return null
                  })}
                </div>
              </div>
            )}

            {/* --- SECTION ÉVÉNEMENTS --- */}
            {dayData.events.length > 0 && (
              <div className="detail-section">
                <div className="detail-section-header" style={{ color: 'var(--color-event)' }}>
                  <div className="custom-icon" style={{ WebkitMaskImage: `url(${eventIcon})`, backgroundColor: 'var(--color-event)' }}></div>
                  Événements
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {dayData.events.map(ev => (
                    <div key={ev.id} style={{ backgroundColor: '#222', padding: '10px', borderRadius: '6px' }}>
                      <strong style={{ color: '#fff' }}>{ev.titre}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- SECTION JOURNAL --- */}
            {dayData.journal.length > 0 && (
              <div className="detail-section">
                <div className="detail-section-header" style={{ color: 'var(--color-journal)' }}>
                  <div className="custom-icon" style={{ WebkitMaskImage: `url(${journalIcon})`, backgroundColor: 'var(--color-journal)' }}></div>
                  Journal
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {dayData.journal.map(entry => {
                    const time = format(new Date(entry.created_at), "HH'h'mm")
                    return (
                      <div key={entry.id} style={{ borderLeft: '3px solid var(--color-journal)', paddingLeft: '10px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '4px' }}>{time}</div>
                        <div style={{ color: '#ddd', whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>{entry.texte}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Message si tout est vide */}
            {!dayData.meteo && dayData.events.length === 0 && dayData.journal.length === 0 && (
              <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                Rien n'a été consigné ce jour-là.
              </p>
            )}
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
          <button onClick={onClose} style={{ padding: '8px 30px', cursor: 'pointer', backgroundColor: 'transparent', border: '1px solid #555', color: 'white', borderRadius: '6px' }}>
            Fermer
          </button>
          <button onClick={onGoToDay} style={{ padding: '8px 30px', cursor: 'pointer', backgroundColor: 'var(--color-journal)', border: 'none', color: '#000', borderRadius: '6px', fontWeight: 'bold' }}>
            Aller à ce jour
          </button>
        </div>

      </div>
    </div>
  )
}
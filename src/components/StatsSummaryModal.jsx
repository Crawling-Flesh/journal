import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { supabase } from '../supabase'

const MOODS = {
  'Joie': '#ffd700', 'Colère': '#ff3333', 'Peur': '#aa00ff', 
  'Tristesse': '#0088ff', 'Dégoût': '#00cc44', 'Surprise': '#ff8800', 
  'Anticipation': '#00e5ff', 'Confiance': '#a6ff00', 'Sérénité': '#e81099'
}
const MOOD_CATEGORIES = Object.keys(MOODS)

export default function StatsSummaryModal({ type, currentDate, monthData, onClose }) {
  const [loading, setLoading] = useState(type === 'global')
  const [stats, setStats] = useState({ journalCount: 0, eventCount: 0, averages: {} })

  useEffect(() => {
    const calculateAverages = (meteoArray) => {
      // 1. On identifie les jours "valides" (au moins une émotion > 0)
      const validDays = meteoArray.filter(day => {
        return MOOD_CATEGORIES.some(mood => {
          const dbColumn = mood.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          return day[dbColumn] > 0
        })
      })

      const numValidDays = validDays.length
      const averagesObj = {}

      // 2. On calcule la moyenne en divisant la somme totale par le nombre de jours valides
      MOOD_CATEGORIES.forEach(mood => {
        if (numValidDays === 0) {
          averagesObj[mood] = 0
        } else {
          const dbColumn = mood.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          const sum = validDays.reduce((acc, day) => acc + (day[dbColumn] || 0), 0)
          // On garde 1 chiffre après la virgule
          averagesObj[mood] = (sum / numValidDays).toFixed(1)
        }
      })

      return averagesObj
    }

    const processData = async () => {
      if (type === 'month') {
        // Mode MOIS : On utilise les données déjà téléchargées par StatsPage
        setStats({
          journalCount: monthData.journal.length,
          eventCount: monthData.event.length,
          averages: calculateAverages(monthData.meteo)
        })
      } else {
        // Mode GLOBAL : On requête la base de données
        const { data: { user } } = await supabase.auth.getUser()
        
        const [journalRes, eventRes, meteoRes] = await Promise.all([
          supabase.from('journal').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('evenements').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('meteo').select('*').eq('user_id', user.id)
        ])

        setStats({
          journalCount: journalRes.count || 0,
          eventCount: eventRes.count || 0,
          averages: calculateAverages(meteoRes.data || [])
        })
        setLoading(false)
      }
    }

    processData()
  }, [type, monthData])

  const title = type === 'month' 
    ? `Bilan de ${format(currentDate, 'MMMM yyyy', { locale: fr })}` 
    : "Bilan Global"

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
      <div className="modal-content stats-summary-modal custom-scrollbar" onClick={e => e.stopPropagation()}>
        <h2 style={{ textAlign: 'center', textTransform: 'capitalize', color: '#fff', marginBottom: '2rem' }}>
          {title}
        </h2>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#888' }}>Calcul en cours...</p>
        ) : (
          <>
            <div className="stats-cards-container">
              <div className="stat-card" style={{ borderColor: 'var(--color-journal)' }}>
                <h3 style={{ color: 'var(--color-journal)' }}>{stats.journalCount}</h3>
                <p>Entrées</p>
              </div>
              <div className="stat-card" style={{ borderColor: 'var(--color-event)' }}>
                <h3 style={{ color: 'var(--color-event)' }}>{stats.eventCount}</h3>
                <p>Événements</p>
              </div>
            </div>

            <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', border: '1px solid #333' }}>
              <h4 style={{ color: '#fff', margin: '0 0 15px 0', textAlign: 'center' }}>Moyenne des ressentis</h4>
              
              <div className="mood-averages-list">
                {MOOD_CATEGORIES.map(mood => {
                  const avg = stats.averages[mood] || 0
                  const percentage = (avg / 10) * 100 // Convertit la note sur 10 en % pour la barre

                  return (
                    <div key={mood} className="mood-average-item">
                      <div className="mood-label">{mood}</div>
                      <div className="mood-bar-bg">
                        <div 
                          className="mood-bar-fill" 
                          style={{ width: `${percentage}%`, backgroundColor: MOODS[mood] }}
                        ></div>
                      </div>
                      <div className="mood-value">{avg}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
          <button onClick={onClose} style={{ padding: '8px 30px', cursor: 'pointer', backgroundColor: 'transparent', border: '1px solid #555', color: 'white', borderRadius: '6px' }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
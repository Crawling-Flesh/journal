import { useState, useEffect } from 'react'
import { format, addDays, subDays, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { supabase } from '../supabase' // Connexion à la base de données

import meteoIcon from '../assets/meteo.png'
import journalIcon from '../assets/journal.png'
import eventIcon from '../assets/event.png'
import JournalListModal from './JournalListModal'
import EventListModal from './EventListModal'
import bonheurIcon from '../assets/bonheur.png';
import BonheurModal from './BonheurModal';

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

const MOOD_POSITIONS = {
  'Joie': '0% 0%', 'Colère': '50% 0%', 'Anxiété': '100% 0%',
  'Tristesse': '0% 50%', 'Dégoût': '50% 50%', 'Stress': '100% 50%',
  'Anticipation': '0% 100%', 'Confiance': '50% 100%', 'Sérénité': '100% 100%'
}

const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function DailyView({ targetDate }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  // Si targetDate change (quand on vient des stats), on met à jour la date affichée
  useEffect(() => {
    if (targetDate) {
      setCurrentDate(targetDate)
    }
  }, [targetDate])
  const [activeModal, setActiveModal] = useState(null)
  const [isFabOpen, setIsFabOpen] = useState(false)
  
  // --- ÉTATS DES DONNÉES DE LA PAGE ---
  const [hasJournal, setHasJournal] = useState(false)
  const [eventsCount, setEventsCount] = useState(0)

  // États des formulaires
  const [journalText, setJournalText] = useState('')
  const [meteoValues, setMeteoValues] = useState(MOOD_CATEGORIES.reduce((acc, mood) => ({ ...acc, [mood]: 0 }), {}))
  const [eventName, setEventName] = useState('')
  const [eventTags, setEventTags] = useState({ avant: [], pendant: [], apres: [] })

const [currentUser, setCurrentUser] = useState(null); // On sauvegarde l'utilisateur pour la modale
  const [hasBonheurs, setHasBonheurs] = useState(false);

  // --- LE CHARGEMENT DES DONNÉES (S'exécute quand la date change) ---
  useEffect(() => {
    const loadDayData = async () => {
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUser(user)

      // 1. Charger la météo du jour
      const { data: meteoData } = await supabase
        .from('meteo')
        .select('*')
        .eq('date', dateStr)
        .eq('user_id', user.id)
        .maybeSingle() // maybeSingle car on peut ne rien avoir ce jour-là

      if (meteoData) {
      setMeteoValues({
        'Joie': meteoData.joie, 'Colère': meteoData.colere, 'Anxiété': meteoData.anxiete,
        'Tristesse': meteoData.tristesse, 'Dégoût': meteoData.degout, 'Stress': meteoData.stress,
        'Anticipation': meteoData.anticipation, 'Confiance': meteoData.confiance, 'Sérénité': meteoData.serenite
      })
    } else {
        // Remise à zéro si pas de données
        setMeteoValues(MOOD_CATEGORIES.reduce((acc, mood) => ({ ...acc, [mood]: 0 }), {}))
      }

      // 2. Vérifier s'il y a des entrées de journal
      const { count: jCount } = await supabase
        .from('journal')
        .select('*', { count: 'exact', head: true })
        .eq('date', dateStr)
        .eq('user_id', user.id)
      
      setHasJournal(jCount > 0)

      // 3. Compter les événements du jour
      const { count: eCount } = await supabase
        .from('evenements')
        .select('*', { count: 'exact', head: true })
        .eq('date', dateStr)
        .eq('user_id', user.id)
      
      setEventsCount(eCount || 0)

      // 4. Vérifier s'il y a des petits bonheurs
      const { data: bonheurData } = await supabase
        .from('bonheurs')
        .select('items')
        .eq('date', dateStr)
        .eq('user_id', user.id)
        .maybeSingle()

      setHasBonheurs(bonheurData && bonheurData.items && bonheurData.items.length > 0)
    }

    loadDayData()
  }, [currentDate]) // Le tableau de dépendances : on relance la fonction si currentDate change

  // --- FONCTIONS DE SAUVEGARDE ---
  const handleSaveJournal = async () => {
    if (!journalText.trim()) return
    const dateStr = format(currentDate, 'yyyy-MM-dd')
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('journal').insert({
      user_id: user.id,
      date: dateStr,
      texte: journalText
    })

    setJournalText('')
    setHasJournal(true)
    setActiveModal(null)
  }

  const handleSaveMeteo = async () => {
    const dateStr = format(currentDate, 'yyyy-MM-dd')
    const { data: { user } } = await supabase.auth.getUser()

    // Upsert = Update si la ligne existe (même date), Insert si elle n'existe pas
    await supabase.from('meteo').upsert({
      user_id: user.id,
      date: dateStr,
      joie: meteoValues['Joie'], colere: meteoValues['Colère'], anxiete: meteoValues['Anxiété'],
      tristesse: meteoValues['Tristesse'], degout: meteoValues['Dégoût'], stress: meteoValues['Stress'],
      anticipation: meteoValues['Anticipation'], confiance: meteoValues['Confiance'], serenite: meteoValues['Sérénité']
    }, { onConflict: 'user_id, date' })

    setActiveModal(null)
  }

  const handleSaveEvent = async () => {
    if (!eventName.trim()) return
    const dateStr = format(currentDate, 'yyyy-MM-dd')
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('evenements').insert({
      user_id: user.id,
      date: dateStr,
      titre: eventName,
      tags_avant: eventTags.avant,
      tags_pendant: eventTags.pendant,
      tags_apres: eventTags.apres
    })

    setEventName('')
    setEventTags({ avant: [], pendant: [], apres: [] })
    setEventsCount(prev => prev + 1)
    setActiveModal(null)
  }

  // --- LOGIQUE UI & NAVIGATION ---
  const dayName = format(currentDate, 'E', { locale: fr })
  const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1)
  const restOfDate = format(currentDate, 'dd MMMM yy', { locale: fr })
  const displayDateCard = `${capitalizedDay} ${restOfDate}`

  const goToPreviousDay = () => setCurrentDate(subDays(currentDate, 1))
  const goToNextDay = () => setCurrentDate(addDays(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  const updateMeteoValue = (mood, delta) => {
    setMeteoValues(prev => {
      const newValue = prev[mood] + delta
      if (newValue >= 0 && newValue <= 5) return { ...prev, [mood]: newValue }
      return prev
    })
  }

  const toggleEventTag = (phase, mood) => {
    setEventTags(prev => {
      const currentTags = prev[phase]
      return currentTags.includes(mood) 
        ? { ...prev, [phase]: currentTags.filter(t => t !== mood) }
        : { ...prev, [phase]: [...currentTags, mood] }
    })
  }

  const openModal = (type) => {
    setActiveModal(type)
    setIsFabOpen(false)
  }

  const generateBackgroundStyle = () => {
    const activeGradients = []
    MOOD_CATEGORIES.forEach(mood => {
      const value = meteoValues[mood]
      if (value > 0) {
        const position = MOOD_POSITIONS[mood]
        const alpha = 0.1 + (value * 0.1) 
        const size = 30 + (value * 10)    
        const colorStart = hexToRgba(MOODS[mood], alpha)
        const colorEnd = hexToRgba(MOODS[mood], 0)
        activeGradients.push(`radial-gradient(circle at ${position}, ${colorStart} 0%, ${colorEnd} ${size}%)`)
      }
    })
    if (activeGradients.length === 0) return { backgroundColor: '#33333a' }
    activeGradients.push('linear-gradient(#413e58, #38373b)')
    return { backgroundImage: activeGradients.join(', ') }
  }

  const cardBackgroundStyle = generateBackgroundStyle()

  return (
    <div className="daily-view-container" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '1.5rem', minHeight: '30px' }}>
        {isToday(currentDate) ? (
          <span style={{ fontSize: '1rem', color: '#666' }}>Aujourd'hui</span>
        ) : (
          <button onClick={goToToday} style={{ fontSize: '0.9rem', padding: '5px 15px', cursor: 'pointer', backgroundColor: 'transparent', border: '1px solid #444', color: '#aaa', borderRadius: '4px' }}>
            Revenir à aujourd'hui
          </button>
        )}
      </div>

      <div className="date-navigation-container">
        <button onClick={goToPreviousDay} className="nav-arrow">◀</button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: '450px' }}>
          
          <div className="day-card" style={cardBackgroundStyle}>
            <div className="day-card-date">{displayDateCard}</div>
            
<div 
  className="card-icon left custom-icon" 
  style={{ WebkitMaskImage: `url(${journalIcon})`, backgroundColor: hasJournal ? 'var(--color-journal)' : '#ffffff', cursor: 'pointer' }}
  onClick={() => setActiveModal('journalList')}
></div>
            
<div 
  className="card-icon center custom-icon"
  style={{ 
    WebkitMaskImage: `url(${bonheurIcon})`, 
    backgroundColor: hasBonheurs ? '#ffd700' : '#ffffff', /* Jaune si actif, blanc par défaut */
    cursor: 'pointer' 
  }}
  onClick={() => setActiveModal('bonheur')}
></div>

            <div 
  className="card-icon right custom-icon" 
  style={{ WebkitMaskImage: `url(${eventIcon})`, backgroundColor: eventsCount > 0 ? 'var(--color-event)' : '#ffffff', cursor: 'pointer' }}
  onClick={() => setActiveModal('eventList')}
></div>
          </div>

          <div className="fab-container">
            <button className={`fab-main ${isFabOpen ? 'open' : ''}`} onClick={() => setIsFabOpen(!isFabOpen)}>+</button>
            
            <div className={`fab-menu ${isFabOpen ? 'open' : ''}`}>
                           <button className="fab-item" style={{ backgroundColor: 'var(--color-meteo)' }} onClick={() => openModal('meteo')}>
                <div className="custom-icon" style={{ WebkitMaskImage: `url(${meteoIcon})`, backgroundColor: '#000' }}></div>
              </button>
               <button className="fab-item" style={{ backgroundColor: 'var(--color-journal)' }} onClick={() => openModal('journal')}>
                <div className="custom-icon" style={{ WebkitMaskImage: `url(${journalIcon})`, backgroundColor: '#000' }}></div>
              </button>
              <button className="fab-item" style={{ backgroundColor: 'var(--color-event)' }} onClick={() => openModal('event')}>
                <div className="custom-icon" style={{ WebkitMaskImage: `url(${eventIcon})`, backgroundColor: '#000' }}></div>
              </button>
              <button className="fab-item" style={{ backgroundColor: '#ffd700' }} onClick={() => openModal('bonheur')}>
  <div className="custom-icon" style={{ WebkitMaskImage: `url(${bonheurIcon})`, backgroundColor: '#000' }}></div>
</button>
            </div>
          </div>
        </div>

        <button onClick={goToNextDay} className="nav-arrow">▶</button>
      </div>

      {(activeModal === 'journal' || activeModal === 'meteo' || activeModal === 'event') && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto', borderTop: `4px solid var(--color-${activeModal})` }}>
            
            {activeModal === 'journal' && (
              <>
                <h3 style={{ color: 'var(--color-journal)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="custom-icon" style={{ WebkitMaskImage: `url(${journalIcon})`, backgroundColor: 'var(--color-journal)' }}></div>
                  Nouvelle entrée de journal
                </h3>
                <textarea className="journal-textarea" placeholder="Que s'est-il passé aujourd'hui ?" value={journalText} onChange={(e) => setJournalText(e.target.value)} autoFocus />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button onClick={() => setActiveModal(null)} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: 'transparent', border: '1px solid #555', color: 'white', borderRadius: '6px' }}>Annuler</button>
                  <button onClick={handleSaveJournal} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: `var(--color-journal)`, border: 'none', color: '#000', borderRadius: '6px', fontWeight: 'bold' }}>Sauvegarder</button>
                </div>
              </>
            )}

            {activeModal === 'meteo' && (
              <>
                <h3 style={{ color: 'var(--color-meteo)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="custom-icon" style={{ WebkitMaskImage: `url(${meteoIcon})`, backgroundColor: 'var(--color-meteo)' }}></div>
                  Météo Intérieure
                </h3>
                <div>
                  {MOOD_CATEGORIES.map(mood => {
                    const value = meteoValues[mood]
                    const color = MOODS[mood]
                    const fillPercentage = (value / 5) * 100
                    const fillOpacity = 0.2 + (value * 0.16)

                    return (
                      <div key={mood} className="gauge-row">
                        <span className="gauge-label">{mood}</span>
                        <div className="gauge-core">
                          <span className="gauge-value">{value}</span>
                          <div className="gauge-pill" style={{ borderColor: color }}>
                            <div className="gauge-fill" style={{ backgroundColor: color, width: `${fillPercentage}%`, opacity: fillOpacity }}></div>
                            <button className="gauge-btn" onClick={() => updateMeteoValue(mood, -1)}>-</button>
                            <button className="gauge-btn" onClick={() => updateMeteoValue(mood, 1)}>+</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button onClick={() => setActiveModal(null)} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: 'transparent', border: '1px solid #555', color: 'white', borderRadius: '6px' }}>Annuler</button>
                  <button onClick={handleSaveMeteo} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: `var(--color-meteo)`, border: 'none', color: '#000', borderRadius: '6px', fontWeight: 'bold' }}>Sauvegarder</button>
                </div>
              </>
            )}

            {activeModal === 'event' && (
              <>
                <h3 style={{ color: 'var(--color-event)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="custom-icon" style={{ WebkitMaskImage: `url(${eventIcon})`, backgroundColor: 'var(--color-event)' }}></div>
                  Nouvel Événement {eventsCount > 0 && `(Déjà ${eventsCount} aujourd'hui)`}
                </h3>
                <input type="text" className="event-input" placeholder="Titre de l'événement..." value={eventName} onChange={(e) => setEventName(e.target.value)} autoFocus />
                {['avant', 'pendant', 'apres'].map(phase => (
                  <div key={phase} className="event-section">
                    <h4>Météo {phase} l'événement</h4>
                    <div className="tags-container">
                      {MOOD_CATEGORIES.map(mood => {
                        const isActive = eventTags[phase].includes(mood)
                        const moodColor = MOODS[mood]
                        return (
                          <button key={mood} className="tag-btn" style={{ borderColor: isActive ? moodColor : '#555', backgroundColor: isActive ? `${moodColor}33` : 'transparent', color: isActive ? '#fff' : '#aaa' }} onClick={() => toggleEventTag(phase, mood)}>
                            {mood}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button onClick={() => setActiveModal(null)} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: 'transparent', border: '1px solid #555', color: 'white', borderRadius: '6px' }}>Annuler</button>
                  <button onClick={handleSaveEvent} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: `var(--color-event)`, border: 'none', color: '#000', borderRadius: '6px', fontWeight: 'bold' }}>Sauvegarder</button>
                </div>
              </>
            )}

          </div>
          
        </div>
      )}
      
      {activeModal === 'journalList' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <JournalListModal 
            currentDate={currentDate} 
            onClose={() => setActiveModal(null)} 
            onListEmpty={() => setHasJournal(false)}
          />
        </div>
      )}

      {activeModal === 'eventList' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <EventListModal 
            currentDate={currentDate} 
            onClose={() => setActiveModal(null)} 
            onListEmpty={() => setEventsCount(0)}
          />
        </div>
      )}
      {activeModal === 'bonheur' && currentUser && (
        <BonheurModal 
          isOpen={activeModal === 'bonheur'}
          onClose={() => setActiveModal(null)}
          dateStr={format(currentDate, 'yyyy-MM-dd')}
          user={currentUser}
          onSaveSuccess={(hasItems) => setHasBonheurs(hasItems)}
        />
      )}
    </div>
  )
}
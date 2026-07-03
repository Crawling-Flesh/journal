import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { supabase } from '../supabase'

import eventIcon from '../assets/event.png'
import ConfirmModal from './ConfirmModal'

const MOODS = {
  'Joie': '#ffd700', 'Colère': '#ff3333', 'Anxiété': '#aa00ff', 
  'Tristesse': '#0088ff', 'Dégoût': '#00cc44', 'Stress': '#ff8800', 
  'Anticipation': '#00e5ff', 'Confiance': '#a6ff00', 'Sérénité': '#e81099'
}
const MOOD_CATEGORIES = Object.keys(MOODS)

export default function EventListModal({ currentDate, onClose, onListEmpty }) {
  const [events, setEvents] = useState([])
  const displayDate = format(currentDate, 'dd MMMM yyyy', { locale: fr })

  // États pour l'édition et la suppression
  const [editingEvent, setEditingEvent] = useState(null)
  const [eventToDelete, setEventToDelete] = useState(null)
  
  // États temporaires du formulaire d'édition
  const [editName, setEditName] = useState('')
  const [editTags, setEditTags] = useState({ avant: [], pendant: [], apres: [] })

  useEffect(() => {
    const fetchEvents = async () => {
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      const { data: { user } } = await supabase.auth.getUser()

      const { data } = await supabase
        .from('evenements')
        .select('*')
        .eq('date', dateStr)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (data) setEvents(data)
    }
    fetchEvents()
  }, [currentDate])

  // --- LOGIQUE DE SUPPRESSION ---
  const executeDelete = async () => {
    if (!eventToDelete) return
    await supabase.from('evenements').delete().eq('id', eventToDelete)
    
    const remainingEvents = events.filter(e => e.id !== eventToDelete)
    setEvents(remainingEvents)
    setEventToDelete(null)
    setEditingEvent(null) // Ferme le mode édition si on vient de supprimer

    if (remainingEvents.length === 0) onListEmpty()
  }

  // --- LOGIQUE D'ÉDITION ---
  const openEditMode = (event) => {
    setEditingEvent(event.id)
    setEditName(event.titre)
    setEditTags({
      avant: event.tags_avant || [],
      pendant: event.tags_pendant || [],
      apres: event.tags_apres || []
    })
  }

  const toggleEditTag = (phase, mood) => {
    setEditTags(prev => {
      const currentTags = prev[phase]
      return currentTags.includes(mood) 
        ? { ...prev, [phase]: currentTags.filter(t => t !== mood) }
        : { ...prev, [phase]: [...currentTags, mood] }
    })
  }

  const handleSaveEdit = async () => {
    if (!editName.trim()) return

    await supabase.from('evenements').update({
      titre: editName,
      tags_avant: editTags.avant,
      tags_pendant: editTags.pendant,
      tags_apres: editTags.apres
    }).eq('id', editingEvent)
    
    // Mise à jour de la liste locale
    setEvents(events.map(e => e.id === editingEvent ? { 
      ...e, titre: editName, tags_avant: editTags.avant, tags_pendant: editTags.pendant, tags_apres: editTags.apres 
    } : e))
    
    setEditingEvent(null) // Retour à la liste
  }

  // --- UTILITAIRE VISUEL ---
  // Fonction pour générer la barre de couleur (haut ou bas)
  const renderColorBar = (tagsArray) => {
    if (!tagsArray || tagsArray.length === 0) return <div className="event-color-bar"></div>
    return (
      <div className="event-color-bar">
        {tagsArray.map((mood, idx) => (
          <div key={idx} className="event-color-segment" style={{ backgroundColor: MOODS[mood] }}></div>
        ))}
      </div>
    )
  }

  return (
    <div className="modal-content journal-list-modal" onClick={(e) => e.stopPropagation()}>
      
      {/* En-tête dynamique selon le mode */}
      <h3 style={{ color: 'var(--color-event)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="custom-icon" style={{ WebkitMaskImage: `url(${eventIcon})`, backgroundColor: 'var(--color-event)' }}></div>
        {editingEvent ? "Modifier l'événement" : `Événements du jour - ${displayDate}`}
      </h3>

      {editingEvent ? (
        /* --- MODE ÉDITION --- */
        <div className="custom-scrollbar" style={{ overflowY: 'auto', paddingRight: '10px' }}>
          <input type="text" className="event-input" placeholder="Titre de l'événement..." value={editName} onChange={(e) => setEditName(e.target.value)} />
          
          {['avant', 'pendant', 'apres'].map(phase => (
            <div key={phase} className="event-section">
              <h4>Météo {phase} l'événement</h4>
              <div className="tags-container">
                {MOOD_CATEGORIES.map(mood => {
                  const isActive = editTags[phase].includes(mood)
                  const moodColor = MOODS[mood]
                  return (
                    <button key={mood} className="tag-btn" style={{ borderColor: isActive ? moodColor : '#555', backgroundColor: isActive ? `${moodColor}33` : 'transparent', color: isActive ? '#fff' : '#aaa' }} onClick={() => toggleEditTag(phase, mood)}>
                      {mood}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
             <button onClick={() => setEventToDelete(editingEvent)} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#ff3333', border: 'none', color: 'white', borderRadius: '6px', marginRight: 'auto', fontWeight: 'bold' }}>Supprimer</button>
             <button onClick={() => setEditingEvent(null)} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: 'transparent', border: '1px solid #555', color: 'white', borderRadius: '6px' }}>Annuler</button>
             <button onClick={handleSaveEdit} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: `var(--color-event)`, border: 'none', color: '#000', borderRadius: '6px', fontWeight: 'bold' }}>Sauvegarder</button>
          </div>
        </div>
      ) : (
        /* --- MODE LISTE --- */
        <>
          <div className="event-list-container custom-scrollbar">
            {events.length === 0 ? (
              <p style={{ color: '#aaa', textAlign: 'center', marginTop: '2rem' }}>Aucun événement pour ce jour.</p>
            ) : (
              events.map(event => (
                <div key={event.id} className="event-list-item" onClick={() => openEditMode(event)}>
                  {/* Barre supérieure (Avant) */}
                  {renderColorBar(event.tags_avant)}
                  
                  {/* Titre au centre */}
                  <div className="event-title-bar">{event.titre}</div>
                  
                  {/* Barre inférieure (Après) */}
                  {renderColorBar(event.tags_apres)}
                </div>
              ))
            )}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
            <button onClick={onClose} style={{ padding: '8px 30px', cursor: 'pointer', backgroundColor: 'transparent', border: '1px solid #555', color: 'white', borderRadius: '6px' }}>
              Fermer
            </button>
          </div>
        </>
      )}

      {/* MODALE DE CONFIRMATION DE SUPPRESSION */}
      {eventToDelete && (
        <ConfirmModal 
          message="Es-tu sûr de vouloir supprimer cet événement ?"
          onConfirm={executeDelete}
          onCancel={() => setEventToDelete(null)}
        />
      )}

    </div>
  )
}
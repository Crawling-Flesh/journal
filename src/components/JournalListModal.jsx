import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { supabase } from '../supabase'
import ConfirmModal from './ConfirmModal'

// Import des icônes
import journalIcon from '../assets/journal.png'
import editIcon from '../assets/edit.png'
import deleteIcon from '../assets/delete.png'

export default function JournalListModal({ currentDate, onClose, onListEmpty }) {
  const [entries, setEntries] = useState([])
  const [selectedEntryId, setSelectedEntryId] = useState(null)
  
  // Nouveaux états pour le mode édition
  const [editingEntryId, setEditingEntryId] = useState(null)
  const [editText, setEditText] = useState('')
  const [entryToDelete, setEntryToDelete] = useState(null)

  const displayDate = format(currentDate, 'dd MMMM yyyy', { locale: fr })

  useEffect(() => {
    const fetchEntries = async () => {
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      const { data: { user } } = await supabase.auth.getUser()

      const { data } = await supabase
        .from('journal')
        .select('*')
        .eq('date', dateStr)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (data) setEntries(data)
    }
    fetchEntries()
  }, [currentDate])

  const executeDelete = async () => {
    if (!entryToDelete) return

    await supabase.from('journal').delete().eq('id', entryToDelete)
    
    const remainingEntries = entries.filter(e => e.id !== entryToDelete)
    setEntries(remainingEntries)
    setEntryToDelete(null) // Ferme la fenêtre de confirmation

    if (remainingEntries.length === 0) {
      onListEmpty()
    }
  }

  // Active le mode édition
  const handleStartEdit = (entry) => {
    setEditingEntryId(entry.id)
    setEditText(entry.texte)
  }

  // Sauvegarde la modification en base de données
  const handleSaveEdit = async (id) => {
    if (!editText.trim()) return

    await supabase.from('journal').update({ texte: editText }).eq('id', id)
    
    // Met à jour l'affichage local sans avoir à recharger toute la page
    setEntries(entries.map(e => e.id === id ? { ...e, texte: editText } : e))
    setEditingEntryId(null) // Quitte le mode édition
  }

  return (
    <div className="modal-content journal-list-modal" onClick={(e) => e.stopPropagation()}>
      <h3 style={{ color: 'var(--color-journal)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="custom-icon" style={{ WebkitMaskImage: `url(${journalIcon})`, backgroundColor: 'var(--color-journal)' }}></div>
        Entrées du jour - {displayDate}
      </h3>

      <div className="journal-entries-container custom-scrollbar">
        {entries.length === 0 ? (
          <p style={{ color: '#aaa', textAlign: 'center', marginTop: '2rem' }}>Aucune entrée de journal pour ce jour.</p>
        ) : (
          entries.map(entry => {
            const time = format(new Date(entry.created_at), "HH'h'mm")
            // On ne peut sélectionner une entrée que si on n'est pas déjà en train d'en éditer une
            const isSelected = selectedEntryId === entry.id && editingEntryId === null
            const isEditing = editingEntryId === entry.id

            return (
              <div 
                key={entry.id} 
                className={`journal-entry-item ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  if (editingEntryId === null) {
                    setSelectedEntryId(isSelected ? null : entry.id)
                  }
                }}
              >
                <h4 className="entry-time" style={{ color: 'var(--color-journal)' }}>{time}</h4>
                
                {/* MODE AFFICHAGE OU MODE ÉDITION */}
                {isEditing ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    <textarea 
                      className="edit-textarea" 
                      value={editText} 
                      onChange={(e) => setEditText(e.target.value)} 
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button onClick={() => setEditingEntryId(null)} style={{ padding: '5px 10px', backgroundColor: 'transparent', border: '1px solid #555', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>Annuler</button>
                      <button onClick={() => handleSaveEdit(entry.id)} style={{ padding: '5px 10px', backgroundColor: '#d4af37', border: 'none', color: '#000', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Enregistrer</button>
                    </div>
                  </div>
                ) : (
                  <p className="entry-text">{entry.texte}</p>
                )}

                {/* BOUTONS D'ACTION FLOTTANTS */}
                {isSelected && (
                  <div className="entry-actions">
                    <button className="action-btn edit" onClick={(e) => { e.stopPropagation(); handleStartEdit(entry); }}>
                      <div className="custom-icon" style={{ WebkitMaskImage: `url(${editIcon})`, backgroundColor: '#000', width: '18px', height: '18px' }}></div>
                    </button>
                    <button className="action-btn delete" onClick={(e) => { e.stopPropagation(); setEntryToDelete(entry.id); }}>
                      <div className="custom-icon" style={{ WebkitMaskImage: `url(${deleteIcon})`, backgroundColor: '#fff', width: '18px', height: '18px' }}></div>
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
        <button onClick={onClose} style={{ padding: '8px 30px', cursor: 'pointer', backgroundColor: 'transparent', border: '1px solid #555', color: 'white', borderRadius: '6px' }}>
          Fermer
        </button>
      </div>
      {/* LA FENÊTRE DE CONFIRMATION */}
      {entryToDelete && (
        <ConfirmModal 
          message="Es-tu sûr de vouloir supprimer cette entrée ?"
          onConfirm={executeDelete}
          onCancel={() => setEntryToDelete(null)}
        />
      )}
    </div>
  )
}
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import deleteIcon from '../assets/delete.png'
import bonheurIcon from '../assets/bonheur.png';

const BonheurModal = ({ isOpen, onClose, dateStr, user, onSaveSuccess }) => {
  // On initialise avec 5 lignes vides
  const defaultBonheurs = ["", "", "", "", ""];
  const [bonheurs, setBonheurs] = useState(defaultBonheurs);
  const [isSaving, setIsSaving] = useState(false);

  // Charger les données quand la modale s'ouvre
  useEffect(() => {
    if (!isOpen || !user || !dateStr) return;

    const fetchBonheurs = async () => {
      const { data, error } = await supabase
        .from('bonheurs')
        .select('items')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .maybeSingle();

      if (data && data.items && data.items.length > 0) {
        // On s'assure d'afficher au moins 5 champs, même si la BDD en a moins
        let loadedItems = [...data.items];
        while (loadedItems.length < 5) {
          loadedItems.push("");
        }
        setBonheurs(loadedItems);
      } else {
        setBonheurs(defaultBonheurs);
      }
    };

    fetchBonheurs();
  }, [isOpen, dateStr, user]);

  const handleChange = (index, value) => {
    const newBonheurs = [...bonheurs];
    newBonheurs[index] = value;
    setBonheurs(newBonheurs);
  };

  const addLine = () => {
    setBonheurs([...bonheurs, ""]);
  };

  const removeLine = (indexToRemove) => {
    // On filtre le tableau pour garder toutes les lignes SAUF celle cliquée
    const newBonheurs = bonheurs.filter((_, index) => index !== indexToRemove);
    setBonheurs(newBonheurs);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // On ne garde que les lignes qui contiennent du texte
    const filteredBonheurs = bonheurs.filter(b => b.trim() !== "");

    const { error } = await supabase.from('bonheurs').upsert({
      user_id: user.id,
      date: dateStr,
      items: filteredBonheurs
    }, { onConflict: 'user_id, date' });

    setIsSaving(false);

    if (!error) {
      // On prévient le composant parent (DailyView) pour qu'il allume ou éteigne l'icône jaune
      onSaveSuccess(filteredBonheurs.length > 0);
      onClose();
    } else {
      console.error("Erreur lors de la sauvegarde :", error);
    }
  };

  if (!isOpen) return null;

return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxHeight: '90vh', 
          overflowY: 'auto', 
          borderTop: `4px solid #ffd700`,
          maxWidth: '500px'
        }}
      >
        
        {/* --- LE TITRE EXACTEMENT COMME LE JOURNAL --- */}
        <h3 style={{ color: '#ffd700', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="custom-icon" style={{ WebkitMaskImage: `url(${bonheurIcon})`, backgroundColor: '#ffd700' }}></div>
          Petits Bonheurs
        </h3>
        
        {/* --- LA LISTE DES CHAMPS ET LES POUBELLES --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', marginTop: '20px' }}>
          {bonheurs.map((bonheur, index) => (
            <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                value={bonheur}
                onChange={(e) => handleChange(index, e.target.value)}
                placeholder="Un petit bonheur du jour..."
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #444',
                  backgroundColor: 'transparent', // Transparent pour coller à ton textarea
                  color: '#fff',
                  outline: 'none' // Enlève la bordure bleue par défaut au clic
                }}
              />
              <button 
                onClick={() => removeLine(index)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '5px'
                }}
                title="Supprimer la ligne"
              >
                <div 
                  className="custom-icon" 
                  style={{ 
                    WebkitMaskImage: `url(${deleteIcon})`, 
                    backgroundColor: '#ff3333', 
                    width: '16px', // Plus petit que les icônes standards
                    height: '16px' 
                  }}
                ></div>
              </button>
            </div>
          ))}
        </div>

        {/* --- LE BOUTON AJOUTER UNE LIGNE --- */}
        <button 
          onClick={addLine}
          style={{
            display: 'block',
            margin: '0 auto 20px auto',
            background: 'transparent',
            color: '#ffd700',
            border: '1px dashed #ffd700',
            padding: '5px 15px',
            borderRadius: '20px',
            cursor: 'pointer'
          }}
        >
          + Ajouter une ligne
        </button>

        {/* --- LES BOUTONS ANNULER ET SAUVEGARDER UNIFORMISÉS --- */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <button 
            onClick={onClose} 
            disabled={isSaving}
            style={{ 
              padding: '10px 20px', 
              cursor: 'pointer', 
              backgroundColor: 'transparent', 
              border: '1px solid #555', 
              color: 'white', 
              borderRadius: '6px' 
            }}
          >
            Annuler
          </button>
          
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            style={{ 
              padding: '10px 20px', 
              cursor: 'pointer', 
              backgroundColor: '#ffd700', 
              border: 'none', 
              color: '#000', 
              borderRadius: '6px', 
              fontWeight: 'bold' 
            }}
          >
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BonheurModal;
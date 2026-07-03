export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    // z-index très élevé pour être sûr de passer par-dessus les autres modales
    <div className="modal-overlay" style={{ zIndex: 2000 }} onClick={onCancel}>
      <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: '#ff3333', borderBottom: 'none', paddingBottom: '0' }}>Attention</h3>
        
        <p style={{ color: '#ddd', fontSize: '1.1rem', margin: '1rem 0 2rem 0' }}>
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button 
            onClick={onCancel} 
            style={{ padding: '8px 20px', cursor: 'pointer', backgroundColor: 'transparent', border: '1px solid #555', color: 'white', borderRadius: '6px' }}
          >
            Annuler
          </button>
          <button 
            onClick={onConfirm} 
            style={{ padding: '8px 20px', cursor: 'pointer', backgroundColor: '#ff3333', border: 'none', color: 'white', borderRadius: '6px', fontWeight: 'bold' }}
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}
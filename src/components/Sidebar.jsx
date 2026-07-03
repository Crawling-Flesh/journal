import { supabase } from '../supabase'
import logoJournal from '../assets/logojournal.gif'

export default function Sidebar({ activeView, setActiveView, isMenuOpen, setIsMenuOpen }) {
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <nav className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
      <div className="sidebar-title">
        <img src={logoJournal} alt="Logo" className="nav-icon logo-img" />
        <span className="nav-text">Mon Journal</span>
      </div>
      
      <button 
        className={activeView === 'calendar' ? 'active' : ''} 
        onClick={() => { setActiveView('calendar'); setIsMenuOpen(false); }}
      >
        <span className="nav-icon">📅</span>
        <span className="nav-text">Aujourd'hui</span>
      </button>
      
      <button 
        className={activeView === 'stats' ? 'active' : ''} 
        onClick={() => { setActiveView('stats'); setIsMenuOpen(false); }}
      >
        <span className="nav-icon">📊</span>
        <span className="nav-text">Statistiques</span>
      </button>
      
      {/* NOUVEAU BOUTON GRAPHIQUES */}
      <button 
        className={activeView === 'graphiques' ? 'active' : ''} 
        onClick={() => { setActiveView('graphiques'); setIsMenuOpen(false); }}
      >
        <span className="nav-icon">📈</span>
        <span className="nav-text">Graphiques</span>
      </button>
      
      <button 
        className={activeView === 'journal' ? 'active' : ''} 
        onClick={() => { setActiveView('journal'); setIsMenuOpen(false); }}
      >
        <span className="nav-icon">📖</span>
        <span className="nav-text">Journal</span>
      </button>

      <button className="logout-btn" onClick={handleLogout}>
        <span className="nav-icon">🔒</span>
        <span className="nav-text">Verrouiller</span>
      </button>
    </nav>
  )
}
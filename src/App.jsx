import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './components/Auth'
import Sidebar from './components/Sidebar'
import './App.css'
import DailyView from './components/DailyView'
import JournalPage from './components/JournalPage'
import StatsPage from './components/StatsPage'

function App() {
  const [session, setSession] = useState(null)
  
  // États pour la navigation
  const [activeView, setActiveView] = useState('calendar')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [targetDate, setTargetDate] = useState(null)
  const handleNavigateToDate = (date) => {
    setTargetDate(date)
    setActiveView('calendar')
  }

  // Gestion de la session Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // --- ÉCRAN DE VERROUILLAGE ---
  if (!session) {
    return <Auth />
  }

  // --- FONCTION DE RENDU DES VUES ---
 const renderView = () => {
    switch (activeView) {
      case 'calendar':
        return <DailyView targetDate={targetDate} />
      case 'stats':
        return <StatsPage onNavigateToDate={handleNavigateToDate} />
      case 'journal':
        return <JournalPage />
      default:
        return <div>Vue introuvable</div>
    }
  }

  // --- ÉCRAN PRINCIPAL (Connecté) ---
  return (
    <div className="app-container">
      {/* Bouton Hamburger pour mobile */}
      <button 
        className="hamburger-btn" 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        ☰ Menu
      </button>

      {/* Barre de navigation encapsulée */}
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isMenuOpen={isMenuOpen} 
        setIsMenuOpen={setIsMenuOpen} 
      />

      {/* Contenu principal dynamique */}
      <main className="main-content">
        {renderView()}
      </main>
    </div>
  )
}

export default App
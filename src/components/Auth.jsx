import { useState } from 'react'
import { supabase } from '../supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Erreur brute :", error)
      setError(error.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '20vh' }}>
      <h1>Mon Journal</h1>
      <p>Veuillez entrer vos identifiants pour accéder à vos données.</p>
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '10px', width: '250px', borderRadius: '4px', border: 'none' }}
        />
        <input 
          type="password" 
          placeholder="Mot de passe" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '10px', width: '250px', borderRadius: '4px', border: 'none' }}
        />
        {error && <p style={{ color: '#ff6b6b', margin: 0 }}>{error}</p>}
        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '10px 20px', cursor: loading ? 'wait' : 'pointer', fontWeight: 'bold' }}
        >
          {loading ? 'Vérification...' : 'Déverrouiller'}
        </button>
      </form>
    </div>
  )
}
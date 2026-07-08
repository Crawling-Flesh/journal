import { useState } from 'react'
import { supabase } from '../supabase'
import { format, subDays } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function ExportPage() {
  // Par défaut, on propose d'exporter les 7 derniers jours
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  
  const [options, setOptions] = useState({
    journal: true,
    meteo: true,
    evenements: true,
    bonheurs: true
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target
    setOptions(prev => ({ ...prev, [name]: checked }))
  }

  // Fonction pour télécharger un fichier
  const downloadFile = (content, fileName, contentType) => {
    const blob = new Blob([content], { type: contentType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Fonction principale d'exportation
  const handleExport = async (formatType) => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Utilisateur non connecté")

      let exportData = {}

      // On récupère uniquement ce qui est coché
      if (options.journal) {
        const { data } = await supabase.from('journal').select('*').gte('date', startDate).lte('date', endDate).eq('user_id', user.id).order('date', { ascending: true })
        exportData.journal = data || []
      }
      if (options.meteo) {
        const { data } = await supabase.from('meteo').select('*').gte('date', startDate).lte('date', endDate).eq('user_id', user.id).order('date', { ascending: true })
        exportData.meteo = data || []
      }
      if (options.evenements) {
        const { data } = await supabase.from('evenements').select('*').gte('date', startDate).lte('date', endDate).eq('user_id', user.id).order('date', { ascending: true })
        exportData.evenements = data || []
      }
      if (options.bonheurs) {
        const { data } = await supabase.from('bonheurs').select('*').gte('date', startDate).lte('date', endDate).eq('user_id', user.id).order('date', { ascending: true })
        exportData.bonheurs = data || []
      }

      const dateStr = `${startDate}_au_${endDate}`

      if (formatType === 'json') {
        // --- EXPORT JSON (Données brutes) ---
        const jsonContent = JSON.stringify(exportData, null, 2)
        downloadFile(jsonContent, `export_journal_${dateStr}.json`, 'application/json')
        
      } else if (formatType === 'html') {
        // --- EXPORT HTML (Mise en page) ---
        const htmlContent = generateHTML(exportData, startDate, endDate)
        downloadFile(htmlContent, `export_journal_${dateStr}.html`, 'text/html;charset=utf-8')
      }

    } catch (error) {
      console.error("Erreur lors de l'exportation:", error)
      alert("Une erreur est survenue lors de l'exportation.")
    } finally {
      setIsLoading(false)
    }
  }

// Génération du fichier HTML
  const generateHTML = (data, start, end) => {
    let html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Export Mon Journal</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #e0e0e0; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #121212; 
          }
          .container { 
            background: #1a1a1a; 
            padding: 30px; 
            border-radius: 10px; 
            border: 1px solid #333;
          }
          h1 { 
            color: #ffffff; 
            border-bottom: 1px solid #333; 
            padding-bottom: 15px; 
            text-align: center;
          }
          h2 { 
            margin-top: 30px; 
            margin-bottom: 15px;
            font-weight: normal;
          }
          .entry { 
            border-left: 3px solid; 
            padding-left: 15px; 
            margin-bottom: 20px; 
            background: #2a2a2a;
            padding: 15px;
            border-radius: 0 8px 8px 0;
          }
          .date { 
            font-weight: bold; 
            margin-bottom: 10px;
            font-size: 0.9em;
          }
          .content { 
            white-space: pre-wrap; 
            color: #cccccc;
          }
          ul { 
            margin-top: 5px; 
            padding-left: 20px;
            color: #cccccc;
          }
          li {
            margin-bottom: 5px;
          }

          /* --- Nouvelles couleurs par catégorie --- */
          .theme-journal h2, .theme-journal .date { color: #00ff88; }
          .theme-journal .entry { border-left-color: #00ff88; }
          
          .theme-meteo h2, .theme-meteo .date { color: #00d2ff; }
          .theme-meteo .entry { border-left-color: #00d2ff; }
          
          .theme-evenements h2, .theme-evenements .date { color: #ff3366; }
          .theme-evenements .entry { border-left-color: #ff3366; }
          
          .theme-bonheurs h2, .theme-bonheurs .date { color: #f8e800; }
          .theme-bonheurs .entry { border-left-color: #f8e800; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Mon Journal</h1>
          <p style="text-align: center; color: #888;">Export des données du <strong>${start}</strong> au <strong>${end}</strong></p>
    `;

    if (data.journal && data.journal.length > 0) {
      html += `<div class="theme-journal"><h2>📖 Journal</h2>`;
      data.journal.forEach(item => {
        html += `<div class="entry"><div class="date">${item.date}</div><div class="content">${item.texte || ''}</div></div>`;
      });
      html += `</div>`;
    }

    if (data.meteo && data.meteo.length > 0) {
      html += `<div class="theme-meteo"><h2>🌤️ Météo Intérieure</h2>`;
      data.meteo.forEach(item => {
        const emotions = Object.keys(item)
          .filter(key => !['id', 'user_id', 'date', 'created_at'].includes(key) && item[key] > 0)
          .map(key => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${item[key]}/5`)
          .join(', ');
        
        if (emotions) {
          html += `<div class="entry"><div class="date">${item.date}</div><div class="content">${emotions}</div></div>`;
        }
      });
      html += `</div>`;
    }

    if (data.evenements && data.evenements.length > 0) {
      html += `<div class="theme-evenements"><h2>📅 Événements</h2>`;
      data.evenements.forEach(item => {
        html += `<div class="entry"><div class="date">${item.date}</div><div class="content">${item.titre || ''}</div></div>`;
      });
      html += `</div>`;
    }

    if (data.bonheurs && data.bonheurs.length > 0) {
      html += `<div class="theme-bonheurs"><h2>✨ Petits Bonheurs</h2>`;
      data.bonheurs.forEach(item => {
        let listItems = '';
        if (Array.isArray(item.items)) {
          listItems = `<ul>${item.items.map(b => `<li>${b}</li>`).join('')}</ul>`;
        }
        html += `<div class="entry"><div class="date">${item.date}</div>${listItems}</div>`;
      });
      html += `</div>`;
    }

    html += `
        </div>
      </body>
      </html>
    `;
    return html;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Exporter mes données</h1>
      
      <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px' }}>
        <h3 style={{ marginTop: 0 }}>1. Période</h3>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Du :</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: '#fff' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Au :</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: '#fff' }} />
          </div>
        </div>

        <h3>2. Données à inclure</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
          <label style={{ cursor: 'pointer' }}>
            <input type="checkbox" name="journal" checked={options.journal} onChange={handleCheckboxChange} style={{ marginRight: '10px' }} />
            Journal ✒️
          </label>
          <label style={{ cursor: 'pointer' }}>
            <input type="checkbox" name="meteo" checked={options.meteo} onChange={handleCheckboxChange} style={{ marginRight: '10px' }} />
            Météo intérieure ☀️
          </label>
          <label style={{ cursor: 'pointer' }}>
            <input type="checkbox" name="evenements" checked={options.evenements} onChange={handleCheckboxChange} style={{ marginRight: '10px' }} />
            Événements 📆
          </label>
          <label style={{ cursor: 'pointer' }}>
            <input type="checkbox" name="bonheurs" checked={options.bonheurs} onChange={handleCheckboxChange} style={{ marginRight: '10px' }} />
            Petits bonheurs ❤️
          </label>
        </div>

        <h3>3. Format d'export</h3>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            onClick={() => handleExport('html')}
            disabled={isLoading}
            style={{ flex: 1, padding: '12px', borderRadius: '6px', backgroundColor: 'transparent', border: '1px solid #00e5ff', color: '#00e5ff', cursor: isLoading ? 'wait' : 'pointer', fontWeight: 'bold' }}
          >
            {isLoading ? 'Génération...' : '📄 Version lisible (HTML)'}
          </button>
          
          <button 
            onClick={() => handleExport('json')}
            disabled={isLoading}
            style={{ flex: 1, padding: '12px', borderRadius: '6px', backgroundColor: '#333', border: '1px solid #555', color: '#fff', cursor: isLoading ? 'wait' : 'pointer' }}
          >
            {isLoading ? 'Génération...' : '⚙️ Data Brute (JSON)'}
          </button>
        </div>
      </div>
    </div>
  )
}
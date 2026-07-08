import { useState } from 'react'
import { supabase } from '../supabase'
import { format, subDays, parseISO } from 'date-fns'
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
            margin-bottom: 10px;
            font-weight: normal;
          }
          .ai-context {
            font-size: 0.85em;
            color: #777777;
            font-style: italic;
            margin-bottom: 20px;
            line-height: 1.4;
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

          /* --- Couleurs par catégorie --- */
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
          <p style="text-align: center; color: #888; margin-bottom: 5px;">Export des données du <strong>${start}</strong> au <strong>${end}</strong></p>
          <div class="ai-context" style="text-align: center; margin-bottom: 30px;">
            Document généré automatiquement. Ce fichier compile des entrées de journal personnel classées par catégories pour faciliter l'analyse temporelle et sémantique.
          </div>
    `;

if (data.journal && data.journal.length > 0) {
      html += `<div class="theme-journal">
        <h2>📖 Journal</h2>
        <div class="ai-context">Contexte de la section : Entrées textuelles libres décrivant le déroulement de la journée, les réflexions personnelles et l'état d'esprit général. Note temporelle : L'heure affichée correspond à l'enregistrement dans la base de données. La présence de la mention '(écrit à une date ultérieure)' indique que la saisie a été effectuée a posteriori ; par conséquent, l'heure de ces entrées différées reflète l'instant de la rédaction et non l'heure réelle des événements relatés.</div>`;
      
      data.journal.forEach(item => {
        let displayDate = item.date;
        let retroactiveBadge = '';

        if (item.created_at) {
          const dayDate = parseISO(item.date);
          const timeDate = new Date(item.created_at);
          
          const createdDateString = format(timeDate, 'yyyy-MM-dd');
          const isRetroactive = createdDateString > item.date;
          
          displayDate = `${format(dayDate, "dd MMMM yyyy", { locale: fr })} - ${format(timeDate, "HH'h'mm")}`;
          
          if (isRetroactive) {
            retroactiveBadge = ` <span style="font-size: 0.85em; font-style: italic; color: #888; margin-left: 10px;">(écrit à une date ultérieure)</span>`;
          }
        }

        html += `<div class="entry"><div class="date">${displayDate}${retroactiveBadge}</div><div class="content">${item.texte || ''}</div></div>`;
      });
      html += `</div>`;
    }

if (data.meteo && data.meteo.length > 0) {
      html += `<div class="theme-meteo">
        <h2>🌤️ Météo Intérieure</h2>
        <div class="ai-context">Contexte de la section : Évaluation quantitative des émotions ressenties. Les valeurs représentent une intensité sur une échelle de 1 (faible) à 5 (fort). Plus le score est faible, plus la couleur est pastel et claire.</div>`;

      const meteoColors = {
        'joie': { label: 'Joie', hex: '#ffd700' },
        'colere': { label: 'Colère', hex: '#ff3333' },
        'anxiete': { label: 'Anxiété', hex: '#aa00ff' },
        'tristesse': { label: 'Tristesse', hex: '#0088ff' },
        'degout': { label: 'Dégoût', hex: '#00cc44' },
        'stress': { label: 'Stress', hex: '#ff8800' },
        'anticipation': { label: 'Anticipation', hex: '#00e5ff' },
        'confiance': { label: 'Confiance', hex: '#a6ff00' },
        'serenite': { label: 'Sérénité', hex: '#e81099' }
      };

      data.meteo.forEach(item => {
        const emotionTags = Object.keys(item)
          .filter(key => meteoColors[key] && item[key] > 0)
          .map(key => {
            const score = item[key];
            const mood = meteoColors[key];
            
            // Calcul du pourcentage : 
            // Score 1 = 30% couleur pure (70% blanc) -> Très clair/pastel
            // Score 5 = 100% couleur pure
            const colorPercentage = 30 + ((score - 1) * 17.5); 
            
            // On utilise color-mix pour mélanger la couleur avec du blanc, sans opacité
            const textColor = `color-mix(in srgb, ${mood.hex} ${colorPercentage}%, #ffffff)`;
            
            return `<span style="color: ${textColor}; font-weight: bold; margin-right: 15px; font-size: 1.05em; display: inline-block;">${mood.label}: ${score}/5</span>`;
          })
          .join('');
        
        if (emotionTags) {
          // On retire également la class="content" ici pour éviter les sauts de ligne indésirables
          html += `<div class="entry"><div class="date">${item.date}</div><div style="display: flex; flex-wrap: wrap;">${emotionTags}</div></div>`;
        }
      });
      html += `</div>`;
    }

if (data.evenements && data.evenements.length > 0) {
      html += `<div class="theme-evenements">
        <h2>📅 Événements</h2>
        <div class="ai-context">Contexte de la section : Liste des faits marquants survenus lors de la journée, accompagnés des émotions (météo intérieure) ressenties spécifiquement avant, pendant et après l'événement.</div>`;
      
      // Palette de couleurs pour recréer les balises dans l'export
      const moodColors = {
        'Joie': '#ffd700', 'Colère': '#ff3333', 'Anxiété': '#aa00ff', 
        'Tristesse': '#0088ff', 'Dégoût': '#00cc44', 'Stress': '#ff8800', 
        'Anticipation': '#00e5ff', 'Confiance': '#a6ff00', 'Sérénité': '#e81099'
      };

      // Fonction pour générer le HTML d'une balise
      const renderTags = (tags) => {
        return tags.map(mood => {
          const color = moodColors[mood] || '#555';
          return `<span style="display: inline-block; padding: 2px 12px; margin: 0 6px 4px 0; border: 1px solid ${color}; border-radius: 15px; font-size: 0.85em; color: #fff; background-color: ${color}33;">${mood}</span>`;
        }).join('');
      };

      data.evenements.forEach(item => {
        let tagsHtml = '';
        const hasAvant = item.tags_avant && item.tags_avant.length > 0;
        const hasPendant = item.tags_pendant && item.tags_pendant.length > 0;
        const hasApres = item.tags_apres && item.tags_apres.length > 0;

        if (hasAvant || hasPendant || hasApres) {
          tagsHtml += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #555;">`;
          tagsHtml += `<div style="font-size: 0.85em; text-transform: uppercase; color: #ff3366; margin-bottom: 10px; letter-spacing: 1px;">Météo intérieure</div>`;
          
          const rowStyle = "display: flex; align-items: center; margin-bottom: 6px; flex-wrap: wrap;";
          const labelStyle = "color: #bbb; font-weight: bold; font-size: 0.9em; min-width: 80px; margin-bottom: 4px;";

          if (hasAvant) {
            tagsHtml += `<div style="${rowStyle}"><span style="${labelStyle}">Avant :</span> <div style="display: flex; flex-wrap: wrap;">${renderTags(item.tags_avant)}</div></div>`;
          }
          if (hasPendant) {
            tagsHtml += `<div style="${rowStyle}"><span style="${labelStyle}">Pendant :</span> <div style="display: flex; flex-wrap: wrap;">${renderTags(item.tags_pendant)}</div></div>`;
          }
          if (hasApres) {
            tagsHtml += `<div style="${rowStyle}"><span style="${labelStyle}">Après :</span> <div style="display: flex; flex-wrap: wrap;">${renderTags(item.tags_apres)}</div></div>`;
          }
          
          tagsHtml += `</div>`;
        }

html += `<div class="entry" style="padding-bottom: 10px;">
          <div class="date" style="margin-bottom: 2px;">${item.date}</div>
          <div style="color: #cccccc;">
            <div style="font-size: 1.2em; color: #fff; font-weight: bold; margin-bottom: 4px;">${item.titre || ''}</div>
            ${tagsHtml}
          </div>
        </div>`;
      });
      html += `</div>`;
    }

    if (data.bonheurs && data.bonheurs.length > 0) {
      html += `<div class="theme-bonheurs">
        <h2>✨ Petits Bonheurs</h2>
        <div class="ai-context">Contexte de la section : Liste à puces recensant les moments de gratitude, les interactions positives ou les petites joies du quotidien.</div>`;
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
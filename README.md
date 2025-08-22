# EUDR Compliance - Satellite Imagery Platform

Plateforme de conformité EUDR (European Union Deforestation Regulation) avec intégration d'imagerie satellite Sentinel-2 pour surveiller la déforestation.

## 🛰️ Backend Satellite

### Installation et Lancement

1. Installer les dépendances Python :
```bash
pip install flask flask-cors requests
```

2. Lancer le backend :
```bash
python satellite_backend.py
```

Le serveur sera disponible sur `http://localhost:5000`

### API Endpoints

#### POST `/api/satellite-image`

Récupère des images satellites Sentinel-2 pour des coordonnées données.

**Exemple de requête :**

```javascript
// Exemple d'utilisation depuis le front-end
fetch('http://localhost:5000/api/satellite-image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    latitude: 48.8566,
    longitude: 2.3522,
    start_date: '2024-01-01',
    end_date: '2024-01-31',
    cloud_coverage: 20  // optionnel, max 20% de couverture nuageuse
  })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('Image satellite récupérée:', data.data.image_url);
    // Afficher l'image dans le front-end
    displaySatelliteImage(data.data.image_url);
  } else {
    console.error('Erreur:', data.message);
  }
})
.catch(error => {
  console.error('Erreur de requête:', error);
});
```

**Réponse exemple :**

```json
{
  "success": true,
  "message": "Satellite image retrieved successfully",
  "data": {
    "coordinates": {
      "latitude": 48.8566,
      "longitude": 2.3522
    },
    "date_range": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    },
    "image_url": "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/2.3522,48.8566,14/600x400?access_token=YOUR_TOKEN",
    "metadata": {
      "satellite": "Sentinel-2",
      "resolution": "10m",
      "bands": ["B02", "B03", "B04", "B08"],
      "cloud_coverage": 20
    }
  }
}
```

#### GET `/api/health`

Vérification de l'état du service.

## 🌐 Intégration Front-end

### Modification de script.js

Le fichier `script.js` a été modifié pour inclure la fonction `fetchSatelliteImage()` qui permet de :

1. Envoyer une requête POST vers le backend local
2. Récupérer l'URL de l'image satellite
3. Afficher l'image dans l'interface utilisateur

### Utilisation

1. Assurez-vous que le backend Python est lancé (`python satellite_backend.py`)
2. Ouvrez l'interface web (index.html)
3. Utilisez l'interface pour sélectionner des coordonnées
4. L'application enverra automatiquement une requête au backend pour récupérer l'imagerie satellite

## 📋 Paramètres de Requête

| Paramètre | Type | Description | Requis |
|-----------|------|-------------|--------|
| `latitude` | Float | Latitude (-90 à 90) | ✅ |
| `longitude` | Float | Longitude (-180 à 180) | ✅ |
| `start_date` | String | Date de début (YYYY-MM-DD) | ✅ |
| `end_date` | String | Date de fin (YYYY-MM-DD) | ✅ |
| `cloud_coverage` | Integer | Couverture nuageuse max (0-100) | ❌ |

## 🔧 Configuration

Pour utiliser un vrai service d'imagerie satellite :

1. Remplacer l'URL placeholder dans `generate_placeholder_image_url()`
2. Ajouter votre clé API (Mapbox, Google Earth Engine, etc.)
3. Intégrer l'API Copernicus Open Access Hub pour Sentinel-2

## 📝 Notes Techniques

- Le backend utilise Flask avec CORS activé pour permettre les requêtes cross-origin
- L'implémentation actuelle utilise des URLs d'images placeholder
- Pour la production, intégrer une vraie API d'imagerie satellite (Copernicus, Sentinel Hub, etc.)
- Les images Sentinel-2 ont une résolution de 10m pour les bandes visibles

## 🚀 Développement

### Structure du Projet

```
EUDR-compliance/
├── index.html              # Interface utilisateur
├── script.js              # Logique front-end (modifié)
├── style.css              # Styles
├── satellite_backend.py   # Backend Flask (nouveau)
└── README.md             # Documentation
```

### Prochaines Étapes

- [ ] Intégrer l'API Copernicus pour Sentinel-2
- [ ] Ajouter l'analyse de déforestation
- [ ] Implémenter la détection de changements
- [ ] Ajouter l'authentification
- [ ] Optimiser les performances d'image

## 📚 Resources

- [Copernicus Open Access Hub](https://scihub.copernicus.eu/)
- [Sentinel-2 Documentation](https://sentinels.copernicus.eu/web/sentinel/missions/sentinel-2)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [EUDR Regulation](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R1115)

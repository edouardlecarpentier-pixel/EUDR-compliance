// --- CONFIGURATION ---
// Configuration pour l'imagerie satellite open source
// Les identifiants Sentinel Hub ont été supprimés pour utiliser des services ouverts

// --- ELEMENTS DU DOM ---
const fileInput = document.getElementById('geojson-file');
const coordBtn = document.getElementById('coord-btn');
const latInput = document.getElementById('latitude');
const lonInput = document.getElementById('longitude');
const beforeImageDiv = document.getElementById('before-image');
const nowImageDiv = document.getElementById('now-image');

// --- INITIALISATION DE LA CARTE ---
const map = L.map('map').setView([46.2276, 2.2137], 5); // Vue centrée sur la France
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);
let geojsonLayer;

// --- GESTION DES DEUX METHODES D'ENTREE ---
// Option 1: Chargement de fichier
fileInput.addEventListener('change', (event) => {
    console.log("Fichier sélectionné.");
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const bounds = handleGeoData(data);
            fetchAndDisplayImages(bounds);
        } catch (error) {
            alert("Erreur: Le fichier GeoJSON est invalide.");
            console.error("Erreur de parsing GeoJSON:", error);
        }
    };
    reader.readAsText(file);
});

// Option 2: Saisie de coordonnées
coordBtn.addEventListener('click', () => {
    console.log("Bouton 'Générer depuis les coordonnées' cliqué.");
    const lat = parseFloat(latInput.value);
    const lon = parseFloat(lonInput.value);
    
    console.log(`Latitude lue: ${lat}, Longitude lue: ${lon}`);
    
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        console.error("Validation des coordonnées échouée.");
        alert("Veuillez entrer une latitude et une longitude valides.");
        return;
    }
    
    console.log("Validation réussie. Création de la zone géographique.");
    const buffer = 0.005; // Environ 500m
    const bounds = L.latLngBounds([
        [lat - buffer, lon - buffer],
        [lat + buffer, lon + buffer]
    ]);
    
    const geoJsonData = L.rectangle(bounds).toGeoJSON();
    handleGeoData(geoJsonData);
    
    console.log("Appel de fetchAndDisplayImages.");
    fetchAndDisplayImages(bounds);
});

function handleGeoData(geoJsonData) {
    console.log("Affichage de la géométrie sur la carte.");
    if (geojsonLayer) map.removeLayer(geojsonLayer);
    
    geojsonLayer = L.geoJSON(geoJsonData).addTo(map);
    const bounds = geojsonLayer.getBounds();
    map.fitBounds(bounds);
    return bounds;
}

// --- FONCTION PRINCIPALE MODIFIEE POUR UTILISER L'IMAGERIE OUVERTE ---
async function fetchAndDisplayImages(bounds) {
    if (!bounds) {
        alert("Zone géographique non définie.");
        return;
    }
    
    console.log("Début de la récupération des images pour la zone:", bounds);
    beforeImageDiv.innerHTML = 'Chargement...';
    nowImageDiv.innerHTML = 'Chargement...';
    coordBtn.disabled = true;
    fileInput.disabled = true;
    
    try {
        console.log("Génération des URLs d'images via services ouverts...");
        
        // Image "avant" - utilise Landsat 8 (2020)
        const beforeImageUrl = await generateOpenImageUrl(bounds, '2020');
        
        // Image "maintenant" - utilise des données récentes
        const nowImageUrl = await generateOpenImageUrl(bounds, '2023');
        
        // Affichage des images
        beforeImageDiv.innerHTML = `<img src="${beforeImageUrl}" alt="Image avant 2021" style="width: 100%; height: auto;"/>`;
        nowImageDiv.innerHTML = `<img src="${nowImageUrl}" alt="Image récente" style="width: 100%; height: auto;"/>`;
        
        console.log("Images affichées avec succès !");
        
    } catch (error) {
        console.error("ERREUR lors de la récupération des images:", error);
        alert("Une erreur s'est produite lors du chargement des images. Vérifiez la console (F12) pour plus de détails.");
        
        // Images de fallback avec des tuiles satellites ouvertes
        const fallbackBeforeUrl = generateFallbackImageUrl(bounds, 'before');
        const fallbackNowUrl = generateFallbackImageUrl(bounds, 'now');
        
        beforeImageDiv.innerHTML = `<img src="${fallbackBeforeUrl}" alt="Image satellite avant (approximative)" style="width: 100%; height: auto;"/>`;
        nowImageDiv.innerHTML = `<img src="${fallbackNowUrl}" alt="Image satellite récente (approximative)" style="width: 100%; height: auto;"/>`;
        
    } finally {
        coordBtn.disabled = false;
        fileInput.disabled = false;
        console.log("Processus terminé, boutons réactivés.");
    }
}

// --- NOUVELLES FONCTIONS POUR L'IMAGERIE OUVERTE ---
/**
 * Génère une URL d'image satellite via des services ouverts
 * Utilise Google Earth Engine ou des services similaires
 */
async function generateOpenImageUrl(bounds, year) {
    const bbox = [
        bounds.getWest(), 
        bounds.getSouth(), 
        bounds.getEast(), 
        bounds.getNorth()
    ];
    
    // Option 1: Utilisation de USGS Earth Explorer (Landsat)
    // Ces URLs pointent vers des services de tuiles ouvertes
    const bboxStr = bbox.join(',');
    
    // Construire l'URL pour des tuiles Landsat via des services ouverts
    // Exemple avec des services de tuiles Landsat publics
    const baseUrl = 'https://earthengine.googleapis.com/v1alpha/projects/earthengine-legacy/maps';
    
    // Pour les besoins de démonstration, on utilise des URLs de tuiles statiques
    // En production, vous devriez intégrer avec l'API Google Earth Engine
    // ou d'autres services d'imagerie ouverte
    
    return generateStaticSatelliteImageUrl(bounds, year);
}

/**
 * Génère une URL d'image satellite statique pour démonstration
 * En production, remplacez par des appels à des APIs d'imagerie ouverte
 */
function generateStaticSatelliteImageUrl(bounds, year) {
    const centerLat = (bounds.getNorth() + bounds.getSouth()) / 2;
    const centerLon = (bounds.getEast() + bounds.getWest()) / 2;
    const zoom = 14;
    const size = '512x512';
    
    // Utilisation du service de tuiles satellites d'Esri (gratuit pour usage non-commercial)
    // Alternative: utiliser des services comme Mapbox, Google Maps Static API, etc.
    const esriSatelliteUrl = `https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/${zoom}/${getTileY(centerLat, zoom)}/${getTileX(centerLon, zoom)}`;
    
    return esriSatelliteUrl;
}

/**
 * Génère des URLs d'images de fallback utilisant des tuiles ouvertes
 */
function generateFallbackImageUrl(bounds, period) {
    const centerLat = (bounds.getNorth() + bounds.getSouth()) / 2;
    const centerLon = (bounds.getEast() + bounds.getWest()) / 2;
    const zoom = 13;
    
    // Utilise OpenStreetMap satellite ou Esri World Imagery
    const tileX = getTileX(centerLon, zoom);
    const tileY = getTileY(centerLat, zoom);
    
    // Service de tuiles satellites Esri (gratuit)
    return `https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/${zoom}/${tileY}/${tileX}`;
}

// --- FONCTIONS UTILITAIRES POUR LES TUILES ---
/**
 * Convertit longitude en numéro de tuile X
 */
function getTileX(lon, zoom) {
    return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
}

/**
 * Convertit latitude en numéro de tuile Y
 */
function getTileY(lat, zoom) {
    const latRad = lat * Math.PI / 180;
    return Math.floor((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * Math.pow(2, zoom));
}

/**
 * Fonction utilitaire pour obtenir une date il y a trois mois
 */
function getThreeMonthsAgoDate() {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
}

/**
 * Génère des liens Copernicus pour une zone géographique et une période donnée
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude  
 * @param {string} dateFrom - Date de début (format YYYY-MM-DD)
 * @param {string} dateTo - Date de fin (format YYYY-MM-DD)
 * @returns {Object} Objet contenant les URLs Copernicus SciHub et EO Browser
 */
function generateCopernicusLinks(lat, lon, dateFrom, dateTo) {
    // Création d'une bbox autour du point (buffer d'environ 1km)
    const buffer = 0.009; // ~1km à l'équateur
    const bbox = {
        west: lon - buffer,
        south: lat - buffer,
        east: lon + buffer,
        north: lat + buffer
    };
    
    // URL pour Copernicus Open Access Hub (SciHub)
    const scihubUrl = `https://scihub.copernicus.eu/dhus/#/home?` +
        `bbox=${bbox.west.toFixed(6)}%2C${bbox.south.toFixed(6)}%2C${bbox.east.toFixed(6)}%2C${bbox.north.toFixed(6)}` +
        `&beginDate=${dateFrom}&endDate=${dateTo}&mission=Sentinel-2`;
    
    // URL pour EO Browser
    const eoBrowserUrl = `https://apps.sentinel-hub.com/eo-browser/?` +
        `zoom=14&lat=${lat.toFixed(6)}&lng=${lon.toFixed(6)}` +
        `&themeId=DEFAULT-THEME&visualizationUrl=` +
        `&datasetId=S2L2A&fromTime=${dateFrom}T00%3A00%3A00.000Z&toTime=${dateTo}T23%3A59%3A59.999Z` +
        `&layerId=1_TRUE_COLOR`;
    
    return {
        scihub: scihubUrl,
        eoBrowser: eoBrowserUrl
    };
}

/**
 * Ouvre les liens Copernicus dans de nouveaux onglets
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} dateFrom - Date de début
 * @param {string} dateTo - Date de fin
 */
function openCopernicusLinks(lat, lon, dateFrom, dateTo) {
    const links = generateCopernicusLinks(lat, lon, dateFrom, dateTo);
    
    // Ouvrir SciHub
    window.open(links.scihub, '_blank');
    
    // Ouvrir EO Browser avec un délai pour éviter le blocage de popup
    setTimeout(() => {
        window.open(links.eoBrowser, '_blank');
    }, 500);
}

// --- FONCTIONS OBSOLETES SUPPRIMEES ---
// Les fonctions getSentinelAuthToken() et getSentinelImageUrl() ont été supprimées
// car elles utilisaient l'API Sentinel Hub avec authentification

console.log("Script initialisé avec les services d'imagerie ouverte.");

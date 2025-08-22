// --- CONFIGURATION ---
// VOS IDENTIFIANTS SENTINEL HUB SONT INTÉGRÉS CI-DESSOUS
const SENTINEL_CLIENT_ID = "aa80864c-7d8f-446b-8802-cb43116318a2"; 
const SENTINEL_CLIENT_SECRET = "T6NTLW0czwyh93nTuMzuh2cS2X6oR1uV";

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
        console.log("Obtention du token d'authentification...");
        const accessToken = await getSentinelAuthToken();
        console.log("Token obtenu avec succès.");
        
        console.log("Récupération de l'image 'avant 2021'...");
        const beforeImageUrl = await getSentinelImageUrl(bounds, '2020-06-01', '2020-12-30', accessToken);
        
        console.log("Récupération de l'image 'maintenant'...");
        const nowImageUrl = await getSentinelImageUrl(bounds, getThreeMonthsAgoDate(), new Date().toISOString().split('T')[0], accessToken);

        beforeImageDiv.innerHTML = `<img src="${beforeImageUrl}" alt="Image avant 2021">`;
        nowImageDiv.innerHTML = `<img src="${nowImageUrl}" alt="Image récente">`;
        console.log("Images affichées avec succès !");

    } catch (error) {
        console.error("ERREUR MAJEURE lors de la récupération des images:", error);
        alert("Une erreur s'est produite. Vérifiez la console (F12) pour plus de détails.");
        beforeImageDiv.innerHTML = 'Erreur de chargement';
        nowImageDiv.innerHTML = 'Erreur de chargement';
    } finally {
        coordBtn.disabled = false;
        fileInput.disabled = false;
        console.log("Processus terminé, boutons réactivés.");
    }
}


// --- FONCTIONS AUXILIAIRES POUR SENTINEL HUB ---
async function getSentinelAuthToken() {
    const response = await fetch('https://services.sentinel-hub.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            'grant_type': 'client_credentials',
            'client_id': SENTINEL_CLIENT_ID,
            'client_secret': SENTINEL_CLIENT_SECRET
        })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error_description || 'Authentication failed');
    return data.access_token;
}

async function getSentinelImageUrl(bounds, fromDate, toDate, token) {
    // BUG CORRIGÉ ICI : bounds.getNorth() au lieu de bounds.e()
    const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
    const evalscript = `
        //VERSION=3
        function setup() {
            return { input: ["B04", "B03", "B02"], output: { bands: 3 } };
        }
        function evaluatePixel(sample) {
            return [2.5 * sample.B04, 2.5 * sample.B03, 2.5 * sample.B02];
        }
    `;

    const requestBody = {
        input: {
            bounds: { bbox: bbox, properties: { crs: "http://www.opengis.net/def/crs/OGC/1.3/CRS84" } },
            data: [{
                type: "sentinel-2-l2a",
                dataFilter: {
                    timeRange: { from: `${fromDate}T00:00:00Z`, to: `${toDate}T23:59:59Z` },
                    mosaickingOrder: "leastCC"
                }
            }]
        },
        output: { width: 512, height: 512, format: "image/jpeg" },
        evalscript: evalscript
    };

    const response = await fetch('https://services.sentinel-hub.com/api/v1/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sentinel Hub API Error: ${errorText}`);
    }

    const imageBlob = await response.blob();
    return URL.createObjectURL(imageBlob);
}

function getThreeMonthsAgoDate() {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
}

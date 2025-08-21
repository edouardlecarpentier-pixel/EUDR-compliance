// --- CONFIGURATION ---
// VOS IDENTIFIANTS SONT INTÉGRÉS CI-DESSOUS.
const SENTINEL_CLIENT_ID = "edouard.lecarpentier@hamelinbrands.com"; 
const SENTINEL_CLIENT_SECRET = "X2P&^wh@eJT0+o";

// --- ELEMENTS DU DOM ---
const fileInput = document.getElementById('geojson-file');
const fetchBtn = document.getElementById('fetch-images-btn');
const beforeImageDiv = document.getElementById('before-image');
const nowImageDiv = document.getElementById('now-image');

// --- INITIALISATION DE LA CARTE ---
const map = L.map('map').setView([46.2276, 2.2137], 5); // Vue centrée sur la France
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let geojsonLayer;
let geojsonBounds;

// --- GESTION DU CHARGEMENT DE FICHIER ---
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (geojsonLayer) map.removeLayer(geojsonLayer);
            
            geojsonLayer = L.geoJSON(data).addTo(map);
            geojsonBounds = geojsonLayer.getBounds();
            map.fitBounds(geojsonBounds);
            fetchBtn.disabled = false;

        } catch (error) {
            alert("Erreur: Le fichier GeoJSON est invalide.");
            fetchBtn.disabled = true;
        }
    };
    reader.readAsText(file);
});

// --- GESTION DU CLIC SUR LE BOUTON ---
fetchBtn.addEventListener('click', async () => {
    if (!geojsonBounds) {
        alert("Veuillez d'abord charger un fichier GeoJSON.");
        return;
    }

    beforeImageDiv.innerHTML = 'Chargement...';
    nowImageDiv.innerHTML = 'Chargement...';
    fetchBtn.disabled = true;

    try {
        const accessToken = await getSentinelAuthToken();
        const beforeImageUrl = await getSentinelImageUrl(geojsonBounds, '2020-06-01', '2020-12-30', accessToken);
        const

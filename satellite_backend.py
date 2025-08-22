from flask import Flask, request, send_file, jsonify
from sentinelsat import SentinelAPI, geojson_to_wkt
from shapely.geometry import shape
from datetime import date, timedelta
import os

# Configuration Sentinel Open Access HUB (accès invité)
USERNAME = "guest"
PASSWORD = "guest"
API_URL = "https://apihub.copernicus.eu/apihub"  # Open Access

app = Flask(__name__)

@app.route("/api/satellite-image", methods=["POST"])
def get_sat_image():
    data = request.json
    geojson = data["geojson"]  # format GeoJSON Feature/Polygon envoyé par le front !
    start = data.get("date_from", (date.today()-timedelta(days=400)).strftime("%Y-%m-%d"))
    end = data.get("date_to", date.today().strftime("%Y-%m-%d"))

    # Conversion zone en WKT
    footprint = geojson_to_wkt(shape(geojson))
    api = SentinelAPI(USERNAME, PASSWORD, API_URL)
    products = api.query(footprint,
                         date=(start, end),
                         platformname='Sentinel-2',
                         processinglevel='Level-2A',
                         cloudcoverpercentage=(0, 20)
                        )
    if not products:
        return jsonify({"error": "Aucune image trouvée"}), 404

    product_id = next(iter(products))
    # Télécharge le produit Sentinel-2 dans ./downloads
    api.download(product_id, directory_path="./downloads")
    product_info = products[product_id]
    # Cherche l'image "true color" dans le SAFE
    jp2_path = find_truecolor_jp2(product_info['title'])

    # Conversion JP2 -> JPG (via Pillow)
    from PIL import Image
    img = Image.open(jp2_path)
    out_path = "temp_output.jpg"
    img.save(out_path, "JPEG")
    return send_file(out_path, mimetype="image/jpeg")

def find_truecolor_jp2(product_title):
    """Trouve le chemin du JP2 true color 10m dans le dossier SAFE téléchargé."""
    for root, dirs, files in os.walk(f"./downloads/{product_title}.SAFE/GRANULE"):
        for file in files:
            if file.endswith("_TCI_10m.jp2"):  # True Color Image 10m Sentinel-2
                return os.path.join(root, file)
    raise Exception("True color JP2 not found.")

if __name__ == "__main__":
    # Pour l'utiliser : python satellite_backend.py
    app.run(debug=True, port=5000)

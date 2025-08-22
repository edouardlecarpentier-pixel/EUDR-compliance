from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import requests
import os
from datetime import datetime, timedelta
import tempfile
import zipfile
from io import BytesIO

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
APP_PORT = 5000
APP_DEBUG = True

@app.route('/api/satellite-image', methods=['POST'])
def get_satellite_image():
    """
    Endpoint pour récupérer des images satellite Sentinel-2
    """
    try:
        # Récupération des paramètres de la requête
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'No data provided',
                'message': 'Please provide coordinates and date range'
            }), 400
        
        # Paramètres requis
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        # Validation des paramètres
        if not all([latitude, longitude, start_date, end_date]):
            return jsonify({
                'error': 'Missing required parameters',
                'message': 'latitude, longitude, start_date, and end_date are required'
            }), 400
        
        # Validation des coordonnées
        try:
            lat = float(latitude)
            lon = float(longitude)
            if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
                raise ValueError("Coordinates out of range")
        except (ValueError, TypeError):
            return jsonify({
                'error': 'Invalid coordinates',
                'message': 'Latitude must be between -90 and 90, longitude between -180 and 180'
            }), 400
        
        # Utilisation de l'API Copernicus Open Access Hub ou alternative
        # Pour cet exemple, nous simulons la récupération d'image
        
        # Construction des paramètres de recherche
        search_params = {
            'coordinates': f'POINT({lon} {lat})',
            'start_date': start_date,
            'end_date': end_date,
            'cloud_coverage': data.get('cloud_coverage', 20),  # Max 20% de couverture nuageuse par défaut
            'product_type': 'S2MSI1C'  # Sentinel-2 Level-1C
        }
        
        # Simulation de la réponse (à remplacer par un vrai appel API)
        # Dans un cas réel, vous utiliseriez l'API Copernicus ou Sentinel Hub
        
        # Exemple d'URL d'image satellite (placeholder)
        image_url = generate_placeholder_image_url(lat, lon, start_date)
        
        # Téléchargement simulé de l'image
        # Dans un cas réel, vous téléchargeriez l'image depuis l'API
        
        response_data = {
            'success': True,
            'message': 'Satellite image retrieved successfully',
            'data': {
                'coordinates': {
                    'latitude': lat,
                    'longitude': lon
                },
                'date_range': {
                    'start': start_date,
                    'end': end_date
                },
                'image_url': image_url,
                'metadata': {
                    'satellite': 'Sentinel-2',
                    'resolution': '10m',
                    'bands': ['B02', 'B03', 'B04', 'B08'],  # Blue, Green, Red, NIR
                    'cloud_coverage': search_params['cloud_coverage']
                }
            }
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

def generate_placeholder_image_url(lat, lon, date):
    """
    Génère une URL d'image placeholder basée sur les coordonnées
    À remplacer par la vraie logique de récupération d'image
    """
    # Utilisation d'un service de cartes satellite comme Mapbox ou Google
    # Ceci est un exemple - remplacez par votre service préféré
    return f"https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/{lon},{lat},14/600x400?access_token=YOUR_MAPBOX_TOKEN"

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Endpoint de vérification de santé du service
    """
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'EUDR Satellite Backend'
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found',
        'message': 'The requested endpoint does not exist'
    }), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        'error': 'Method not allowed',
        'message': 'The method is not allowed for this endpoint'
    }), 405

if __name__ == '__main__':
    print(f"🚀 Starting EUDR Satellite Backend on port {APP_PORT}")
    print(f"📡 Available endpoints:")
    print(f"   POST http://localhost:{APP_PORT}/api/satellite-image")
    print(f"   GET  http://localhost:{APP_PORT}/api/health")
    print(f"")
    print(f"💡 To test the API, send a POST request to:")
    print(f"   http://localhost:{APP_PORT}/api/satellite-image")
    print(f"   with JSON body: {{")
    print(f"     \"latitude\": 48.8566,")
    print(f"     \"longitude\": 2.3522,")
    print(f"     \"start_date\": \"2024-01-01\",")
    print(f"     \"end_date\": \"2024-01-31\"")
    print(f"   }}")
    
    app.run(debug=APP_DEBUG, host='0.0.0.0', port=APP_PORT)

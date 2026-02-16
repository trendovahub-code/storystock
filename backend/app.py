from dotenv import load_dotenv
import os

# Load .env relative to this file
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

from utils.dns_fix import apply_dns_patch

apply_dns_patch()

from flask import Flask
from flask_cors import CORS
from api.routes import api_bp
from services.background_jobs import start_background_jobs

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Register Blueprints
    app.register_blueprint(api_bp, url_prefix='/api')
    start_background_jobs()

    brand_name = os.getenv("BRAND_NAME", "Trendova Hub")

    @app.after_request
    def add_brand_headers(response):
        response.headers["X-Powered-By"] = brand_name
        return response

    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('PORT', 5002))
    app.run(host='0.0.0.0', port=port, debug=True)

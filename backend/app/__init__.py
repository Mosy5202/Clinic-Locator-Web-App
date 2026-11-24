from flask import Flask
from flask_cors import CORS

from .routes.health import health_bp


def create_app() -> Flask:
    app = Flask(__name__)
    # Development origins only. Tighten this for any deployed version.
    CORS(app, resources={r"/api/*": {"origins": ["http://127.0.0.1:5500", "http://localhost:5500"]}})
    app.register_blueprint(health_bp)
    return app

import sys
import os

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

sys.path.insert(0, PROJECT_ROOT)
sys.path.insert(0, BACKEND_DIR)

try:
    from backend.app.main import app
except ImportError:
    from app.main import app
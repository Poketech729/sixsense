import sys
import os

# Add project root and backend folder to Python path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

for path in [PROJECT_ROOT, BACKEND_DIR]:
    if path not in sys.path:
        sys.path.insert(0, path)

try:
    from app.main import app
except ImportError:
    from backend.app.main import app
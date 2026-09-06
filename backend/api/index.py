# backend/api/index.py
import sys
import os

# Dynamically resolve project root directory
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

# Inject paths into runtime Python environment
sys.path.insert(0, PROJECT_ROOT)
sys.path.insert(0, BACKEND_DIR)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Now safely import FastAPI app instance from main.py
try:
    from main import app
except ImportError:
    from backend.main import app
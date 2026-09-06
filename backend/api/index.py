# S:\Projects\sixsense\backend\api\index.py
import sys
import os

# Add root backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

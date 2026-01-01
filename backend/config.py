import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).resolve().parent

# Data directories
DATA_DIR = BASE_DIR.parent / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
CACHE_DIR = DATA_DIR / "cache"

# Model directories
MODELS_DIR = BASE_DIR.parent / "models"
PRETRAINED_DIR = MODELS_DIR / "pretrained"

# Create directories if they don't exist
for directory in [RAW_DATA_DIR, PROCESSED_DATA_DIR, CACHE_DIR, PRETRAINED_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Google Earth Engine
GEE_PROJECT_ID = os.getenv("GEE_PROJECT_ID", "earthengine-public")

# Satellite collections
SATELLITES = {
    "landsat8": "LANDSAT/LC08/C02/T1_L2",
    "landsat9": "LANDSAT/LC09/C02/T1_L2",
    "sentinel2": "COPERNICUS/S2_SR_HARMONIZED"
}

# Temporal settings
START_YEAR = 2020
END_YEAR = 2022
TEMPORAL_RESOLUTION = "yearly"

# RemoteCLIP settings
REMOTECLIP_MODEL = "remoteclip-base"
BATCH_SIZE = 4
DEVICE = "cpu"  # keep cpu for now

# API settings
API_HOST = "0.0.0.0"
API_PORT = 8000
API_RELOAD = True

GEE_PROJECT_ID = "gee-student-project"


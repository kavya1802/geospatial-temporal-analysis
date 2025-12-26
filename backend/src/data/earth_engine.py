import ee
import sys
from pathlib import Path

# Add backend directory to Python path
BACKEND_DIR = Path(__file__).resolve().parents[2]
sys.path.append(str(BACKEND_DIR))

import config

class EarthEngineClient:
    def __init__(self):
        try:
            ee.Initialize(project='earthengine-public')
            print("✓ Earth Engine initialized successfully")
        except Exception as e:
            print("✗ Earth Engine initialization failed")
            print(e)

    def get_images(self, lat, lon):
        point = ee.Geometry.Point([lon, lat])
        collection = (
            ee.ImageCollection(config.SATELLITES["sentinel2"])
            .filterBounds(point)
            .filterDate("2020-01-01", "2022-12-31")
            .limit(3)
        )
        print("Images found:", collection.size().getInfo())


if __name__ == "__main__":
    client = EarthEngineClient()
    client.get_images(28.6139, 77.2090)  # New Delhi

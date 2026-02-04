import ee
import sys
from pathlib import Path
from datetime import datetime
import numpy as np

# Add backend directory to Python path
BACKEND_DIR = Path(__file__).resolve().parents[2]
sys.path.append(str(BACKEND_DIR))

import config

# Your Google Cloud Project ID
GEE_PROJECT_ID = "gee-student-project-482416"


class EarthEngineClient:
    def __init__(self, auto_authenticate=False):
        """
        Initialize Earth Engine client.
        
        Args:
            auto_authenticate: If True, opens browser for authentication.
                             If False, uses stored credentials (default for server mode).
        """
        self.initialized = False
        self.data_dir = BACKEND_DIR / "data" / "raw" / "gee"
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            # Try to initialize with stored credentials first (no browser popup)
            try:
                ee.Initialize(project=GEE_PROJECT_ID)
                self.initialized = True
            except Exception:
                # If that fails and auto_authenticate is True, try authenticating
                if auto_authenticate:
                    print("  Authenticating with Google Earth Engine...")
                    ee.Authenticate()
                    ee.Initialize(project=GEE_PROJECT_ID)
                    self.initialized = True
                else:
                    raise Exception("No stored credentials. Run 'earthengine authenticate' first.")
            
            if self.initialized:
                print("✓ Earth Engine initialized successfully")
                print(f"  Project: {GEE_PROJECT_ID}")
                print(f"  Data will be saved to: {self.data_dir}")
        except Exception as e:
            print("✗ Earth Engine initialization failed")
            print(f"  Error: {e}")
            print("\n  To fix this:")
            print("  1. Run: earthengine authenticate")
            print("  2. Or run the backend with: python src/main.py --authenticate")

    def get_images(self, lat, lon):
        """Search for images at a location"""
        if not self.initialized:
            print("✗ Earth Engine not initialized")
            return []
        
        point = ee.Geometry.Point([lon, lat])
        collection = (
            ee.ImageCollection(config.SATELLITES["sentinel2"])
            .filterBounds(point)
            .filterDate("2020-01-01", "2024-12-31")
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
            .sort('CLOUDY_PIXEL_PERCENTAGE')
            .limit(10)
        )
        
        count = collection.size().getInfo()
        print(f"✓ Found {count} images")
        return collection
    
    def search_sentinel2(self, lat, lon, start_date, end_date, max_cloud_cover=30, limit=10):
        """
        Search for Sentinel-2 images at a location
        
        Args:
            lat: Latitude
            lon: Longitude
            start_date: Start date "YYYY-MM-DD"
            end_date: End date "YYYY-MM-DD"
            max_cloud_cover: Maximum cloud cover percentage
            limit: Maximum results
            
        Returns:
            List of image metadata
        """
        if not self.initialized:
            return []
        
        print(f"\n🔍 Searching Sentinel-2 images (GEE)...")
        print(f"   Location: ({lat}, {lon})")
        print(f"   Date range: {start_date} to {end_date}")
        
        point = ee.Geometry.Point([lon, lat])
        
        collection = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(point)
            .filterDate(start_date, end_date)
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', max_cloud_cover))
            .sort('CLOUDY_PIXEL_PERCENTAGE')
            .limit(limit)
        )
        
        # Get metadata
        images_list = collection.toList(limit)
        count = collection.size().getInfo()
        print(f"✓ Found {count} images")
        
        results = []
        for i in range(min(count, limit)):
            img = ee.Image(images_list.get(i))
            props = img.getInfo()['properties']
            
            date = props.get('system:time_start', 0)
            date_str = datetime.fromtimestamp(date / 1000).strftime('%Y-%m-%d') if date else 'Unknown'
            cloud = props.get('CLOUDY_PIXEL_PERCENTAGE', 0)
            
            print(f"   {i+1}. {date_str} | Cloud: {cloud:.1f}%")
            
            results.append({
                'id': props.get('system:index', f'image_{i}'),
                'date': date_str,
                'cloud_cover': cloud,
                'source': 'gee',
                'satellite': 'Sentinel-2',
                '_ee_image': img
            })
        
        return results
    
    def get_image_rgb(self, image_meta, resolution=512):
        """
        Get RGB image from Earth Engine
        
        Args:
            image_meta: Metadata dict with '_ee_image' key
            resolution: Output size in pixels
            
        Returns:
            numpy array (height, width, 3)
        """
        if not self.initialized:
            return None
        
        print(f"\n📥 Loading image from GEE...")
        
        ee_image = image_meta.get('_ee_image')
        if ee_image is None:
            print("✗ No Earth Engine image in metadata")
            return None
        
        # Define visualization parameters
        vis_params = {
            'bands': ['B4', 'B3', 'B2'],  # RGB for Sentinel-2
            'min': 0,
            'max': 3000
        }
        
        # Get the image URL for thumbnail
        url = ee_image.getThumbURL({
            'bands': vis_params['bands'],
            'min': vis_params['min'],
            'max': vis_params['max'],
            'dimensions': resolution,
            'format': 'png'
        })
        
        # Download the image
        import urllib.request
        from PIL import Image
        import io
        
        with urllib.request.urlopen(url) as response:
            img_data = response.read()
        
        img = Image.open(io.BytesIO(img_data))
        rgb = np.array(img.convert('RGB'))
        
        print(f"✓ Image loaded: {rgb.shape}")
        return rgb
    
    def get_temporal_images(self, lat, lon, start_year, end_year, images_per_year=1):
        """
        Get images across multiple years for temporal analysis
        
        Args:
            lat: Latitude
            lon: Longitude
            start_year: Starting year
            end_year: Ending year
            images_per_year: Images per year
            
        Returns:
            List of dictionaries with image data and metadata
        """
        if not self.initialized:
            return []
        
        print(f"\n📅 Getting temporal images from {start_year} to {end_year} (GEE)")
        
        temporal_data = []
        
        for year in range(start_year, end_year + 1):
            print(f"\n--- Year {year} ---")
            
            # Search for images in this year
            results = self.search_sentinel2(
                lat=lat,
                lon=lon,
                start_date=f"{year}-03-01",
                end_date=f"{year}-10-31",
                max_cloud_cover=20,
                limit=images_per_year
            )
            
            if results:
                for meta in results[:images_per_year]:
                    try:
                        rgb = self.get_image_rgb(meta)
                        
                        if rgb is not None:
                            data = {
                                'year': year,
                                'date': meta['date'],
                                'satellite': 'Sentinel-2',
                                'cloud_cover': meta['cloud_cover'],
                                'image_array': rgb,
                                'source': 'gee'
                            }
                            temporal_data.append(data)
                            
                            # Save the image
                            filename = f"{lat}_{lon}_{meta['date']}.png"
                            self.save_image(rgb, filename)
                            
                    except Exception as e:
                        print(f"⚠️  Error loading image: {e}")
            else:
                print(f"   No images found for {year}")
        
        print(f"\n✓ Retrieved {len(temporal_data)} images total")
        return temporal_data
    
    def save_image(self, rgb_array, filename):
        """Save RGB array as image file"""
        from PIL import Image
        
        save_path = self.data_dir / filename
        img = Image.fromarray(rgb_array)
        img.save(save_path)
        print(f"✓ Saved: {save_path}")
        return save_path


if __name__ == "__main__":
    print("=" * 50)
    print("Google Earth Engine Client Test")
    print("=" * 50)
    
    client = EarthEngineClient()
    
    if client.initialized:
        # Test with New Delhi
        lat, lon = 28.6139, 77.2090
        
        print("\n" + "=" * 50)
        print("Testing image search...")
        print("=" * 50)
        
        results = client.search_sentinel2(
            lat, lon,
            start_date="2023-01-01",
            end_date="2023-12-31",
            max_cloud_cover=20,
            limit=3
        )
        
        if results:
            print("\n" + "=" * 50)
            print("Testing image download...")
            print("=" * 50)
            
            rgb = client.get_image_rgb(results[0])
            if rgb is not None:
                client.save_image(rgb, f"test_{results[0]['date']}.png")
        
        print("\n✅ Test complete!")

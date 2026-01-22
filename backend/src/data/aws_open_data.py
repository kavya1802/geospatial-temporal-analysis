"""
AWS Open Data Satellite Image Loader
FREE satellite imagery - No registration required!

Provides access to:
- Sentinel-2 (10m resolution)
- Landsat 8/9 (30m resolution)
"""

import os
import sys
from pathlib import Path
from datetime import datetime
import numpy as np

# Add backend directory to Python path
BACKEND_DIR = Path(__file__).resolve().parents[2]
sys.path.append(str(BACKEND_DIR))

try:
    from pystac_client import Client
    import rasterio
    from rasterio.windows import Window
    DEPENDENCIES_INSTALLED = True
except ImportError:
    DEPENDENCIES_INSTALLED = False
    print("⚠️  Required packages not installed. Run:")
    print("    pip install rasterio pystac-client boto3")


class AWSOpenDataClient:
    """
    Load satellite imagery from AWS Open Data
    FREE - No authentication required!
    """
    
    def __init__(self):
        if not DEPENDENCIES_INSTALLED:
            raise ImportError("Please install: pip install rasterio pystac-client boto3")
        
        # AWS Earth Search API (FREE, no auth)
        self.catalog_url = "https://earth-search.aws.element84.com/v1"
        self.catalog = Client.open(self.catalog_url)
        
        # Data directory for saving images
        self.data_dir = BACKEND_DIR / "data" / "raw" / "aws"
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        print("✓ AWS Open Data client initialized")
        print(f"  Data will be saved to: {self.data_dir}")
    
    def search_sentinel2(self, lat, lon, start_date, end_date, max_cloud_cover=30, limit=10):
        """
        Search for Sentinel-2 images at a location
        
        Args:
            lat: Latitude (e.g., 28.6139 for New Delhi)
            lon: Longitude (e.g., 77.2090 for New Delhi)
            start_date: Start date as string "YYYY-MM-DD"
            end_date: End date as string "YYYY-MM-DD"
            max_cloud_cover: Maximum cloud cover percentage (0-100)
            limit: Maximum number of results
            
        Returns:
            List of STAC items (image metadata)
        """
        print(f"\n🔍 Searching Sentinel-2 images...")
        print(f"   Location: ({lat}, {lon})")
        print(f"   Date range: {start_date} to {end_date}")
        print(f"   Max cloud cover: {max_cloud_cover}%")
        
        # Create bounding box (0.05 degree buffer ~ 5km)
        buffer = 0.05
        bbox = [lon - buffer, lat - buffer, lon + buffer, lat + buffer]
        
        # Search the catalog
        search = self.catalog.search(
            collections=["sentinel-2-l2a"],  # Sentinel-2 Level 2A (atmospherically corrected)
            bbox=bbox,
            datetime=f"{start_date}/{end_date}",
            query={"eo:cloud_cover": {"lt": max_cloud_cover}},
            limit=limit
        )
        
        items = list(search.items())
        print(f"✓ Found {len(items)} images")
        
        # Print summary
        for i, item in enumerate(items):
            date = item.properties.get('datetime', 'Unknown')[:10]
            cloud = item.properties.get('eo:cloud_cover', 'N/A')
            print(f"   {i+1}. {date} | Cloud: {cloud:.1f}%")
        
        return items
    
    def search_landsat(self, lat, lon, start_date, end_date, max_cloud_cover=30, limit=10):
        """
        Search for Landsat 8/9 images at a location
        
        Args:
            lat: Latitude
            lon: Longitude
            start_date: Start date as string "YYYY-MM-DD"
            end_date: End date as string "YYYY-MM-DD"
            max_cloud_cover: Maximum cloud cover percentage
            limit: Maximum number of results
            
        Returns:
            List of STAC items
        """
        print(f"\n🔍 Searching Landsat images...")
        print(f"   Location: ({lat}, {lon})")
        print(f"   Date range: {start_date} to {end_date}")
        
        buffer = 0.1
        bbox = [lon - buffer, lat - buffer, lon + buffer, lat + buffer]
        
        search = self.catalog.search(
            collections=["landsat-c2-l2"],  # Landsat Collection 2 Level 2
            bbox=bbox,
            datetime=f"{start_date}/{end_date}",
            query={"eo:cloud_cover": {"lt": max_cloud_cover}},
            limit=limit
        )
        
        items = list(search.items())
        print(f"✓ Found {len(items)} images")
        
        for i, item in enumerate(items):
            date = item.properties.get('datetime', 'Unknown')[:10]
            cloud = item.properties.get('eo:cloud_cover', 'N/A')
            print(f"   {i+1}. {date} | Cloud: {cloud:.1f}%")
        
        return items
    
    def get_image_rgb(self, item, satellite="sentinel2", resolution=512):
        """
        Load RGB image from a STAC item (reads directly from cloud!)
        
        Args:
            item: STAC item from search results
            satellite: "sentinel2" or "landsat"
            resolution: Output image size (pixels)
            
        Returns:
            numpy array of shape (height, width, 3) - RGB image
        """
        print(f"\n📥 Loading image from cloud...")
        
        # Get band URLs based on satellite type
        if satellite == "sentinel2":
            # Sentinel-2 band names
            red_url = item.assets["red"].href
            green_url = item.assets["green"].href
            blue_url = item.assets["blue"].href
        else:
            # Landsat band names
            red_url = item.assets["red"].href
            green_url = item.assets["green"].href
            blue_url = item.assets["blue"].href
        
        bands = []
        for band_url in [red_url, green_url, blue_url]:
            with rasterio.open(band_url) as src:
                # Read a window from center of image
                height, width = src.height, src.width
                
                # Calculate window for center crop
                win_size = min(height, width, resolution * 10)
                row_start = (height - win_size) // 2
                col_start = (width - win_size) // 2
                
                window = Window(col_start, row_start, win_size, win_size)
                
                # Read and resize
                data = src.read(1, window=window)
                
                # Resize to target resolution using simple downsampling
                step = max(1, win_size // resolution)
                data = data[::step, ::step][:resolution, :resolution]
                
                bands.append(data)
        
        # Stack bands into RGB
        rgb = np.stack(bands, axis=-1)
        
        # Normalize to 0-255 range
        rgb = self._normalize_image(rgb)
        
        print(f"✓ Image loaded: {rgb.shape}")
        return rgb
    
    def _normalize_image(self, img, percentile=98):
        """Normalize image to 0-255 range for display"""
        img = img.astype(np.float32)
        
        # Clip outliers using percentile
        p_low = np.percentile(img, 100 - percentile)
        p_high = np.percentile(img, percentile)
        
        img = np.clip(img, p_low, p_high)
        
        # Scale to 0-255
        img = (img - p_low) / (p_high - p_low + 1e-8) * 255
        
        return img.astype(np.uint8)
    
    def save_image(self, rgb_array, filename, location_name=""):
        """Save RGB array as image file"""
        from PIL import Image
        
        save_path = self.data_dir / filename
        img = Image.fromarray(rgb_array)
        img.save(save_path)
        print(f"✓ Saved: {save_path}")
        return save_path
    
    def get_temporal_images(self, lat, lon, start_year, end_year, images_per_year=1):
        """
        Get images across multiple years for temporal analysis
        
        Args:
            lat: Latitude
            lon: Longitude
            start_year: Starting year (e.g., 2018)
            end_year: Ending year (e.g., 2024)
            images_per_year: How many images to get per year
            
        Returns:
            List of dictionaries with image data and metadata
        """
        print(f"\n📅 Getting temporal images from {start_year} to {end_year}")
        
        temporal_data = []
        
        for year in range(start_year, end_year + 1):
            print(f"\n--- Year {year} ---")
            
            # Search for images in this year (preferring summer months for clearer images)
            items = self.search_sentinel2(
                lat=lat,
                lon=lon,
                start_date=f"{year}-03-01",
                end_date=f"{year}-10-31",
                max_cloud_cover=20,
                limit=images_per_year
            )
            
            if items:
                for item in items[:images_per_year]:
                    try:
                        rgb = self.get_image_rgb(item, satellite="sentinel2")
                        
                        date_str = item.properties.get('datetime', '')[:10]
                        
                        data = {
                            'year': year,
                            'date': date_str,
                            'satellite': 'Sentinel-2',
                            'cloud_cover': item.properties.get('eo:cloud_cover', 0),
                            'image_array': rgb,
                            'item_id': item.id
                        }
                        
                        temporal_data.append(data)
                        
                        # Save the image
                        filename = f"{lat}_{lon}_{date_str}.png"
                        self.save_image(rgb, filename)
                        
                    except Exception as e:
                        print(f"⚠️  Error loading image: {e}")
            else:
                print(f"   No images found for {year}")
        
        print(f"\n✓ Retrieved {len(temporal_data)} images total")
        return temporal_data
    
    def display_image(self, rgb_array, title="Satellite Image"):
        """Display image using matplotlib"""
        try:
            import matplotlib.pyplot as plt
            
            plt.figure(figsize=(10, 10))
            plt.imshow(rgb_array)
            plt.title(title)
            plt.axis('off')
            plt.tight_layout()
            plt.show()
        except ImportError:
            print("Install matplotlib to display: pip install matplotlib")


# ============================================
# MAIN - Test the loader
# ============================================
if __name__ == "__main__":
    print("=" * 50)
    print("AWS Open Data Satellite Image Loader")
    print("=" * 50)
    
    # Initialize client
    client = AWSOpenDataClient()
    
    # Example: New Delhi, India
    lat, lon = 28.6139, 77.2090
    
    # Search for recent images
    print("\n" + "=" * 50)
    print("EXAMPLE 1: Search for Sentinel-2 images")
    print("=" * 50)
    
    items = client.search_sentinel2(
        lat=lat,
        lon=lon,
        start_date="2023-01-01",
        end_date="2024-12-31",
        max_cloud_cover=20,
        limit=5
    )
    
    # Load and display first image
    if items:
        print("\n" + "=" * 50)
        print("EXAMPLE 2: Load and save an image")
        print("=" * 50)
        
        rgb = client.get_image_rgb(items[0])
        
        # Save the image
        date_str = items[0].properties.get('datetime', '')[:10]
        client.save_image(rgb, f"new_delhi_{date_str}.png")
        
        # Display (if matplotlib is available)
        client.display_image(rgb, f"New Delhi - {date_str}")
    
    print("\n" + "=" * 50)
    print("✅ Test complete!")
    print("=" * 50)

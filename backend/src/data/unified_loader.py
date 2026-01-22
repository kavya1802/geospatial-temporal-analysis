"""
Unified Data Loader - Single interface for all satellite data sources
Prevents confusion between GEE and AWS data

This module provides:
1. A single interface for the rest of the application
2. Clear separation between data sources
3. Metadata tracking to identify data origin
"""

import os
import sys
from pathlib import Path
from enum import Enum
from typing import List, Dict, Optional, Any
from datetime import datetime
import json

# Add backend directory to Python path
BACKEND_DIR = Path(__file__).resolve().parents[2]
sys.path.append(str(BACKEND_DIR))

import config


class DataSource(Enum):
    """Available data sources - use ONE at a time to avoid confusion"""
    AWS_OPEN_DATA = "aws"
    GOOGLE_EARTH_ENGINE = "gee"
    SAMPLE_DATA = "sample"


class UnifiedDataLoader:
    """
    Single interface for all satellite data sources.
    
    IMPORTANT: Only ONE data source is active at a time.
    This prevents mixing data from different sources.
    """
    
    def __init__(self, source: DataSource = DataSource.AWS_OPEN_DATA):
        """
        Initialize with a specific data source.
        
        Args:
            source: Which data source to use (default: AWS_OPEN_DATA)
        """
        self.source = source
        self.client = None
        self.metadata_file = BACKEND_DIR / "data" / "data_source_info.json"
        
        # Data directories - separate for each source
        self.data_dirs = {
            DataSource.AWS_OPEN_DATA: BACKEND_DIR / "data" / "raw" / "aws",
            DataSource.GOOGLE_EARTH_ENGINE: BACKEND_DIR / "data" / "raw" / "gee",
            DataSource.SAMPLE_DATA: BACKEND_DIR / "data" / "raw" / "sample",
        }
        
        # Create directories
        for dir_path in self.data_dirs.values():
            dir_path.mkdir(parents=True, exist_ok=True)
        
        # Initialize the appropriate client
        self._init_client()
        
        # Save current source info
        self._save_source_info()
    
    def _init_client(self):
        """Initialize the appropriate data client based on source"""
        
        if self.source == DataSource.AWS_OPEN_DATA:
            try:
                from src.data.aws_open_data import AWSOpenDataClient
                self.client = AWSOpenDataClient()
                print(f"✓ Using AWS Open Data (FREE, no auth required)")
            except ImportError as e:
                print(f"✗ AWS Open Data not available: {e}")
                print("  Run: pip install rasterio pystac-client boto3")
                self.client = None
                
        elif self.source == DataSource.GOOGLE_EARTH_ENGINE:
            try:
                from src.data.earth_engine import EarthEngineClient
                self.client = EarthEngineClient()
                print(f"✓ Using Google Earth Engine")
            except Exception as e:
                print(f"✗ Google Earth Engine not available: {e}")
                print("  GEE requires authentication. Consider using AWS Open Data instead.")
                self.client = None
                
        elif self.source == DataSource.SAMPLE_DATA:
            from src.data.sample_data import SampleDataLoader
            self.client = SampleDataLoader(str(self.data_dirs[DataSource.SAMPLE_DATA]))
            print(f"✓ Using Sample Data (mock/development mode)")
    
    def _save_source_info(self):
        """Save current data source info to prevent mixing"""
        info = {
            "active_source": self.source.value,
            "source_name": self.source.name,
            "last_updated": datetime.now().isoformat(),
            "data_directory": str(self.data_dirs[self.source]),
            "warning": "DO NOT mix data from different sources!"
        }
        
        with open(self.metadata_file, 'w') as f:
            json.dump(info, f, indent=2)
    
    def get_current_source(self) -> Dict[str, Any]:
        """Get information about current data source"""
        return {
            "source": self.source.value,
            "source_name": self.source.name,
            "data_directory": str(self.data_dirs[self.source]),
            "is_ready": self.client is not None
        }
    
    def search_images(
        self,
        lat: float,
        lon: float,
        start_date: str,
        end_date: str,
        max_cloud_cover: int = 30,
        limit: int = 10,
        satellite: str = "sentinel2"
    ) -> List[Dict]:
        """
        Search for satellite images at a location.
        
        Args:
            lat: Latitude
            lon: Longitude  
            start_date: Start date "YYYY-MM-DD"
            end_date: End date "YYYY-MM-DD"
            max_cloud_cover: Maximum cloud cover percentage
            limit: Maximum results
            satellite: "sentinel2" or "landsat"
            
        Returns:
            List of image metadata dictionaries
        """
        if self.client is None:
            print(f"✗ No client available for {self.source.name}")
            return []
        
        print(f"\n📡 Data Source: {self.source.name}")
        print(f"   Directory: {self.data_dirs[self.source]}")
        
        if self.source == DataSource.AWS_OPEN_DATA:
            if satellite == "landsat":
                items = self.client.search_landsat(lat, lon, start_date, end_date, max_cloud_cover, limit)
            else:
                items = self.client.search_sentinel2(lat, lon, start_date, end_date, max_cloud_cover, limit)
            
            # Convert to unified format with source tracking
            return [self._create_unified_metadata(item, "stac") for item in items]
        
        elif self.source == DataSource.GOOGLE_EARTH_ENGINE:
            # GEE implementation
            self.client.get_images(lat, lon)
            return []  # GEE returns different format
        
        elif self.source == DataSource.SAMPLE_DATA:
            # Return mock data
            return self.client.create_mock_temporal_data(f"{lat}_{lon}", num_years=5)
        
        return []
    
    def _create_unified_metadata(self, item: Any, item_type: str) -> Dict:
        """Create unified metadata format with source tracking"""
        
        if item_type == "stac":
            return {
                "id": item.id,
                "date": item.properties.get('datetime', '')[:10],
                "cloud_cover": item.properties.get('eo:cloud_cover', 0),
                "source": self.source.value,  # Track where data came from
                "source_name": self.source.name,
                "satellite": item.properties.get('platform', 'unknown'),
                "_raw_item": item  # Keep original for loading
            }
        
        return item
    
    def load_image(self, image_meta: Dict, resolution: int = 512):
        """
        Load an image from search results.
        
        Args:
            image_meta: Metadata from search_images()
            resolution: Output image size
            
        Returns:
            numpy array (RGB image)
        """
        if self.client is None:
            return None
        
        # Verify source matches to prevent mixing
        if image_meta.get("source") != self.source.value:
            print(f"⚠️  WARNING: Image source ({image_meta.get('source')}) doesn't match")
            print(f"   Current source: {self.source.value}")
            print(f"   This could cause data mixing issues!")
            return None
        
        if self.source == DataSource.AWS_OPEN_DATA:
            raw_item = image_meta.get("_raw_item")
            if raw_item:
                return self.client.get_image_rgb(raw_item, resolution=resolution)
        
        elif self.source == DataSource.SAMPLE_DATA:
            return image_meta.get("image_array")
        
        return None
    
    def save_image(self, rgb_array, filename: str, metadata: Dict = None):
        """
        Save image to the appropriate source directory.
        
        Args:
            rgb_array: RGB image array
            filename: Filename for the image
            metadata: Optional metadata to save alongside
        """
        if self.source == DataSource.AWS_OPEN_DATA and self.client:
            save_path = self.client.save_image(rgb_array, filename)
            
            # Save metadata JSON alongside image
            if metadata:
                meta_path = save_path.with_suffix('.json')
                # Remove non-serializable items
                clean_meta = {k: v for k, v in metadata.items() if k != "_raw_item"}
                with open(meta_path, 'w') as f:
                    json.dump(clean_meta, f, indent=2)
            
            return save_path
        
        return None
    
    def get_temporal_images(
        self,
        lat: float,
        lon: float,
        start_year: int,
        end_year: int,
        images_per_year: int = 1
    ) -> List[Dict]:
        """
        Get images across multiple years for temporal analysis.
        
        All images will be from the SAME source to ensure consistency.
        
        Args:
            lat: Latitude
            lon: Longitude
            start_year: Starting year
            end_year: Ending year
            images_per_year: Images per year
            
        Returns:
            List of dictionaries with image data and metadata
        """
        print(f"\n{'='*50}")
        print(f"TEMPORAL DATA COLLECTION")
        print(f"Source: {self.source.name} (EXCLUSIVE)")
        print(f"{'='*50}")
        
        if self.source == DataSource.AWS_OPEN_DATA and self.client:
            temporal_data = self.client.get_temporal_images(
                lat, lon, start_year, end_year, images_per_year
            )
            
            # Add source tracking to each item
            for item in temporal_data:
                item["source"] = self.source.value
                item["source_name"] = self.source.name
            
            return temporal_data
        
        elif self.source == DataSource.GOOGLE_EARTH_ENGINE and self.client:
            temporal_data = self.client.get_temporal_images(
                lat, lon, start_year, end_year, images_per_year
            )
            
            # Add source tracking to each item
            for item in temporal_data:
                item["source"] = self.source.value
                item["source_name"] = self.source.name
            
            return temporal_data
        
        elif self.source == DataSource.SAMPLE_DATA and self.client:
            return self.client.create_mock_temporal_data(
                f"{lat}_{lon}", 
                num_years=(end_year - start_year + 1)
            )
        
        return []
    
    def list_downloaded_images(self) -> List[Dict]:
        """List all downloaded images for current source"""
        data_dir = self.data_dirs[self.source]
        images = []
        
        for img_path in data_dir.glob("*.png"):
            meta_path = img_path.with_suffix('.json')
            
            item = {
                "filename": img_path.name,
                "path": str(img_path),
                "source": self.source.value,
            }
            
            # Load metadata if exists
            if meta_path.exists():
                with open(meta_path) as f:
                    item["metadata"] = json.load(f)
            
            images.append(item)
        
        return images
    
    @staticmethod
    def get_available_sources() -> List[Dict]:
        """Get list of available data sources with status"""
        sources = []
        
        # Check AWS
        try:
            from src.data.aws_open_data import AWSOpenDataClient
            sources.append({
                "id": "aws",
                "name": "AWS Open Data",
                "available": True,
                "requires_auth": False,
                "description": "FREE satellite imagery, no registration needed"
            })
        except:
            sources.append({
                "id": "aws",
                "name": "AWS Open Data", 
                "available": False,
                "requires_auth": False,
                "description": "Install: pip install rasterio pystac-client boto3"
            })
        
        # Check GEE
        try:
            import ee
            ee.Initialize()
            sources.append({
                "id": "gee",
                "name": "Google Earth Engine",
                "available": True,
                "requires_auth": True,
                "description": "Requires GEE account and authentication"
            })
        except:
            sources.append({
                "id": "gee",
                "name": "Google Earth Engine",
                "available": False,
                "requires_auth": True,
                "description": "Not authenticated. Use AWS instead."
            })
        
        # Sample data always available
        sources.append({
            "id": "sample",
            "name": "Sample Data",
            "available": True,
            "requires_auth": False,
            "description": "Mock data for development/testing"
        })
        
        return sources


# ============================================
# Factory function for easy initialization
# ============================================
def create_data_loader(source: str = "aws") -> UnifiedDataLoader:
    """
    Create a data loader with the specified source.
    
    Args:
        source: "aws", "gee", or "sample"
        
    Returns:
        UnifiedDataLoader instance
    """
    source_map = {
        "aws": DataSource.AWS_OPEN_DATA,
        "gee": DataSource.GOOGLE_EARTH_ENGINE,
        "sample": DataSource.SAMPLE_DATA,
    }
    
    return UnifiedDataLoader(source_map.get(source, DataSource.AWS_OPEN_DATA))


# ============================================
# MAIN - Test the unified loader
# ============================================
if __name__ == "__main__":
    print("=" * 60)
    print("UNIFIED DATA LOADER TEST")
    print("=" * 60)
    
    # Show available sources
    print("\n📋 Available Data Sources:")
    for src in UnifiedDataLoader.get_available_sources():
        status = "✓" if src["available"] else "✗"
        print(f"   {status} {src['name']}: {src['description']}")
    
    # Create loader with AWS (recommended)
    print("\n" + "=" * 60)
    print("Creating loader with AWS Open Data...")
    print("=" * 60)
    
    loader = create_data_loader("aws")
    
    # Show current source
    info = loader.get_current_source()
    print(f"\n📡 Active Source: {info['source_name']}")
    print(f"   Directory: {info['data_directory']}")
    print(f"   Ready: {info['is_ready']}")
    
    # Search for images
    print("\n" + "=" * 60)
    print("Searching for images...")
    print("=" * 60)
    
    images = loader.search_images(
        lat=28.6139,
        lon=77.2090,
        start_date="2024-01-01",
        end_date="2024-12-31",
        max_cloud_cover=20,
        limit=5
    )
    
    print(f"\nFound {len(images)} images")
    for img in images[:3]:
        print(f"   - {img['date']} | Source: {img['source']} | Cloud: {img['cloud_cover']:.1f}%")
    
    print("\n" + "=" * 60)
    print("✅ Test complete!")
    print("=" * 60)

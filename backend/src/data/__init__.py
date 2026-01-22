"""
Data module for satellite imagery loading.

Available loaders:
- AWSOpenDataClient: FREE satellite data from AWS (RECOMMENDED)
- EarthEngineClient: Google Earth Engine (requires authentication)
- SampleDataLoader: Mock data for development
- UnifiedDataLoader: Single interface for all sources

Usage:
    from src.data.unified_loader import create_data_loader
    
    loader = create_data_loader("aws")  # Use AWS (recommended)
    images = loader.search_images(lat=28.6, lon=77.2, ...)
"""

from src.data.unified_loader import (
    UnifiedDataLoader,
    DataSource,
    create_data_loader
)

__all__ = [
    "UnifiedDataLoader",
    "DataSource", 
    "create_data_loader"
]

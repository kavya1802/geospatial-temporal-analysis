"""
FastAPI Backend Server
Provides REST API for the frontend to access satellite data
"""

import os
import sys
from pathlib import Path
from typing import Optional, List
from datetime import datetime
import json
import base64

# Add backend directory to Python path
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(BACKEND_DIR))

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import uvicorn

# Import our data loader
from src.data.unified_loader import create_data_loader, UnifiedDataLoader, DataSource

# Initialize FastAPI
app = FastAPI(
    title="Geospatial Temporal Analysis API",
    description="API for satellite imagery and temporal analysis",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global data loader - using AWS by default (GEE is not working)
data_loader: UnifiedDataLoader = None


# ============================================
# Request/Response Models
# ============================================

class AnalyzeRequest(BaseModel):
    latitude: float
    longitude: float
    start_year: int = 2020
    end_year: int = 2024
    satellite: str = "sentinel2"
    max_cloud_cover: int = 30


class SearchRequest(BaseModel):
    latitude: float
    longitude: float
    start_date: str
    end_date: str
    max_cloud_cover: int = 30
    limit: int = 10
    satellite: str = "sentinel2"


class DataSourceRequest(BaseModel):
    source: str  # "aws", "gee", or "sample"


# ============================================
# Startup Event
# ============================================

@app.on_event("startup")
async def startup_event():
    """Initialize data loader on startup"""
    global data_loader
    print("\n" + "=" * 50)
    print("🚀 Starting Geospatial API Server")
    print("=" * 50)
    
    # Use Google Earth Engine (now registered and working!)
    data_loader = create_data_loader("gee")
    
    print("\n✓ API Server ready!")
    print("  Frontend URL: http://localhost:3000")
    print("  API URL: http://localhost:8000")
    print("  API Docs: http://localhost:8000/docs")


# ============================================
# API Endpoints
# ============================================

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "name": "Geospatial Temporal Analysis API",
        "version": "1.0.0",
        "status": "running",
        "data_source": data_loader.get_current_source() if data_loader else None
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "data_loader_ready": data_loader is not None
    }


@app.get("/api/data-sources")
async def get_data_sources():
    """Get available data sources and their status"""
    return {
        "sources": UnifiedDataLoader.get_available_sources(),
        "active": data_loader.get_current_source() if data_loader else None,
        "recommendation": "Use 'aws' - Google Earth Engine is currently not working"
    }


@app.post("/api/data-sources/switch")
async def switch_data_source(request: DataSourceRequest):
    """Switch to a different data source"""
    global data_loader
    
    valid_sources = ["aws", "gee", "sample"]
    if request.source not in valid_sources:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid source. Use one of: {valid_sources}"
        )
    
    if request.source == "gee":
        return {
            "success": False,
            "message": "Google Earth Engine is currently not working. Using AWS instead.",
            "active_source": "aws"
        }
    
    data_loader = create_data_loader(request.source)
    
    return {
        "success": True,
        "message": f"Switched to {request.source}",
        "active_source": data_loader.get_current_source()
    }


@app.post("/api/search")
async def search_images(request: SearchRequest):
    """Search for satellite images at a location"""
    if data_loader is None:
        raise HTTPException(status_code=500, detail="Data loader not initialized")
    
    try:
        results = data_loader.search_images(
            lat=request.latitude,
            lon=request.longitude,
            start_date=request.start_date,
            end_date=request.end_date,
            max_cloud_cover=request.max_cloud_cover,
            limit=request.limit,
            satellite=request.satellite
        )
        
        # Clean results for JSON serialization (remove raw items)
        clean_results = []
        for r in results:
            clean_results.append({
                "id": r.get("id"),
                "date": r.get("date"),
                "cloud_cover": r.get("cloud_cover"),
                "source": r.get("source"),
                "satellite": r.get("satellite")
            })
        
        return {
            "success": True,
            "count": len(clean_results),
            "source": data_loader.get_current_source()["source"],
            "results": clean_results
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze")
async def analyze_location(request: AnalyzeRequest):
    """
    Analyze a location over time.
    Returns temporal satellite images and metadata.
    """
    if data_loader is None:
        raise HTTPException(status_code=500, detail="Data loader not initialized")
    
    try:
        print(f"\n📍 Analyzing location: ({request.latitude}, {request.longitude})")
        print(f"   Years: {request.start_year} - {request.end_year}")
        
        # Get temporal images
        temporal_data = data_loader.get_temporal_images(
            lat=request.latitude,
            lon=request.longitude,
            start_year=request.start_year,
            end_year=request.end_year,
            images_per_year=1
        )
        
        # Prepare response
        images_info = []
        for data in temporal_data:
            # Convert image to base64 for sending to frontend
            if "image_array" in data:
                from PIL import Image
                import io
                
                img = Image.fromarray(data["image_array"])
                buffer = io.BytesIO()
                img.save(buffer, format="PNG")
                img_base64 = base64.b64encode(buffer.getvalue()).decode()
                
                images_info.append({
                    "year": data.get("year"),
                    "date": data.get("date"),
                    "satellite": data.get("satellite"),
                    "cloud_cover": data.get("cloud_cover"),
                    "source": data.get("source"),
                    "image_base64": f"data:image/png;base64,{img_base64}"
                })
        
        return {
            "success": True,
            "location": {
                "latitude": request.latitude,
                "longitude": request.longitude
            },
            "time_range": {
                "start_year": request.start_year,
                "end_year": request.end_year
            },
            "data_source": data_loader.get_current_source()["source"],
            "images_count": len(images_info),
            "images": images_info
        }
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/images")
async def list_images():
    """List all downloaded images"""
    if data_loader is None:
        raise HTTPException(status_code=500, detail="Data loader not initialized")
    
    images = data_loader.list_downloaded_images()
    
    return {
        "success": True,
        "source": data_loader.get_current_source()["source"],
        "count": len(images),
        "images": images
    }


@app.get("/api/images/{filename}")
async def get_image(filename: str):
    """Get a specific downloaded image"""
    if data_loader is None:
        raise HTTPException(status_code=500, detail="Data loader not initialized")
    
    # Get data directory for current source
    source_info = data_loader.get_current_source()
    data_dir = Path(source_info["data_directory"])
    
    image_path = data_dir / filename
    
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    
    return FileResponse(image_path)


@app.get("/api/sample-locations")
async def get_sample_locations():
    """Get sample locations for testing"""
    return {
        "locations": [
            {
                "name": "New Delhi, India",
                "latitude": 28.6139,
                "longitude": 77.2090,
                "description": "Urban expansion study"
            },
            {
                "name": "Mumbai, India",
                "latitude": 19.0760,
                "longitude": 72.8777,
                "description": "Coastal urban area"
            },
            {
                "name": "Amazon Basin, Brazil",
                "latitude": -3.4653,
                "longitude": -62.2159,
                "description": "Deforestation monitoring"
            },
            {
                "name": "Dubai, UAE",
                "latitude": 25.2048,
                "longitude": 55.2708,
                "description": "Rapid urban development"
            },
            {
                "name": "Beijing, China",
                "latitude": 39.9042,
                "longitude": 116.4074,
                "description": "Megacity expansion"
            }
        ]
    }


# ============================================
# Main Entry Point
# ============================================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Geospatial Temporal Analysis API")
    parser.add_argument('--authenticate', action='store_true', 
                        help='Force Google Earth Engine authentication (opens browser)')
    parser.add_argument('--port', type=int, default=8000, help='Port to run the server on')
    args = parser.parse_args()
    
    # If authenticate flag is set, run authentication before starting server
    if args.authenticate:
        print("\n" + "=" * 50)
        print("Google Earth Engine Authentication")
        print("=" * 50)
        import ee
        ee.Authenticate()
        print("✓ Authentication complete! Starting server...")
    
    print("\n" + "=" * 50)
    print("Starting Geospatial Temporal Analysis API")
    print("=" * 50)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=args.port
    )

# 🌍 Geospatial Temporal Analysis System

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Earth Engine](https://img.shields.io/badge/Google-Earth%20Engine-blue.svg)](https://earthengine.google.com/)
[![IEEE](https://img.shields.io/badge/Base%20Paper-IEEE%20TGRS%202024-red.svg)](https://ieeexplore.ieee.org/document/10504785)

> A Vision-Language Approach for Historical Change Detection in Geospatial Imagery

An intelligent system that analyzes geographical changes over time using satellite imagery and AI-powered vision-language models. Upload any location's image or coordinates, and get a comprehensive 10-year historical analysis with semantic descriptions of changes.

![System Demo](docs/images/demo.gif)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Base Paper](#base-paper)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Technologies](#technologies)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [Acknowledgments](#acknowledgments)
- [License](#license)

---

## 🎯 Overview

This project leverages **RemoteCLIP** (a state-of-the-art vision-language foundation model) combined with **Google Earth Engine** to provide automated temporal analysis of geospatial changes. The system can:

- Accept geospatial images or GPS coordinates
- Retrieve 10 years of historical satellite imagery
- Perform zero-shot classification without manual labeling
- Generate natural language descriptions of observed changes
- Visualize temporal evolution through an interactive interface

### Why This Project?

Traditional geospatial analysis requires:
- ❌ Manual labeling of thousands of images
- ❌ Task-specific model training
- ❌ Limited semantic understanding
- ❌ Inability to handle new scenarios

**Our solution provides:**
- ✅ Automated zero-shot classification
- ✅ Natural language descriptions
- ✅ Interactive temporal visualization
- ✅ Works globally with any coordinates

---

## ✨ Features

### Core Capabilities
- 🛰️ **Multi-Source Satellite Data**: Integrates Landsat 8/9 and Sentinel-2 imagery
- 🤖 **Zero-Shot Classification**: No manual training required for new locations
- 📊 **Temporal Analysis**: Compares changes across 10-year periods
- 💬 **Semantic Descriptions**: Natural language explanations of detected changes
- 🗺️ **Interactive Visualization**: Timeline-based UI with side-by-side comparisons
- 📈 **Change Quantification**: Statistical metrics for geographical transformations
- 📄 **Automated Reports**: Downloadable analysis with insights

### Use Cases
- 🌳 **Environmental Monitoring**: Track deforestation and ecosystem changes
- 🏙️ **Urban Planning**: Monitor city expansion and infrastructure
- 💧 **Water Resource Management**: Analyze river courses and reservoir levels
- 🌾 **Agriculture**: Study crop patterns and land use modifications
- 🌪️ **Disaster Assessment**: Evaluate long-term impacts of natural disasters

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER INPUT                            │
│              (Image Upload / GPS Coordinates)                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  GOOGLE EARTH ENGINE API                     │
│        (Retrieve 10 Years of Satellite Imagery)              │
│              Landsat 8/9 • Sentinel-2                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  REMOTECLIP PROCESSING                       │
│          Vision-Language Feature Extraction                  │
│        • Image Encoding  • Text Encoding                     │
│        • Zero-Shot Classification                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  TEMPORAL ANALYSIS ENGINE                    │
│      • Embedding Comparison  • Change Detection              │
│      • Semantic Description  • Statistical Analysis          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   VISUALIZATION LAYER                        │
│   Interactive Timeline • Comparison Views • Reports          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📚 Base Paper

This project is based on the following IEEE research paper:

**RemoteCLIP: A Vision Language Foundation Model for Remote Sensing**

- **Authors**: Fan Liu et al.
- **Publication**: IEEE Transactions on Geoscience and Remote Sensing, 2024
- **IEEE Xplore**: [https://ieeexplore.ieee.org/document/10504785](https://ieeexplore.ieee.org/document/10504785)
- **Key Innovation**: First vision-language foundation model for remote sensing enabling zero-shot classification

### Key Advantages of RemoteCLIP:
- 9.14% improvement over previous methods on RSITMD dataset
- 6.39% improvement in zero-shot classification accuracy
- Works across diverse geographical regions
- No manual labeling required

---

## 🚀 Installation

### Prerequisites

- Python 3.9 or higher
- Node.js 16+ (for frontend)
- Google Earth Engine account
- Git
- Github

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/geospatial-temporal-analysis.git
cd geospatial-temporal-analysis

# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install RemoteCLIP
pip install git+https://github.com/ChenDelong1999/RemoteCLIP.git

# Authenticate Google Earth Engine
earthengine authenticate
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Google Earth Engine
GEE_PROJECT_ID=your-project-id

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# Model Configuration
REMOTECLIP_MODEL=remoteclip-base
DEVICE=cpu  # or 'cuda' if GPU available

# Frontend
FRONTEND_URL=http://localhost:3000
```

---

## 💻 Usage

### Starting the Backend

```bash
# From backend directory with venv activated
cd backend
python src/main.py
```

The API will be available at `http://localhost:8000`

### Starting the Frontend

```bash
# From frontend directory
cd frontend
npm start
```

The web interface will open at `http://localhost:3000`

### API Examples

#### 1. Analyze Location by Coordinates

```bash
curl -X POST "http://localhost:8000/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 28.6139,
    "longitude": 77.2090,
    "start_year": 2015,
    "end_year": 2025
  }'
```

#### 2. Upload Image for Analysis

```bash
curl -X POST "http://localhost:8000/api/analyze-image" \
  -F "image=@/path/to/image.jpg"
```

#### 3. Get Temporal Comparison

```bash
curl -X GET "http://localhost:8000/api/compare?year1=2015&year2=2025&lat=28.6139&lon=77.2090"
```

### Python Script Example

```python
from src.data.earth_engine import EarthEngineClient
from src.models.remoteclip import RemoteCLIPAnalyzer
from src.models.change_detector import TemporalChangeDetector

# Initialize clients
ee_client = EarthEngineClient()
analyzer = RemoteCLIPAnalyzer()
detector = TemporalChangeDetector()

# Fetch images for location (New Delhi)
lat, lon = 28.6139, 77.2090
images = ee_client.get_temporal_images(lat, lon, 2015, 2025)

# Analyze with RemoteCLIP
features = [analyzer.extract_features(img) for img in images]

# Detect changes
changes = detector.detect_changes(features)

# Generate report
report = detector.generate_report(changes)
print(report)
```

---

## 📁 Project Structure

```
geospatial-temporal-analysis/
│
├── backend/
│   ├── src/
│   │   ├── data/
│   │   │   ├── __init__.py
│   │   │   ├── earth_engine.py        # Google Earth Engine integration
│   │   │   └── preprocessor.py        # Data preprocessing
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── remoteclip.py          # RemoteCLIP wrapper
│   │   │   └── change_detector.py     # Temporal analysis algorithms
│   │   ├── utils/
│   │   │   ├── __init__.py
│   │   │   ├── geocoding.py           # Coordinate handling
│   │   │   └── visualization.py       # Visualization helpers
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes.py              # API endpoints
│   │   └── main.py                     # Main application
│   ├── tests/                          # Unit tests
│   ├── requirements.txt                # Python dependencies
│   ├── config.py                       # Configuration
│   └── README.md
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapView.jsx            # Interactive map
│   │   │   ├── Timeline.jsx           # Timeline slider
│   │   │   └── ImageComparison.jsx    # Side-by-side view
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   └── Analysis.jsx
│   │   ├── App.jsx
│   │   └── index.js
│   ├── package.json
│   └── README.md
│
├── data/                               # Data storage
│   ├── raw/                            # Raw satellite imagery
│   ├── processed/                      # Processed data
│   └── cache/                          # Cached results
│
├── models/                             # Model weights
│   └── pretrained/                     # Pre-trained models
│
├── notebooks/                          # Jupyter notebooks
│   ├── 01_data_exploration.ipynb
│   ├── 02_model_testing.ipynb
│   └── 03_analysis_examples.ipynb
│
├── docs/                               # Documentation
│   ├── images/                         # Screenshots and diagrams
│   ├── API.md                          # API documentation
│   └── ARCHITECTURE.md                 # Architecture details
│
├── tests/                              # Test files
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🛠️ Technologies

### Backend
- **Python 3.9+** - Core programming language
- **Google Earth Engine API** - Satellite data access
- **PyTorch** - Deep learning framework
- **RemoteCLIP** - Vision-language model
- **FastAPI** - REST API framework
- **Uvicorn** - ASGI server

### Frontend
- **React.js** - User interface
- **Leaflet.js** - Map visualization
- **Chart.js** - Data visualization
- **Axios** - HTTP client
- **Material-UI** - UI components

### Data Sources
- **Landsat 8/9** - 30m resolution satellite imagery
- **Sentinel-2** - 10m resolution satellite imagery
- **Google Earth Engine** - Petabyte-scale geospatial analysis

---

## 📖 API Documentation

### Endpoints

#### POST `/api/analyze`
Analyze a location using coordinates.

**Request Body:**
```json
{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "start_year": 2015,
  "end_year": 2025,
  "satellite": "sentinel2"
}
```

**Response:**
```json
{
  "status": "success",
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090
  },
  "temporal_analysis": [
    {
      "year": 2015,
      "description": "Dense urban area with vegetation",
      "features": {...}
    },
    ...
  ],
  "changes_detected": [
    {
      "from_year": 2015,
      "to_year": 2025,
      "change_type": "urbanization",
      "severity": 0.75,
      "description": "Significant urban expansion observed"
    }
  ]
}
```

#### POST `/api/analyze-image`
Analyze an uploaded image.

**Request:** Multipart form data with image file

**Response:** Similar to `/api/analyze`

#### GET `/api/compare`
Compare two specific years.

**Query Parameters:**
- `year1`: First year
- `year2`: Second year
- `lat`: Latitude
- `lon`: Longitude

For complete API documentation, see [docs/API.md](docs/API.md)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Write unit tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR


/**
 * API Service for connecting to the backend
 * Handles all satellite data requests
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Check API health
 */
export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return await response.json();
  } catch (error) {
    console.error('API health check failed:', error);
    return { status: 'offline', error: error.message };
  }
};

/**
 * Get available data sources
 */
export const getDataSources = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/data-sources`);
    return await response.json();
  } catch (error) {
    console.error('Failed to get data sources:', error);
    throw error;
  }
};

/**
 * Search for satellite images
 * @param {Object} params Search parameters
 * @param {number} params.latitude Latitude
 * @param {number} params.longitude Longitude
 * @param {string} params.startDate Start date (YYYY-MM-DD)
 * @param {string} params.endDate End date (YYYY-MM-DD)
 * @param {number} params.maxCloudCover Max cloud cover percentage
 * @param {number} params.limit Max results
 */
export const searchImages = async (params) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latitude: params.latitude,
        longitude: params.longitude,
        start_date: params.startDate,
        end_date: params.endDate,
        max_cloud_cover: params.maxCloudCover || 30,
        limit: params.limit || 10,
        satellite: params.satellite || 'sentinel2'
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Image search failed:', error);
    throw error;
  }
};

/**
 * Analyze location over time
 * @param {Object} params Analysis parameters
 * @param {number} params.latitude Latitude
 * @param {number} params.longitude Longitude
 * @param {number} params.startYear Start year
 * @param {number} params.endYear End year
 */
export const analyzeLocation = async (params) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latitude: parseFloat(params.latitude),
        longitude: parseFloat(params.longitude),
        start_year: params.startYear || 2020,
        end_year: params.endYear || 2024,
        satellite: params.satellite || 'sentinel2',
        max_cloud_cover: params.maxCloudCover || 30
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Analysis failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Location analysis failed:', error);
    throw error;
  }
};

/**
 * Get list of downloaded images
 */
export const getDownloadedImages = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/images`);
    return await response.json();
  } catch (error) {
    console.error('Failed to get images:', error);
    throw error;
  }
};

/**
 * Get sample locations
 */
export const getSampleLocations = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sample-locations`);
    return await response.json();
  } catch (error) {
    console.error('Failed to get sample locations:', error);
    // Return default locations if API fails
    return {
      locations: [
        { name: 'New Delhi, India', latitude: 28.6139, longitude: 77.2090 },
        { name: 'Mumbai, India', latitude: 19.0760, longitude: 72.8777 },
        { name: 'Dubai, UAE', latitude: 25.2048, longitude: 55.2708 }
      ]
    };
  }
};

/**
 * Get image URL
 * @param {string} filename Image filename
 */
export const getImageUrl = (filename) => {
  return `${API_BASE_URL}/api/images/${filename}`;
};

export default {
  checkHealth,
  getDataSources,
  searchImages,
  analyzeLocation,
  getDownloadedImages,
  getSampleLocations,
  getImageUrl
};

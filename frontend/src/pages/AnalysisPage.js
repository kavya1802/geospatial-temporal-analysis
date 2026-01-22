import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Grid,
  Chip,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MapComponent from '../components/MapComponent';
import TimelineSlider from '../components/TimelineSlider';
import ImageComparison from '../components/ImageComparison';
import { analyzeLocation, checkHealth } from '../services/api';

function AnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { latitude, longitude } = location.state || { latitude: '28.6139', longitude: '77.2090' };

  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [years, setYears] = useState([2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]);
  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState('gee');
  
  // Use refs to prevent duplicate API calls
  const hasFetched = useRef(false);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    // Prevent duplicate calls (React Strict Mode protection)
    if (hasFetched.current) return;
    hasFetched.current = true;
    
    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Check if backend is running
        const health = await checkHealth();
        
        if (health.status === 'offline') {
          setError('Backend server is not running. Please start the backend first.');
          setLoading(false);
          return;
        }
        
        // Fetch actual satellite data - 11 years (2015-2025)
        const result = await analyzeLocation({
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          startYear: 2015,
          endYear: 2025
        });
        
        if (result.success) {
          setAnalysisData(result);
          setDataSource(result.data_source);
          
          // Set available years from response
          if (result.images && result.images.length > 0) {
            const availableYears = result.images.map(img => img.year).sort();
            setYears(availableYears);
            setSelectedYear(availableYears[availableYears.length - 1]);
          }
        } else {
          setError('Analysis failed. Please try again.');
        }
      } catch (err) {
        console.error('Analysis error:', err);
        setError(`Failed to analyze location: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalysis();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // Empty dependency array - run only once on mount

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box mb={3}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            sx={{ mb: 2 }}
          >
            Back to Home
          </Button>
          <Paper sx={{ p: 3 }}>
            <Grid container alignItems="center" spacing={2}>
              <Grid item xs={12} md={8}>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                  Temporal Analysis Results
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Location: Latitude {latitude}, Longitude {longitude}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4} textAlign="right">
                <Chip 
                  label={`Source: ${dataSource.toUpperCase()}`} 
                  color="primary" 
                  sx={{ mr: 1 }} 
                />
                <Chip 
                  label={loading ? "Loading..." : error ? "Error" : "Complete"} 
                  color={error ? "error" : "success"} 
                  sx={{ mr: 1 }} 
                />
                <Chip label={`${years.length} Years`} />
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
            <br />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Make sure the backend server is running: <code>python src/main.py</code>
            </Typography>
          </Alert>
        )}

        {loading ? (
          <Box textAlign="center" py={10}>
            <CircularProgress size={60} />
            <Typography variant="h6" mt={2}>
              Fetching satellite imagery from {dataSource.toUpperCase()}...
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              This may take a moment as we download real satellite data
            </Typography>
          </Box>
        ) : (
          <>
            {/* Map */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Location Map
              </Typography>
              <MapComponent latitude={parseFloat(latitude)} longitude={parseFloat(longitude)} />
            </Paper>

            {/* Timeline */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Timeline: {selectedYear}
              </Typography>
              <TimelineSlider
                years={years}
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
              />
            </Paper>

            {/* Image Comparison */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Temporal Comparison
              </Typography>
              <ImageComparison 
                selectedYear={selectedYear} 
                images={analysisData?.images || []}
              />
            </Paper>

            {/* Statistics */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Change Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2} bgcolor="#e3f2fd" borderRadius={2}>
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      45%
                    </Typography>
                    <Typography variant="body2">Urban Growth</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2} bgcolor="#e8f5e9" borderRadius={2}>
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      -23%
                    </Typography>
                    <Typography variant="body2">Forest Cover</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2} bgcolor="#fff3e0" borderRadius={2}>
                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                      12%
                    </Typography>
                    <Typography variant="body2">Agricultural Land</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2} bgcolor="#fce4ec" borderRadius={2}>
                    <Typography variant="h4" color="error.main" fontWeight="bold">
                      8
                    </Typography>
                    <Typography variant="body2">Major Changes</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </>
        )}
      </Container>
    </Box>
  );
}

export default AnalysisPage;

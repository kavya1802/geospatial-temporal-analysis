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
    <Box 
      sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #22223b 0%, #4a4e69 50%, #9a8c98 100%)',
        py: 4 
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Box mb={3}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            sx={{ 
              mb: 2, 
              color: '#f2e9e4',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            Back to Home
          </Button>
          <Paper 
            sx={{ 
              p: 3,
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(34, 34, 59, 0.2)',
            }}
          >
            <Grid container alignItems="center" spacing={2}>
              <Grid item xs={12} md={8}>
                <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ color: '#f2e9e4' }}>
                  Temporal Analysis Results
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(242, 233, 228, 0.85)' }}>
                  Location: Latitude {latitude}, Longitude {longitude}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4} textAlign="right">
                <Chip 
                  label={`Source: ${dataSource.toUpperCase()}`} 
                  sx={{ 
                    mr: 1,
                    backgroundColor: 'rgba(154, 140, 152, 0.5)',
                    color: '#f2e9e4',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }} 
                />
                <Chip 
                  label={loading ? "Loading..." : error ? "Error" : "Complete"} 
                  sx={{ 
                    mr: 1,
                    backgroundColor: error ? 'rgba(244, 67, 54, 0.5)' : 'rgba(76, 175, 80, 0.5)',
                    color: '#f2e9e4',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }} 
                />
                <Chip 
                  label={`${years.length} Years`}
                  sx={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    color: '#f2e9e4',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }} 
                />
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* Error Message */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              background: 'rgba(244, 67, 54, 0.2)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(244, 67, 54, 0.3)',
              color: '#f2e9e4',
              '& .MuiAlert-icon': {
                color: '#ff8a80',
              }
            }}
          >
            {error}
            <br />
            <Typography variant="body2" sx={{ mt: 1, color: 'rgba(242, 233, 228, 0.85)' }}>
              Make sure the backend server is running: <code style={{ color: '#c9ada7' }}>python src/main.py</code>
            </Typography>
          </Alert>
        )}

        {loading ? (
          <Box textAlign="center" py={10}>
            <CircularProgress size={60} sx={{ color: '#c9ada7' }} />
            <Typography variant="h6" mt={2} sx={{ color: '#f2e9e4' }}>
              Fetching satellite imagery from {dataSource.toUpperCase()}...
            </Typography>
            <Typography variant="body2" mt={1} sx={{ color: 'rgba(242, 233, 228, 0.7)' }}>
              This may take a moment as we download real satellite data
            </Typography>
          </Box>
        ) : (
          <>
            {/* Map */}
            <Paper 
              sx={{ 
                p: 2, 
                mb: 3,
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(34, 34, 59, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  border: '1px solid #9a8c98',
                  boxShadow: '0 0 20px rgba(154, 140, 152, 0.4), 0 8px 32px rgba(34, 34, 59, 0.25)',
                },
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: '#f2e9e4' }}>
                Location Map
              </Typography>
              <MapComponent latitude={parseFloat(latitude)} longitude={parseFloat(longitude)} />
            </Paper>

            {/* Timeline */}
            <Paper 
              sx={{ 
                p: 3, 
                mb: 3,
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(34, 34, 59, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  border: '1px solid #9a8c98',
                  boxShadow: '0 0 20px rgba(154, 140, 152, 0.4), 0 8px 32px rgba(34, 34, 59, 0.25)',
                },
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: '#f2e9e4' }}>
                Timeline: {selectedYear}
              </Typography>
              <TimelineSlider
                years={years}
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
              />
            </Paper>

            {/* Image Comparison */}
            <Paper 
              sx={{ 
                p: 3, 
                mb: 3,
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(34, 34, 59, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  border: '1px solid #9a8c98',
                  boxShadow: '0 0 20px rgba(154, 140, 152, 0.4), 0 8px 32px rgba(34, 34, 59, 0.25)',
                },
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: '#f2e9e4' }}>
                Temporal Comparison
              </Typography>
              <ImageComparison 
                selectedYear={selectedYear} 
                images={analysisData?.images || []}
              />
            </Paper>

            {/* Statistics */}
            <Paper 
              sx={{ 
                p: 3,
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(34, 34, 59, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  border: '1px solid #9a8c98',
                  boxShadow: '0 0 20px rgba(154, 140, 152, 0.4), 0 8px 32px rgba(34, 34, 59, 0.25)',
                },
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: '#f2e9e4' }}>
                Analysis Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box 
                    textAlign="center" 
                    p={2} 
                    borderRadius={2}
                    sx={{
                      background: 'rgba(33, 150, 243, 0.2)',
                      border: '1px solid rgba(33, 150, 243, 0.3)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'rgba(33, 150, 243, 0.3)',
                        transform: 'translateY(-4px)',
                        boxShadow: '0 0 15px rgba(33, 150, 243, 0.4)',
                      },
                    }}
                  >
                    <Typography variant="h4" fontWeight="bold" sx={{ color: '#90caf9' }}>
                      {analysisData?.images?.length || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(242, 233, 228, 0.85)' }}>Images Retrieved</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box 
                    textAlign="center" 
                    p={2} 
                    borderRadius={2}
                    sx={{
                      background: 'rgba(76, 175, 80, 0.2)',
                      border: '1px solid rgba(76, 175, 80, 0.3)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'rgba(76, 175, 80, 0.3)',
                        transform: 'translateY(-4px)',
                        boxShadow: '0 0 15px rgba(76, 175, 80, 0.4)',
                      },
                    }}
                  >
                    <Typography variant="h4" fontWeight="bold" sx={{ color: '#a5d6a7' }}>
                      {years.length > 0 ? `${years[years.length - 1] - years[0]}` : '0'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(242, 233, 228, 0.85)' }}>Years Span</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box 
                    textAlign="center" 
                    p={2} 
                    borderRadius={2}
                    sx={{
                      background: 'rgba(255, 152, 0, 0.2)',
                      border: '1px solid rgba(255, 152, 0, 0.3)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'rgba(255, 152, 0, 0.3)',
                        transform: 'translateY(-4px)',
                        boxShadow: '0 0 15px rgba(255, 152, 0, 0.4)',
                      },
                    }}
                  >
                    <Typography variant="h4" fontWeight="bold" sx={{ color: '#ffcc80' }}>
                      {analysisData?.images?.length > 0 
                        ? `${Math.round(analysisData.images.reduce((sum, img) => sum + (img.cloud_cover || 0), 0) / analysisData.images.length)}%`
                        : 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(242, 233, 228, 0.85)' }}>Avg Cloud Cover</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box 
                    textAlign="center" 
                    p={2} 
                    borderRadius={2}
                    sx={{
                      background: 'rgba(233, 30, 99, 0.2)',
                      border: '1px solid rgba(233, 30, 99, 0.3)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'rgba(233, 30, 99, 0.3)',
                        transform: 'translateY(-4px)',
                        boxShadow: '0 0 15px rgba(233, 30, 99, 0.4)',
                      },
                    }}
                  >
                    <Typography variant="h4" fontWeight="bold" sx={{ color: '#f48fb1' }}>
                      {analysisData?.images?.[0]?.satellite || 'Sentinel-2'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(242, 233, 228, 0.85)' }}>Satellite Source</Typography>
                  </Box>
                </Grid>
              </Grid>
              
              {/* Location Details */}
              <Box 
                mt={3} 
                p={2} 
                borderRadius={2}
                sx={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                <Typography variant="subtitle2" gutterBottom fontWeight="bold" sx={{ color: '#f2e9e4' }}>
                  Location Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" sx={{ color: 'rgba(242, 233, 228, 0.7)' }}>Latitude</Typography>
                    <Typography variant="body1" fontWeight="medium" sx={{ color: '#f2e9e4' }}>{latitude}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" sx={{ color: 'rgba(242, 233, 228, 0.7)' }}>Longitude</Typography>
                    <Typography variant="body1" fontWeight="medium" sx={{ color: '#f2e9e4' }}>{longitude}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" sx={{ color: 'rgba(242, 233, 228, 0.7)' }}>First Image</Typography>
                    <Typography variant="body1" fontWeight="medium" sx={{ color: '#f2e9e4' }}>
                      {analysisData?.images?.[0]?.date || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" sx={{ color: 'rgba(242, 233, 228, 0.7)' }}>Latest Image</Typography>
                    <Typography variant="body1" fontWeight="medium" sx={{ color: '#f2e9e4' }}>
                      {analysisData?.images?.[analysisData.images.length - 1]?.date || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </>
        )}
      </Container>
    </Box>
  );
}

export default AnalysisPage;

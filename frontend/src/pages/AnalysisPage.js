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
  LinearProgress,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CategoryIcon from '@mui/icons-material/Category';
import MapComponent from '../components/MapComponent';
import TimelineSlider from '../components/TimelineSlider';
import ImageComparison from '../components/ImageComparison';
import { analyzeLocation, analyzeWithAI, checkHealth } from '../services/api';
import DownloadIcon from '@mui/icons-material/Download';
import { jsPDF } from 'jspdf';

function AnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { latitude, longitude } = location.state || { latitude: '28.6139', longitude: '77.2090' };

  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [years, setYears] = useState([2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]);
  const [analysisData, setAnalysisData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState('gee');
  const [locationName, setLocationName] = useState('');
  
  // Use refs to prevent duplicate API calls
  const hasFetched = useRef(false);
  const abortControllerRef = useRef(null);

  // Reverse geocode to get location name
  useEffect(() => {
    const fetchLocationName = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
          { headers: { 'User-Agent': 'GeospatialTemporalAnalysis/1.0' } }
        );
        const data = await res.json();
        const addr = data.address || {};
        // Build a concise name: city/town, state, country
        const parts = [
          addr.city || addr.town || addr.village || addr.county || addr.suburb || '',
          addr.state || addr.region || '',
          addr.country || ''
        ].filter(Boolean);
        setLocationName(parts.join(', ') || data.display_name?.split(',').slice(0, 3).join(',') || 'Unknown Location');
      } catch {
        setLocationName('');
      }
    };
    fetchLocationName();
  }, [latitude, longitude]);

  const handleDownloadPDF = () => {
    if (!aiAnalysis) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxLineWidth = pageWidth - margin * 2;
    let y = 20;

    const addText = (text, size = 10, style = 'normal', color = [34, 34, 59]) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', style);
      doc.setTextColor(color[0], color[1], color[2]);
      const lines = doc.splitTextToSize(text, maxLineWidth);
      for (const line of lines) {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += size * 0.5;
      }
    };

    const addLine = () => {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.setDrawColor(201, 173, 167);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
    };

    // Header
    doc.setFillColor(34, 34, 59);
    doc.rect(0, 0, pageWidth, 50, 'F');
    doc.setTextColor(242, 233, 228);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Geospatial Temporal Analysis Report', pageWidth / 2, 16, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(201, 173, 167);
    doc.text('Powered by RemoteCLIP | IEEE TGRS 2024', pageWidth / 2, 25, { align: 'center' });
    if (locationName) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(242, 233, 228);
      doc.text(locationName, pageWidth / 2, 34, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(201, 173, 167);
    }
    doc.text(`Coordinates: (${latitude}, ${longitude})`, pageWidth / 2, 41, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 47, { align: 'center' });
    y = 60;

    // Analysis Summary
    addText('ANALYSIS SUMMARY', 13, 'bold', [74, 78, 105]);
    y += 3;
    addText(`Images Analyzed: ${analysisData?.images?.length || 0}`, 10, 'normal');
    addText(`Year Range: ${years.length > 0 ? `${years[0]} - ${years[years.length - 1]}` : 'N/A'}`, 10, 'normal');
    addText(`Satellite: ${analysisData?.images?.[0]?.satellite || 'Sentinel-2'}`, 10, 'normal');
    y += 4;
    addLine();

    // Land Use Classification
    if (aiAnalysis.classifications?.length > 0) {
      addText('LAND USE CLASSIFICATION', 13, 'bold', [74, 78, 105]);
      y += 3;
      aiAnalysis.classifications.forEach((item, idx) => {
        const cat = item.classification?.[0]?.category || 'N/A';
        const conf = ((item.classification?.[0]?.confidence || 0) * 100).toFixed(1);
        addText(`Image ${idx + 1} (${item.date || 'N/A'}): ${cat} (${conf}%)`, 10, 'normal');
      });
      y += 4;
      addLine();
    }

    // Temporal Changes
    if (aiAnalysis.changes?.length > 0) {
      addText('TEMPORAL CHANGES', 13, 'bold', [74, 78, 105]);
      y += 3;
      aiAnalysis.changes.forEach((change) => {
        const from = change.from_date || `Image ${change.from_index + 1}`;
        const to = change.to_date || `Image ${change.to_index + 1}`;
        const mag = (change.analysis?.change_magnitude * 100).toFixed(1);
        addText(`${from}  -->  ${to}:`, 10, 'bold');
        addText(`  Change magnitude: ${mag}%`, 10, 'normal');
        change.analysis?.detected_changes?.forEach((det) => {
          addText(`  - ${det.description} (${(det.confidence * 100).toFixed(1)}%)`, 10, 'normal');
        });
        y += 2;
      });
      y += 2;
      addLine();
    }

    // Overall Trend
    if (aiAnalysis.overall_trend) {
      addText('OVERALL TREND', 13, 'bold', [74, 78, 105]);
      y += 3;
      const trend = aiAnalysis.overall_trend;
      if (trend.land_use_transition) {
        if (trend.land_use_transition.same_category) {
          addText(`Land use: Remained ${trend.land_use_transition.from}`, 10, 'normal');
        } else {
          addText(`Land use transition: ${trend.land_use_transition.from} --> ${trend.land_use_transition.to}`, 10, 'normal');
        }
      }
      addText(`Total change magnitude: ${((trend.total_change_magnitude || 0) * 100).toFixed(1)}%`, 10, 'normal');
      if (trend.primary_changes?.length > 0) {
        y += 2;
        addText('Key changes detected:', 10, 'bold');
        trend.primary_changes.forEach((ch) => {
          addText(`  - ${ch.description} (${(ch.confidence * 100).toFixed(1)}%)`, 10, 'normal');
        });
      }
      y += 4;
      addLine();
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(154, 140, 152);
      doc.text(
        `Page ${i} of ${pageCount} | Geospatial Temporal Analysis | RemoteCLIP`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`geospatial_report_${latitude}_${longitude}_${new Date().toISOString().slice(0,10)}.pdf`);
  };

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

          // Now trigger AI analysis with RemoteCLIP
          setAiLoading(true);
          try {
            const aiResult = await analyzeWithAI({
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
              startYear: 2015,
              endYear: 2025
            });
            if (aiResult.success && aiResult.analysis) {
              setAiAnalysis(aiResult.analysis);
            } else if (aiResult.ai_available === false) {
              setAiError('RemoteCLIP model is loading or not available. Basic analysis shown.');
            }
          } catch (aiErr) {
            console.error('AI Analysis error:', aiErr);
            setAiError('AI analysis unavailable. Showing basic satellite data.');
          } finally {
            setAiLoading(false);
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
            </Paper>

            {/* AI Analysis - RemoteCLIP */}
            <Paper 
              sx={{ 
                p: 3,
                mb: 3,
                background: 'rgba(34, 34, 59, 0.85)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(201, 173, 167, 0.4)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  border: '1px solid #c9ada7',
                  boxShadow: '0 0 25px rgba(201, 173, 167, 0.4), 0 8px 32px rgba(0, 0, 0, 0.35)',
                },
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <SmartToyIcon sx={{ color: '#c9ada7', fontSize: 28 }} />
                <Typography variant="h6" sx={{ color: '#f2e9e4', fontWeight: 600 }}>
                  🛰️ AI-Powered Analysis (RemoteCLIP)
                </Typography>
                <Chip 
                  label="IEEE TGRS 2024" 
                  size="small"
                  sx={{ 
                    ml: 'auto',
                    backgroundColor: 'rgba(154, 140, 152, 0.4)',
                    color: '#f2e9e4',
                    fontSize: '0.7rem',
                  }} 
                />
              </Box>

              {aiLoading && (
                <Box textAlign="center" py={4}>
                  <CircularProgress size={40} sx={{ color: '#c9ada7', mb: 2 }} />
                  <Typography variant="body1" sx={{ color: '#f2e9e4' }}>
                    Running RemoteCLIP analysis on satellite images...
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9a8c98', mt: 1 }}>
                    First-time loading may take a few minutes to download the model
                  </Typography>
                </Box>
              )}

              {aiError && !aiAnalysis && (
                <Alert 
                  severity="info" 
                  sx={{ 
                    background: 'rgba(33, 150, 243, 0.15)',
                    border: '1px solid rgba(33, 150, 243, 0.3)',
                    color: '#f2e9e4',
                    '& .MuiAlert-icon': { color: '#90caf9' },
                  }}
                >
                  {aiError}
                </Alert>
              )}

              {aiAnalysis && (
                <>
                  {/* Land Use Classification */}
                  <Box mb={3}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <CategoryIcon sx={{ color: '#c9ada7' }} />
                      <Typography variant="subtitle1" sx={{ color: '#f2e9e4', fontWeight: 600 }}>
                        Land Use Classification
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      {aiAnalysis.classifications?.map((item, idx) => (
                        <Grid item xs={12} sm={6} md={4} key={idx}>
                          <Box 
                            p={2} 
                            borderRadius={2}
                            sx={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(201, 173, 167, 0.3)',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                background: 'rgba(255, 255, 255, 0.12)',
                                transform: 'translateY(-2px)',
                              },
                            }}
                          >
                            <Typography variant="caption" sx={{ color: '#9a8c98' }}>
                              {item.date || `Image ${item.index + 1}`}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#f2e9e4', fontWeight: 500, mt: 0.5 }}>
                              {item.classification?.[0]?.category || 'N/A'}
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={(item.classification?.[0]?.confidence || 0) * 100}
                              sx={{ 
                                mt: 1, 
                                height: 6, 
                                borderRadius: 3,
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: '#c9ada7',
                                  borderRadius: 3,
                                },
                              }}
                            />
                            <Typography variant="caption" sx={{ color: '#9a8c98' }}>
                              Confidence: {((item.classification?.[0]?.confidence || 0) * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>

                  <Divider sx={{ borderColor: 'rgba(201, 173, 167, 0.2)', my: 3 }} />

                  {/* Temporal Changes */}
                  <Box mb={3}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <CompareArrowsIcon sx={{ color: '#c9ada7' }} />
                      <Typography variant="subtitle1" sx={{ color: '#f2e9e4', fontWeight: 600 }}>
                        Detected Changes Over Time
                      </Typography>
                    </Box>
                    {aiAnalysis.changes?.map((change, idx) => (
                      <Box 
                        key={idx} 
                        p={2} 
                        mb={1.5}
                        borderRadius={2}
                        sx={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(201, 173, 167, 0.2)',
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body2" sx={{ color: '#c9ada7', fontWeight: 500 }}>
                            {change.from_date || `Image ${change.from_index + 1}`} → {change.to_date || `Image ${change.to_index + 1}`}
                          </Typography>
                          <Chip 
                            label={`${(change.analysis?.change_magnitude * 100).toFixed(1)}% change`}
                            size="small"
                            sx={{
                              backgroundColor: change.analysis?.change_magnitude > 0.15 
                                ? 'rgba(255, 152, 0, 0.3)' 
                                : 'rgba(76, 175, 80, 0.3)',
                              color: '#f2e9e4',
                              fontSize: '0.75rem',
                            }}
                          />
                        </Box>
                        {change.analysis?.detected_changes?.map((det, i) => (
                          <Box key={i} display="flex" alignItems="center" gap={1} mt={0.5}>
                            <Typography variant="body2" sx={{ color: '#f2e9e4' }}>
                              • {det.description}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#9a8c98' }}>
                              ({(det.confidence * 100).toFixed(1)}%)
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    ))}
                  </Box>

                  <Divider sx={{ borderColor: 'rgba(201, 173, 167, 0.2)', my: 3 }} />

                  {/* Overall Trend */}
                  {aiAnalysis.overall_trend && (
                    <Box>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <TrendingUpIcon sx={{ color: '#c9ada7' }} />
                        <Typography variant="subtitle1" sx={{ color: '#f2e9e4', fontWeight: 600 }}>
                          Overall Trend
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Box 
                            p={2.5}
                            borderRadius={2}
                            sx={{
                              background: 'rgba(154, 140, 152, 0.2)',
                              border: '1px solid rgba(201, 173, 167, 0.3)',
                            }}
                          >
                            <Typography variant="caption" sx={{ color: '#9a8c98' }}>
                              Land Use Transition
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#f2e9e4', fontWeight: 500, mt: 1 }}>
                              {aiAnalysis.overall_trend.land_use_transition?.same_category 
                                ? `Remained: ${aiAnalysis.overall_trend.land_use_transition?.from}`
                                : `${aiAnalysis.overall_trend.land_use_transition?.from} → ${aiAnalysis.overall_trend.land_use_transition?.to}`
                              }
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Box 
                            p={2.5}
                            borderRadius={2}
                            sx={{
                              background: 'rgba(154, 140, 152, 0.2)',
                              border: '1px solid rgba(201, 173, 167, 0.3)',
                            }}
                          >
                            <Typography variant="caption" sx={{ color: '#9a8c98' }}>
                              Total Change Magnitude
                            </Typography>
                            <Typography variant="h5" sx={{ color: '#c9ada7', fontWeight: 700, mt: 1 }}>
                              {((aiAnalysis.overall_trend.total_change_magnitude || 0) * 100).toFixed(1)}%
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={(aiAnalysis.overall_trend.total_change_magnitude || 0) * 100}
                              sx={{ 
                                mt: 1, 
                                height: 8, 
                                borderRadius: 4,
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: (aiAnalysis.overall_trend.total_change_magnitude || 0) > 0.2 
                                    ? '#ff8a65' : '#a5d6a7',
                                  borderRadius: 4,
                                },
                              }}
                            />
                          </Box>
                        </Grid>
                      </Grid>
                      
                      {/* Key Changes */}
                      <Box mt={2} p={2} borderRadius={2} sx={{ background: 'rgba(255,255,255,0.05)' }}>
                        <Typography variant="body2" sx={{ color: '#c9ada7', fontWeight: 600, mb: 1 }}>
                          Key Changes Detected:
                        </Typography>
                        {aiAnalysis.overall_trend.primary_changes?.map((change, i) => (
                          <Box key={i} display="flex" alignItems="center" gap={1} mb={0.5}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#c9ada7' }} />
                            <Typography variant="body2" sx={{ color: '#f2e9e4' }}>
                              {change.description}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#9a8c98', ml: 'auto' }}>
                              {(change.confidence * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Full Report */}
                  {aiAnalysis.report && (
                    <Box mt={3}>
                      <Divider sx={{ borderColor: 'rgba(201, 173, 167, 0.2)', mb: 2 }} />
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography variant="subtitle2" sx={{ color: '#c9ada7', fontWeight: 600 }}>
                          📄 Full Analysis Report
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={handleDownloadPDF}
                          sx={{
                            color: '#c9ada7',
                            borderColor: 'rgba(201, 173, 167, 0.5)',
                            textTransform: 'none',
                            fontSize: '0.8rem',
                            '&:hover': {
                              borderColor: '#c9ada7',
                              background: 'rgba(201, 173, 167, 0.15)',
                              boxShadow: '0 0 12px rgba(201, 173, 167, 0.3)',
                            },
                          }}
                        >
                          Download PDF
                        </Button>
                      </Box>
                      <Box 
                        p={2} 
                        borderRadius={2}
                        sx={{ 
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(201, 173, 167, 0.2)',
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          whiteSpace: 'pre-wrap',
                          color: '#f2e9e4',
                          maxHeight: '400px',
                          overflowY: 'auto',
                          '&::-webkit-scrollbar': {
                            width: '6px',
                          },
                          '&::-webkit-scrollbar-track': {
                            background: 'rgba(255,255,255,0.05)',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: '#9a8c98',
                            borderRadius: '3px',
                          },
                        }}
                      >
                        {aiAnalysis.report}
                      </Box>
                    </Box>
                  )}
                </>
              )}
            </Paper>

            {/* Location Details */}
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
                Location Details
              </Typography>
              {locationName && (
                <Typography variant="subtitle1" sx={{ color: '#c9ada7', mb: 2, fontWeight: 600 }}>
                  {locationName}
                </Typography>
              )}
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
            </Paper>
          </>
        )}
      </Container>
    </Box>
  );
}

export default AnalysisPage;

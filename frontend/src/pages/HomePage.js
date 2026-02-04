import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import TimelineIcon from '@mui/icons-material/Timeline';
import MapIcon from '@mui/icons-material/Map';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import NatureIcon from '@mui/icons-material/Nature';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BusinessIcon from '@mui/icons-material/Business';
import GlobeBackground from '../components/GlobeBackground';

// Sample locations organized by category
const sampleLocations = {
  urban: [
    { name: 'London', lat: '51.5074', lng: '-0.1278', country: 'UK' },
    { name: 'Tokyo', lat: '35.6762', lng: '139.6503', country: 'Japan' },
    { name: 'Singapore', lat: '1.3521', lng: '103.8198', country: 'Singapore' },
    { name: 'Paris', lat: '48.8566', lng: '2.3522', country: 'France' },
    { name: 'New York', lat: '40.7128', lng: '-74.0060', country: 'USA' },
    { name: 'New Delhi', lat: '28.6139', lng: '77.2090', country: 'India' },
  ],
  nature: [
    { name: 'Amazon Rainforest', lat: '-3.4653', lng: '-62.2159', country: 'Brazil' },
    { name: 'Grand Canyon', lat: '36.0544', lng: '-112.1401', country: 'USA' },
    { name: 'Great Barrier Reef', lat: '-18.2871', lng: '147.6992', country: 'Australia' },
    { name: 'Himalayas', lat: '27.9881', lng: '86.9250', country: 'Nepal' },
    { name: 'Sahara Desert', lat: '23.4162', lng: '25.6628', country: 'Libya' },
  ],
  landmarks: [
    { name: 'Giza Pyramids', lat: '29.9792', lng: '31.1342', country: 'Egypt' },
    { name: 'Taj Mahal', lat: '27.1751', lng: '78.0421', country: 'India' },
    { name: 'Machu Picchu', lat: '-13.1631', lng: '-72.5450', country: 'Peru' },
    { name: 'Angkor Wat', lat: '13.4125', lng: '103.8670', country: 'Cambodia' },
    { name: 'Eiffel Tower', lat: '48.8584', lng: '2.2945', country: 'France' },
  ],
  infrastructure: [
    { name: 'Palm Jumeirah', lat: '25.1124', lng: '55.1390', country: 'UAE' },
    { name: 'Suez Canal', lat: '30.4574', lng: '32.3499', country: 'Egypt' },
    { name: 'Dubai', lat: '25.2048', lng: '55.2708', country: 'UAE' },
    { name: 'Golden Gate Bridge', lat: '37.8199', lng: '-122.4783', country: 'USA' },
    { name: 'Panama Canal', lat: '9.0800', lng: '-79.6800', country: 'Panama' },
  ],
};

function HomePage() {
  const navigate = useNavigate();
  const [latitude, setLatitude] = useState('28.6139');
  const [longitude, setLongitude] = useState('77.2090');
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [activeCard, setActiveCard] = useState(1); // Center card active by default

  // Feature cards data
  const featureCards = [
    {
      icon: <SatelliteAltIcon sx={{ fontSize: 60, color: '#f2e9e4' }} />,
      title: 'Satellite Imagery',
      description: 'Access 10 years of high-resolution satellite data from Landsat and Sentinel-2',
    },
    {
      icon: <TimelineIcon sx={{ fontSize: 60, color: '#f2e9e4' }} />,
      title: 'Temporal Analysis',
      description: 'AI-powered detection of geographical changes over time with natural language descriptions',
    },
    {
      icon: <MapIcon sx={{ fontSize: 60, color: '#f2e9e4' }} />,
      title: 'Interactive Visualization',
      description: 'Explore changes through interactive maps, timelines, and comparison views',
    },
  ];

  // Get card position styles based on index and active card
  const getCardStyle = (index) => {
    const diff = index - activeCard;
    const isActive = diff === 0;
    const isLeft = diff < 0;
    const isRight = diff > 0;
    const absDiff = Math.abs(diff);

    return {
      position: 'absolute',
      width: '420px',
      height: '380px',
      cursor: 'pointer',
      transform: isActive
        ? 'translateX(-50%) translateZ(0) rotateY(0deg) scale(1)'
        : isLeft
        ? `translateX(calc(-50% - ${absDiff * 220}px)) translateZ(${-absDiff * 100}px) rotateY(25deg) scale(${1 - absDiff * 0.15})`
        : `translateX(calc(-50% + ${absDiff * 220}px)) translateZ(${-absDiff * 100}px) rotateY(-25deg) scale(${1 - absDiff * 0.15})`,
      left: '50%',
      zIndex: 10 - absDiff,
      opacity: 1 - absDiff * 0.3,
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      background: isActive 
        ? 'rgba(255, 255, 255, 0.2)' 
        : 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: isActive 
        ? '2px solid #c9ada7' 
        : '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '20px',
      boxShadow: isActive
        ? '0 0 30px rgba(201, 173, 167, 0.5), 0 0 60px rgba(201, 173, 167, 0.3), 0 25px 50px rgba(34, 34, 59, 0.4)'
        : '0 8px 32px rgba(34, 34, 59, 0.2)',
      '&:hover': !isActive ? {
        opacity: 0.9,
        boxShadow: '0 0 20px rgba(154, 140, 152, 0.4), 0 8px 32px rgba(34, 34, 59, 0.3)',
      } : {},
    };
  };

  const handleAnalyze = () => {
    // Navigate to analysis page with coordinates
    navigate('/analysis', {
      state: { latitude, longitude }
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #22223b 0%, #4a4e69 50%, #9a8c98 100%)',
        py: 8,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Rotating 3D Globe Background */}
      <GlobeBackground />
      
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box textAlign="center" mb={10}>
          <SatelliteAltIcon sx={{ fontSize: 60, color: 'white', mb: 2 }} />
          <Typography variant="h2" color="white" gutterBottom fontWeight="bold">
            Geospatial Temporal Analysis
          </Typography>
          <Typography variant="h5" color="white" sx={{ opacity: 0.9 }}>
            Analyze 10 Years of Geographical Changes with AI
          </Typography>
        </Box>

        {/* 3D Stacked Feature Cards */}
        <Box 
          sx={{ 
            position: 'relative', 
            height: '420px', 
            mb: 12,
            perspective: '1200px',
            perspectiveOrigin: 'center center',
          }}
        >
          {/* Navigation Arrows */}
          <Button
            onClick={() => setActiveCard(prev => Math.max(0, prev - 1))}
            disabled={activeCard === 0}
            sx={{
              position: 'absolute',
              left: { xs: '5%', md: '15%' },
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              minWidth: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#f2e9e4',
              fontSize: '24px',
              '&:hover': {
                background: 'rgba(201, 173, 167, 0.3)',
                border: '1px solid #c9ada7',
              },
              '&:disabled': {
                opacity: 0.3,
                color: '#f2e9e4',
              },
            }}
          >
            ‹
          </Button>
          
          <Button
            onClick={() => setActiveCard(prev => Math.min(featureCards.length - 1, prev + 1))}
            disabled={activeCard === featureCards.length - 1}
            sx={{
              position: 'absolute',
              right: { xs: '5%', md: '15%' },
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              minWidth: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#f2e9e4',
              fontSize: '24px',
              '&:hover': {
                background: 'rgba(201, 173, 167, 0.3)',
                border: '1px solid #c9ada7',
              },
              '&:disabled': {
                opacity: 0.3,
                color: '#f2e9e4',
              },
            }}
          >
            ›
          </Button>

          {/* 3D Cards Container */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              transformStyle: 'preserve-3d',
            }}
          >
            {featureCards.map((card, index) => (
              <Card
                key={index}
                onClick={() => setActiveCard(index)}
                sx={getCardStyle(index)}
              >
                <CardContent 
                  sx={{ 
                    p: 4, 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}
                >
                  {card.icon}
                  <Typography 
                    variant="h5" 
                    gutterBottom 
                    sx={{ 
                      color: '#f2e9e4', 
                      fontWeight: 600,
                      mt: 2,
                    }}
                  >
                    {card.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'rgba(242, 233, 228, 0.85)',
                      lineHeight: 1.6,
                    }}
                  >
                    {card.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Dot Indicators */}
          <Box 
            sx={{ 
              position: 'absolute', 
              bottom: '-20px', 
              left: '50%', 
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 1.5,
              zIndex: 20,
            }}
          >
            {featureCards.map((_, index) => (
              <Box
                key={index}
                onClick={() => setActiveCard(index)}
                sx={{
                  width: activeCard === index ? '24px' : '10px',
                  height: '10px',
                  borderRadius: '5px',
                  background: activeCard === index 
                    ? '#c9ada7' 
                    : 'rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: activeCard === index 
                      ? '#c9ada7' 
                      : 'rgba(255, 255, 255, 0.5)',
                  },
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Input Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 6, 
            maxWidth: 700, 
            mx: 'auto',
            background: 'rgba(34, 34, 59, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(201, 173, 167, 0.4)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          <Typography variant="h4" gutterBottom textAlign="center" sx={{ color: '#f2e9e4', fontWeight: 600 }}>
            Enter Location Coordinates
          </Typography>
          <Typography variant="body1" textAlign="center" mb={4} sx={{ color: '#c9ada7' }}>
            Enter latitude and longitude to analyze geographical changes
          </Typography>

          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }}>
            <TextField
              fullWidth
              label="Latitude"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              margin="normal"
              type="number"
              inputProps={{ step: "0.0001" }}
              helperText="e.g., 28.6139 (New Delhi)"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  '& fieldset': {
                    borderColor: 'rgba(201, 173, 167, 0.5)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#c9ada7',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#c9ada7',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#c9ada7',
                },
                '& .MuiInputBase-input': {
                  color: '#f2e9e4',
                  fontSize: '1.1rem',
                },
                '& .MuiFormHelperText-root': {
                  color: '#9a8c98',
                },
              }}
            />

            <TextField
              fullWidth
              label="Longitude"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              margin="normal"
              type="number"
              inputProps={{ step: "0.0001" }}
              helperText="e.g., 77.2090 (New Delhi)"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  '& fieldset': {
                    borderColor: 'rgba(201, 173, 167, 0.5)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#c9ada7',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#c9ada7',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#c9ada7',
                },
                '& .MuiInputBase-input': {
                  color: '#f2e9e4',
                  fontSize: '1.1rem',
                },
                '& .MuiFormHelperText-root': {
                  color: '#9a8c98',
                },
              }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleAnalyze}
              sx={{ mt: 3, py: 1.5 }}
            >
              Analyze Location
            </Button>
          </Box>

          {/* Sample Locations */}
          <Box mt={6} pt={4} sx={{ borderTop: '1px solid rgba(201, 173, 167, 0.2)' }}>
            <Typography variant="subtitle1" sx={{ color: '#f2e9e4', mb: 4, fontWeight: 600, fontSize: '1.2rem', textAlign: 'center' }}>
              🌍 Explore Sample Locations
            </Typography>
            
            <Tabs
              value={selectedCategory}
              onChange={(e, newValue) => setSelectedCategory(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                mb: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                '& .MuiTab-root': {
                  color: '#9a8c98',
                  minHeight: 56,
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  minWidth: 'auto',
                  px: 2,
                  '&.Mui-selected': {
                    color: '#f2e9e4',
                    fontWeight: 600,
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#c9ada7',
                  height: 3,
                },
                '& .MuiTabs-scrollButtons': {
                  color: '#f2e9e4',
                },
              }}
            >
              <Tab icon={<LocationCityIcon sx={{ fontSize: 22 }} />} label="Urban" iconPosition="start" />
              <Tab icon={<NatureIcon sx={{ fontSize: 22 }} />} label="Nature" iconPosition="start" />
              <Tab icon={<AccountBalanceIcon sx={{ fontSize: 22 }} />} label="Landmarks" iconPosition="start" />
              <Tab icon={<BusinessIcon sx={{ fontSize: 22 }} />} label="Infrastructure" iconPosition="start" />
            </Tabs>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
              {Object.values(sampleLocations)[selectedCategory].map((location) => (
                <Chip
                  key={location.name}
                  label={`${location.name}`}
                  onClick={() => {
                    setLatitude(location.lat);
                    setLongitude(location.lng);
                  }}
                  sx={{
                    backgroundColor: 'rgba(154, 140, 152, 0.3)',
                    color: '#f2e9e4',
                    border: '1px solid rgba(201, 173, 167, 0.5)',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    padding: '10px 6px',
                    height: '40px',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(201, 173, 167, 0.5)',
                      border: '1px solid #c9ada7',
                      boxShadow: '0 0 12px rgba(201, 173, 167, 0.4)',
                    },
                  }}
                />
              ))}
            </Box>
            
            <Typography variant="body2" sx={{ color: '#9a8c98', mt: 4, display: 'block', textAlign: 'center' }}>
              Click a location to auto-fill coordinates
            </Typography>
          </Box>
        </Paper>

        {/* Footer */}
        <Box textAlign="center" mt={6}>
          <Typography variant="body2" color="white" sx={{ opacity: 0.8 }}>
            Powered by RemoteCLIP | IEEE TGRS 2024
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default HomePage;

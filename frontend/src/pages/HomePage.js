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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import TimelineIcon from '@mui/icons-material/Timeline';
import MapIcon from '@mui/icons-material/Map';

function HomePage() {
  const navigate = useNavigate();
  const [latitude, setLatitude] = useState('28.6139');
  const [longitude, setLongitude] = useState('77.2090');

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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 8,
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box textAlign="center" mb={6}>
          <SatelliteAltIcon sx={{ fontSize: 60, color: 'white', mb: 2 }} />
          <Typography variant="h2" color="white" gutterBottom fontWeight="bold">
            Geospatial Temporal Analysis
          </Typography>
          <Typography variant="h5" color="white" sx={{ opacity: 0.9 }}>
            Analyze 10 Years of Geographical Changes with AI
          </Typography>
        </Box>

        {/* Features */}
        <Grid container spacing={3} mb={6}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent>
                <SatelliteAltIcon color="primary" sx={{ fontSize: 50, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Satellite Imagery
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Access 10 years of high-resolution satellite data from Landsat and Sentinel-2
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent>
                <TimelineIcon color="primary" sx={{ fontSize: 50, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Temporal Analysis
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  AI-powered detection of geographical changes over time with natural language descriptions
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent>
                <MapIcon color="primary" sx={{ fontSize: 50, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Interactive Visualization
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Explore changes through interactive maps, timelines, and comparison views
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Input Section */}
        <Paper elevation={6} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h5" gutterBottom textAlign="center" fontWeight="bold">
            Enter Location Coordinates
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
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
          <Box mt={3}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Try these sample locations:
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Button
                  size="small"
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    setLatitude('28.6139');
                    setLongitude('77.2090');
                  }}
                >
                  New Delhi
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  size="small"
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    setLatitude('25.2048');
                    setLongitude('55.2708');
                  }}
                >
                  Dubai
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  size="small"
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    setLatitude('-3.4653');
                    setLongitude('-62.2159');
                  }}
                >
                  Amazon
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  size="small"
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    setLatitude('40.7128');
                    setLongitude('-74.0060');
                  }}
                >
                  New York
                </Button>
              </Grid>
            </Grid>
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

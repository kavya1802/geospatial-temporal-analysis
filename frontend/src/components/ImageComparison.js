import React, { useMemo } from 'react';
import { Box, Typography, Grid, Paper, Chip } from '@mui/material';

function ImageComparison({ selectedYear, images = [] }) {
  // Find the current year image and a comparison image
  const { currentImage, comparisonImage } = useMemo(() => {
    const current = images.find(img => img.year === selectedYear);
    
    // Find an image from exactly 10 years earlier for comparison
    let comparison = null;
    const preferredGaps = [10, 9, 8, 7, 6, 5, 4, 3];
    
    for (const gap of preferredGaps) {
      const targetYear = selectedYear - gap;
      comparison = images.find(img => img.year === targetYear);
      if (comparison) break;
    }
    
    // If not found, get the earliest available image
    if (!comparison && images.length > 1) {
      const sortedImages = [...images].sort((a, b) => a.year - b.year);
      comparison = sortedImages[0];
      
      // Don't use same image for comparison
      if (comparison && comparison.year === selectedYear && sortedImages.length > 1) {
        comparison = sortedImages[1];
      }
    }
    
    return { currentImage: current, comparisonImage: comparison };
  }, [selectedYear, images]);

  // Fallback placeholder image
  const placeholderImage = (year) => 
    `https://via.placeholder.com/400x300/1a237e/ffffff?text=Satellite+Image+${year}`;

  return (
    <Grid container spacing={2}>
      {/* Current Year Image */}
      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle1" fontWeight="bold">
              {selectedYear}
            </Typography>
            {currentImage && (
              <Chip 
                label={`${currentImage.source?.toUpperCase() || 'AWS'}`} 
                size="small" 
                color="primary"
              />
            )}
          </Box>
          
          <Box
            component="img"
            src={currentImage?.image_base64 || placeholderImage(selectedYear)}
            alt={`Satellite image from ${selectedYear}`}
            sx={{
              width: '100%',
              height: '300px',
              objectFit: 'cover',
              borderRadius: 1,
              bgcolor: '#e0e0e0'
            }}
          />
          
          <Box mt={1}>
            {currentImage ? (
              <>
                <Typography variant="body2" color="text.secondary">
                  Date: {currentImage.date}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Satellite: {currentImage.satellite || 'Sentinel-2'}
                </Typography>
                {currentImage.cloud_cover !== undefined && (
                  <Typography variant="body2" color="text.secondary">
                    Cloud Cover: {currentImage.cloud_cover.toFixed(1)}%
                  </Typography>
                )}
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No image available for {selectedYear}
              </Typography>
            )}
          </Box>
        </Paper>
      </Grid>

      {/* Comparison Year Image */}
      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle1" fontWeight="bold">
              {comparisonImage?.year || selectedYear - 3} (Comparison)
            </Typography>
            {comparisonImage && (
              <Chip 
                label={`${comparisonImage.source?.toUpperCase() || 'AWS'}`} 
                size="small" 
                color="secondary"
              />
            )}
          </Box>
          
          <Box
            component="img"
            src={comparisonImage?.image_base64 || placeholderImage(selectedYear - 3)}
            alt={`Satellite image from ${comparisonImage?.year || selectedYear - 3}`}
            sx={{
              width: '100%',
              height: '300px',
              objectFit: 'cover',
              borderRadius: 1,
              bgcolor: '#e0e0e0'
            }}
          />
          
          <Box mt={1}>
            {comparisonImage ? (
              <>
                <Typography variant="body2" color="text.secondary">
                  Date: {comparisonImage.date}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Satellite: {comparisonImage.satellite || 'Sentinel-2'}
                </Typography>
                {comparisonImage.cloud_cover !== undefined && (
                  <Typography variant="body2" color="text.secondary">
                    Cloud Cover: {comparisonImage.cloud_cover.toFixed(1)}%
                  </Typography>
                )}
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No comparison image available
              </Typography>
            )}
          </Box>
        </Paper>
      </Grid>

      {/* Data Source Info */}
      {images.length > 0 && (
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Data source: AWS Open Data (Sentinel-2) • {images.length} images loaded
          </Typography>
        </Grid>
      )}
    </Grid>
  );
}

export default ImageComparison;

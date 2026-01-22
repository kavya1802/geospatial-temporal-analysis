import React from 'react';
import { Slider, Box } from '@mui/material';

function TimelineSlider({ years, selectedYear, onYearChange }) {
  const marks = years.map(year => ({
    value: year,
    label: year.toString(),
  }));

  return (
    <Box sx={{ px: 2 }}>
      <Slider
        value={selectedYear}
        onChange={(e, value) => onYearChange(value)}
        marks={marks}
        min={Math.min(...years)}
        max={Math.max(...years)}
        step={null}
        valueLabelDisplay="on"
        sx={{ mt: 4 }}
      />
    </Box>
  );
}

export default TimelineSlider;

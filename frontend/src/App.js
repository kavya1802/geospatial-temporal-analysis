import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import HomePage from './pages/HomePage';
import AnalysisPage from './pages/AnalysisPage';
import './App.css';

// Create theme with custom color palette
// Palette: https://coolors.co/22223b-4a4e69-9a8c98-c9ada7-f2e9e4
const theme = createTheme({
  palette: {
    primary: {
      main: '#22223b',      // Dark navy/purple
      light: '#4a4e69',     // Medium gray-purple
      dark: '#1a1a2e',
      contrastText: '#f2e9e4',
    },
    secondary: {
      main: '#9a8c98',      // Mauve/dusty purple
      light: '#c9ada7',     // Dusty rose
      dark: '#7a6c78',
      contrastText: '#22223b',
    },
    background: {
      default: '#f2e9e4',   // Off-white/cream
      paper: '#ffffff',
    },
    text: {
      primary: '#22223b',
      secondary: '#4a4e69',
    },
  },
  typography: {
    fontFamily: '"Playwrite NZ Basic", cursive',
    h2: {
      fontWeight: 400,
      fontFamily: '"Playwrite NZ Basic", cursive',
    },
    h5: {
      fontWeight: 300,
      fontFamily: '"Playwrite NZ Basic", cursive',
    },
    h6: {
      fontWeight: 300,
      fontFamily: '"Playwrite NZ Basic", cursive',
    },
    body1: {
      fontFamily: '"Playwrite NZ Basic", cursive',
      fontWeight: 200,
    },
    body2: {
      fontFamily: '"Playwrite NZ Basic", cursive',
      fontWeight: 200,
    },
    button: {
      fontFamily: '"Playwrite NZ Basic", cursive',
      fontWeight: 300,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(34, 34, 59, 0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
